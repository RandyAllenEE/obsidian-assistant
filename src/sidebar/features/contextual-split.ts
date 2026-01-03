import { App, WorkspaceLeaf, WorkspaceItem, setIcon, debounce, EventRef } from "obsidian";
import AssistantPlugin from "../../main";
import { SidebarBinding } from "../../settings";

export class ContextualSplitFeature {
    app: App;
    plugin: AssistantPlugin;

    // Store original visual states of master tabs: { viewType: { icon: string, title: string } }
    private originalStates: Map<string, { icon: string, title: string }> = new Map();
    private activeBinding: SidebarBinding | null = null;
    private listeners: EventRef[] = [];

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    onload() {
        if (this.listeners.length > 0) {
            this.onunload();
        }

        const runInit = () => {
            this.cleanOrphans();
            this.applyAllMasquerades();
        };

        if (this.app.workspace.layoutReady) {
            runInit();
        } else {
            this.app.workspace.onLayoutReady(() => {
                runInit();
            });
        }

        // Re-apply masquerade and check validity on layout changes
        this.listeners.push(
            this.app.workspace.on('layout-change', debounce(() => {
                this.applyAllMasquerades();
                this.checkActiveBindingValidity();
            }, 200))
        );

        this.listeners.push(
            this.app.workspace.on('resize', debounce(() => {
                this.saveSplitState();
            }, 500))
        );

        this.listeners.push(
            this.app.workspace.on('active-leaf-change', debounce((leaf) => {
                if (leaf) this.handleActiveLeaf(leaf);
            }, 50, true))
        );
    }

    onunload() {
        this.listeners.forEach(ref => this.app.workspace.offref(ref));
        this.listeners = [];

        if (this.activeBinding) {
            this.cleanupSplit(this.activeBinding);
        }
        // Restore all visuals
        const bindings = this.plugin.settings.mySideBar.tabs.bindings || [];
        bindings.forEach(b => {
            const masterLeaves = this.findLeavesByType(b.masterId);
            masterLeaves.forEach(l => this.restoreVisuals(l, b.masterId));
        });
    }

    cleanOrphans() {
        const removeOrphans = (split: any) => {
            if (!split) return;
            const toDetach: WorkspaceLeaf[] = [];
            this.app.workspace.iterateLeaves((leaf) => {
                if (leaf.view.containerEl.dataset.assistantContextualSlave === "true") {
                    toDetach.push(leaf);
                }
            }, split);
            toDetach.forEach(l => l.detach());
        };
        removeOrphans(this.app.workspace.leftSplit);
        removeOrphans(this.app.workspace.rightSplit);
    }

    applyAllMasquerades() {
        const bindings = this.plugin.settings.mySideBar.tabs.bindings || [];
        bindings.forEach(b => {
            const masterLeaves = this.findLeavesByType(b.masterId);
            masterLeaves.forEach(leaf => this.applyVisualOverride(leaf, b));
        });
    }

    async handleActiveLeaf(leaf: WorkspaceLeaf) {
        if (!this.plugin.settings.mySideBar.tabs?.enabled) return;
        const viewType = leaf.view.getViewType();
        const bindings = this.plugin.settings.mySideBar.tabs.bindings || [];

        const matchingBinding = bindings.find(b => b.masterId === viewType);

        if (matchingBinding) {
            // Activate Split (Focused on Master)
            if (this.activeBinding && this.activeBinding !== matchingBinding) {
                await this.cleanupSplit(this.activeBinding);
            }
            this.activeBinding = matchingBinding;
            await this.activateSplit(leaf, matchingBinding);

        } else {
            // Focused on something else
            if (this.activeBinding) {
                // 1. Is it the Slave?
                if (viewType === this.activeBinding.slaveId) {
                    if (leaf.view.containerEl.dataset.assistantContextualSlave === "true") {
                        return; // Focus is on our slave, keep split open
                    }
                }

                // 2. Is the Master still visible? (e.g. Focus is in Editor, but Sidebar Tab is open)
                if (this.isMasterVisible(this.activeBinding.masterId)) {
                    return; // Master is visible, keep split open
                }

                await this.cleanupSplit(this.activeBinding);
                this.activeBinding = null;
            }
        }
    }

    checkActiveBindingValidity() {
        const bindings = this.plugin.settings.mySideBar.tabs.bindings || [];

        // 1. Check if any Master is visible
        for (const binding of bindings) {
            if (this.isMasterVisible(binding.masterId)) {
                if (this.activeBinding !== binding) {
                    if (this.activeBinding) this.cleanupSplit(this.activeBinding);

                    this.activeBinding = binding;
                    const leaves = this.findLeavesByType(binding.masterId);
                    const visibleLeaf = leaves.find(l => l.view.containerEl.isShown());
                    if (visibleLeaf) this.activateSplit(visibleLeaf, binding);
                }
                return;
            }
        }

        // 2. If no Master is visible, cleanup active binding
        if (this.activeBinding) {
            this.cleanupSplit(this.activeBinding);
            this.activeBinding = null;
        }
    }

    isMasterVisible(masterId: string): boolean {
        const leaves = this.findLeavesByType(masterId);
        return leaves.some(l => l.view.containerEl.isShown());
    }

    saveSplitState() {
        if (!this.activeBinding) return;
        const slaveLeaf = this.findUniqueSlaveLeaf(this.activeBinding.slaveId);
        if (slaveLeaf) {
            const parent = (slaveLeaf as any).parent;
            // Check if parent has dimension property
            if (parent && typeof parent.dimension === 'number') {
                let dim = parent.dimension;

                // Enforce Integer and Layout Constraints (10-90)
                dim = Math.round(dim);
                if (dim < 10) dim = 10;
                if (dim > 90) dim = 90;

                if (this.activeBinding.splitRatio !== dim) {
                    this.activeBinding.splitRatio = dim;
                    this.plugin.saveSettings();
                }
            }
        }
    }

    async activateSplit(masterLeaf: WorkspaceLeaf, binding: SidebarBinding) {
        // Only handles the split logic now, visual is handled globally
        let slaveLeaf = this.findUniqueSlaveLeaf(binding.slaveId);

        if (!slaveLeaf) {
            slaveLeaf = this.app.workspace.createLeafBySplit(masterLeaf, 'horizontal');
            await slaveLeaf.setViewState({ type: binding.slaveId });
            slaveLeaf.view.containerEl.dataset.assistantContextualSlave = "true";
        }

        const parent = (slaveLeaf as any).parent;
        if (parent && parent.containerEl) {
            parent.containerEl.addClass('contextual-split-hidden-header');

            // Restore Dimension with Constraints and Balance Sibling
            if (typeof (parent as any).setDimension === 'function') {
                let dim = binding.splitRatio || 50;
                dim = Math.round(dim);
                if (dim < 10) dim = 10;
                if (dim > 90) dim = 90;

                const split = parent.parent; // WorkspaceSplit (Vertical)
                if (split && split.children) {
                    const others = split.children.filter((c: any) => c !== parent);
                    if (others.length > 0) {
                        const sibling = others[0]; // Master Tabs

                        try {
                            if (typeof (parent as any).setDimension === 'function') {
                                (parent as any).setDimension(dim);
                            }
                            if (typeof (sibling as any).setDimension === 'function') {
                                (sibling as any).setDimension(100 - dim);
                            }
                        } catch (e) {
                            console.error("Assistant Assistant: Failed to set split dimension", e);
                        }
                    } else {
                        // Fallback if no sibling found
                        try {
                            if (typeof (parent as any).setDimension === 'function') {
                                (parent as any).setDimension(dim);
                            }
                        } catch (e) {
                            console.error("Assistant Assistant: Failed to set split dimension (fallback)", e);
                        }
                    }
                }
            }
        }
    }

    async cleanupSplit(binding: SidebarBinding) {
        // Only closes the slave split
        const slaveLeaf = this.findUniqueSlaveLeaf(binding.slaveId);
        if (slaveLeaf) {
            if (slaveLeaf.view.containerEl.dataset.assistantContextualSlave === "true") {
                slaveLeaf.detach();
            }
        }
    }

    findLeavesByType(type: string): WorkspaceLeaf[] {
        const leaves: WorkspaceLeaf[] = [];
        this.app.workspace.iterateAllLeaves(l => {
            if (l.view.getViewType() === type) leaves.push(l);
        });
        return leaves;
    }

    findUniqueSlaveLeaf(type: string): WorkspaceLeaf | null {
        let found: WorkspaceLeaf | null = null;
        const checkSplit = (split: any) => {
            if (!split) return;
            this.app.workspace.iterateLeaves(l => {
                if (l.view.getViewType() === type && l.view.containerEl.dataset.assistantContextualSlave === "true") {
                    found = l;
                }
            }, split);
        };
        checkSplit(this.app.workspace.leftSplit);
        checkSplit(this.app.workspace.rightSplit);
        return found;
    }

    applyVisualOverride(leaf: WorkspaceLeaf, binding: SidebarBinding) {
        // Must have at least name or icon to override
        if ((!binding.groupName) && (!binding.groupSvg)) return;

        const viewType = leaf.view.getViewType();

        // Snapshot original
        if (!this.originalStates.has(viewType)) {
            const icon = leaf.view.icon;
            const title = leaf.view.getDisplayText();
            this.originalStates.set(viewType, { icon, title });
        }

        const workspaceTabs = (leaf as any).parent;
        if (workspaceTabs && workspaceTabs.tabHeaderContainerEl) {
            const header = workspaceTabs.tabHeaderContainerEl.querySelector(`.workspace-tab-header[data-type="${viewType}"]`);
            if (header) {
                // NAME
                if (binding.groupName) {
                    const titleEl = header.querySelector('.workspace-tab-header-inner-title');
                    if (titleEl) {
                        titleEl.textContent = binding.groupName;
                        header.setAttribute('aria-label', binding.groupName);
                    }
                }

                // ICON (SVG or Lucide)
                if (binding.groupSvg && binding.groupSvg.trim().length > 0) {
                    const iconEl = header.querySelector('.workspace-tab-header-inner-icon');
                    if (iconEl) {
                        const val = binding.groupSvg.trim();
                        // Check if it looks like SVG code
                        if (val.startsWith('<svg')) {
                            iconEl.empty();
                            iconEl.innerHTML = val;
                        } else {
                            // Fallback to Lucide name if it's not SVG code AND looks safe (no HTML tags)
                            if (!val.includes('<') && !val.includes('>')) {
                                iconEl.empty();
                                setIcon(iconEl as HTMLElement, val);
                            }
                        }
                    }
                }

                // Add class to mark as Group
                header.addClass('assistant-contextual-group-tab');
            }
        }
    }

    restoreVisuals(leaf: WorkspaceLeaf, viewType: string) {
        const original = this.originalStates.get(viewType);
        if (!original) return;

        const workspaceTabs = (leaf as any).parent;
        if (workspaceTabs && workspaceTabs.tabHeaderContainerEl) {
            const header = workspaceTabs.tabHeaderContainerEl.querySelector(`.workspace-tab-header[data-type="${viewType}"]`);
            if (header) {
                const titleEl = header.querySelector('.workspace-tab-header-inner-title');
                if (titleEl) {
                    titleEl.textContent = original.title;
                    header.setAttribute('aria-label', original.title);
                }

                const iconEl = header.querySelector('.workspace-tab-header-inner-icon');
                if (iconEl) {
                    iconEl.empty();
                    setIcon(iconEl as HTMLElement, original.icon);
                }
                header.removeClass('assistant-contextual-group-tab');
            }
        }
        this.originalStates.delete(viewType);
    }
}

import { App, WorkspaceLeaf, WorkspaceItem, Notice } from "obsidian";
import AssistantPlugin from "../../main";
import { SidebarTabElement } from "../../settings";
import { t } from "../../i18n/helpers";

export class SidebarTabsFeature {
    app: App;
    plugin: AssistantPlugin;

    scanTimer: number | null = null;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    async onload() {
        if (!this.plugin.settings.mySideBar.tabs?.enabled) return;

        this.app.workspace.onLayoutReady(() => {
            // Initial delayed scan/apply to let other plugins load
            this.scanTimer = window.setTimeout(() => {
                this.scanAndApply();
                this.scanTimer = null;
            }, 1000);
        });
    }

    async scanAndApply() {
        if (!this.plugin.settings.mySideBar.tabs.enabled) return;

        // 1. Scan current tabs to populate settings with any new ones
        await this.scan();

        // 2. Apply saved layout
        await this.applyLayout();
    }

    async scan() {
        const settings = this.plugin.settings.mySideBar.tabs;
        let changed = false;

        const processSplit = (split: any, side: 'left' | 'right') => {
            if (!split) return;
            // Iterate all leaves within this sidebar split
            this.app.workspace.iterateLeaves((leaf) => {
                const viewType = leaf.view.getViewType();
                // Ignore Contextual Slaves
                if (leaf.view.containerEl.dataset.assistantContextualSlave === "true") return;

                // Only manage if not already managed
                if (!settings.elements[viewType]) {
                    // For scan, we append to end
                    const maxOrder = Object.values(settings.elements)
                        .reduce((max, el) => Math.max(max, el.order), -1);

                    settings.elements[viewType] = {
                        id: viewType,
                        side: side,
                        visible: true,
                        order: maxOrder + 1
                    };
                    changed = true;
                }
            }, split);
        };

        processSplit(this.app.workspace.leftSplit, 'left');
        processSplit(this.app.workspace.rightSplit, 'right');

        if (changed) {
            await this.plugin.saveSettings();
        }
        return settings.elements;
    }

    async applyLayout() {
        const settings = this.plugin.settings.mySideBar.tabs;
        if (!settings.enabled) return;

        const elements = Object.values(settings.elements);
        const leftItems = elements.filter(e => e.side === 'left' && e.visible).sort((a, b) => a.order - b.order);
        const rightItems = elements.filter(e => e.side === 'right' && e.visible).sort((a, b) => a.order - b.order);

        // Steady-State Check: If current layout matches target, do nothing.
        // This preserves plugin leaf instances (like Quiet Outline) if they are already correct.
        const getSplitIds = (split: any) => {
            if (!split) return [];
            const ids: string[] = [];
            this.app.workspace.iterateLeaves((leaf) => {
                if (leaf.view.containerEl.dataset.assistantContextualSlave === "true") return;
                ids.push(leaf.view.getViewType());
            }, split);
            return ids;
        };

        const currentLeft = getSplitIds(this.app.workspace.leftSplit);
        const currentRight = getSplitIds(this.app.workspace.rightSplit);

        const targetLeftIds = leftItems.map(e => e.id);
        const targetRightIds = rightItems.map(e => e.id);

        // JSON stringify is a quick way to check array equality (order matters)
        const isLeftMatch = JSON.stringify(currentLeft) === JSON.stringify(targetLeftIds);
        const isRightMatch = JSON.stringify(currentRight) === JSON.stringify(targetRightIds);

        if (isLeftMatch && isRightMatch) {
            // Layout is already perfect. Do not disturb.
            return;
        }

        const viewStates: { [id: string]: any } = {};
        const leavesToDetach: WorkspaceLeaf[] = [];

        // Helper to capture state and mark for detach
        const processSide = (split: any, isMatch: boolean) => {
            if (isMatch) return; // Don't touch this side if it matches
            if (!split) return;

            this.app.workspace.iterateLeaves((leaf) => {
                const type = leaf.view.getViewType();
                // If it's a managed type, we capture and detach.
                // If it's unmanaged (new plugin appeared after scan?), we might detach it if we are strict.
                // But `scan` runs right before `applyLayout`, so everything should be managed.
                if (settings.elements[type]) {
                    viewStates[type] = leaf.getViewState();
                    leavesToDetach.push(leaf);
                }
            }, split);
        };

        // If Left mismatches, we rebuild Left. If Right mismatches, rebuild Right.
        processSide(this.app.workspace.leftSplit, isLeftMatch);
        processSide(this.app.workspace.rightSplit, isRightMatch);

        leavesToDetach.forEach(leaf => leaf.detach());

        // Rebuild only needed sides
        if (!isLeftMatch) await this.openInSplit(leftItems, 'left', viewStates);
        if (!isRightMatch) await this.openInSplit(rightItems, 'right', viewStates);
    }

    async openInSplit(items: SidebarTabElement[], side: 'left' | 'right', viewStates: { [id: string]: any }) {
        for (const item of items) {
            let leaf: WorkspaceLeaf;
            if (side === 'left') leaf = this.app.workspace.getLeftLeaf(false);
            else leaf = this.app.workspace.getRightLeaf(false);

            let state = viewStates[item.id];
            if (!state) {
                // Try default create if state missing
                state = { type: item.id };
            }

            try {
                await leaf.setViewState(state);
            } catch (e) {
                console.error(`Assistant: Failed to restore tab ${item.id}`, e);
                leaf.detach();
            }
        }
    }

    // Helper to toggle side or visibility
    async updateTab(id: string, updates: Partial<SidebarTabElement>) {
        const settings = this.plugin.settings.mySideBar.tabs;
        if (settings.elements[id]) {
            const oldSide = settings.elements[id].side;

            Object.assign(settings.elements[id], updates);

            // Binding Check: If side changed, remove any conflicting bindings
            if (updates.side && updates.side !== oldSide && settings.bindings) {
                const initialLength = settings.bindings.length;
                settings.bindings = settings.bindings.filter(b => {
                    // Check if this tab is part of a binding
                    if (b.masterId === id || b.slaveId === id) {
                        const masterSide = settings.elements[b.masterId]?.side;
                        const slaveSide = settings.elements[b.slaveId]?.side;
                        // Filter out if sides don't match (one of them just changed)
                        return masterSide === slaveSide;
                    }
                    return true;
                });

                if (settings.bindings.length < initialLength) {
                    new Notice(t('Binding Removed'));
                }
            }

            await this.plugin.saveSettings();
            await this.applyLayout(); // Immediate reflection
        }
    }

    onunload() {
        if (this.scanTimer) {
            window.clearTimeout(this.scanTimer);
            this.scanTimer = null;
        }
    }
}

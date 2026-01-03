import { App } from "obsidian";
import AssistantPlugin from "../../main";
import { ExtendedWorkspaceSplit, ExtendedWorkspaceRibbon } from "../types";

class SidebarSideController {
    side: 'left' | 'right';
    app: App;
    plugin: AssistantPlugin;
    split: ExtendedWorkspaceSplit;
    isHovering: boolean = false;
    isAutoExpanded: boolean = false;
    expandTimer: number | null = null;
    collapseTimer: number | null = null;

    // Callbacks for unified coordination
    onExpand: () => void;
    onCollapse: () => void;

    constructor(
        side: 'left' | 'right',
        app: App,
        plugin: AssistantPlugin,
        split: ExtendedWorkspaceSplit,
        onExpand: () => void,
        onCollapse: () => void
    ) {
        this.side = side;
        this.app = app;
        this.plugin = plugin;
        this.split = split;
        this.onExpand = onExpand;
        this.onCollapse = onCollapse;
    }

    get settings() {
        return this.plugin.settings.mySideBar.autoHide;
    }

    get isSideEnabled() {
        return this.side === 'left' ? this.settings.leftSidebar : this.settings.rightSidebar;
    }

    get pixelTrigger() {
        return this.side === 'left' ? this.settings.leftSideBarPixelTrigger : this.settings.rightSideBarPixelTrigger;
    }

    expand() {
        if (this.split.collapsed) this.isAutoExpanded = true;
        this.split.expand();
        this.isHovering = true;
    }

    collapse() {
        if (this.isAutoExpanded) {
            this.split.collapse();
            this.isAutoExpanded = false;
        }
        this.isHovering = false;
    }

    cancelTimers() {
        if (this.expandTimer) { clearTimeout(this.expandTimer); this.expandTimer = null; }
        if (this.collapseTimer) { clearTimeout(this.collapseTimer); this.collapseTimer = null; }
    }

    // Event Handlers
    onMouseEnter = () => {
        this.isHovering = true;
        this.split.containerEl.addClass('hovered');
        this.cancelTimers(); // Successfully entered
    }

    onMouseMove = () => {
        this.split.containerEl.addClass('hovered');
    }

    onMouseLeave = (event: MouseEvent) => {
        const target = event.relatedTarget as HTMLElement;
        if (target && (target.closest('.workspace-tab-header-container-inner') ||
            (target.hasClass && target.hasClass('menu')) ||
            target?.classList?.contains('menu') ||
            target?.closest('.menu'))) {
            return;
        }

        if (this.isSideEnabled) {
            this.isHovering = false;
            this.split.containerEl.removeClass('hovered');

            if (this.collapseTimer) clearTimeout(this.collapseTimer);
            this.collapseTimer = window.setTimeout(() => {
                if (!this.isHovering) {
                    this.onCollapse();
                }
                this.collapseTimer = null;
            }, this.settings.sidebarDelay);
        }
    }

    cleanup() {
        this.cancelTimers();
        if (this.split && this.split.containerEl) {
            this.split.containerEl.removeClass('hovered');
            this.split.containerEl.removeEventListener("mouseenter", this.onMouseEnter);
            this.split.containerEl.removeEventListener("mousemove", this.onMouseMove);
            this.split.containerEl.removeEventListener("mouseleave", this.onMouseLeave);
        }
    }

    attach() {
        if (this.split && this.split.containerEl) {
            this.split.containerEl.addEventListener("mouseenter", this.onMouseEnter);
            this.split.containerEl.addEventListener("mousemove", this.onMouseMove);
            this.split.containerEl.addEventListener("mouseleave", this.onMouseLeave);
        }
    }
}

export class AutoHideFeature {
    app: App;
    plugin: AssistantPlugin;

    private layoutChangeRef: any = null;
    private isInitialized = false;

    leftRibbon: ExtendedWorkspaceRibbon;

    leftController: SidebarSideController;
    rightController: SidebarSideController;

    // Additional Handlers
    leftRibbonMouseEnterHandler: () => void;
    documentClickHandler: (e: MouseEvent) => void;
    documentMouseLeaveHandler: (e: MouseEvent) => void;
    mouseMoveHandler: (event: MouseEvent) => void;

    resizeObserver: ResizeObserver | null = null;
    editorWidth: number = 0;
    private rafId: number | null = null;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    get settings() {
        return this.plugin.settings.mySideBar.autoHide;
    }

    onload() {
        if (this.settings.overlayMode) {
            document.body.classList.add("sidebar-overlay-mode");
        }
        document.body.classList.add("open-sidebar-hover-plugin");
        this.updateCSSVariables();

        this.app.workspace.onLayoutReady(() => {
            this.init();
        });
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        const leftSplit = this.app.workspace.leftSplit as unknown as ExtendedWorkspaceSplit;
        const rightSplit = this.app.workspace.rightSplit as unknown as ExtendedWorkspaceSplit;
        this.leftRibbon = this.app.workspace.leftRibbon as unknown as ExtendedWorkspaceRibbon;

        // Initialize Controllers
        this.leftController = new SidebarSideController('left', this.app, this.plugin, leftSplit,
            () => { // Expand Callback
                if (this.settings.syncLeftRight && this.settings.rightSidebar) {
                    this.expandBoth();
                } else {
                    this.leftController.expand();
                }
            },
            () => { // Collapse Callback
                if (this.settings.syncLeftRight && this.settings.rightSidebar) {
                    this.collapseBoth();
                } else {
                    this.leftController.collapse();
                }
            }
        );

        this.rightController = new SidebarSideController('right', this.app, this.plugin, rightSplit,
            () => { // Expand Callback
                if (this.settings.syncLeftRight && this.settings.leftSidebar) {
                    this.expandBoth();
                } else {
                    this.rightController.expand();
                }
            },
            () => { // Collapse Callback
                if (this.settings.syncLeftRight && this.settings.leftSidebar) {
                    this.collapseBoth();
                } else {
                    this.rightController.collapse();
                }
            }
        );

        // Attach Controller Listeners
        this.leftController.attach();
        this.rightController.attach();

        // Initialize extra handlers
        this.initializeHandlers();
        this.updateEditorDimensions();

        // Add global event listeners
        document.addEventListener("mousemove", this.mouseMoveHandler);
        document.addEventListener("mouseleave", this.documentMouseLeaveHandler);
        document.addEventListener("click", this.documentClickHandler);

        // Resize Observer for efficient width calculation
        this.resizeObserver = new ResizeObserver(() => {
            this.updateEditorDimensions();
        });
        this.resizeObserver.observe(this.app.workspace.containerEl);

        if (this.leftRibbon && this.leftRibbon.containerEl) {
            this.leftRibbon.containerEl.addEventListener("mouseenter", this.leftRibbonMouseEnterHandler);
        }

        // Manual Toggle Logic: Reset auto flags if collapsed manually
        this.layoutChangeRef = this.app.workspace.on('layout-change', () => {
            if (this.leftController.split.collapsed) this.leftController.isAutoExpanded = false;
            if (this.rightController.split.collapsed) this.rightController.isAutoExpanded = false;
        });
    }

    onunload() {
        if (!this.isInitialized) return;

        this.leftController?.cleanup();
        this.rightController?.cleanup();

        document.body.classList.remove("sidebar-overlay-mode");
        document.body.classList.remove("open-sidebar-hover-plugin");

        document.removeEventListener("mousemove", this.mouseMoveHandler);
        if (this.documentClickHandler) document.removeEventListener("click", this.documentClickHandler);
        if (this.documentMouseLeaveHandler) document.removeEventListener("mouseleave", this.documentMouseLeaveHandler);

        if (this.leftRibbon && this.leftRibbon.containerEl) {
            this.leftRibbon.containerEl.removeEventListener("mouseenter", this.leftRibbonMouseEnterHandler);
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // Remove CSS variables style element
        const styleEl = document.getElementById('obsidian-assistant-sidebar-variables');
        if (styleEl) styleEl.remove();

        if (this.layoutChangeRef) {
            this.app.workspace.offref(this.layoutChangeRef);
            this.layoutChangeRef = null;
        }

        this.isInitialized = false;
    }

    updateEditorDimensions() {
        if (this.app.workspace.containerEl) {
            this.editorWidth = this.app.workspace.containerEl.clientWidth;
        }
    }

    initializeHandlers() {
        // Document Click
        this.documentClickHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!this.leftController.split || !this.rightController.split) return;

            const leftSplitEl = this.leftController.split.containerEl;
            const rightSplitEl = this.rightController.split.containerEl;

            // If clicking outside sidebar areas
            if (!leftSplitEl.contains(target) && !rightSplitEl.contains(target)) {
                if (!this.leftController.split.collapsed && this.settings.leftSidebar) {
                    this.leftController.collapse();
                }
                if (!this.rightController.split.collapsed && this.settings.rightSidebar) {
                    this.rightController.collapse();
                }
            }
        };

        // Window Mouse Leave
        this.documentMouseLeaveHandler = (e: MouseEvent) => {
            this.leftController.cancelTimers();
            this.leftController.isHovering = false;
            this.rightController.cancelTimers();
            this.rightController.isHovering = false;
        };

        // Ribbon Hover
        this.leftRibbonMouseEnterHandler = () => {
            if (this.settings.leftSidebar) {
                this.leftController.isHovering = true;
                if (this.leftController.expandTimer) clearTimeout(this.leftController.expandTimer);

                this.leftController.expandTimer = window.setTimeout(() => {
                    if (this.leftController.isHovering) {
                        this.leftController.onExpand();
                    }
                    this.leftController.expandTimer = null;
                }, this.settings.sidebarExpandDelay);
            }
        };

        // Global Mouse Move (Trigger Zones)
        this.mouseMoveHandler = (event: MouseEvent) => {
            // Optimization: use rAF to throttle
            if (this.rafId) return;

            this.rafId = requestAnimationFrame(() => {
                this.rafId = null;
                const mouseX = event.clientX;
                // Use cached width
                const editorWidth = this.editorWidth;

                // RIGHT SIDEBAR TRIGGER
                if (this.settings.rightSidebar && this.rightController.split.collapsed) {
                    const inTriggerZone = mouseX >= editorWidth - this.settings.rightSideBarPixelTrigger;

                    if (inTriggerZone) {
                        if (!this.rightController.isHovering) {
                            this.rightController.isHovering = true;
                            if (this.rightController.expandTimer) clearTimeout(this.rightController.expandTimer);

                            this.rightController.expandTimer = window.setTimeout(() => {
                                this.rightController.onExpand();
                                this.rightController.expandTimer = null;
                            }, this.settings.sidebarExpandDelay);
                        }
                    } else {
                        if (this.rightController.isHovering) {
                            // Exit zone
                            this.rightController.isHovering = false;
                            if (this.rightController.expandTimer) {
                                clearTimeout(this.rightController.expandTimer);
                                this.rightController.expandTimer = null;
                            }
                        }
                    }
                }

                // LEFT SIDEBAR TRIGGER
                if (this.settings.leftSidebar && this.leftController.split.collapsed) {
                    const inTriggerZone = mouseX <= this.settings.leftSideBarPixelTrigger;

                    if (inTriggerZone) {
                        if (!this.leftController.isHovering) {
                            this.leftController.isHovering = true;
                            if (this.leftController.expandTimer) clearTimeout(this.leftController.expandTimer);

                            this.leftController.expandTimer = window.setTimeout(() => {
                                this.leftController.onExpand();
                                this.leftController.expandTimer = null;
                            }, this.settings.sidebarExpandDelay);
                        }
                    } else {
                        if (this.leftController.isHovering) {
                            this.leftController.isHovering = false;
                            if (this.leftController.expandTimer) {
                                clearTimeout(this.leftController.expandTimer);
                                this.leftController.expandTimer = null;
                            }
                        }
                    }
                }
            });
        };
    }

    updateCSSVariables() {
        const styleEl = document.createElement('style');
        styleEl.id = 'obsidian-assistant-sidebar-variables';
        const existingStyle = document.getElementById(styleEl.id);
        if (existingStyle) existingStyle.remove();

        styleEl.textContent = `
            :root {
                --sidebar-expand-collapse-speed: ${this.settings.expandCollapseSpeed}ms;
                --sidebar-expand-delay: ${this.settings.sidebarExpandDelay}ms;
                --left-sidebar-max-width: ${this.settings.leftSidebarMaxWidth}px;
                --right-sidebar-max-width: ${this.settings.rightSidebarMaxWidth}px;
            }
        `;
        document.head.appendChild(styleEl);
    }

    expandBoth() {
        this.rightController.expand();
        this.leftController.expand();
    }

    collapseBoth() {
        this.rightController.collapse();
        this.leftController.collapse();
    }
}

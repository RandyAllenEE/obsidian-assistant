import { App } from "obsidian";
import AssistantPlugin from "../../main";
import { ExtendedWorkspaceSplit, ExtendedWorkspaceRibbon } from "../types";

export class AutoHideFeature {
    app: App;
    plugin: AssistantPlugin;

    // State
    isHoveringLeft = false;
    isHoveringRight = false;
    leftSplit: ExtendedWorkspaceSplit;
    rightSplit: ExtendedWorkspaceSplit;
    leftRibbon: ExtendedWorkspaceRibbon;

    // Handlers
    leftSplitMouseEnterHandler: () => void;
    rightSplitMouseEnterHandler: () => void;
    leftSplitMouseMoveHandler: () => void;
    rightSplitMouseMoveHandler: () => void;
    leftSplitMouseLeaveHandler: (event: MouseEvent) => void;
    rightSplitMouseLeaveHandler: (event: MouseEvent) => void;
    leftRibbonMouseEnterHandler: () => void;
    documentClickHandler: (e: MouseEvent) => void;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    get settings() {
        return this.plugin.settings.mySideBar.autoHide;
    }

    load() {
        // Apply overlay mode class if enabled in settings
        if (this.settings.overlayMode) {
            document.body.classList.add("sidebar-overlay-mode");
        }

        // Add global CSS class to implement the suggested JS-CSS approach
        document.body.classList.add("open-sidebar-hover-plugin");

        // Update CSS variables based on settings
        this.updateCSSVariables();

        this.app.workspace.onLayoutReady(() => {
            this.init();
        });
    }

    init() {
        // Cast to extended interfaces to access internal properties
        this.leftSplit = this.app.workspace.leftSplit as unknown as ExtendedWorkspaceSplit;
        this.rightSplit = this.app.workspace.rightSplit as unknown as ExtendedWorkspaceSplit;
        this.leftRibbon = this.app.workspace.leftRibbon as unknown as ExtendedWorkspaceRibbon;

        // Initialize handlers
        this.initializeHandlers();

        // add event listeners - IMPORTANT: REMOVE IN UNLOAD()
        document.addEventListener("mousemove", this.mouseMoveHandler);

        // Enhanced implementation with hover class for right split
        this.rightSplit.containerEl.addEventListener(
            "mousemove",
            this.rightSplitMouseMoveHandler
        );
        this.rightSplit.containerEl.addEventListener(
            "mouseleave",
            this.rightSplitMouseLeaveHandler
        );
        this.rightSplit.containerEl.addEventListener(
            "mouseenter",
            this.rightSplitMouseEnterHandler
        );

        // Enhanced implementation with hover class for left split
        if (this.leftRibbon && this.leftRibbon.containerEl) {
            this.leftRibbon.containerEl.addEventListener(
                "mouseenter",
                this.leftRibbonMouseEnterHandler
            );
        }

        this.leftSplit.containerEl.addEventListener(
            "mousemove",
            this.leftSplitMouseMoveHandler
        );
        this.leftSplit.containerEl.addEventListener(
            "mouseleave",
            this.leftSplitMouseLeaveHandler
        );
        this.leftSplit.containerEl.addEventListener(
            "mouseenter",
            this.leftSplitMouseEnterHandler
        );

        // Add a document-wide click handler to help with collapse issues
        document.addEventListener("click", this.documentClickHandler);
    }

    unload() {
        // Remove overlay mode class if it was added
        document.body.classList.remove("sidebar-overlay-mode");

        // Remove the global CSS class
        document.body.classList.remove("open-sidebar-hover-plugin");

        // remove all event listeners
        if (this.mouseMoveHandler) {
            document.removeEventListener("mousemove", this.mouseMoveHandler);
        }
        if (this.documentClickHandler) {
            document.removeEventListener("click", this.documentClickHandler);
        }

        // Clean up right split event listeners
        if (this.rightSplit && this.rightSplit.containerEl) {
            this.rightSplit.containerEl.removeEventListener(
                "mouseleave",
                this.rightSplitMouseLeaveHandler
            );
            this.rightSplit.containerEl.removeEventListener(
                "mouseenter",
                this.rightSplitMouseEnterHandler
            );
            this.rightSplit.containerEl.removeEventListener(
                "mousemove",
                this.rightSplitMouseMoveHandler
            );
        }

        // Clean up left split event listeners
        if (this.leftRibbon && this.leftRibbon.containerEl) {
            this.leftRibbon.containerEl.removeEventListener(
                "mouseenter",
                this.leftRibbonMouseEnterHandler
            );
        }

        if (this.leftSplit && this.leftSplit.containerEl) {
            this.leftSplit.containerEl.removeEventListener(
                "mouseleave",
                this.leftSplitMouseLeaveHandler
            );
            this.leftSplit.containerEl.removeEventListener(
                "mouseenter",
                this.leftSplitMouseEnterHandler
            );
            this.leftSplit.containerEl.removeEventListener(
                "mousemove",
                this.leftSplitMouseMoveHandler
            );
        }

        // Remove CSS variables style element
        const styleEl = document.getElementById('obsidian-assistant-sidebar-variables');
        if (styleEl) {
            styleEl.remove();
        }
    }

    initializeHandlers() {
        // Event handler for document clicks
        this.documentClickHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Make sure leftSplit and rightSplit are initialized
            if (!this.leftSplit || !this.rightSplit) return;

            const leftSplitEl = this.leftSplit.containerEl;
            const rightSplitEl = this.rightSplit.containerEl;

            // If clicking outside sidebar areas and they're expanded, collapse them
            if (!leftSplitEl.contains(target) && !rightSplitEl.contains(target)) {
                if (!this.leftSplit.collapsed && this.settings.leftSidebar) {
                    this.collapseLeft();
                }
                if (!this.rightSplit.collapsed && this.settings.rightSidebar) {
                    this.collapseRight();
                }
            }
        };

        this.rightSplitMouseMoveHandler = () => this.rightSplit.containerEl.addClass('hovered');

        this.rightSplitMouseEnterHandler = () => {
            this.isHoveringRight = true;
            this.rightSplit.containerEl.addClass('hovered');
        };

        this.leftSplitMouseMoveHandler = () => this.leftSplit.containerEl.addClass('hovered');

        this.leftSplitMouseEnterHandler = () => {
            this.isHoveringLeft = true;
            this.leftSplit.containerEl.addClass('hovered');
        };

        this.leftRibbonMouseEnterHandler = () => {
            if (this.settings.leftSidebar) {
                this.isHoveringLeft = true;
                setTimeout(() => {
                    // Check if still hovering
                    if (this.isHoveringLeft) {
                        if (this.settings.syncLeftRight && this.settings.rightSidebar) {
                            this.expandBoth();
                        } else {
                            this.expandLeft();
                        }
                    }
                }, this.settings.sidebarExpandDelay);
            }
        };

        this.rightSplitMouseLeaveHandler = (event: MouseEvent) => {
            // Don't process if we're leaving to the tab header container or a menu
            const target = event.relatedTarget as HTMLElement;
            if (target && (target.closest('.workspace-tab-header-container-inner') ||
                (target.hasClass && target.hasClass('menu')) ||
                target?.classList?.contains('menu') ||
                target?.closest('.menu'))) {
                return;
            }

            if (this.settings.rightSidebar) {
                this.isHoveringRight = false;
                // Remove the hovered class
                this.rightSplit.containerEl.removeClass('hovered');

                setTimeout(() => {
                    if (!this.isHoveringRight) {
                        if (this.settings.syncLeftRight && this.settings.leftSidebar) {
                            this.collapseBoth();
                        } else {
                            this.collapseRight();
                        }
                    }
                }, this.settings.sidebarDelay);
            }
        };

        this.leftSplitMouseLeaveHandler = (event: MouseEvent) => {
            // Don't process if we're leaving to the tab header container or a menu
            const target = event.relatedTarget as HTMLElement;
            if (target && (target.closest('.workspace-tab-header-container-inner') ||
                (target.hasClass && target.hasClass('menu')) ||
                target?.classList?.contains('menu') ||
                target?.closest('.menu'))) {
                return;
            }

            if (this.settings.leftSidebar) {
                this.isHoveringLeft = false;
                // Remove the hovered class
                this.leftSplit.containerEl.removeClass('hovered');

                setTimeout(() => {
                    if (!this.isHoveringLeft) {
                        if (this.settings.syncLeftRight && this.settings.rightSidebar) {
                            this.collapseBoth();
                        } else {
                            this.collapseLeft();
                        }
                    }
                }, this.settings.sidebarDelay);
            }
        };
    }

    // Helper method to update CSS variables
    updateCSSVariables() {
        // Create a style element to hold custom CSS variables
        const styleEl = document.createElement('style');
        styleEl.id = 'obsidian-assistant-sidebar-variables';

        // Remove any existing style element with this ID
        const existingStyle = document.getElementById(styleEl.id);
        if (existingStyle) {
            existingStyle.remove();
        }

        // Add the CSS variables to the style element
        styleEl.textContent = `
            :root {
                --sidebar-expand-collapse-speed: ${this.settings.expandCollapseSpeed}ms;
                --sidebar-expand-delay: ${this.settings.sidebarExpandDelay}ms;
                --left-sidebar-max-width: ${this.settings.leftSidebarMaxWidth}px;
                --right-sidebar-max-width: ${this.settings.rightSidebarMaxWidth}px;
            }
            
            body {
                --sidebar-width: ${this.settings.leftSidebarMaxWidth}px !important;
                --right-sidebar-width: ${this.settings.rightSidebarMaxWidth}px !important;
            }
        `;

        // Add the style element to the document head
        document.head.appendChild(styleEl);
    }

    // -- Non-Obsidian API --------------------------
    // Helpers
    getEditorWidth = () => this.app.workspace.containerEl.clientWidth;

    expandRight() {
        // Start animation by expanding
        this.rightSplit.expand();
        this.isHoveringRight = true;
    }

    expandLeft() {
        // Start animation by expanding
        this.leftSplit.expand();
        this.isHoveringLeft = true;
    }

    expandBoth() {
        this.expandRight();
        this.expandLeft();
    }

    collapseRight() {
        this.rightSplit.collapse();
        this.isHoveringRight = false;
    }

    collapseLeft() {
        this.leftSplit.collapse();
        this.isHoveringLeft = false;
    }

    collapseBoth() {
        this.collapseRight();
        this.collapseLeft();
    }

    // Event handlers
    mouseMoveHandler = (event: MouseEvent) => {
        const mouseX = event.clientX;

        // Handle right sidebar hover
        if (this.settings.rightSidebar) {
            if (!this.isHoveringRight && this.rightSplit.collapsed) {
                const editorWidth = this.getEditorWidth();

                this.isHoveringRight =
                    mouseX >= editorWidth - this.settings.rightSideBarPixelTrigger;

                if (this.isHoveringRight && this.rightSplit.collapsed) {
                    setTimeout(() => {
                        if (this.isHoveringRight) {
                            if (this.settings.syncLeftRight) {
                                this.expandBoth();
                            } else {
                                this.expandRight();
                            }
                        }
                    }, this.settings.sidebarExpandDelay);
                }

                setTimeout(() => {
                    if (!this.isHoveringRight) {
                        this.collapseRight();
                    }
                }, this.settings.sidebarDelay);
            }
        }

        // Handle left sidebar hover
        if (this.settings.leftSidebar) {
            if (!this.isHoveringLeft && this.leftSplit.collapsed) {
                // Check if mouse is in the left trigger area
                this.isHoveringLeft = mouseX <= this.settings.leftSideBarPixelTrigger;

                if (this.isHoveringLeft && this.leftSplit.collapsed) {
                    setTimeout(() => {
                        if (this.isHoveringLeft) {
                            if (this.settings.syncLeftRight) {
                                this.expandBoth();
                            } else {
                                this.expandLeft();
                            }
                        }
                    }, this.settings.sidebarExpandDelay);
                }

                setTimeout(() => {
                    if (!this.isHoveringLeft) {
                        this.collapseLeft();
                    }
                }, this.settings.sidebarDelay);
            }
        }
    };
}

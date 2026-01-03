import { Setting, setIcon } from "obsidian";
import { SidebarManager } from "./manager";
import { t } from "../i18n/helpers";
import { DEFAULT_MY_SIDEBAR_SETTINGS } from "../settings";
import { RibbonElement } from "./types";

export function renderSidebarSettings(containerEl: HTMLElement, manager: SidebarManager) {
    // 1. Left Sidebar Sub-menu
    createSubSection(containerEl, t('Left Sidebar'), (contentEl) => {
        // Future settings for Left Sidebar can go here
        new Setting(contentEl).setName(t("Coming Soon")).setDesc(t("Settings for Left Sidebar control will be here."));
    });

    // 2. Ribbon Buttons Management
    createSubSection(containerEl, t('Ribbon Buttons'), (contentEl) => {
        renderRibbonSettings(contentEl, manager);
    });

    // 3. Right Sidebar Sub-menu
    createSubSection(containerEl, t('Right Sidebar'), (contentEl) => {
        new Setting(contentEl).setName(t("Coming Soon")).setDesc(t("Settings for Right Sidebar control will be here."));
    });

    // 4. Auto Hide Sub-menu
    createSubSection(containerEl, t('Auto Hide'), (contentEl) => {
        renderAutoHideSettings(contentEl, manager);
    });
}

function createSubSection(containerEl: HTMLElement, title: string, renderBody: (el: HTMLElement) => void) {
    const details = containerEl.createEl('details');
    details.open = false;
    details.style.marginBottom = '10px';
    details.style.border = '1px solid var(--background-modifier-border)';
    details.style.borderRadius = '5px';
    details.style.padding = '0.5em';

    const summary = details.createEl('summary');
    summary.style.cursor = 'pointer';
    summary.style.fontWeight = 'bold';
    summary.innerText = title;
    summary.style.outline = 'none';

    const content = details.createEl('div');
    content.style.marginTop = '10px';
    content.style.paddingLeft = '5px';
    content.style.borderLeft = '2px solid var(--background-modifier-border)';

    renderBody(content);
}

function renderAutoHideSettings(containerEl: HTMLElement, manager: SidebarManager) {
    const plugin = manager.plugin;
    const settings = plugin.settings.mySideBar.autoHide;

    // BASIC SETTINGS (no heading)
    new Setting(containerEl)
        .setName(t("Left sidebar hover"))
        .setDesc(t("Enables the expansion and collapsing of the left sidebar on hover."))
        .addToggle((t) =>
            t.setValue(settings.leftSidebar).onChange(async (value) => {
                settings.leftSidebar = value;
                await plugin.saveSettings();
            })
        );

    new Setting(containerEl)
        .setName(t("Right sidebar hover"))
        .setDesc(t("Enables the expansion and collapsing of the right sidebar on hover. Only collapses the right panel unless you have a right ribbon."))
        .addToggle((t) =>
            t
                .setValue(settings.rightSidebar)
                .onChange(async (value) => {
                    settings.rightSidebar = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(containerEl)
        .setName(t("Sync left and right"))
        .setDesc(t("If enabled, hovering over the right sidebar will also expand the left sidebar at the same time, and vice versa. (Left and Right sidebar must both be enabled above)"))
        .addToggle((t) =>
            t
                .setValue(settings.syncLeftRight)
                .onChange(async (value) => {
                    settings.syncLeftRight = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(containerEl)
        .setName(t("Overlay mode"))
        .setDesc(t("When enabled, sidebars will slide over the main content without affecting the layout. When disabled, sidebars will expand by pushing content."))
        .addToggle((t) =>
            t
                .setValue(settings.overlayMode)
                .onChange(async (value) => {
                    settings.overlayMode = value;

                    // Update CSS class on body to toggle overlay mode
                    if (value) {
                        document.body.classList.add("sidebar-overlay-mode");
                    } else {
                        document.body.classList.remove("sidebar-overlay-mode");
                    }

                    await plugin.saveSettings();
                })
        );

    // BEHAVIOR SECTION
    new Setting(containerEl).setName(t("Behavior")).setHeading();

    new Setting(containerEl)
        .setName(t("Left sidebar pixel trigger"))
        .setDesc(t("Specify the number of pixels from the left edge of the editor that will trigger the left sidebar to open on hover (must be greater than 0)"))
        .addText((text) => {
            text
                .setPlaceholder("20")
                .setValue(settings.leftSideBarPixelTrigger.toString())
                .onChange(async (value) => {
                    const v = Number(value);
                    if (!value || isNaN(v) || v < 1) {
                        settings.leftSideBarPixelTrigger = DEFAULT_MY_SIDEBAR_SETTINGS.autoHide.leftSideBarPixelTrigger;
                    } else {
                        settings.leftSideBarPixelTrigger = v;
                    }
                    await plugin.saveSettings();
                });
        });

    new Setting(containerEl)
        .setName(t("Right sidebar pixel trigger"))
        .setDesc(t("Specify the number of pixels from the right edge of the editor that will trigger the right sidebar to open on hover (must be greater than 0)"))
        .addText((text) => {
            text
                .setPlaceholder("20")
                .setValue(settings.rightSideBarPixelTrigger.toString())
                .onChange(async (value) => {
                    const v = Number(value);
                    if (!value || isNaN(v) || v < 1) {
                        settings.rightSideBarPixelTrigger = DEFAULT_MY_SIDEBAR_SETTINGS.autoHide.rightSideBarPixelTrigger;
                    } else {
                        settings.rightSideBarPixelTrigger = v;
                    }
                    await plugin.saveSettings();
                });
        });

    // TIMING SECTION
    new Setting(containerEl).setName(t("Timing")).setHeading();

    new Setting(containerEl)
        .setName(t("Sidebar collapse delay"))
        .setDesc(t("The delay in milliseconds before the sidebar collapses after the mouse has left. Enter '0' to disable delay."))
        .addText((text) => {
            text
                .setPlaceholder("300")
                .setValue(settings.sidebarDelay.toString())
                .onChange(async (value) => {
                    const v = Number(value);
                    if (!v || isNaN(v) || v < 0) {
                        settings.sidebarDelay = DEFAULT_MY_SIDEBAR_SETTINGS.autoHide.sidebarDelay;
                    } else {
                        settings.sidebarDelay = v;
                    }
                    await plugin.saveSettings();
                });
        });

    new Setting(containerEl)
        .setName(t("Sidebar expand delay"))
        .setDesc(t("The delay in milliseconds before the sidebar expands after hovering. Default is 200ms."))
        .addText((text) => {
            text
                .setPlaceholder("200")
                .setValue(settings.sidebarExpandDelay.toString())
                .onChange(async (value) => {
                    const v = Number(value);
                    if (!v || isNaN(v) || v < 0) {
                        settings.sidebarExpandDelay = DEFAULT_MY_SIDEBAR_SETTINGS.autoHide.sidebarExpandDelay;
                    } else {
                        settings.sidebarExpandDelay = v;
                    }
                    // Apply the CSS variables immediately
                    manager.autoHideFeature.updateCSSVariables();
                    await plugin.saveSettings();
                });
        });

    new Setting(containerEl)
        .setName(t("Expand/collapse animation speed"))
        .setDesc(t("The speed of the sidebar expand/collapse animation in milliseconds."))
        .addText((text) => {
            text
                .setPlaceholder("300")
                .setValue(settings.expandCollapseSpeed?.toString() || "300")
                .onChange(async (value) => {
                    const v = Number(value);
                    if (!value || isNaN(v) || v < 0) {
                        settings.expandCollapseSpeed = DEFAULT_MY_SIDEBAR_SETTINGS.autoHide.expandCollapseSpeed;
                    } else {
                        settings.expandCollapseSpeed = v;
                    }
                    // Apply the CSS variables immediately
                    manager.autoHideFeature.updateCSSVariables();
                    await plugin.saveSettings();
                });
        });

    // APPEARANCE SECTION
    new Setting(containerEl).setName(t("Appearance")).setHeading();

    new Setting(containerEl)
        .setName(t("Left sidebar maximum width"))
        .setDesc(t("Specify the maximum width in pixels for the left sidebar when expanded"))
        .addText((text) => {
            text
                .setPlaceholder("300")
                .setValue(settings.leftSidebarMaxWidth.toString())
                .onChange(async (value) => {
                    const v = Number(value);
                    if (!value || isNaN(v) || v < 100) {
                        settings.leftSidebarMaxWidth = DEFAULT_MY_SIDEBAR_SETTINGS.autoHide.leftSidebarMaxWidth;
                    } else {
                        settings.leftSidebarMaxWidth = v;
                    }
                    // Apply the CSS variables immediately
                    manager.autoHideFeature.updateCSSVariables();
                    await plugin.saveSettings();
                });
        });

    new Setting(containerEl)
        .setName(t("Right sidebar maximum width"))
        .setDesc(t("Specify the maximum width in pixels for the right sidebar when expanded"))
        .addText((text) => {
            text
                .setPlaceholder("300")
                .setValue(settings.rightSidebarMaxWidth.toString())
                .onChange(async (value) => {
                    const v = Number(value);
                    if (!value || isNaN(v) || v < 100) {
                        settings.rightSidebarMaxWidth = DEFAULT_MY_SIDEBAR_SETTINGS.autoHide.rightSidebarMaxWidth;
                    } else {
                        settings.rightSidebarMaxWidth = v;
                    }
                    // Apply the CSS variables immediately
                    manager.autoHideFeature.updateCSSVariables();
                    await plugin.saveSettings();
                });
        });
}

function renderRibbonSettings(containerEl: HTMLElement, manager: SidebarManager) {
    containerEl.empty();
    const plugin = manager.plugin;
    const settings = plugin.settings.mySideBar.ribbon;
    // Force a refresh from DOM before rendering
    manager.ribbonFeature.processRibbon().then(() => {
        const elements = Object.values(settings.elements).sort((a, b) => a.order - b.order);

        // Render explanation
        const info = containerEl.createEl("div", { cls: "setting-item-description" });
        info.style.marginBottom = "10px";
        info.innerText = t("Drag to reorder ribbon icons. Click eye icon to toggle visibility.");

        // Container for rows
        const rowsContainer = containerEl.createEl("div");
        rowsContainer.addClass("statusbar-organizer-rows-container");

        // If no elements found yet?
        if (elements.length === 0) {
            rowsContainer.createEl("div", { text: t("No ribbon elements found yet.") });
            return;
        }

        elements.forEach(el => {
            renderRibbonRow(rowsContainer, el, manager, elements);
        });
    });
}

function renderRibbonRow(container: HTMLElement, el: RibbonElement, manager: SidebarManager, allElements: RibbonElement[]) {
    const rowEntry = container.createEl("div");
    rowEntry.addClass("statusbar-organizer-row");
    // Override grid for ribbon (3 columns: handle, name, visible)
    rowEntry.style.gridTemplateColumns = "2em 1fr 2em";

    if (!el.visible) rowEntry.addClass("statusbar-organizer-row-hidden");
    rowEntry.setAttribute("data-ribbon-id", el.id);

    // 1. Handle
    // We use a custom class to avoid inheriting the ::after content from statusbar-organizer-row-handle
    const handle = rowEntry.createEl("span");
    handle.style.cursor = "grab";
    handle.style.display = "flex";
    handle.style.alignItems = "center";
    handle.style.justifyContent = "center";
    handle.setAttribute("aria-label", t("Drag to reorder"));
    setIcon(handle, "grip-horizontal");

    // Bind drag events
    handle.addEventListener("mousedown", (e) => handleRibbonDrag(e, rowEntry, el, manager, container, allElements));

    // 2. Icon + Name
    const nameContainer = rowEntry.createEl("span", { cls: "statusbar-organizer-row-title" });
    nameContainer.style.display = "flex";
    nameContainer.style.alignItems = "center";
    nameContainer.style.gap = "8px";

    if (el.icon) {
        const iconSpan = nameContainer.createEl("span");
        iconSpan.innerHTML = el.icon;
        const svg = iconSpan.querySelector("svg");
        if (svg) {
            svg.setAttribute("width", "16");
            svg.setAttribute("height", "16");
            svg.style.verticalAlign = "middle";
        }
    }

    const nameSpan = nameContainer.createEl("span");
    nameSpan.innerText = el.name || el.id;

    // 3. Visibility Toggle
    const visBtn = rowEntry.createEl("span", { cls: "statusbar-organizer-row-visibility" });
    visBtn.style.cursor = "pointer";
    setIcon(visBtn, el.visible ? "eye" : "eye-off");
    visBtn.addEventListener("click", async () => {
        await manager.ribbonFeature.toggleVisibility(el.id);
        // Toggle UI
        if (manager.plugin.settings.mySideBar.ribbon.elements[el.id].visible) {
            rowEntry.removeClass("statusbar-organizer-row-hidden");
            setIcon(visBtn, "eye");
        } else {
            rowEntry.addClass("statusbar-organizer-row-hidden");
            setIcon(visBtn, "eye-off");
        }
    });
}

function handleRibbonDrag(
    event: MouseEvent,
    rowEntry: HTMLElement,
    item: RibbonElement,
    manager: SidebarManager,
    container: HTMLElement,
    allElements: RibbonElement[]
) {
    event.preventDefault();

    const rect = rowEntry.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;

    // Create ghost image/clone
    const clone = rowEntry.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.width = `${rect.width}px`;
    clone.style.zIndex = "1000";
    clone.style.opacity = "0.8";
    clone.addClass("is-dragging");
    document.body.appendChild(clone);

    rowEntry.style.opacity = "0.2";

    const moveHandler = (e: MouseEvent) => {
        clone.style.top = `${e.clientY - offsetY}px`;
        clone.style.left = `${rect.left}px`;

        const children = Array.from(container.children) as HTMLElement[];
        const draggingIdx = children.indexOf(rowEntry);

        let targetIdx = -1;

        let closestDist = Infinity;
        let closestEl: HTMLElement | null = null;

        children.forEach((child, idx) => {
            if (child === rowEntry) return;
            const childRect = child.getBoundingClientRect();
            const childCenter = childRect.top + childRect.height / 2;
            const dist = Math.abs(e.clientY - childCenter);
            if (dist < closestDist && dist < childRect.height) {
                closestDist = dist;
                closestEl = child;
                targetIdx = idx;
            }
        });

        if (closestEl && targetIdx !== -1) {
            // Swap in DOM
            if (draggingIdx < targetIdx) {
                container.insertBefore(rowEntry, closestEl.nextSibling);
            } else {
                container.insertBefore(rowEntry, closestEl);
            }
        }
    };

    const upHandler = async () => {
        document.removeEventListener("mousemove", moveHandler);
        document.removeEventListener("mouseup", upHandler);
        clone.remove();
        rowEntry.style.opacity = "";

        const children = Array.from(container.children) as HTMLElement[];

        const newOrderIds: string[] = [];
        children.forEach(child => {
            const id = child.getAttribute("data-ribbon-id");
            if (id) newOrderIds.push(id);
        });

        if (newOrderIds.length > 0) {
            await manager.ribbonFeature.saveOrder(newOrderIds);
        }
    };

    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", upHandler);
}

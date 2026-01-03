import { Setting, setIcon, ToggleComponent, DropdownComponent } from "obsidian";
import { SidebarManager } from "./manager";
import { t } from "../i18n/helpers";
import { SidebarTabElement } from "../settings";
import { RibbonElement } from "./types";
import { DEFAULT_MY_SIDEBAR_SETTINGS } from "../settings";

export function renderSidebarSettings(containerEl: HTMLElement, manager: SidebarManager) {
    // 1. Auto Hide Sub-menu
    createToggledSubSection(
        containerEl,
        t('Auto Hide'),
        manager.plugin.settings.mySideBar?.autoHide?.enabled ?? true,
        async (enabled) => {
            if (!manager.plugin.settings.mySideBar.autoHide) manager.plugin.settings.mySideBar.autoHide = { ...DEFAULT_MY_SIDEBAR_SETTINGS.autoHide };
            manager.plugin.settings.mySideBar.autoHide.enabled = enabled;
            await manager.plugin.saveSettings();
            if (enabled) manager.autoHideFeature.load();
            else manager.autoHideFeature.unload();
        },
        (contentEl) => {
            renderAutoHideSettings(contentEl, manager);
        }
    );

    // 2. Ribbon Buttons Management
    createToggledSubSection(
        containerEl,
        t('Ribbon Buttons'),
        manager.plugin.settings.mySideBar?.ribbon?.enabled ?? true,
        async (enabled) => {
            if (!manager.plugin.settings.mySideBar.ribbon) manager.plugin.settings.mySideBar.ribbon = { ...DEFAULT_MY_SIDEBAR_SETTINGS.ribbon };
            manager.plugin.settings.mySideBar.ribbon.enabled = enabled;
            await manager.plugin.saveSettings();
            if (enabled) await manager.ribbonFeature.onload();
            else manager.ribbonFeature.onunload();
        },
        (contentEl) => {
            renderRibbonSettings(contentEl, manager);
        }
    );

    // 3. Sidebar Tabs Management
    createToggledSubSection(
        containerEl,
        t('Sidebar Tabs'),
        manager.plugin.settings.mySideBar?.tabs?.enabled ?? true,
        async (enabled) => {
            if (!manager.plugin.settings.mySideBar.tabs) manager.plugin.settings.mySideBar.tabs = { ...DEFAULT_MY_SIDEBAR_SETTINGS.tabs };
            manager.plugin.settings.mySideBar.tabs.enabled = enabled;
            await manager.plugin.saveSettings();
            if (enabled) await manager.tabsFeature.onload();
        },
        (contentEl) => {
            renderSidebarTabsSettings(contentEl, manager);
        }
    );
}

function createToggledSubSection(
    containerEl: HTMLElement,
    title: string,
    isEnabled: boolean,
    onToggle: (enabled: boolean) => void,
    renderBody: (el: HTMLElement) => void
) {
    const details = containerEl.createEl('details');
    // Keep closed by default
    details.style.marginBottom = '10px';
    details.style.border = '1px solid var(--background-modifier-border)';
    details.style.borderRadius = '5px';
    details.style.padding = '0.5em';

    const summary = details.createEl('summary');
    summary.style.cursor = 'pointer';
    summary.style.display = 'flex';
    summary.style.alignItems = 'center';
    summary.style.justifyContent = 'space-between';
    summary.style.outline = 'none';

    const titleEl = summary.createEl('span');
    titleEl.style.fontWeight = 'bold';
    titleEl.innerText = title;

    // Toggle
    const toggleContainer = summary.createEl('span');
    toggleContainer.addEventListener('click', (e) => e.stopPropagation());

    new ToggleComponent(toggleContainer)
        .setValue(isEnabled)
        .onChange((value) => {
            onToggle(value);
        });

    const content = details.createEl('div');
    content.style.marginTop = '10px';
    content.style.paddingLeft = '5px';
    content.style.borderLeft = '2px solid var(--background-modifier-border)';

    if (isEnabled) {
        renderBody(content);
    } else {
        content.createEl('div', { text: t("Feature is disabled."), cls: "setting-item-description" });
    }
}

function renderAutoHideSettings(containerEl: HTMLElement, manager: SidebarManager) {
    const plugin = manager.plugin;
    const settings = plugin.settings.mySideBar.autoHide;

    // BASIC SETTINGS
    new Setting(containerEl)
        .setName(t("Left sidebar hover"))
        .setDesc(t("Enables the expansion and collapsing of the left sidebar on hover."))
        .addToggle((t) => t.setValue(settings.leftSidebar).onChange(async (v) => { settings.leftSidebar = v; await plugin.saveSettings(); }));

    new Setting(containerEl)
        .setName(t("Right sidebar hover"))
        .setDesc(t("Enables the expansion and collapsing of the right sidebar on hover. Only collapses the right panel unless you have a right ribbon."))
        .addToggle((t) => t.setValue(settings.rightSidebar).onChange(async (v) => { settings.rightSidebar = v; await plugin.saveSettings(); }));

    new Setting(containerEl)
        .setName(t("Sync left and right"))
        .setDesc(t("If enabled, hovering over the right sidebar will also expand the left sidebar at the same time, and vice versa. (Left and Right sidebar must both be enabled above)"))
        .addToggle((t) => t.setValue(settings.syncLeftRight).onChange(async (v) => { settings.syncLeftRight = v; await plugin.saveSettings(); }));

    new Setting(containerEl)
        .setName(t("Overlay mode"))
        .setDesc(t("When enabled, sidebars will slide over the main content without affecting the layout. When disabled, sidebars will expand by pushing content."))
        .addToggle((t) => t.setValue(settings.overlayMode).onChange(async (v) => {
            settings.overlayMode = v;
            document.body.toggleClass("obsidian-assistant-overlay-mode", v);
            await plugin.saveSettings();
        }));

    new Setting(containerEl).setName(t("Behavior")).setHeading();

    new Setting(containerEl)
        .setName(t("Left sidebar pixel trigger"))
        .setDesc(t("Specify the number of pixels from the left edge of the editor that will trigger the left sidebar to open on hover (must be greater than 0)"))
        .addText(text => text.setValue(String(settings.leftSideBarPixelTrigger)).onChange(async v => {
            const num = parseInt(v); if (!isNaN(num) && num > 0) { settings.leftSideBarPixelTrigger = num; await plugin.saveSettings(); }
        }));

    new Setting(containerEl)
        .setName(t("Right sidebar pixel trigger"))
        .setDesc(t("Specify the number of pixels from the right edge of the editor that will trigger the right sidebar to open on hover (must be greater than 0)"))
        .addText(text => text.setValue(String(settings.rightSideBarPixelTrigger)).onChange(async v => {
            const num = parseInt(v); if (!isNaN(num) && num > 0) { settings.rightSideBarPixelTrigger = num; await plugin.saveSettings(); }
        }));

    new Setting(containerEl).setName(t("Timing")).setHeading();

    new Setting(containerEl)
        .setName(t("Sidebar collapse delay"))
        .setDesc(t("The delay in milliseconds before the sidebar collapses after the mouse has left. Enter '0' to disable delay."))
        .addText(text => text.setValue(String(settings.sidebarDelay)).onChange(async v => {
            const num = parseInt(v); if (!isNaN(num) && num >= 0) { settings.sidebarDelay = num; await plugin.saveSettings(); }
        }));

    new Setting(containerEl)
        .setName(t("Sidebar expand delay"))
        .setDesc(t("The delay in milliseconds before the sidebar expands after hovering. Default is 200ms."))
        .addText(text => text.setValue(String(settings.sidebarExpandDelay)).onChange(async v => {
            const num = parseInt(v); if (!isNaN(num) && num >= 0) { settings.sidebarExpandDelay = num; await plugin.saveSettings(); }
        }));

    new Setting(containerEl)
        .setName(t("Expand/collapse animation speed"))
        .setDesc(t("The speed of the sidebar expand/collapse animation in milliseconds."))
        .addText(text => text.setValue(String(settings.expandCollapseSpeed)).onChange(async v => {
            const num = parseInt(v); if (!isNaN(num) && num > 0) { settings.expandCollapseSpeed = num; await plugin.saveSettings(); }
        }));

    new Setting(containerEl).setName(t("Appearance")).setHeading();

    new Setting(containerEl)
        .setName(t("Left sidebar maximum width"))
        .setDesc(t("Specify the maximum width in pixels for the left sidebar when expanded"))
        .addText(text => text.setValue(String(settings.leftSidebarMaxWidth)).onChange(async v => {
            const num = parseInt(v); if (!isNaN(num) && num > 0) { settings.leftSidebarMaxWidth = num; await plugin.saveSettings(); }
        }));

    new Setting(containerEl)
        .setName(t("Right sidebar maximum width"))
        .setDesc(t("Specify the maximum width in pixels for the right sidebar when expanded"))
        .addText(text => text.setValue(String(settings.rightSidebarMaxWidth)).onChange(async v => {
            const num = parseInt(v); if (!isNaN(num) && num > 0) { settings.rightSidebarMaxWidth = num; await plugin.saveSettings(); }
        }));
}

function renderRibbonSettings(containerEl: HTMLElement, manager: SidebarManager) {
    containerEl.empty();
    const plugin = manager.plugin;
    const settings = plugin.settings.mySideBar.ribbon;

    manager.ribbonFeature.processRibbon().then(() => {
        const elements = Object.values(settings.elements).sort((a, b) => a.order - b.order);

        const info = containerEl.createEl("div", { cls: "setting-item-description" });
        info.style.marginBottom = "10px";
        info.innerText = t("Drag to reorder ribbon icons. Click eye icon to toggle visibility.");

        const rowsContainer = containerEl.createEl("div");
        rowsContainer.addClass("statusbar-organizer-rows-container");

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
    // Legacy row style for Ribbon
    const rowEntry = container.createEl("div");
    rowEntry.addClass("statusbar-organizer-row");
    rowEntry.style.gridTemplateColumns = "2em 1fr 2em";
    if (!el.visible) rowEntry.addClass("statusbar-organizer-row-hidden");
    rowEntry.setAttribute("data-ribbon-id", el.id);

    // Handle
    const handle = rowEntry.createEl("span");
    handle.style.cursor = "grab";
    handle.style.display = "flex";
    handle.style.alignItems = "center";
    handle.style.justifyContent = "center";
    setIcon(handle, "grip-horizontal");
    handle.addEventListener("mousedown", (e) => handleRibbonDrag(e, rowEntry, el, manager, container, allElements));

    // Name
    const nameContainer = rowEntry.createEl("span", { cls: "statusbar-organizer-row-title" });
    nameContainer.style.display = "flex";
    nameContainer.style.alignItems = "center";
    nameContainer.style.gap = "8px";
    if (el.icon) {
        const iconSpan = nameContainer.createEl("span");
        iconSpan.innerHTML = el.icon;
        const svg = iconSpan.querySelector("svg");
        if (svg) { svg.setAttribute("width", "16"); svg.setAttribute("height", "16"); svg.style.verticalAlign = "middle"; }
    }
    nameContainer.createEl("span", { text: el.name || el.id });

    // Vis
    const visBtn = rowEntry.createEl("span", { cls: "statusbar-organizer-row-visibility" });
    visBtn.style.cursor = "pointer";
    setIcon(visBtn, el.visible ? "eye" : "eye-off");
    visBtn.addEventListener("click", async () => {
        await manager.ribbonFeature.toggleVisibility(el.id);
        if (manager.plugin.settings.mySideBar.ribbon.elements[el.id].visible) {
            rowEntry.removeClass("statusbar-organizer-row-hidden");
            setIcon(visBtn, "eye");
        } else {
            rowEntry.addClass("statusbar-organizer-row-hidden");
            setIcon(visBtn, "eye-off");
        }
    });
}

function handleRibbonDrag(e: MouseEvent, row: HTMLElement, el: RibbonElement, manager: SidebarManager, container: HTMLElement, allElements: RibbonElement[]) {
    e.preventDefault();
    const startY = e.clientY;
    const startIndex = Array.from(container.children).indexOf(row);
    let newIndex = startIndex;

    const onMouseMove = (moveEvent: MouseEvent) => {
        const currentY = moveEvent.clientY;
        const siblings = Array.from(container.children) as HTMLElement[];
        const rowHeight = row.offsetHeight;

        const delta = Math.round((currentY - startY) / rowHeight);
        newIndex = Math.max(0, Math.min(siblings.length - 1, startIndex + delta));

        siblings.forEach((sibling, index) => {
            if (sibling === row) return;
            if (index === newIndex) {
                if (startIndex < newIndex) sibling.after(row);
                else sibling.before(row);
            }
        });
    };

    const onMouseUp = async () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        if (newIndex !== startIndex) {
            allElements.splice(startIndex, 1);
            allElements.splice(newIndex, 0, el);
            allElements.forEach((item, index) => {
                manager.plugin.settings.mySideBar.ribbon.elements[item.id].order = index;
            });
            await manager.plugin.saveSettings();
            await manager.ribbonFeature.processRibbon();
        }
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

// --- SIDEBAR TABS UI ---

function renderSidebarTabsSettings(containerEl: HTMLElement, manager: SidebarManager) {
    containerEl.empty();
    const settings = manager.plugin.settings.mySideBar.tabs;

    new Setting(containerEl)
        .setName(t("Scan Current Layout"))
        .setDesc(t("Scan and apply"))
        .addButton(btn => btn
            .setButtonText(t("Scan"))
            .onClick(async () => {
                await manager.tabsFeature.scanAndApply();
                renderSidebarTabsSettings(containerEl, manager);
            }));

    const elements = Object.values(settings.elements).sort((a, b) => a.order - b.order);

    const leftElements = elements.filter(e => e.side === 'left' && e.visible);
    const rightElements = elements.filter(e => e.side === 'right' && e.visible);
    const hiddenElements = elements.filter(e => !e.visible);

    renderTabGroup(containerEl, t("Left Sidebar"), leftElements, manager);
    renderTabGroup(containerEl, t("Right Sidebar"), rightElements, manager);
    renderTabGroup(containerEl, t("Hidden"), hiddenElements, manager);
}

function renderTabGroup(container: HTMLElement, title: string, groupElements: SidebarTabElement[], manager: SidebarManager) {
    if (groupElements.length === 0 && title !== t("Hidden")) return;

    // Standard Obsidian Heading Style with small styling tweak
    const heading = container.createEl("div", {
        cls: "setting-item setting-item-heading",
        text: title
    });
    // Add green color as requested for "small titles" (sidebar headings)
    heading.style.color = "var(--text-success)";

    if (groupElements.length === 0) {
        container.createEl("div", { text: t("No elements"), cls: "setting-item-description", style: "margin-bottom: 20px; font-style: italic;" });
        return;
    }

    const listContainer = container.createDiv();

    groupElements.forEach(el => {
        renderTabRow(listContainer, el, manager);
    });
}

function renderTabRow(container: HTMLElement, el: SidebarTabElement, manager: SidebarManager) {
    const row = container.createEl("div", { cls: "setting-item" });
    row.style.borderTop = "none";
    row.style.borderBottom = "1px solid var(--background-modifier-border)";

    // Info (Name)
    const info = row.createEl("div", { cls: "setting-item-info" });
    info.createEl("div", { cls: "setting-item-name", text: el.id }); // Using ID as name

    // Control (Dropdown + Handle)
    const control = row.createEl("div", { cls: "setting-item-control" });

    // Dropdown for placement
    new DropdownComponent(control)
        .addOption("left", t("Left Sidebar"))
        .addOption("right", t("Right Sidebar"))
        .addOption("hidden", t("Hidden"))
        .setValue(el.visible ? el.side : "hidden")
        .onChange(async (value) => {
            if (value === "hidden") {
                await manager.tabsFeature.updateTab(el.id, { visible: false });
            } else {
                await manager.tabsFeature.updateTab(el.id, { side: value as 'left' | 'right', visible: true });
            }
            // Refresh entire Tabs section to reflect group change
            renderSidebarTabsSettings(container.parentElement!.parentElement!, manager);
        });

    // Drag Handle
    const handle = control.createEl("span", { cls: "clickable-icon", style: "cursor: grab; margin-left: 10px;" });
    setIcon(handle, "grip-horizontal");
    handle.addEventListener("mousedown", (e) => handleTabDrag(e, row, el, manager, container));
}

function handleTabDrag(e: MouseEvent, row: HTMLElement, el: SidebarTabElement, manager: SidebarManager, container: HTMLElement) {
    e.preventDefault();
    const startY = e.clientY;
    const startIndex = Array.from(container.children).indexOf(row);
    let newIndex = startIndex;

    const onMouseMove = (moveEvent: MouseEvent) => {
        const currentY = moveEvent.clientY;
        const siblings = Array.from(container.children) as HTMLElement[];
        const rowHeight = row.offsetHeight;

        const delta = Math.round((currentY - startY) / rowHeight);
        newIndex = Math.max(0, Math.min(siblings.length - 1, startIndex + delta));

        siblings.forEach((sibling, index) => {
            if (sibling === row) return;
            if (index === newIndex) {
                if (startIndex < newIndex) sibling.after(row);
                else sibling.before(row);
            }
        });
    };

    const onMouseUp = async () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        if (newIndex !== startIndex) {
            // Re-order logic
            const siblings = Array.from(container.children) as HTMLElement[];
            const newOrderIds = siblings.map(s => s.querySelector(".setting-item-name")?.textContent || "");

            const settings = manager.plugin.settings.mySideBar.tabs;
            const groupItems = newOrderIds.map(id => settings.elements[id]).filter(x => x);
            // Get current sorted orders for this group
            const sortedOrders = groupItems.map(x => x.order).sort((a, b) => a - b);

            // Re-assign sorted orders to new sequence
            newOrderIds.forEach((id, index) => {
                if (settings.elements[id]) {
                    settings.elements[id].order = sortedOrders[index];
                }
            });

            await manager.plugin.saveSettings();

            // CRITICAL Fix: Apply layout immediately after sorting
            await manager.tabsFeature.applyLayout();
        }
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

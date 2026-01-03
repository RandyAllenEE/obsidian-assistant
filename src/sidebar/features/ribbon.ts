import { App, Menu } from "obsidian";
import AssistantPlugin from "../../main";
import { RibbonElement, RibbonSettings } from "../types";

export class RibbonFeature {
    app: App;
    plugin: AssistantPlugin;
    ribbonActions: HTMLElement;
    ribbonSettings: HTMLElement;
    observer: MutationObserver;

    // Debounce timer for observer
    private observerTimer: number | null = null;
    private isInternalChange = false;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    get settings(): RibbonSettings {
        return this.plugin.settings.mySideBar.ribbon;
    }

    async onload() {
        if (!this.plugin.settings.mySideBar?.ribbon) {
            if (!this.plugin.settings.mySideBar) {
                // @ts-ignore
                this.plugin.settings.mySideBar = {};
            }
            this.plugin.settings.mySideBar.ribbon = { elements: {} };
            await this.plugin.saveSettings();
        }

        this.app.workspace.onLayoutReady(() => {
            this.init();
        });
    }

    onunload() {
        if (this.observer) {
            this.observer.disconnect();
        }

        const resetEl = (el: HTMLElement) => {
            el.style.removeProperty("order");
            el.style.removeProperty("display");
            el.removeClass("assistant-ribbon-hidden");
        };

        if (this.ribbonActions) Array.from(this.ribbonActions.children).forEach(el => resetEl(el as HTMLElement));
        if (this.ribbonSettings) Array.from(this.ribbonSettings.children).forEach(el => resetEl(el as HTMLElement));
    }

    private init() {
        const ribbon = document.querySelector(".workspace-ribbon.mod-left");
        if (!ribbon) return;

        this.ribbonActions = ribbon.querySelector(".side-dock-actions") as HTMLElement;
        this.ribbonSettings = ribbon.querySelector(".side-dock-settings") as HTMLElement;

        if (!this.ribbonActions && !this.ribbonSettings) return;

        // Initial process
        this.processRibbon();

        // Start observing both
        this.observer = new MutationObserver((mutations) => {
            if (this.isInternalChange) return;

            let shouldUpdate = false;
            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    shouldUpdate = true;
                    break;
                }
            }

            if (shouldUpdate) {
                this.scheduleProcess();
            }
        });

        if (this.ribbonActions) this.observer.observe(this.ribbonActions, { childList: true });
        if (this.ribbonSettings) this.observer.observe(this.ribbonSettings, { childList: true });
    }

    private scheduleProcess() {
        if (this.observerTimer !== null) {
            window.clearTimeout(this.observerTimer);
        }
        this.observerTimer = window.setTimeout(() => {
            this.processRibbon();
            this.observerTimer = null;
        }, 200);
    }

    async processRibbon() {
        if (!this.ribbonActions && !this.ribbonSettings) return;

        // Gather current DOM elements from both lists
        const actionsChildren = this.ribbonActions ? Array.from(this.ribbonActions.children) as HTMLElement[] : [];
        const settingsChildren = this.ribbonSettings ? Array.from(this.ribbonSettings.children) as HTMLElement[] : [];

        const domElementsMap = new Map<string, HTMLElement>();

        // Process top actions
        actionsChildren.forEach(el => {
            const ariaLabel = el.getAttribute("aria-label");
            if (ariaLabel && !el.classList.contains("assistant-ghost")) {
                domElementsMap.set(ariaLabel, el);
            }
        });

        settingsChildren.forEach(el => {
            const ariaLabel = el.getAttribute("aria-label");
            if (ariaLabel && !el.classList.contains("assistant-ghost")) {
                domElementsMap.set(ariaLabel, el);
            }
        });

        const settingsElements = this.settings.elements;
        const knownIDs = Object.keys(settingsElements);

        // 1. Check for new elements
        let maxOrder = 0;
        Object.values(settingsElements).forEach(el => {
            if (el.order > maxOrder) maxOrder = el.order;
        });

        const newElements: RibbonElement[] = [];
        for (const [id, el] of domElementsMap.entries()) {
            if (!settingsElements[id]) {
                maxOrder++;
                const newEl: RibbonElement = {
                    id: id,
                    name: id,
                    visible: true,
                    order: maxOrder,
                    icon: el.querySelector("svg")?.outerHTML || el.innerHTML
                };
                newElements.push(newEl);
                settingsElements[id] = newEl;
            } else {
                // Update icon
                const icon = el.querySelector("svg")?.outerHTML || el.innerHTML;
                if (icon && settingsElements[id].icon !== icon) {
                    settingsElements[id].icon = icon;
                }
            }
        }

        // 3. Apply Order and Visibility
        this.isInternalChange = true;

        // We will move all managed elements to the top 'ribbonActions' container to create a unified list
        // EXCEPT for the 'Settings' and 'Help' buttons which are usually in the bottom 'ribbonSettings' container.
        // Moving them might be confusing or break native behavior expectations.
        // However, the user wants a single unified sortable list. 
        // If we want to support that, we MUST move them to the same container.
        // Let's check if the user has explicitly reordered them.
        // If we move Settings/Help to top, they become just like any other button. 
        // This is often a desired feature (e.g. "Commander" allows this).
        // Let's implement full unification: Move everything to ribbonActions if it's managed.

        const sortedIDs = Object.keys(settingsElements).sort((a, b) => settingsElements[a].order - settingsElements[b].order);

        for (const id of sortedIDs) {
            const setting = settingsElements[id];
            const el = domElementsMap.get(id);
            if (el) {
                // Determine visibility
                if (setting.visible) {
                    el.style.setProperty("display", "flex", "important");
                    el.removeClass("assistant-ribbon-hidden");
                } else {
                    el.style.setProperty("display", "none", "important");
                    el.addClass("assistant-ribbon-hidden");
                }

                // Apply Order (Physical DOM order)
                if (this.ribbonActions && el.parentElement !== this.ribbonActions) {
                    this.ribbonActions.appendChild(el);
                }
                // If already in ribbonActions, appending it again moves it to the end, effectively sorting it if we loop in order.
                if (this.ribbonActions) {
                    this.ribbonActions.appendChild(el);
                }
            }
        }

        this.isInternalChange = false;

        if (newElements.length > 0) {
            await this.plugin.saveSettings();
        }
    }

    async toggleVisibility(id: string) {
        if (this.settings.elements[id]) {
            this.settings.elements[id].visible = !this.settings.elements[id].visible;
            await this.plugin.saveSettings();
            await this.processRibbon();
        }
    }

    async saveOrder(newOrder: string[]) {
        newOrder.forEach((id, index) => {
            if (this.settings.elements[id]) {
                this.settings.elements[id].order = index;
            }
        });
        await this.plugin.saveSettings();
        await this.processRibbon();
    }
}

import { App } from "obsidian";
import AssistantPlugin from "../main";
import { AutoHideFeature } from "./features/auto-hide";
import { RibbonFeature } from "./features/ribbon";
import { SidebarTabsFeature } from "./features/tabs";
import { ContextualSplitFeature } from "./features/contextual-split";

export class SidebarManager {
    app: App;
    plugin: AssistantPlugin;
    autoHideFeature: AutoHideFeature;
    ribbonFeature: RibbonFeature;
    tabsFeature: SidebarTabsFeature;
    contextualFeature: ContextualSplitFeature;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
        this.autoHideFeature = new AutoHideFeature(app, plugin);
        this.ribbonFeature = new RibbonFeature(app, plugin);
        this.tabsFeature = new SidebarTabsFeature(app, plugin);
        this.contextualFeature = new ContextualSplitFeature(app, plugin);
    }

    async onload() {
        if (this.plugin.settings.mySideBar.autoHide?.enabled) this.autoHideFeature.onload();
        if (this.plugin.settings.mySideBar.ribbon?.enabled) await this.ribbonFeature.onload();
        if (this.plugin.settings.mySideBar.tabs?.enabled) {
            await this.tabsFeature.onload();
            this.contextualFeature.onload();
        }
    }

    onunload() {
        this.autoHideFeature.onunload();
        this.ribbonFeature.onunload();
        this.tabsFeature.onunload();
        this.contextualFeature.onunload();
    }
}

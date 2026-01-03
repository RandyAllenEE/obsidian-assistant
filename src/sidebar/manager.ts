import { App } from "obsidian";
import AssistantPlugin from "../main";
import { AutoHideFeature } from "./features/auto-hide";
import { RibbonFeature } from "./features/ribbon";
import { SidebarTabsFeature } from "./features/tabs";

export class SidebarManager {
    app: App;
    plugin: AssistantPlugin;
    autoHideFeature: AutoHideFeature;
    ribbonFeature: RibbonFeature;
    tabsFeature: SidebarTabsFeature;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
        this.autoHideFeature = new AutoHideFeature(app, plugin);
        this.ribbonFeature = new RibbonFeature(app, plugin);
        this.tabsFeature = new SidebarTabsFeature(app, plugin);
    }

    async onload() {
        if (this.plugin.settings.mySideBar.autoHide?.enabled !== false) {
            this.autoHideFeature.load();
        }
        if (this.plugin.settings.mySideBar.ribbon?.enabled !== false) {
            await this.ribbonFeature.onload();
        }
        if (this.plugin.settings.mySideBar.tabs?.enabled !== false) {
            await this.tabsFeature.onload();
        }
    }

    onunload() {
        this.autoHideFeature.unload();
        this.ribbonFeature.onunload();
        // this.tabsFeature.onunload(); // If implemented
    }
}

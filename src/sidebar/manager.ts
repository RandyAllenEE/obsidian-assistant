import { App } from "obsidian";
import AssistantPlugin from "../main";
import { AutoHideFeature } from "./features/auto-hide";
import { RibbonFeature } from "./features/ribbon";

export class SidebarManager {
    app: App;
    plugin: AssistantPlugin;
    autoHideFeature: AutoHideFeature;
    ribbonFeature: RibbonFeature;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
        this.autoHideFeature = new AutoHideFeature(app, plugin);
        this.ribbonFeature = new RibbonFeature(app, plugin);
    }

    async onload() {
        this.autoHideFeature.load();
        await this.ribbonFeature.onload();
    }

    onunload() {
        this.autoHideFeature.unload();
        this.ribbonFeature.onunload();
    }
}

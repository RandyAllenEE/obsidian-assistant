import { App, setIcon } from "obsidian";
import AssistantPlugin from "../main";
import { MySnippetsSettings } from "../settings";
import { EnhancedApp } from "./types";
import { addIcons } from "./icons/customIcons";
import snippetsMenu from "./ui/snippetsMenu";
import CreateSnippetModal from "./modal/createSnippetModal";
import { setAttributes } from "./util/setAttributes";
import { t } from "../i18n/helpers";

export class SnippetsManager {
    app: EnhancedApp;
    plugin: AssistantPlugin;
    settings: MySnippetsSettings;
    statusBarIcon: HTMLElement | undefined;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app as EnhancedApp;
        this.plugin = plugin;
        this.settings = this.plugin.settings.mySnippets;
    }

    async onload() {
        console.log('Loading MySnippets module...');
        addIcons();

        // Ensure status bar icon is setup after layout ready
        if (this.app.workspace.layoutReady) {
            this.setupSnippetsStatusBarIcon();
        } else {
            this.app.workspace.onLayoutReady(() => {
                setTimeout(() => {
                    this.setupSnippetsStatusBarIcon();
                });
            });
        }

        // Register Commands
        // Note: In original plugin these were in onload. 
        // Since this manager is loaded/unloaded dynamically, we should manage commands.
        // But Obsidian API doesn't make it easy to unregister commands dynamically by ID without private API.
        // We will register them if not exists? Or just register on plugin load?
        // Since commands are global, maybe we should register them in main plugin but check enabled status?
        // Or we can try to register/unregister.
        // For simplicity, let's register them here.

        this.plugin.addCommand({
            id: `open-snippets-menu`,
            name: t(`Open snippets in status bar`),
            icon: `pantone-line`,
            callback: async () => {
                if (this.settings.enabled) snippetsMenu(this.app, this, this.settings);
            },
        });
        this.plugin.addCommand({
            id: `open-snippets-create`,
            name: t(`Create new CSS snippet`),
            icon: `ms-css-file`,
            callback: async () => {
                if (this.settings.enabled) new CreateSnippetModal(this.app, this).open();
            },
        });
    }

    onunload() {
        console.log('Unloading MySnippets module...');
        if (this.statusBarIcon) {
            this.statusBarIcon.remove();
            this.statusBarIcon = undefined;
        }

        // We can't easily remove commands without access to app.commands.removeCommand which is private/internal.
        // But if we disable the module, the commands callback check enabled status.
    }

    setupSnippetsStatusBarIcon() {
        if (!this.settings.showStatusBarIcon) {
            if (this.statusBarIcon) {
                this.statusBarIcon.remove();
                this.statusBarIcon = undefined;
            }
            return;
        }

        if (this.statusBarIcon) return; // Already setup

        this.statusBarIcon = this.plugin.addStatusBarItem();
        this.statusBarIcon.addClass("MiniSettings-statusbar-button");
        this.statusBarIcon.addClass("mod-clickable");

        setAttributes(this.statusBarIcon, {
            "aria-label": "Configure Snippets",
            "aria-label-position": "top",
        });
        setIcon(this.statusBarIcon, "pantone-line");

        this.statusBarIcon.addEventListener("click", () => {
            snippetsMenu(this.app, this, this.settings);
        });
    }

    updateStatusBar() {
        this.setupSnippetsStatusBarIcon();
    }

    saveSettings() {
        return this.plugin.saveSettings();
    }
}

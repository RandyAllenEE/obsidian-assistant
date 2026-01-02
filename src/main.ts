import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { AssistantSettings, DEFAULT_SETTINGS } from './settings';
import { FoldersManager } from './folders/manager';
import { renderFoldersSettings } from './folders/settings-ui';
import { StatusBarManager } from './statusbar/manager';
import { renderStatusBarSettings } from './statusbar/settings-ui';
import { PluginsManager } from './plugins/manager';
import { renderPluginsSettings } from './plugins/settings-ui';
import { SnippetsManager } from './snippets/manager';
import { renderSnippetsSettings } from './snippets/settings-ui';
import { t } from './i18n/helpers';

export default class AssistantPlugin extends Plugin {
    settings: AssistantSettings;
    foldersManager: FoldersManager;
    pluginsManager: PluginsManager;
    statusBarManager: StatusBarManager;
    snippetsManager: SnippetsManager;

    async onload() {
        console.log(t('Loading Obsidian Assistant...'));
        console.log(t('Loading Settings...'));
        await this.loadSettings();

        // Initialize Managers
        this.foldersManager = new FoldersManager(this.app, this);
        this.pluginsManager = new PluginsManager(this.app, this);
        this.statusBarManager = new StatusBarManager(this.app, this);
        this.snippetsManager = new SnippetsManager(this.app, this);

        // Load modules if enabled
        if (this.settings.myFolders.enabled) await this.foldersManager.onload();
        if (this.settings.myPlugins.enabled) await this.pluginsManager.onload();
        if (this.settings.myStatusBar.enabled) await this.statusBarManager.onload();
        if (this.settings.mySnippets.enabled) await this.snippetsManager.onload();

        this.addSettingTab(new AssistantSettingsTab(this.app, this));
    }

    onunload() {
        console.log(t('Unloading Obsidian Assistant...'));
        this.foldersManager?.onunload();
        this.pluginsManager?.onunload();
        this.statusBarManager?.onunload();
        this.snippetsManager?.onunload();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class AssistantSettingsTab extends PluginSettingTab {
    plugin: AssistantPlugin;

    constructor(app: App, plugin: AssistantPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: t('Obsidian Assistant Settings') });

        // MyFolders Section
        this.addPluginSection(
            containerEl,
            t('My Folders'),
            this.plugin.settings.myFolders.enabled,
            async (value) => {
                this.plugin.settings.myFolders.enabled = value;
                await this.plugin.saveSettings();
                if (value) {
                    this.plugin.foldersManager.onload();
                } else {
                    this.plugin.foldersManager.onunload();
                }
            },
            (el) => {
                renderFoldersSettings(el, this.plugin.foldersManager);
            }
        );

        // MyPlugins Section
        this.addPluginSection(
            containerEl,
            t('My Plugins'),
            this.plugin.settings.myPlugins.enabled,
            async (value) => {
                this.plugin.settings.myPlugins.enabled = value;
                await this.plugin.saveSettings();
                if (value) {
                    this.plugin.pluginsManager.onload();
                } else {
                    this.plugin.pluginsManager.onunload();
                }
            },
            (el) => {
                renderPluginsSettings(el, this.plugin.pluginsManager);
            }
        );

        // MyStatusBar Section
        this.addPluginSection(
            containerEl,
            t('My Status Bar'),
            this.plugin.settings.myStatusBar.enabled,
            async (value) => {
                this.plugin.settings.myStatusBar.enabled = value;
                await this.plugin.saveSettings();
                if (value) {
                    this.plugin.statusBarManager.onload();
                } else {
                    this.plugin.statusBarManager.onunload();
                }
            },
            (el) => {
                renderStatusBarSettings(el, this.plugin.statusBarManager);
            }
        );

        // MySnippets Section
        this.addPluginSection(
            containerEl,
            t('My Snippets'),
            this.plugin.settings.mySnippets.enabled,
            async (value) => {
                this.plugin.settings.mySnippets.enabled = value;
                await this.plugin.saveSettings();
                if (value) {
                    this.plugin.snippetsManager.onload();
                } else {
                    this.plugin.snippetsManager.onunload();
                }
            },
            (el) => {
                renderSnippetsSettings(el, this.plugin.snippetsManager);
            }
        );
    }

    addPluginSection(
        containerEl: HTMLElement,
        title: string,
        isEnabled: boolean,
        onToggle: (val: boolean) => void,
        renderBody: (el: HTMLElement) => void
    ) {
        const details = containerEl.createEl('details');
        details.open = false;
        details.style.marginBottom = '1em';
        details.style.border = '1px solid var(--background-modifier-border)';
        details.style.borderRadius = '5px';

        const summary = details.createEl('summary');
        summary.style.display = 'flex';
        summary.style.alignItems = 'center';
        summary.style.justifyContent = 'space-between';
        summary.style.padding = '0.5em 1em';
        summary.style.cursor = 'pointer';
        summary.style.backgroundColor = 'var(--background-secondary)';
        summary.style.borderTopLeftRadius = '5px';
        summary.style.borderTopRightRadius = '5px';

        const titleContainer = summary.createEl('div', { cls: 'settings-section-title' });
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.gap = '10px';
        titleContainer.createEl('strong', { text: title });

        // Toggle Switch Container
        const toggleContainer = summary.createEl('div');
        toggleContainer.onclick = (e) => e.preventDefault(); // Just stop propagation isn't enough for summary? 
        // Actually, clicking a child of summary usually triggers toggle unless preventDefault/stopPropagation.
        // But setting toggle uses specific event handling.

        const toggleSetting = new Setting(toggleContainer)
            .addToggle(toggle => toggle
                .setValue(isEnabled)
                .onChange(onToggle));
        // Remove default setting padding/border to fit in header
        toggleSetting.settingEl.style.border = 'none';
        toggleSetting.settingEl.style.padding = '0';
        toggleSetting.infoEl.remove(); // Remove empty info

        const content = details.createEl('div');
        content.style.padding = '1em';
        content.style.borderTop = '1px solid var(--background-modifier-border)';

        if (isEnabled) {
            renderBody(content);
        } else {
            content.createEl('i', { text: t('Module is disabled.') });
        }
    }
}

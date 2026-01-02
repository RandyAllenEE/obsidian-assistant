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

import { HeadingsManager } from './headings/manager';
import { renderHeadingsSettings } from './headings/settings-ui';
import { FormulasManager } from './formulas/manager';
import { renderFormulasSettings } from './formulas/settings-ui';
import { AutoNumberingController } from './utils/auto-numbering';

export default class AssistantPlugin extends Plugin {
    settings: AssistantSettings;
    foldersManager: FoldersManager;
    pluginsManager: PluginsManager;
    statusBarManager: StatusBarManager;
    snippetsManager: SnippetsManager;
    headingsManager: HeadingsManager;
    formulasManager: FormulasManager;
    autoNumberingController: AutoNumberingController;

    async onload() {
        console.log(t('Loading Obsidian Assistant...'));
        console.log(t('Loading Settings...'));
        await this.loadSettings();

        // Initialize Managers
        this.foldersManager = new FoldersManager(this.app, this);
        this.pluginsManager = new PluginsManager(this.app, this);
        this.statusBarManager = new StatusBarManager(this.app, this);
        this.snippetsManager = new SnippetsManager(this.app, this);
        this.headingsManager = new HeadingsManager(this.app, this);
        this.formulasManager = new FormulasManager(this.app, this);

        // Initialize Auto Controller
        this.autoNumberingController = new AutoNumberingController(this.app, this, this.headingsManager, this.formulasManager);

        // Load modules if enabled
        if (this.settings.myFolders.enabled) await this.foldersManager.onload();
        if (this.settings.myPlugins.enabled) await this.pluginsManager.onload();
        if (this.settings.myStatusBar.enabled) await this.statusBarManager.onload();
        if (this.settings.mySnippets.enabled) await this.snippetsManager.onload();
        if (this.settings.myHeadings.enabled) await this.headingsManager.onload();
        if (this.settings.myFormulas.enabled) await this.formulasManager.onload();

        // Load Auto Controller if either relevant module is enabled
        if (this.settings.myHeadings.enabled || this.settings.myFormulas.enabled) {
            this.autoNumberingController.onload();
        }

        this.addSettingTab(new AssistantSettingsTab(this.app, this));
    }

    onunload() {
        console.log(t('Unloading Obsidian Assistant...'));
        this.foldersManager?.onunload();
        this.pluginsManager?.onunload();
        this.statusBarManager?.onunload();
        this.snippetsManager?.onunload();
        this.headingsManager?.onunload();
        this.formulasManager?.onunload();
        this.autoNumberingController?.onunload();
    }

    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

        // Deep merge for nested settings objects to ensure new defaults (like Heading Shifter) are present
        // even if the user has pre-existing settings for the module.
        if (loadedData?.myHeadings) {
            this.settings.myHeadings = Object.assign({}, DEFAULT_SETTINGS.myHeadings, loadedData.myHeadings);

            // Deep merge stylesToRemove if it exists partially or not at all in loadedData
            // Note: If loadedData.myHeadings.styleToRemove exists, it overwrites. But we want to ensure keys exist.
            // But since styleToRemove is ALL NEW, if it exists in loadedData it's from this session? 
            // If it doesn't exist, Object.assign({}, DEFAULT, loaded) handles it because loaded won't have it.
            // Wait, Object.assign is shallow.
            // DEFAULT.myHeadings has styleToRemove. loadedData.myHeadings does NOT.
            // Object.assign(target, default, loaded) -> target gets default.styleToRemove. loaded lacks it, so it keeps default.
            // So one level deep merge for myHeadings is enough to get styleToRemove.

            // However, styleToRemove itself is nested. If in future we add keys to styleToRemove, we might need deeper.
            // For now, migrating from "No Shifter" to "Shifter", 1-level deep for myHeadings is sufficient
            // because strict "undefined" in loadedData means default value prevails.
        }

        if (loadedData?.myFormulas) {
            this.settings.myFormulas = Object.assign({}, DEFAULT_SETTINGS.myFormulas, loadedData.myFormulas);
        }

        if (loadedData?.mySnippets) {
            this.settings.mySnippets = Object.assign({}, DEFAULT_SETTINGS.mySnippets, loadedData.mySnippets);
        }
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

        // Global Settings Section
        containerEl.createEl('h3', { text: t('Global Settings') });

        new Setting(containerEl)
            .setName(t('Auto-Numbering Refresh Interval'))
            .setDesc(t('Time in milliseconds to wait before auto-numbering triggers (after losing focus)'))
            .addText(text => text
                .setPlaceholder('1000')
                .setValue(String(this.plugin.settings.refreshInterval))
                .onChange(async (value) => {
                    const interval = parseInt(value);
                    if (!isNaN(interval) && interval > 0) {
                        this.plugin.settings.refreshInterval = interval;
                        await this.plugin.saveSettings();
                    }
                }));

        containerEl.createEl('br');
        containerEl.createEl('h3', { text: t('Modules') });


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

        // MyHeadings Section
        this.addPluginSection(
            containerEl,
            t('My Headings'),
            this.plugin.settings.myHeadings.enabled,
            async (value) => {
                this.plugin.settings.myHeadings.enabled = value;
                await this.plugin.saveSettings();

                // Reload logic for Headings + Auto Controller
                if (value) {
                    await this.plugin.headingsManager.onload();
                } else {
                    this.plugin.headingsManager.onunload();
                }

                // Refresh controller: if any module is active, ensure it's loaded. If all inactive, unload.
                const anyActive = value || this.plugin.settings.myFormulas.enabled;
                if (anyActive) {
                    // It's safe to call onload multiple times (idempotent setup usually preferred, but here simple re-register might duplicate listeners if not careful)
                    // Controller implementation of onload calls 'registerEditorFocusEvents'.
                    // We should probably unload first just to be safe or check state.
                    this.plugin.autoNumberingController.onunload(); // Clear old listeners
                    this.plugin.autoNumberingController.onload();   // Add new listeners
                } else {
                    this.plugin.autoNumberingController.onunload();
                }
            },
            (el) => {
                renderHeadingsSettings(el, this.plugin.headingsManager);
            }
        );

        // MyFormulas Section
        this.addPluginSection(
            containerEl,
            t('My Formulas'),
            this.plugin.settings.myFormulas.enabled,
            async (value) => {
                this.plugin.settings.myFormulas.enabled = value;
                await this.plugin.saveSettings();

                if (value) {
                    await this.plugin.formulasManager.onload();
                } else {
                    this.plugin.formulasManager.onunload();
                }

                // Refresh controller
                const anyActive = this.plugin.settings.myHeadings.enabled || value;
                if (anyActive) {
                    this.plugin.autoNumberingController.onunload();
                    this.plugin.autoNumberingController.onload();
                } else {
                    this.plugin.autoNumberingController.onunload();
                }
            },
            (el) => {
                renderFormulasSettings(el, this.plugin.formulasManager);
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
        toggleContainer.onclick = (e) => e.preventDefault();

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

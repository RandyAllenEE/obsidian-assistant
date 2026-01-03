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
import { SidebarManager } from './sidebar/manager';
import { renderSidebarSettings } from './sidebar/settings-ui';
import { AutoNumberingController } from './utils/auto-numbering';

export default class AssistantPlugin extends Plugin {
    settings: AssistantSettings;
    foldersManager: FoldersManager;
    pluginsManager: PluginsManager;
    statusBarManager: StatusBarManager;
    snippetsManager: SnippetsManager;
    headingsManager: HeadingsManager;

    formulasManager: FormulasManager;
    sidebarManager: SidebarManager;
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
        this.sidebarManager = new SidebarManager(this.app, this);

        // Initialize Auto Controller
        this.autoNumberingController = new AutoNumberingController(this.app, this, this.headingsManager, this.formulasManager);

        // Load modules if enabled
        if (this.settings.myFolders.enabled) await this.foldersManager.onload();
        if (this.settings.myPlugins.enabled) await this.pluginsManager.onload();
        if (this.settings.myStatusBar.enabled) await this.statusBarManager.onload();
        if (this.settings.mySnippets.enabled) await this.snippetsManager.onload();
        if (this.settings.myHeadings.enabled) await this.headingsManager.onload();
        if (this.settings.myFormulas.enabled) await this.formulasManager.onload();
        if (this.settings.mySideBar.enabled) await this.sidebarManager.onload();

        // Load Auto Controller if either relevant module is enabled
        if (this.settings.myHeadings.enabled || this.settings.myFormulas.enabled) {
            this.autoNumberingController.onload();
        }

        // --- Centralized Command Registration ---

        // Folders
        this.addCommand({
            id: "toggle-attachment-folders",
            name: t('Toggle visibility of hidden folders'),
            callback: () => {
                if (this.settings.myFolders.enabled) this.foldersManager.toggleFunctionality();
            },
        });

        // Snippets
        this.addCommand({
            id: `open-snippets-menu`,
            name: t(`Open snippets in status bar`),
            icon: `pantone-line`,
            callback: async () => {
                if (this.settings.mySnippets.enabled) this.snippetsManager.openMenu();
            },
        });
        this.addCommand({
            id: `open-snippets-create`,
            name: t(`Create new CSS snippet`),
            icon: `ms-css-file`,
            callback: async () => {
                if (this.settings.mySnippets.enabled) this.snippetsManager.openCreateModal();
            },
        });

        // Headings
        this.addCommand({
            id: 'configure-headings',
            name: t('Configure Headings'),
            callback: () => {
                if (this.settings.myHeadings.enabled) this.headingsManager.openControlModal();
            },
        });

        // Formulas
        this.addCommand({
            id: 'configure-formulas',
            name: t('Configure Formulas'),
            callback: () => {
                if (this.settings.myFormulas.enabled) this.formulasManager.openControlModal();
            },
        });

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
        this.sidebarManager?.onunload();
        this.autoNumberingController?.onunload();
    }

    async loadSettings() {
        const loadedData = await this.loadData();

        if (loadedData) {
            this.migrateSettings(loadedData);
        }

        // 1. Initial Assign for top-level keys
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

        // 2. Clearer Deep Merge for all modules to ensure default values for new keys
        // Headings (includes Shifter)
        if (loadedData?.myHeadings) {
            this.settings.myHeadings = Object.assign({}, DEFAULT_SETTINGS.myHeadings, loadedData.myHeadings);
            // Even deeper if needed (e.g. styleToRemove)
            if (loadedData.myHeadings.styleToRemove) {
                this.settings.myHeadings.styleToRemove = {
                    beginning: Object.assign({}, DEFAULT_SETTINGS.myHeadings.styleToRemove.beginning, loadedData.myHeadings.styleToRemove.beginning),
                    surrounding: Object.assign({}, DEFAULT_SETTINGS.myHeadings.styleToRemove.surrounding, loadedData.myHeadings.styleToRemove.surrounding),
                };
            }
        }

        // Formulas
        if (loadedData?.myFormulas) {
            this.settings.myFormulas = Object.assign({}, DEFAULT_SETTINGS.myFormulas, loadedData.myFormulas);
        }

        // Folders
        if (loadedData?.myFolders) {
            this.settings.myFolders = Object.assign({}, DEFAULT_SETTINGS.myFolders, loadedData.myFolders);
        }

        // Plugins
        if (loadedData?.myPlugins) {
            this.settings.myPlugins = Object.assign({}, DEFAULT_SETTINGS.myPlugins, loadedData.myPlugins);
            if (loadedData.myPlugins.desktop) {
                this.settings.myPlugins.desktop = Object.assign({}, DEFAULT_SETTINGS.myPlugins.desktop, loadedData.myPlugins.desktop);
            }
            if (loadedData.myPlugins.mobile) {
                this.settings.myPlugins.mobile = Object.assign({}, DEFAULT_SETTINGS.myPlugins.mobile, loadedData.myPlugins.mobile);
            }
        }

        // Snippets
        if (loadedData?.mySnippets) {
            this.settings.mySnippets = Object.assign({}, DEFAULT_SETTINGS.mySnippets, loadedData.mySnippets);
        }

        // SideBar
        if (loadedData?.mySideBar) {
            this.settings.mySideBar = Object.assign({}, DEFAULT_SETTINGS.mySideBar, loadedData.mySideBar);

            if (loadedData.mySideBar.autoHide) {
                this.settings.mySideBar.autoHide = Object.assign({}, DEFAULT_SETTINGS.mySideBar.autoHide, loadedData.mySideBar.autoHide);
            }
            if (loadedData.mySideBar.ribbon) {
                this.settings.mySideBar.ribbon = Object.assign({}, DEFAULT_SETTINGS.mySideBar.ribbon, loadedData.mySideBar.ribbon);
            }
            if (loadedData.mySideBar.tabs) {
                this.settings.mySideBar.tabs = Object.assign({}, DEFAULT_SETTINGS.mySideBar.tabs, loadedData.mySideBar.tabs);

                // Cleanup splitRatio bounds (Issue #6)
                if (this.settings.mySideBar.tabs.bindings) {
                    this.settings.mySideBar.tabs.bindings.forEach(b => {
                        if (b.splitRatio !== undefined) {
                            b.splitRatio = Math.round(b.splitRatio);
                            if (b.splitRatio < 10) b.splitRatio = 10;
                            if (b.splitRatio > 90) b.splitRatio = 90;
                        }
                    });
                }
            }
        }

        // Save cleaned settings to disk immediately
        await this.saveSettings();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private migrateSettings(data: any) {
        // Migration for version < 2.0.0
        // Clean up 2.0.0 obsoleted keys
        if (data.myStatusBar) {
            delete data.myStatusBar.presets;
            delete data.myStatusBar.activePreset;
            delete data.myStatusBar.activeFullscreenPreset;
            delete data.myStatusBar.separateFullscreenPreset;
            delete data.myStatusBar.presetsOrder;
        }
        delete data.statusBar;
        delete data.statusBarOrganizer;
    }
}

class AssistantSettingsTab extends PluginSettingTab {
    plugin: AssistantPlugin;

    constructor(app: App, plugin: AssistantPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    private refreshAutoNumberingController() {
        const anyActive = this.plugin.settings.myHeadings.enabled || this.plugin.settings.myFormulas.enabled;

        // Always unload to clear potential old listeners/state
        this.plugin.autoNumberingController.onunload();

        if (anyActive) {
            this.plugin.autoNumberingController.onload();
        }
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

                this.refreshAutoNumberingController();
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

                this.refreshAutoNumberingController();
            },
            (el) => {
                renderFormulasSettings(el, this.plugin.formulasManager);
            }
        );

        // MySideBar Section
        this.addPluginSection(
            containerEl,
            t('My SideBar'),
            this.plugin.settings.mySideBar.enabled,
            async (value) => {
                this.plugin.settings.mySideBar.enabled = value;
                await this.plugin.saveSettings();
                if (value) {
                    this.plugin.sidebarManager.onload();
                } else {
                    this.plugin.sidebarManager.onunload();
                }
            },
            (el) => {
                renderSidebarSettings(el, this.plugin.sidebarManager);
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

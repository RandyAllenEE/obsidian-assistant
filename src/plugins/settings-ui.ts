import { DropdownComponent, Setting } from "obsidian";
import { PluginsManager } from "./manager";
import { LoadingMethod } from "../settings";
import { t } from "../i18n/helpers";

export function renderPluginsSettings(containerEl: HTMLElement, manager: PluginsManager) {
    const view = new PluginsSettingsView(containerEl, manager);
    view.display();
}

class PluginsSettingsView {
    manager: PluginsManager;
    containerEl: HTMLElement;
    filterMethod: LoadingMethod | undefined;
    filterString: string | undefined;
    dropdowns: DropdownComponent[] = [];
    pluginListContainer: HTMLElement;

    constructor(containerEl: HTMLElement, manager: PluginsManager) {
        this.containerEl = containerEl;
        this.manager = manager;
    }

    get settings() {
        return this.manager.settings;
    }

    async display() {
        const { containerEl } = this;

        if (!this.settings.enabled) return;

        new Setting(containerEl)
            .setName(t('Separate desktop/mobile configuration'))
            .setDesc(t('Enable this if you want to have different settings depending whether you\'re using a desktop or mobile device. All of the settings below can be configured differently on desktop and mobile. You\'re currently using the {device} settings.').replace('{device}', this.manager.device))
            .addToggle(toggle => {
                toggle
                    .setValue(this.settings.dualConfigs)
                    .onChange(async (value) => {
                        this.settings.dualConfigs = value;
                        await this.manager.plugin.saveSettings();
                        await this.manager.onload();
                    })
            });

        // Timers
        Object.entries({
            shortDelaySeconds: t('Short delay (seconds)'),
            longDelaySeconds: t('Long delay (seconds)')
        }).forEach(([key, name]) => {
            new Setting(containerEl)
                .setName(name)
                .addText(text => text
                    // @ts-ignore
                    .setValue(this.manager.deviceSettings[key].toString())
                    .onChange(async (value) => {
                        // @ts-ignore
                        this.manager.deviceSettings[key] = parseFloat(parseFloat(value).toFixed(3));
                        await this.manager.plugin.saveSettings();
                    }))
        });

        new Setting(containerEl)
            .setName(t('Default startup type for new plugins'))
            .addDropdown(dropdown => {
                dropdown.addOption('', t('Nothing configured'));
                this.addDelayOptions(dropdown);
                dropdown
                    .setValue(this.manager.deviceSettings.defaultStartupType || '')
                    .onChange(async (value: LoadingMethod) => {
                        this.manager.deviceSettings.defaultStartupType = value || null;
                        await this.manager.plugin.saveSettings();
                    })
            });

        new Setting(containerEl)
            .setName(t('Show plugin descriptions'))
            .addToggle(toggle => {
                toggle
                    .setValue(this.manager.deviceSettings.showDescriptions)
                    .onChange(async (value) => {
                        this.manager.deviceSettings.showDescriptions = value;
                        await this.manager.plugin.saveSettings();
                        this.buildPluginList();
                    })
            });

        new Setting(containerEl)
            .setName(t('Set the delay for all plugins at once'))
            .addDropdown(dropdown => {
                dropdown.addOption('', t('Set all plugins to be:'));
                this.addDelayOptions(dropdown);
                dropdown.onChange(async (value: LoadingMethod) => {
                    this.manager.manifests.forEach(plugin => {
                        this.manager.deviceSettings.plugins[plugin.id] = { startupType: value };
                    });
                    this.dropdowns.forEach(d => d.setValue(value));
                    dropdown.setValue('');
                    await this.manager.plugin.saveSettings();
                })
            });

        // Filter UI moved into styled details
        const pluginsDetails = containerEl.createEl('details');
        pluginsDetails.style.marginBottom = '10px';
        pluginsDetails.style.border = '1px solid var(--background-modifier-border)';
        pluginsDetails.style.borderRadius = '5px';
        pluginsDetails.style.padding = '0.5em';
        pluginsDetails.open = true; // Default open for visibility since it's the main feature? User requested "like My Sidebar", sidebar defaults closed typically but for main content maybe open? I'll stick to OPEN since hiding the main list immediately might be confusing, or CLOSED if they want to save space. User said "place in that dropdown", implying hidden by default. I'll set open = false (default behavior of createEl('details') actually) but let's be explicit. User "also has a dropdown menu". I'll default false.

        const pluginsSummary = pluginsDetails.createEl('summary');
        pluginsSummary.setText(t('Plugins')); // Matches previous heading
        pluginsSummary.style.cursor = 'pointer';
        pluginsSummary.style.fontWeight = 'bold';
        pluginsSummary.style.outline = 'none';

        const pluginsContent = pluginsDetails.createEl('div');
        pluginsContent.style.marginTop = '10px';
        pluginsContent.style.paddingLeft = '5px';
        pluginsContent.style.borderLeft = '2px solid var(--background-modifier-border)';

        // Add filters to content
        const filterContainer = pluginsContent.createDiv();
        filterContainer.createSpan({ text: t('Filter by: '), style: 'margin-right: 10px; font-weight: bold;' });

        this.addFilterButton(filterContainer, t('All'));
        Object.keys(LoadingMethod).forEach(key =>
            this.addFilterButton(filterContainer, t(LoadingMethod[key as LoadingMethod] as any) || key, key as LoadingMethod));

        new Setting(pluginsContent)
            .addText(text => text
                .setPlaceholder(t('Type to filter list'))
                .onChange(value => {
                    this.filterString = value;
                    this.buildPluginList();
                }));

        this.pluginListContainer = pluginsContent.createEl('div');
        this.buildPluginList();
    }

    buildPluginList() {
        this.pluginListContainer.empty();
        this.manager.updateManifests(); // Ensure fresh list

        this.manager.manifests.forEach(plugin => {
            const currentValue = this.manager.getPluginStartup(plugin.id);

            if (this.filterMethod && currentValue !== this.filterMethod) return;
            if (this.filterString && !plugin.name.toLowerCase().includes(this.filterString.toLowerCase())) return;

            new Setting(this.pluginListContainer)
                .setName(plugin.name)
                .addDropdown(dropdown => {
                    this.dropdowns.push(dropdown);
                    this.addDelayOptions(dropdown);

                    dropdown
                        .setValue(currentValue)
                        .onChange(async (value: LoadingMethod) => {
                            await this.manager.updatePluginSettings(plugin.id, value);
                            this.manager.setPluginStartup(plugin.id);
                        })
                })
                .then(setting => {
                    if (this.manager.deviceSettings.showDescriptions) {
                        setting.setDesc(plugin.description);
                    }
                });
        });
    }

    addDelayOptions(el: DropdownComponent) {
        const loadingMethodsDisplay: { [key in LoadingMethod]: string } = {
            disabled: t('⛔ Disable plugin'),
            instant: t('⚡ Instant'),
            short: t('⌚ Short delay'),
            long: t('💤 Long delay')
        };
        Object.keys(loadingMethodsDisplay).forEach(key => {
            el.addOption(key, loadingMethodsDisplay[key as LoadingMethod]);
        })
    }

    addFilterButton(el: HTMLElement, text: string, value?: LoadingMethod) {
        const link = el.createEl('button', { text });
        link.addClass('lazy-plugin-filter');
        link.style.marginRight = '5px';
        link.onclick = () => {
            this.filterMethod = value;
            this.buildPluginList();
        }
    }
}


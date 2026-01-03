import { App, Platform, PluginManifest } from 'obsidian';
import AssistantPlugin from '../main';
import { DeviceSettings, LoadingMethod, MyPluginsSettings, DEFAULT_DEVICE_SETTINGS } from '../settings';
import { t } from "../i18n/helpers";

export class PluginsManager {
    app: App;
    plugin: AssistantPlugin;
    manifests: PluginManifest[] = [];
    pendingTimeouts: NodeJS.Timeout[] = [];
    device = 'desktop/global';
    private isLoaded = false;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    get settings(): MyPluginsSettings {
        return this.plugin.settings.myPlugins;
    }

    get deviceSettings(): DeviceSettings {
        if (this.settings.dualConfigs && Platform.isMobile) {
            return this.settings.mobile || this.settings.desktop;
        }
        return this.settings.desktop;
    }

    async onload() {
        if (this.isLoaded) return;
        this.isLoaded = true;

        if (!this.settings.enabled) return;

        // Dual config initialization logic
        if (this.settings.dualConfigs && Platform.isMobile) {
            if (!this.settings.mobile) {
                this.settings.mobile = JSON.parse(JSON.stringify(this.settings.desktop));
                await this.plugin.saveSettings();
            }
            this.device = 'mobile';
        } else {
            this.device = 'desktop/global';
        }

        this.updateManifests();
        await this.setInitialPluginsConfiguration();

        // Iterate over the installed plugins and load them with the specified delay
        this.manifests.forEach(plugin => this.setPluginStartup(plugin.id));
    }

    onunload() {
        if (!this.isLoaded) return;
        this.isLoaded = false;
        this.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.pendingTimeouts = [];
    }

    async setPluginStartup(pluginId: string) {
        // @ts-expect-error
        const obsidian = this.app.plugins;

        const startupType = this.getPluginStartup(pluginId);
        const isActiveOnStartup = obsidian.enabledPlugins.has(pluginId);
        const isRunning = obsidian.plugins?.[pluginId]?._loaded;

        switch (startupType) {
            case LoadingMethod.disabled:
                await obsidian.disablePluginAndSave(pluginId);
                break;
            case LoadingMethod.instant:
                if (!isActiveOnStartup && !isRunning) await obsidian.enablePluginAndSave(pluginId);
                break;
            case LoadingMethod.short:
            case LoadingMethod.long:
                if (isActiveOnStartup) {
                    await obsidian.disablePluginAndSave(pluginId);
                    await obsidian.enablePlugin(pluginId);
                } else if (!isRunning) {
                    const seconds = startupType === LoadingMethod.short ? this.deviceSettings.shortDelaySeconds : this.deviceSettings.longDelaySeconds;
                    const stagger = isNaN(this.deviceSettings.delayBetweenPlugins) ? 40 : this.deviceSettings.delayBetweenPlugins;
                    const delay = this.manifests.findIndex(x => x.id === pluginId) * stagger;

                    const timeout = setTimeout(async () => {
                        try {
                            if (!obsidian.plugins?.[pluginId]?._loaded) {
                                if (this.settings.showConsoleLog) {
                                    console.log(t('Starting {id} after a {type} delay').replace('{id}', pluginId).replace('{type}', startupType));
                                }
                                await obsidian.enablePlugin(pluginId);
                            }
                        } catch (e) {
                            console.error(t('Failed to load plugin {id} after delay:').replace('{id}', pluginId), e);
                        }
                    }, seconds * 1000 + delay);
                    this.pendingTimeouts.push(timeout);
                }
                break;
        }
    }

    getPluginStartup(pluginId: string): LoadingMethod {
        return this.deviceSettings.plugins?.[pluginId]?.startupType ||
            this.deviceSettings.defaultStartupType ||
            // @ts-expect-error
            (this.app.plugins.enabledPlugins.has(pluginId) ? LoadingMethod.instant : LoadingMethod.disabled);
    }

    async setInitialPluginsConfiguration() {
        let changed = false;
        for (const plugin of this.manifests) {
            if (!this.deviceSettings.plugins?.[plugin.id]?.startupType) {
                this.updatePluginSettingsWithNoSave(plugin.id, this.getPluginStartup(plugin.id));
                changed = true;
            }
        }
        if (changed) await this.plugin.saveSettings();
    }

    async updatePluginSettings(pluginId: string, startupType: LoadingMethod) {
        this.deviceSettings.plugins[pluginId] = { startupType };
        await this.plugin.saveSettings();
    }

    private updatePluginSettingsWithNoSave(pluginId: string, startupType: LoadingMethod) {
        this.deviceSettings.plugins[pluginId] = { startupType };
    }

    updateManifests() {
        // @ts-expect-error
        this.manifests = Object.values(this.app.plugins.manifests)
            .filter((plugin: PluginManifest) =>
                plugin.id !== this.plugin.manifest.id &&
                !(Platform.isMobile && plugin.isDesktopOnly))
            .sort((a, b) => a.name.localeCompare(b.name));
    }
}

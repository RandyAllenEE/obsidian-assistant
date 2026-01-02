import { StatusBarManager } from "./manager";
import { Setting } from "obsidian";
import { initializePresets } from "./presets";
import { initializeRows } from "./rows";
import { setFullscreenListener } from "./fullscreen";
import { t } from "../i18n/helpers";

export function renderStatusBarSettings(containerEl: HTMLElement, manager: StatusBarManager) {
    const plugin = manager;

    // Clean container logic usually handled by caller, but here we can ensure it's clean if needed.
    // showSettings implementation below:
    showSettings(plugin, containerEl);
}

// Renamed from showSettings to be internal or exported for strict porting
export async function showSettings(plugin: StatusBarManager, topContainer: HTMLElement): Promise<void> {
    topContainer.empty();

    // Dummy input used to fix automatically focusing on the first preset's name field
    const dummyInput = document.createElement("input");
    dummyInput.setAttribute("autofocus", "autofocus");
    dummyInput.setAttribute("type", "hidden");
    topContainer.appendChild(dummyInput);

    // Container for buttons to switch between presets
    const presetsContainer = document.createElement("div");
    presetsContainer.addClass("statusbar-organizer-presets-container");
    topContainer.appendChild(presetsContainer);

    // Container for rows of status bar elements
    const settingsContainer = document.createElement("div");
    settingsContainer.addClass("statusbar-organizer-rows-container-wrapper");
    topContainer.appendChild(settingsContainer);

    await initializePresets(plugin, presetsContainer, settingsContainer);
    await initializeRows(plugin, settingsContainer);

    new Setting(topContainer)
        .setName(t("Separate fullscreen and windowed mode"))
        .setDesc(t("When enabled, the plugin will remember which preset was active for fullscreen mode and which for windowed mode and switch correspondingly. This is useful for example when you want to display more information in fullscreen mode, like a clock."))
        .addToggle(toggle => toggle
            .setValue(plugin.settings.separateFullscreenPreset)
            .onChange(async value => {
                plugin.settings.separateFullscreenPreset = value;
                plugin.plugin.saveSettings();
            })
        )

    setFullscreenListener(async () => {
        await initializePresets(plugin, presetsContainer, settingsContainer);
        await initializeRows(plugin, settingsContainer);
    });
}


// Methods moved to StatusBarManager to break circular dependency

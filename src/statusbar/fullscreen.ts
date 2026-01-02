import { StatusBarManager } from "./manager";
import { getActivePreset } from "./presets";
import { fixOrder } from "./organizer";
import { ElectronWindow } from "./types";

declare let electronWindow: ElectronWindow;

let menuListener: () => void;
let fullscreenCallback: () => void;

export function monitorFullscreen(plugin: StatusBarManager) {
    // Check if electronWindow is available (Obsidian internal)
    if (typeof electronWindow !== 'undefined') {
        fullscreenCallback = fullscreenChange(plugin);
        (electronWindow as ElectronWindow).addListener("enter-full-screen", fullscreenCallback);
        (electronWindow as ElectronWindow).addListener("leave-full-screen", fullscreenCallback);
        fullscreenCallback();
    }
}

export function stopMonitoringFullscreen() {
    if (typeof electronWindow !== 'undefined' && fullscreenCallback) {
        (electronWindow as ElectronWindow).removeListener("enter-full-screen", fullscreenCallback);
        (electronWindow as ElectronWindow).removeListener("leave-full-screen", fullscreenCallback);
    }
}

function fullscreenChange(plugin: StatusBarManager) {
    return async () => {
        const settings = plugin.settings;
        if (!settings.separateFullscreenPreset || !(getActivePreset(plugin) in settings.presets)) {
            if (isFullscreen()) settings.activeFullscreenPreset = settings.activePreset;
            else settings.activePreset = settings.activeFullscreenPreset;
            await plugin.plugin.saveSettings();
        }
        fixOrder(plugin);
        menuListener?.();
    }
}

export function isFullscreen(): boolean {
    if (typeof electronWindow !== 'undefined') {
        return (electronWindow as ElectronWindow).isFullScreen();
    }
    return false;
}

export function setFullscreenListener(callback: () => void) {
    menuListener = callback;
}

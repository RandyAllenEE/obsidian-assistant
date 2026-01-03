import { StatusBarManager } from "./manager";
import { initializeRows } from "./rows";

export function renderStatusBarSettings(containerEl: HTMLElement, manager: StatusBarManager) {
    const plugin = manager;

    // Clean container logic usually handled by caller, but here we can ensure it's clean if needed.
    // showSettings implementation below:
    showSettings(plugin, containerEl);
}

// Renamed from showSettings to be internal or exported for strict porting
export async function showSettings(plugin: StatusBarManager, topContainer: HTMLElement): Promise<void> {
    topContainer.empty();

    // Container for rows of status bar elements
    const settingsContainer = document.createElement("div");
    settingsContainer.addClass("statusbar-organizer-rows-container-wrapper");
    topContainer.appendChild(settingsContainer);

    await initializeRows(plugin, settingsContainer);
}

import { StatusBarManager } from "./manager";
import { getStatusBarElements } from "./parser";
import { getActivePreset } from "./presets";
import { StatusBarElement } from "./types";

export function fixOrder(plugin: StatusBarManager) {
    if (!plugin.statusBar) return;
    const elements = getStatusBarElements(plugin.statusBar);
    const activePresetName = getActivePreset(plugin);
    const status = plugin.settings.presets[activePresetName];

    // If status is undefined (new preset issue?), try default or return
    if (!status) return;

    // Elements with known position
    const known: [StatusBarElement, number][] = [];

    // Elements which were not seen before
    const orphans = [];

    // Split elements into known and unknown
    for (const element of elements) {
        if (element.id in status) {
            const myStatus = status[element.id];
            known.push([element, myStatus.position]);
            if (myStatus.visible)
                (element.element as HTMLDivElement).removeClass("statusbar-organizer-element-hidden");
            else
                (element.element as HTMLDivElement).addClass("statusbar-organizer-element-hidden");
        } else {
            orphans.push(element.element);
        }
    }

    // Sort known elements by position set in the settings and extract their HTML elements
    const orderedElements = known
        .sort((a, b) => a[1] - b[1])
        .map((x) => x[0].element);

    // Append orphans to the end
    const allElements = orderedElements.concat(orphans);

    // Reorder elements according to their position in the list
    for (const [i, element] of allElements.entries()) {
        if (element) (element as HTMLElement).style.order = (i + 1).toString();
    }
}

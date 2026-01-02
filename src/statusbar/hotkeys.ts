import { StatusBarManager } from "./manager";
import { fixOrder } from "./organizer";
import { setActivePreset } from "./presets";
import { t } from "../i18n/helpers";

function commandCallback(plugin: StatusBarManager, index: number) {
    return (checking: boolean) => {
        if (!plugin.settings.enabled) return false;
        const presets = plugin.settings.presetsOrder;

        if (presets.length <= index) return false;
        if (!checking) {
            setActivePreset(plugin, presets[index]);
            fixOrder(plugin);
        }
        return true;
    }
}

export function registerHotkeys(plugin: StatusBarManager) {
    // Register 10 preset switch slots
    for (let i = 0; i < 10; i++) {
        plugin.plugin.addCommand({
            id: `statusbar-organizer-preset-${i}`,
            name: t(`Switch to preset slot {n}`).replace('{n}', (i + 1).toString()),
            checkCallback: commandCallback(plugin, i)
        });
    }
}

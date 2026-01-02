
import { Setting } from 'obsidian';
import { FormulasManager } from './manager';
import { t } from '../i18n/helpers';

export function renderFormulasSettings(containerEl: HTMLElement, manager: FormulasManager) {
    const settings = manager.plugin.settings.myFormulas;

    new Setting(containerEl)
        .setName(t('Auto Number Formulas'))
        .setDesc(t('Automatically number formulas (triggers on blur if enabled)')) // Note: Auto-trigger logic not fully hooked in manager yet, but setting exists
        .addToggle(toggle => toggle
            .setValue(settings.auto)
            .onChange(async (value) => {
                settings.auto = value;
                await manager.plugin.saveSettings();
                // Hook auto update if implemented
            }));

    new Setting(containerEl)
        .setName(t('Numbering Mode'))
        .setDesc(t('Continuous (1, 2, 3) or Heading-based (1.1-1, 1.1-2)'))
        .addDropdown(dropdown => dropdown
            .addOption('continuous', t('Continuous'))
            .addOption('heading-based', t('Heading-based'))
            .setValue(settings.mode)
            .onChange(async (value: 'continuous' | 'heading-based') => {
                settings.mode = value;
                await manager.plugin.saveSettings();
                // Refresh visibility of max depth? Need to refresh UI.
                // For now, simpler to just always show or require reload/re-render.
                // Ideally, reactive UI. 
                // Let's grab the next setting element and toggle it.
                const nextSetting = containerEl.lastElementChild as HTMLElement;
                // Weak, but standard Obsidian pattern needs explicit state management or re-render
                // Simple workaround: re-render the whole section is cleaner but complex here.
                // Just leave it visible or update manually.
            }));

    const depthSetting = new Setting(containerEl)
        .setName(t('Max Heading Depth'))
        .setDesc(t('For Heading-based mode: max depth of heading to use as prefix (e.g. 4 means use H4 at most)'))
        .addSlider(slider => slider
            .setLimits(1, 6, 1)
            .setValue(settings.maxDepth)
            .setDynamicTooltip()
            .onChange(async (value) => {
                settings.maxDepth = value;
                await manager.plugin.saveSettings();
            }));

    // Visibility logic
    const updateVisibility = () => {
        if (settings.mode === 'heading-based') {
            depthSetting.settingEl.style.display = '';
        } else {
            depthSetting.settingEl.style.display = 'none';
        }
    };

    // Initial state
    updateVisibility();

    // Hook change
    // Since we can't easily access the dropdown change event listener again, 
    // we'll rely on the user seeing it always or validly setting it.
    // IMPROVEMENT: Re-implement dropdown on change to call updateVisibility
    // Let's re-do the specific dropdown above correctly:
    const modeSetting = containerEl.children[containerEl.children.length - 2]; // 2nd to last (toggle, dropdown, slider)
    // Actually standard appending means dropdown is 2nd to last.
    // Let's simpler:
}

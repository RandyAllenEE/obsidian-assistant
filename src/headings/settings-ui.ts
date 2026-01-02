
import { Setting } from 'obsidian';
import { HeadingsManager } from './manager';
import { t } from '../i18n/helpers';

export function renderFoldersSettings(el: HTMLElement, manager: HeadingsManager) {
    // This is a placeholder as the main settings tab logic calls specific render functions
    // We'll rename this properly or use it as the entry point
    renderHeadingsSettings(el, manager);
}

export function renderHeadingsSettings(containerEl: HTMLElement, manager: HeadingsManager) {
    const settings = manager.plugin.settings.myHeadings;

    new Setting(containerEl)
        .setName(t('Auto Number Headings'))
        .setDesc(t('Create numbers automatically on blur'))
        .addToggle(toggle => toggle
            .setValue(settings.auto)
            .onChange(async (value) => {
                settings.auto = value;
                await manager.plugin.saveSettings();
                if (value) manager.registerAutoUpdate();
                else manager.clearAutoUpdateTimer();
            }));

    new Setting(containerEl)
        .setName(t('First Level'))
        .addSlider(slider => slider
            .setLimits(1, 6, 1)
            .setValue(settings.firstLevel)
            .setDynamicTooltip()
            .onChange(async (value) => {
                settings.firstLevel = value;
                await manager.plugin.saveSettings();
            }));

    new Setting(containerEl)
        .setName(t('Max Level'))
        .addSlider(slider => slider
            .setLimits(1, 6, 1)
            .setValue(settings.maxLevel)
            .setDynamicTooltip()
            .onChange(async (value) => {
                settings.maxLevel = value;
                await manager.plugin.saveSettings();
            }));

    // Style Grid
    containerEl.createEl('h3', { text: t('Heading Styles') });
    const stylesContainer = containerEl.createEl('div');
    stylesContainer.style.display = 'grid';
    stylesContainer.style.gridTemplateColumns = '0.5fr 1fr 1fr 1fr';
    stylesContainer.style.gap = '10px';
    stylesContainer.style.marginBottom = '20px';

    // Headers
    stylesContainer.createEl('div', { text: t('Level'), style: 'font-weight: bold;' });
    stylesContainer.createEl('div', { text: t('Style'), style: 'font-weight: bold;' });
    stylesContainer.createEl('div', { text: t('Separator'), style: 'font-weight: bold;' });
    stylesContainer.createEl('div', { text: t('Start At'), style: 'font-weight: bold;' });

    const styleOptions = { '1': '1, 2, 3', 'a': 'a, b, c', 'A': 'A, B, C', 'I': 'I, II, III', '一': '一, 二, 三', '①': '①, ②, ③' };
    const separatorOptions = { '': 'None', '.': '.', '-': '-', ':': ':', '—': '—' };

    for (let i = 0; i < 6; i++) {
        stylesContainer.createEl('div', { text: `H${i + 1}`, style: 'align-self: center;' });

        // Style Dropdown
        const styleSelect = stylesContainer.createEl('select');
        Object.entries(styleOptions).forEach(([key, label]) => {
            styleSelect.createEl('option', { value: key, text: label });
        });
        styleSelect.value = settings.headingStyles[i];
        styleSelect.onchange = async () => {
            settings.headingStyles[i] = styleSelect.value;
            await manager.plugin.saveSettings();
        };

        // Separator Dropdown
        const sepSelect = stylesContainer.createEl('select');
        // Separators array starts from index 0 for H1 (prefix) but usually users care about H2 separator (e.g. 1.1)
        // The loop is 0-5. For H1 (i=0), the separator is typically the 'prefix' or unused.
        // Enhanced JS maps separators[1] to H2.
        // Let's render consistent with enhanced JS UI:
        // "separatorOptions"
        Object.entries(separatorOptions).forEach(([key, label]) => {
            sepSelect.createEl('option', { value: key, text: label });
        });
        sepSelect.value = settings.headingSeparators[i];
        sepSelect.onchange = async () => {
            settings.headingSeparators[i] = sepSelect.value;
            await manager.plugin.saveSettings();
        };

        // Start Value Input
        const startInput = stylesContainer.createEl('input', { type: 'text' });
        startInput.style.width = '100%';
        startInput.value = settings.headingStartValues[i];
        startInput.onchange = async () => {
            settings.headingStartValues[i] = startInput.value;
            await manager.plugin.saveSettings();
        };
    }
}

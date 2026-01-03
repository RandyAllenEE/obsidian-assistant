import { Setting } from "obsidian";
import { FoldersManager } from "./manager";
import { t } from "../i18n/helpers";

export function renderFoldersSettings(containerEl: HTMLElement, manager: FoldersManager) {
    const plugin = manager.plugin;
    const settings = manager.settings;

    const experimentalSettingsContainerEl = document.createElement("details");
    experimentalSettingsContainerEl.style.marginBottom = '10px';
    experimentalSettingsContainerEl.style.border = '1px solid var(--background-modifier-border)';
    experimentalSettingsContainerEl.style.borderRadius = '5px';
    experimentalSettingsContainerEl.style.padding = '0.5em';

    const experimentalSettingsTitleEl = document.createElement("summary");
    experimentalSettingsTitleEl.innerText = t("Experimental & Unstable Settings");
    experimentalSettingsTitleEl.style.cursor = 'pointer';
    experimentalSettingsTitleEl.style.fontWeight = 'bold';
    experimentalSettingsTitleEl.style.outline = 'none';

    experimentalSettingsContainerEl.appendChild(experimentalSettingsTitleEl);

    // Create a wrapper for content to enforce left border style
    const experimentalContent = experimentalSettingsContainerEl.createDiv();
    experimentalContent.style.marginTop = '10px';
    experimentalContent.style.paddingLeft = '5px';
    experimentalContent.style.borderLeft = '2px solid var(--background-modifier-border)';

    new Setting(containerEl)
        .setName(t("Folders to hide"))
        .setDesc(t("The names of the folders to hide, one per line. Either exact folder-names, startsWith::FOLDERPREFIX, or endsWith::FOLDERSUFFIX"))
        .addTextArea(text => text
            .setPlaceholder(t("attachments\nendsWith::_attachments"))
            .setValue(settings.attachmentFolderNames.join("\n"))
            .onChange(async (value) => {
                const newSettingsValue = value.split("\n");
                // remove removed folders from exclude list too
                await manager.removeSpecificFoldersFromObsidianIgnoreList(settings.attachmentFolderNames.filter(e => !newSettingsValue.includes(e)));
                settings.attachmentFolderNames = newSettingsValue;
                await plugin.saveSettings();
                await manager.updateObsidianIgnoreList();
            }));

    new Setting(containerEl)
        .setName(t("Ignore Upper/lowercase"))
        .setDesc(t("If enabled, 'SOMEFOLDER', 'someFolder', or 'sOmeFoldEr' will all be treated the same and matched."))
        .addToggle(toggle => toggle
            .setValue(settings.matchCaseInsensitive)
            .onChange(async (value) => {
                // remove all folders and re-add them later in the update function
                await manager.removeSpecificFoldersFromObsidianIgnoreList(settings.attachmentFolderNames);
                settings.matchCaseInsensitive = value;
                await plugin.saveSettings();
                await manager.updateObsidianIgnoreList();
            }));

    new Setting(containerEl)
        .setName(t("Hide folders"))
        .setDesc(t("If the configured folders should be hidden or not"))
        .addToggle(toggle => toggle
            .setValue(settings.areFoldersHidden)
            .onChange(async (value) => {
                settings.areFoldersHidden = value;
                await plugin.saveSettings();
                await manager.updateObsidianIgnoreList();
                manager.updateUI();
                manager.processFolders();
            }));

    new Setting(containerEl)
        .setName(t("Add Hidden Folders to Obsidian Exclusion-List"))
        .setDesc(t("Excluded files will be hidden in Search, Graph View, and Unlinked Mentions, less noticeable in Quick Switcher and link suggestions."))
        .addToggle(toggle => toggle
            .setValue(settings.addHiddenFoldersToObsidianIgnoreList)
            .onChange(async (value) => {
                settings.addHiddenFoldersToObsidianIgnoreList = value;
                await plugin.saveSettings();
                await manager.updateObsidianIgnoreList(!value);
            }));

    new Setting(containerEl)
        .setName(t("Hide bottom status-bar \"Folders are Hidden\" indicator"))
        .setDesc(t("If enable there will be no bottom-bar indicator-text telling you if this plugin is active."))
        .addToggle(toggle => toggle
            .setValue(settings.hideBottomStatusBarIndicatorText)
            .onChange(async (value) => {
                settings.hideBottomStatusBarIndicatorText = value;
                if (value) {
                    manager.statusBarItem?.remove();
                    manager.statusBarItem = null;
                } else {
                    manager.createBottomStatusBarIndicatorTextItem();
                }
                await plugin.saveSettings();
            }));

    new Setting(experimentalContent)
        .setName(t("[EXPERIMENTAL] Compatibility: quick-explorer by pjeby"))
        .setDesc(t("[WARNING: UNSTABLE] Also hide hidden folders in the https://github.com/pjeby/quick-explorer plugin. Not affiliated with quick-explorer's author."))
        .addToggle(toggle => toggle
            .setValue(settings.enableCompatQuickExplorer)
            .onChange(async (value) => {
                settings.enableCompatQuickExplorer = value;
                await plugin.saveSettings();
            }));

    containerEl.appendChild(document.createElement("br"));
    containerEl.appendChild(experimentalSettingsContainerEl);
}


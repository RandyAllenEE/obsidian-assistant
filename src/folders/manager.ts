import { App, debounce, setIcon } from "obsidian";
import AssistantPlugin from "../main";
import { MyFoldersSettings } from "../settings";
import { CompatQuickExplorer, getFolderNameWithoutPrefix } from "./compat";
import { t } from "../i18n/helpers";

export class FoldersManager {
    app: App;
    plugin: AssistantPlugin;
    ribbonIconButton: HTMLElement | null = null;
    statusBarItem: HTMLElement | null = null;
    mutationObserver: MutationObserver;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    get settings(): MyFoldersSettings {
        return this.plugin.settings.myFolders;
    }

    public processFolders = debounce(async (recheckPreviouslyHiddenFolders?: boolean) => {
        if (!this.settings.enabled) return;
        if (this.settings.attachmentFolderNames.length === 0) return;

        if (recheckPreviouslyHiddenFolders) {
            document.querySelectorAll<HTMLElement>(".obsidian-hide-folders--hidden").forEach((folder) => {
                folder.style.height = "";
                folder.style.overflow = "";
                folder.removeClass("obsidian-hide-folders--hidden");
            });
        }

        this.settings.attachmentFolderNames.forEach(folderName => {
            if (getFolderNameWithoutPrefix(folderName) === "") return;

            const selectorString = [
                this.getQuerySelectorStringForFolderName(folderName),
                this.settings.enableCompatQuickExplorer ? CompatQuickExplorer.getAdditionalDocumentSelectorStringForFolder?.(folderName, this.settings) : null,
            ].filter((o) => o != null).join(", ");

            if (!selectorString) return;

            try {
                const folderElements = document.querySelectorAll<HTMLElement>(selectorString);

                folderElements.forEach((folder) => {
                    if (!folder) {
                        return;
                    }

                    folder.addClass("obsidian-hide-folders--hidden");
                    folder.style.height = this.settings.areFoldersHidden ? "0" : "";
                    folder.style.display = this.settings.areFoldersHidden ? "none" : "";
                    folder.style.overflow = this.settings.areFoldersHidden ? "hidden" : "";
                });
            } catch (e) {
                console.error(`Failed to process folder ${folderName}:`, e);
            }
        });
    }, 10, false);

    getQuerySelectorStringForFolderName(folderName: string) {
        if (folderName.toLowerCase().startsWith("endswith::")) {
            return `*:has(> [data-path$="${getFolderNameWithoutPrefix(folderName)}"${this.settings.matchCaseInsensitive ? " i" : ""}])`;
        } else if (folderName.toLowerCase().startsWith("startswith::")) {
            return `*:has(> .nav-folder-title[data-path^="${getFolderNameWithoutPrefix(folderName)}"${this.settings.matchCaseInsensitive ? " i" : ""}]), *:has(> .nav-folder-title[data-path*="/${getFolderNameWithoutPrefix(folderName)}"${this.settings.matchCaseInsensitive ? " i" : ""}])`;
        } else {
            return `*:has(> [data-path$="/${folderName.trim()}"${this.settings.matchCaseInsensitive ? " i" : ""}]), *:has(> [data-path="${folderName.trim()}"${this.settings.matchCaseInsensitive ? " i" : ""}])`;
        }
    }

    async toggleFunctionality() {
        this.settings.areFoldersHidden = !this.settings.areFoldersHidden;
        if (this.ribbonIconButton) {
            this.ribbonIconButton.ariaLabel = this.settings.areFoldersHidden ? t('Show hidden folders') : t('Hide hidden folders again');
            setIcon(this.ribbonIconButton, this.settings.areFoldersHidden ? "eye" : "eye-off");
        }
        if (this.statusBarItem) {
            this.statusBarItem.innerHTML = this.settings.areFoldersHidden ? t('Configured folders are hidden') : "";
        }
        await this.processFolders();
        await this.plugin.saveSettings();
        await this.updateObsidianIgnoreList();
    }

    updateUI() {
        if (this.ribbonIconButton) {
            this.ribbonIconButton.ariaLabel = this.settings.areFoldersHidden ? t('Show hidden folders') : t('Hide hidden folders again');
            setIcon(this.ribbonIconButton, this.settings.areFoldersHidden ? "eye" : "eye-off");
        }
        if (this.statusBarItem) {
            this.statusBarItem.innerHTML = this.settings.areFoldersHidden ? t('Configured folders are hidden') : "";
        }
    }

    createIgnoreListRegExpForFolderName(rawFolderName: string) {
        const folderName = this.settings.matchCaseInsensitive
            ? getFolderNameWithoutPrefix(rawFolderName).split("").map(c => c.toLowerCase() != c.toUpperCase() ? `[${c.toLowerCase()}${c.toUpperCase()}]` : c).join("")
            : getFolderNameWithoutPrefix(rawFolderName);

        if (rawFolderName.toLowerCase().startsWith("endswith::")) {
            return `/(${folderName}$)|(${folderName}/)/`;
        } else if (rawFolderName.toLowerCase().startsWith("startswith::")) {
            return `/(^${folderName})|(/${folderName})/`;
        } else {
            return `/${folderName}/`;
        }
    }

    async updateObsidianIgnoreList(processFeatureDisabling?: boolean) {
        if (!this.settings.addHiddenFoldersToObsidianIgnoreList && !processFeatureDisabling) return;

        // @ts-ignore
        let ignoreList = (this.app.vault.getConfig("userIgnoreFilters") ?? []) as string[];

        if (this.settings.areFoldersHidden && !processFeatureDisabling) {
            this.settings.attachmentFolderNames.forEach(folderName => {
                if (getFolderNameWithoutPrefix(folderName).trim() === "") return;
                if (ignoreList.contains(this.createIgnoreListRegExpForFolderName(folderName))) return;
                ignoreList.push(this.createIgnoreListRegExpForFolderName(folderName));
            });
        } else {
            const folderNameRegexes = this.settings.attachmentFolderNames.map(folderName => this.createIgnoreListRegExpForFolderName(folderName));
            ignoreList = ignoreList.filter((s) => !folderNameRegexes.includes(s));
        }

        // @ts-ignore
        this.app.vault.setConfig("userIgnoreFilters", ignoreList);
    }

    async removeSpecificFoldersFromObsidianIgnoreList(folderNames: string[]) {
        folderNames.forEach(folderName => {
            // @ts-ignore
            this.app.vault.config.userIgnoreFilters?.remove(this.createIgnoreListRegExpForFolderName(folderName));
            this.app.vault.trigger("config-changed");
        });
    }

    createBottomStatusBarIndicatorTextItem() {
        if (this.statusBarItem) return; // prevent multiple instantiations

        // This adds a status bar item to the bottom of the app.
        this.statusBarItem = this.plugin.addStatusBarItem();
        this.statusBarItem.setText(this.settings.areFoldersHidden ? t('Configured folders are hidden') : "");
    }

    async onload() {
        if (!this.settings.enabled) return;

        console.log("Loading MyFolders module");

        // Ribbon Icon
        this.ribbonIconButton = this.plugin.addRibbonIcon(
            this.settings.areFoldersHidden ? "eye" : "eye-off",
            this.settings.areFoldersHidden ? t('Show hidden folders') : t('Hide hidden folders again'),
            (evt: MouseEvent) => {
                this.toggleFunctionality();
            }
        );

        if (!this.settings.hideBottomStatusBarIndicatorText) {
            this.createBottomStatusBarIndicatorTextItem();
        }

        // Command
        this.plugin.addCommand({
            id: "toggle-attachment-folders",
            name: t('Toggle visibility of hidden folders'),
            callback: () => {
                this.toggleFunctionality();
            },
        });

        // Mutation Observer
        this.mutationObserver = new MutationObserver((mutationRecord) => {
            const feClasses = [
                "nav-folder",
                "nav-files-container",
            ];

            const shouldTriggerProcessFolders = mutationRecord.some((record) => {
                // @ts-ignore
                if (feClasses.some(c => record.target?.parentElement?.classList.contains(c))) return true;
                if (this.settings.enableCompatQuickExplorer && CompatQuickExplorer.shouldMutationRecordTriggerFolderReProcessing?.(record)) return true;

                return false;
            });

            if (!shouldTriggerProcessFolders) return;
            this.processFolders();
        });
        this.mutationObserver.observe(window.document, { childList: true, subtree: true });

        // Rename Event
        this.plugin.registerEvent(this.app.vault.on("rename", () => {
            window.setTimeout(() => {
                this.processFolders();
            }, 10);
        }));

        this.app.workspace.onLayoutReady(() => {
            if (!this.settings.areFoldersHidden) return;
            window.setTimeout(() => {
                this.processFolders();
            }, 1000);
        });
    }

    onunload() {
        this.mutationObserver?.disconnect();
        this.ribbonIconButton?.remove();
        this.statusBarItem?.remove();
    }
}

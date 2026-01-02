import {
    Modal,
    Setting,
    TextComponent,
    ButtonComponent,
    TextAreaComponent,
    Notice,
} from "obsidian";
import { SnippetsManager } from "../manager"; // Ensure this matches where we put the manager
import { setAttributes } from "../util/setAttributes";
import { EnhancedApp } from "../types";
import { t } from "../../i18n/helpers";

export default class CreateSnippetModal extends Modal {
    path: string;
    manager: SnippetsManager;
    mySnippetsEl: HTMLDivElement;
    app: EnhancedApp;

    constructor(app: EnhancedApp, manager: SnippetsManager) {
        super(app);
        this.app = app;
        this.manager = manager;
        this.onOpen = () => this.display(true);
    }

    private async display(focus?: boolean) {
        const { contentEl } = this;
        const customCss = this.app.customCss;

        contentEl.empty();
        contentEl.setAttribute("style", "margin-top: 0px");

        const title = document.createElement("h1");
        title.setText(t("Create a CSS Snippet"));
        contentEl.appendChild(title);

        const fileTitleSetting = new Setting(contentEl);
        const fileTitleValue = new TextComponent(fileTitleSetting.controlEl);
        fileTitleSetting
            .setName(t("CSS Snippet Title"))
            .setDesc(t("Write the title for this CSS snippet file."));

        const cssStylesSetting = new Setting(contentEl);

        // avoiding having to reference this specific modal - add style in code
        cssStylesSetting.settingEl.setAttribute(
            "style",
            "display: grid; grid-template-columns: 1fr;"
        );
        const cssStylesValue = new TextAreaComponent(cssStylesSetting.controlEl);
        setAttributes(cssStylesValue.inputEl, {
            style: "margin-top: 12px; width: 100%;  height: 32vh;",
            class: "ms-css-editor",
        });
        cssStylesSetting
            .setName(t("CSS Snippet Styles"))
            .setDesc(t("Add in styling for this CSS snippet file."));
        cssStylesValue.setValue(this.manager.settings.stylingTemplate);

        const doAdd = async () => {
            let fileName = fileTitleValue.getValue();
            let fileContents = cssStylesValue.getValue();
            let snippetPath = customCss.getSnippetPath(fileName);
            if (fileName) {
                if (!customCss.snippets.includes(fileName)) {
                    await this.app.vault.create(
                        `${customCss.getSnippetsFolder()}/${fileName}.css`,
                        fileContents
                    );
                    console.log('%c' + t('"{fileName}.css" has been created!').replace('{fileName}', fileName), "color: Violet");
                    if (this.manager.settings.snippetEnabledStatus)
                        customCss.setCssEnabledStatus(fileName, true);

                    if (this.manager.settings.openSnippetFile)
                        this.app.openWithDefaultApp(snippetPath);

                    customCss.requestLoadSnippets();
                    this.close();
                } else new Notice(t('"{fileName}.css" already exists.').replace('{fileName}', fileName));
            } else new Notice(t("Missing name for file"));
        };
        const saveButton = new ButtonComponent(contentEl)
            .setButtonText(t("Create Snippet"))
            .onClick(doAdd);
        saveButton.buttonEl.addClass("wg-button");
        fileTitleValue.inputEl.focus();
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}

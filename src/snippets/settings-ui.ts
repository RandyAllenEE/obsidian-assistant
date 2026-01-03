import { Action, Setting, TextAreaComponent } from "obsidian";
import { SnippetsManager } from "./manager";
import { setAttributes } from "./util/setAttributes";
import { MySnippetsSettings } from "../settings";
import { t } from "../i18n/helpers";

export function renderSnippetsSettings(containerEl: HTMLElement, manager: SnippetsManager) {
    const plugin = manager.plugin;
    // We access settings via manager.settings which references plugin.settings.mySnippets
    const settings = manager.settings;

    new Setting(containerEl)
        .setName(t("Show Status Bar Icon"))
        .setDesc(t("Toggle the visibility of the snippets icon in the status bar."))
        .addToggle((toggle) => {
            toggle
                .setValue(settings.showStatusBarIcon)
                .onChange(async (value) => {
                    settings.showStatusBarIcon = value;
                    await manager.saveSettings();
                    manager.updateStatusBar();
                });
        });

    const snippetsSection = containerEl.createEl("details");
    snippetsSection.style.marginBottom = '10px';
    snippetsSection.style.border = '1px solid var(--background-modifier-border)';
    snippetsSection.style.borderRadius = '5px';
    snippetsSection.style.padding = '0.5em';

    const snippetsSummary = snippetsSection.createEl("summary");
    snippetsSummary.style.cursor = 'pointer';
    snippetsSummary.style.fontWeight = 'bold';
    snippetsSummary.innerText = t("Manage Snippets");
    snippetsSummary.style.outline = 'none';

    // Move content into a wrapper div
    const snippetsContainer = snippetsSection.createDiv();
    snippetsContainer.style.marginTop = '10px';
    snippetsContainer.style.paddingLeft = '5px';
    snippetsContainer.style.borderLeft = '2px solid var(--background-modifier-border)';
    snippetsContainer.addClass("ms-manage-snippets-container"); // Custom class kept for inner layout
    renderSnippetsList(snippetsContainer, manager);

    containerEl.appendChild(snippetsSection);

    new Setting(containerEl)
        .setName(t("Glass menu effect"))
        .setDesc(
            t("Choose to change the background from the secondary background color of your theme to a glass background.")
        )
        .addToggle((toggle) => {
            toggle
                .setValue(settings.aestheticStyle)
                .onChange(async (value) => {
                    settings.aestheticStyle = value;
                    await manager.saveSettings();
                });
        });

    new Setting(containerEl)
        .setName(t("Auto open new snippet"))
        .setDesc(
            t("Choose whether or not to open CSS snippet files immeditaley after creating them. It will open in your default app.")
        )
        .addToggle((toggle) => {
            toggle
                .setValue(settings.openSnippetFile)
                .onChange(async (value) => {
                    settings.openSnippetFile = value;
                    await manager.saveSettings();
                });
        });
    new Setting(containerEl)
        .setName(t("Set new snippet status"))
        .setDesc(
            t("Choose whether or not to have newly created CSS snippet files toggled on automatically upon creation.")
        )
        .addToggle((toggle) => {
            toggle
                .setValue(settings.snippetEnabledStatus)
                .onChange(async (value) => {
                    settings.snippetEnabledStatus = value;
                    await manager.saveSettings();
                });
        });

    const stylingTemplateSetting = new Setting(containerEl);
    stylingTemplateSetting.settingEl.setAttribute(
        "style",
        "display: grid; grid-template-columns: 1fr;"
    );
    stylingTemplateSetting
        .setName(t("CSS snippet template"))
        .setDesc(
            t("Set default CSS styling as a template for new CSS files you choose to create.")
        );

    const stylingTemplateContent = new TextAreaComponent(
        stylingTemplateSetting.controlEl
    );
    setAttributes(stylingTemplateContent.inputEl, {
        style: "margin-top: 12px; width: 100%;  height: 32vh;",
        class: "ms-css-editor",
    });
    stylingTemplateContent

        .setValue(settings.stylingTemplate)
        .onChange(async (value) => {
            settings.stylingTemplate = value;
            await manager.saveSettings();
        });
}

function renderSnippetsList(containerEl: HTMLElement, manager: SnippetsManager) {
    containerEl.empty();
    const app = manager.app;
    const customCss = app.customCss;
    const currentSnippets = customCss.snippets;

    if (currentSnippets.length === 0) {
        containerEl.createEl("p", { text: t("No CSS snippets found.") });
        return;
    }

    currentSnippets.forEach((snippet: string) => {
        new Setting(containerEl)
            .setName(snippet)
            .addToggle((toggle) => {
                toggle
                    .setValue(customCss.enabledSnippets.has(snippet))
                    .onChange((value) => {
                        customCss.setCssEnabledStatus(snippet, value);
                    });
            });
    });

    const buttonContainer = containerEl.createDiv();
    buttonContainer.addClass("ms-reload-container");

    new Setting(buttonContainer)
        .addButton(button => button
            .setButtonText(t("Reload Snippets"))
            .onClick(() => {
                customCss.requestLoadSnippets();
                renderSnippetsList(containerEl, manager); // Re-render list
            }));
}



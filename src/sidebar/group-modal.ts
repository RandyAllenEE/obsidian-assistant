import { App, Modal, Setting, TextComponent, TextAreaComponent, Notice } from "obsidian";
import { SidebarManager } from "./manager";
import { t } from "../i18n/helpers";

export class GroupModal extends Modal {
    manager: SidebarManager;
    onSubmit: () => void;

    masterId: string = "";
    slaveId: string = "";
    groupName: string = "";
    groupSvg: string = "";

    constructor(app: App, manager: SidebarManager, onSubmit: () => void) {
        super(app);
        this.manager = manager;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: t("Add New Group") });

        new Setting(contentEl)
            .setName(t("Master View ID"))
            .setDesc(t("The view ID of the main tab (will be replaced by the group tab)"))
            .addText(text => text
                .onChange(value => this.masterId = value));

        new Setting(contentEl)
            .setName(t("Slave View ID"))
            .setDesc(t("The view ID of the split tab (hidden until group is active)"))
            .addText(text => text
                .onChange(value => this.slaveId = value));

        new Setting(contentEl)
            .setName(t("Group Name"))
            .setDesc(t("Name to display on the tab"))
            .addText(text => text
                .onChange(value => this.groupName = value));

        new Setting(contentEl)
            .setName(t("Group Icon"))
            .setDesc(t("SVG Code or Lucide Icon Name"))
            .addTextArea(text => text
                .setPlaceholder('<svg...> or "star"')
                .onChange(value => this.groupSvg = value));

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText(t("Add Group"))
                .setCta()
                .onClick(async () => {
                    if (await this.createGroup()) {
                        this.close();
                        this.onSubmit();
                    }
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    async createGroup(): Promise<boolean> {
        const settings = this.manager.plugin.settings.mySideBar.tabs;

        if (!this.masterId || !this.slaveId) {
            new Notice(t('Error: Invalid ID'));
            return false;
        }

        const masterParams = settings.elements[this.masterId];
        const slaveParams = settings.elements[this.slaveId];

        if (!masterParams || !slaveParams) {
            new Notice(t('Error: Invalid ID'));
            return false;
        }

        if (masterParams.side !== slaveParams.side) {
            new Notice(t('Error: Same Side'));
            return false;
        }

        if (!settings.bindings) settings.bindings = [];

        // Prevent duplicate bindings for same master
        if (settings.bindings.some(b => b.masterId === this.masterId)) {
            new Notice(t('Error: Master ID already bound'));
            return false;
        }

        const newBinding = {
            masterId: this.masterId,
            slaveId: this.slaveId,
            groupName: this.groupName,
            groupSvg: this.groupSvg
        };

        settings.bindings.push(newBinding);

        settings.elements[this.slaveId].visible = false;
        settings.elements[this.masterId].visible = true;

        // Ordering: Place Slave immediately after Master
        settings.elements[this.slaveId].order = settings.elements[this.masterId].order + 0.01;

        // Normalize orders
        const all = Object.values(settings.elements).sort((a, b) => a.order - b.order);
        all.forEach((el, idx) => el.order = idx);

        await this.manager.plugin.saveSettings();

        // Apply Masquerade Immediately
        const leaves = this.manager.contextualFeature.findLeavesByType(this.masterId);
        leaves.forEach(l => this.manager.contextualFeature.applyVisualOverride(l, newBinding));

        // Apply Layout
        await this.manager.tabsFeature.applyLayout();

        return true;
    }
}

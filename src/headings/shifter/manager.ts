import { type App, type Editor, editorInfoField, Plugin } from "obsidian";
import type { EditorState } from "@codemirror/state";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import type { EditorView } from "@codemirror/view";
import type AssistantPlugin from "../../../main";
import { IncreaseHeading, DecreaseHeading } from "./features/shift";
import { ApplyHeading } from "./features/apply";
import {
    InsertHeadingAtCurrentLevel,
    InsertHeadingAtDeeperLevel,
    InsertHeadingAtHigherLevel,
} from "./features/insert";

export const HEADINGS = [0, 1, 2, 3, 4, 5, 6] as const;

export class ShifterManager {
    app: App;
    plugin: AssistantPlugin;

    constructor(app: App, plugin: AssistantPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    onload() {
        this.addCommands();
    }

    private addCommands() {
        const settings = this.plugin.settings.myHeadings;

        const increaseHeading = new IncreaseHeading(settings, false);
        const increaseHeadingForced = new IncreaseHeading(settings, true);
        const decreaseHeading = new DecreaseHeading(settings);
        const insertHeadingAtCurrentLabel = new InsertHeadingAtCurrentLevel(settings);
        const insertHeadingAtDeeperLevel = new InsertHeadingAtDeeperLevel(settings);
        const insertHeadingAtHigherLevel = new InsertHeadingAtHigherLevel(settings);

        HEADINGS.forEach((heading) => {
            const applyHeadingCmd = new ApplyHeading(settings, heading);
            this.plugin.addCommand({
                ...applyHeadingCmd.createCommand(),
                id: `heading-shifter-${applyHeadingCmd.createCommand().id}` // Prefix to avoid conflict? Or use as derived.
                // The createCommand in classes returned generic IDs e.g. 'increase-heading'.
                // obsidian-assistant will prefix with 'obsidian-assistant:'.
                // I should probably ensure unique IDs within my plugin if I have other heading commands.
                // But previously I removed 'number-headings' command.
                // Let's keep IDs simple: 'increase-heading' -> 'obsidian-assistant:increase-heading'.
            });
        });

        this.plugin.addCommand(increaseHeading.createCommand());
        this.plugin.addCommand(increaseHeadingForced.createCommand());
        this.plugin.addCommand(decreaseHeading.createCommand());
        this.plugin.addCommand(insertHeadingAtCurrentLabel.createCommand());
        this.plugin.addCommand(insertHeadingAtDeeperLevel.createCommand());
        this.plugin.addCommand(insertHeadingAtHigherLevel.createCommand());

        // Register Keymap for Tab/Shift-Tab
        this.plugin.registerEditorExtension(
            Prec.highest(
                keymap.of([
                    {
                        key: "Tab",
                        run: this.createKeyMapRunCallback({
                            check: increaseHeading.check,
                            run: increaseHeading.editorCallback,
                        }),
                    },
                ]),
            ),
        );

        this.plugin.registerEditorExtension(
            Prec.highest(
                keymap.of([
                    {
                        key: "s-Tab",
                        run: this.createKeyMapRunCallback({
                            check: decreaseHeading.check,
                            run: decreaseHeading.editorCallback,
                        }),
                    },
                ]),
            ),
        );
    }

    // Helper from ObsidianService
    private getEditorFromState(state: EditorState) {
        // @ts-ignore - editorInfoField is available at runtime
        return state.field(editorInfoField).editor;
    }

    private createKeyMapRunCallback(config: {
        check?: (editor: Editor) => boolean;
        run: (editor: Editor) => any; // StopPropagation logic maps to boolean
    }) {
        const check = config.check || (() => true);
        const { run } = config;

        return (view: EditorView): boolean => {
            const editor = this.getEditorFromState(view.state);

            if (!editor) {
                return false;
            }

            if (!check(editor)) {
                return false;
            }

            // run returns true (stop prop) or false (continue)
            return run(editor);
        };
    }
}


import { App, MarkdownView, Editor } from 'obsidian';
import AssistantPlugin from '../main';
import { HeadingsManager } from '../headings/manager';
import { FormulasManager } from '../formulas/manager';
import { parseHeadingsFrontMatter, parseFormulasFrontMatter } from './frontmatter';
import { restoreCursor } from './text-processing';

export class AutoNumberingController {
    app: App;
    plugin: AssistantPlugin;
    headingsManager: HeadingsManager;
    formulasManager: FormulasManager;
    autoUpdateTimeout: number | null = null;

    // Default refresh interval matching source
    private readonly REFRESH_INTERVAL = 5000;

    constructor(app: App, plugin: AssistantPlugin, headingsManager: HeadingsManager, formulasManager: FormulasManager) {
        this.app = app;
        this.plugin = plugin;
        this.headingsManager = headingsManager;
        this.formulasManager = formulasManager;
    }

    onload() {
        this.registerEditorFocusEvents();
    }

    onunload() {
        this.clearAutoUpdateTimer();
    }

    registerEditorFocusEvents() {
        this.plugin.registerDomEvent(window, 'blur', () => this.handleBlur());
        this.plugin.registerDomEvent(window, 'focus', () => this.handleFocus());
    }

    handleBlur() {
        // 1. Get active view info
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView || !activeView.file) return;

        const data = this.app.metadataCache.getFileCache(activeView.file);
        if (!data) return;

        // 2. Check effective settings
        // We need to see if EITHER headings OR formulas are enabled for auto-update
        const headingSettings = parseHeadingsFrontMatter(data.frontmatter, this.plugin.settings.myHeadings);
        const formulaSettings = parseFormulasFrontMatter(data.frontmatter, this.plugin.settings.myFormulas);

        const headingsAuto = headingSettings.enabled && headingSettings.auto;
        const formulasAuto = formulaSettings.enabled && formulaSettings.auto;

        // Smart interrupt: if neither is auto, stop
        if (!headingsAuto && !formulasAuto) return;

        // 3. Start Timer
        this.clearAutoUpdateTimer();

        // Use global refreshInterval setting
        const delay = this.plugin.settings.refreshInterval || 1000;

        this.autoUpdateTimeout = window.setTimeout(() => {
            this.performAutoUpdate(activeView, headingSettings, formulaSettings);
        }, delay);
    }

    handleFocus() {
        if (this.autoUpdateTimeout) {
            // console.log('AutoNumbering: Focused. Timer cancelled.');
            this.clearAutoUpdateTimer();
        }
    }

    clearAutoUpdateTimer() {
        if (this.autoUpdateTimeout) {
            window.clearTimeout(this.autoUpdateTimeout);
            this.autoUpdateTimeout = null;
        }
    }

    performAutoUpdate(view: MarkdownView, headingSettings: any, formulaSettings: any) {
        if (!view.editor) return;
        const editor = view.editor;

        // Re-check enabled status just in case (though we checked on blur)
        const headingsAuto = headingSettings.enabled && headingSettings.auto;
        const formulasAuto = formulaSettings.enabled && formulaSettings.auto;

        if (!headingsAuto && !formulasAuto) return;

        // 1. Record state
        const cursorBefore = editor.getCursor();
        const scrollBefore = editor.getScrollInfo();

        let isChanged = false;

        try {
            // A. Update Headings
            if (headingsAuto) {
                // Pass performRestore = false because we handle it here centrally
                if (this.headingsManager.updateNumbering(false, false)) {
                    isChanged = true;
                }
            }

            // B. Update Formulas
            if (formulasAuto) {
                if (this.formulasManager.updateNumbering(false, false)) {
                    isChanged = true;
                }
            }
        } catch (e) {
            console.error("AutoNumbering: Error during update logic", e);
            this.autoUpdateTimeout = null;
            return;
        }

        // 2. Restore state if changed
        if (isChanged) {
            restoreCursor(editor, cursorBefore);
            editor.scrollTo(scrollBefore.left, scrollBefore.top);
        }

        this.autoUpdateTimeout = null;
    }
}

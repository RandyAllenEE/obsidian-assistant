
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
    private isLoaded = false;
    private isDirty = false;

    private blurHandler: () => void;
    private focusHandler: () => void;
    private dirtyRef: any = null;

    // Default refresh interval matching source


    constructor(app: App, plugin: AssistantPlugin, headingsManager: HeadingsManager, formulasManager: FormulasManager) {
        this.app = app;
        this.plugin = plugin;
        this.headingsManager = headingsManager;
        this.formulasManager = formulasManager;
    }

    onload() {
        if (this.isLoaded) return;
        this.registerEditorFocusEvents();

        // Track changes to avoid unnecessary scans
        this.dirtyRef = this.app.workspace.on('editor-change', () => {
            this.isDirty = true;
        });

        this.isLoaded = true;
    }

    onunload() {
        if (!this.isLoaded) return;
        this.clearAutoUpdateTimer();
        window.removeEventListener('blur', this.blurHandler);
        window.removeEventListener('focus', this.focusHandler);

        if (this.dirtyRef) {
            this.app.workspace.offref(this.dirtyRef);
            this.dirtyRef = null;
        }

        this.isLoaded = false;
    }

    registerEditorFocusEvents() {
        this.blurHandler = () => this.handleBlur();
        this.focusHandler = () => this.handleFocus();
        window.addEventListener('blur', this.blurHandler);
        window.addEventListener('focus', this.focusHandler);
    }

    handleBlur() {
        // Optimization: If no changes since last check, skip
        if (!this.isDirty) return;

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

        // Reset dirty flag as we are about to process
        this.isDirty = false;

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

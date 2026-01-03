import { WorkspaceSplit, WorkspaceRibbon } from "obsidian";

export interface ExtendedWorkspaceSplit extends WorkspaceSplit {
    containerEl: HTMLElement;
    collapsed: boolean;
    expand: () => void;
    collapse: () => void;
}

export interface ExtendedWorkspaceRibbon extends WorkspaceRibbon {
    containerEl: HTMLElement;
    // Helper to access internal items if needed, though mostly we use DOM
    items?: any[];
}

export interface RibbonElement {
    id: string; // usually name/aria-label
    name: string;
    icon?: string;
    visible: boolean;
    order: number;
    // Reference to DOM element for manipulation
    element?: HTMLElement;
}

export interface RibbonSettings {
    elements: { [key: string]: RibbonElement };
}

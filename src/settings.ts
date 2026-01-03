export interface MyFoldersSettings {
    enabled: boolean;
    areFoldersHidden: boolean;
    matchCaseInsensitive: boolean;
    addHiddenFoldersToObsidianIgnoreList: boolean;
    hideBottomStatusBarIndicatorText: boolean;
    enableCompatQuickExplorer: boolean;
    attachmentFolderNames: string[];
}

export const DEFAULT_MY_FOLDERS_SETTINGS: MyFoldersSettings = {
    enabled: true,
    areFoldersHidden: true,
    matchCaseInsensitive: true,
    addHiddenFoldersToObsidianIgnoreList: false,
    hideBottomStatusBarIndicatorText: false,
    enableCompatQuickExplorer: false,
    attachmentFolderNames: ["attachments"],
};

export enum LoadingMethod {
    disabled = 'disabled',
    instant = 'instant',
    short = 'short',
    long = 'long'
}

export interface PluginSettings {
    startupType?: LoadingMethod;
}

export interface DeviceSettings {
    shortDelaySeconds: number;
    longDelaySeconds: number;
    delayBetweenPlugins: number;
    defaultStartupType: LoadingMethod | null;
    showDescriptions: boolean;
    enableDependencies: boolean;
    plugins: { [pluginId: string]: PluginSettings };
    [key: string]: any;
}

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
    shortDelaySeconds: 5,
    longDelaySeconds: 15,
    delayBetweenPlugins: 40,
    defaultStartupType: null,
    showDescriptions: true,
    enableDependencies: false,
    plugins: {}
}

export interface MyPluginsSettings {
    enabled: boolean; // Master switch
    dualConfigs: boolean;
    showConsoleLog: boolean;
    desktop: DeviceSettings;
    mobile?: DeviceSettings;
}

export const DEFAULT_MY_PLUGINS_SETTINGS: MyPluginsSettings = {
    enabled: true,
    dualConfigs: false,
    showConsoleLog: false,
    desktop: DEFAULT_DEVICE_SETTINGS
};

import { StatusBarElementStatus } from './statusbar/types';

export interface StatusBarOrganizerSettings {
    status: { [key: string]: StatusBarElementStatus };
    version: string;
}

export interface MyStatusBarSettings extends StatusBarOrganizerSettings {
    enabled: boolean;
}

export const DEFAULT_STATUS_BAR_SETTINGS: MyStatusBarSettings = {
    enabled: true,
    status: {},
    version: "0.0.1"
};

// MySnippets Settings
export interface MySnippetsSettings {
    aestheticStyle: boolean;
    snippetViewPosition: string; // "right" | "left"
    openSnippetFile: boolean;
    stylingTemplate: string;
    snippetEnabledStatus: boolean;
    showStatusBarIcon: boolean; // [NEW] Toggle status bar icon
    enabled: boolean; // Add enabled flag for module control
}

export interface MySnippetsSettings {
    aestheticStyle: boolean;
    snippetViewPosition: string; // "right" | "left"
    openSnippetFile: boolean;
    stylingTemplate: string;
    snippetEnabledStatus: boolean;
    showStatusBarIcon: boolean; // [NEW] Toggle status bar icon
    enabled: boolean; // Add enabled flag for module control
}

export const DEFAULT_MY_SNIPPETS_SETTINGS: MySnippetsSettings = {
    aestheticStyle: false,
    snippetViewPosition: "left",
    openSnippetFile: true,
    stylingTemplate: "",
    snippetEnabledStatus: false,
    showStatusBarIcon: true,
    enabled: true
};

// MyHeadings Settings
export interface MyHeadingsSettings {
    // Auto Numbering
    enabled: boolean;
    auto: boolean;
    firstLevel: number;
    maxLevel: number;
    headingStyles: string[];
    headingSeparators: string[];
    headingStartValues: string[];
    skipHeadings: string;

    // Heading Shifter
    limitHeadingFrom: number;
    overrideTab: boolean;
    styleToRemove: {
        beginning: {
            ul: boolean;
            ol: boolean;
            userDefined: string[];
        };
        surrounding: {
            bold: boolean;
            italic: boolean;
            userDefined: string[];
        };
    };
    list: {
        childrenBehavior: "outdent to zero" | "sync with headings" | "noting";
    };
    editor: {
        tabSize: number;
    };
}

export const DEFAULT_MY_HEADINGS_SETTINGS: MyHeadingsSettings = {
    // Auto Numbering
    enabled: true,
    auto: false,
    firstLevel: 1,
    maxLevel: 6,
    headingStyles: ['1', 'a', 'A', '一', '①', '1'],
    headingSeparators: ['', '-', ':', '.', '—', '-'],
    headingStartValues: ['0', '1', '1', '1', '1', '1'],
    skipHeadings: '',

    // Heading Shifter
    limitHeadingFrom: 1,
    overrideTab: false,
    styleToRemove: {
        beginning: {
            ul: true,
            ol: true,
            userDefined: [],
        },
        surrounding: {
            bold: true,
            italic: true,
            userDefined: [],
        },
    },
    list: {
        childrenBehavior: "outdent to zero",
    },
    editor: {
        tabSize: 4,
    },
};

// MyFormulas Settings
export interface MyFormulasSettings {
    enabled: boolean;
    auto: boolean;
    mode: 'continuous' | 'heading-based';
    maxDepth: number;
}

export const DEFAULT_MY_FORMULAS_SETTINGS: MyFormulasSettings = {
    enabled: true,
    auto: false,
    mode: 'continuous',
    maxDepth: 4
};

// MySideBar Settings
export interface AutoHideSettings {
    enabled: boolean;
    leftSidebar: boolean;
    rightSidebar: boolean;
    syncLeftRight: boolean;
    enforceSameDelay: boolean;
    sidebarDelay: number;
    sidebarExpandDelay: number;
    leftSideBarPixelTrigger: number;
    rightSideBarPixelTrigger: number;
    overlayMode: boolean;
    expandCollapseSpeed: number;
    leftSidebarMaxWidth: number;
    rightSidebarMaxWidth: number;
}

export interface SidebarTabElement {
    id: string;
    side: 'left' | 'right';
    visible: boolean;
    order: number;
}

export interface SidebarTabsSettings {
    enabled: boolean;
    elements: { [viewType: string]: SidebarTabElement };
}

export interface MySideBarSettings {
    enabled: boolean;
    autoHide: AutoHideSettings;
    ribbon: { enabled: boolean; elements: { [key: string]: any } };
    tabs: SidebarTabsSettings;
}

export const DEFAULT_MY_SIDEBAR_SETTINGS: MySideBarSettings = {
    enabled: true,
    autoHide: {
        enabled: true,
        leftSidebar: true,
        rightSidebar: true,
        syncLeftRight: false,
        enforceSameDelay: true,
        sidebarDelay: 150,
        sidebarExpandDelay: 10,
        leftSideBarPixelTrigger: 20,
        rightSideBarPixelTrigger: 20,
        overlayMode: false,
        expandCollapseSpeed: 370,
        leftSidebarMaxWidth: 325,
        rightSidebarMaxWidth: 325,
    },
    ribbon: { enabled: true, elements: {} },
    tabs: { enabled: true, elements: {} }
};

export interface AssistantSettings {
    myFolders: MyFoldersSettings;
    myPlugins: MyPluginsSettings;
    myStatusBar: MyStatusBarSettings;
    mySnippets: MySnippetsSettings;
    myHeadings: MyHeadingsSettings;
    myFormulas: MyFormulasSettings;
    mySideBar: MySideBarSettings;
    refreshInterval: number; // Global auto-numbering refresh interval in milliseconds
}

export const DEFAULT_SETTINGS: AssistantSettings = {
    myFolders: DEFAULT_MY_FOLDERS_SETTINGS,
    myPlugins: DEFAULT_MY_PLUGINS_SETTINGS,
    myStatusBar: DEFAULT_STATUS_BAR_SETTINGS,
    mySnippets: DEFAULT_MY_SNIPPETS_SETTINGS,
    myHeadings: DEFAULT_MY_HEADINGS_SETTINGS,
    myFormulas: DEFAULT_MY_FORMULAS_SETTINGS,
    mySideBar: DEFAULT_MY_SIDEBAR_SETTINGS,
    refreshInterval: 1000, // Default 1 second (1000ms) as per source
};

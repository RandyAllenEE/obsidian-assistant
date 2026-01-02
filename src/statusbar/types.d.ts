export type StatusBarElement = {
    name: string;
    index: number;
    id: string;
    element?: HTMLElement;
    entry?: HTMLDivElement;
};

export type StatusBarElementStatus = {
    position: number;
    visible: boolean;
}

export type BarStatus = {
    [key: string]: StatusBarElementStatus
}

export type ExistsStatus = {
    [key: string]: boolean
}

export interface StatusBarOrganizerSettings {
    activePreset: string;
    activeFullscreenPreset: string,
    separateFullscreenPreset: boolean,
    presets: { [key: string]: BarStatus }
    presetsOrder: string[];
    version: string;
}

export type ElectronWindow = {
    addListener: (event: string, callback: () => void) => void;
    isFullScreen: () => boolean;
}

export type Version = {
    major: number;
    minor: number;
    patch: number;
}

export type Upgrades = Map<number, Map<number, Map<number, Upgrade>>>;
export type Upgrade = (settings: StatusBarOrganizerSettings) => void;
export type VersionUpgrade = { version: Version, upgrade: Upgrade };

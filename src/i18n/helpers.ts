import { moment } from "obsidian";
import en from "./locales/en";
import zh from "./locales/zh";

const localeMap: { [k: string]: Partial<typeof en> } = {
    en,
    zh,
    "zh-cn": zh,
};

const locale = localeMap[moment.locale()];

export function t(str: keyof typeof en): string {
    if (!locale) {
        return en[str] || str;
    }

    return locale[str] || en[str] || str;
}

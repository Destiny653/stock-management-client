import React, { useContext } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLanguage, availableLanguages } from "@/components/i18n/LanguageContext";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
    showLabel?: boolean;
}

export default function LanguageSelector({ showLabel = false }: LanguageSelectorProps) {
    let language = 'en';
    let setLanguage: (lang: string) => void = () => { };

    try {
        const ctx = useLanguage();
        language = ctx.language || 'en';
        setLanguage = ctx.setLanguage || (() => { });
    } catch (e) {
        // Fallback if not within provider
    }

    return (
        <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className={showLabel ? "w-40" : "w-24"}>
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {availableLanguages.map((lang: any) => (
                    <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            {showLabel && <span>{lang.name}</span>}
                            {!showLabel && <span>{lang.code.toUpperCase()}</span>}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IconLanguage, IconCheck, IconExternalLink } from "@tabler/icons-react";
import { toast } from "sonner";

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", region: "National / Standard" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", region: "Jharkhand, MP, CG" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳", region: "West Bengal (ECL)" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳", region: "Odisha (MCL)" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳", region: "Maharashtra (WCL)" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", region: "Telangana (SCCL)" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", region: "Tamil Nadu (NLC)" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳", region: "Gujarat (GMDC)" },
];

const GOOGLE_TRANSLATE_SCRIPT_ID = "google-translate-script";
const COOKIE_NAME = "googtrans";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: any;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

// Fortify DOM Node removeChild and insertBefore against Google Translate <font> injection
if (typeof window !== "undefined" && typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child) as T;
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
      }
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

/**
 * Set the Google Translate cookie across all domain scopes
 */
function setGoogleCookie(langCode: string) {
  if (typeof window === "undefined") return;

  const value = langCode === "en" ? "/en/en" : `/en/${langCode}`;
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();

  // Root path
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax;`;

  // Host domain
  const host = window.location.hostname;
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; domain=${host}; SameSite=Lax;`;

  // Subdomain wildcard if available
  const parts = host.split(".");
  if (parts.length > 2) {
    const rootDomain = "." + parts.slice(-2).join(".");
    document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; domain=${rootDomain}; SameSite=Lax;`;
  }
}

/**
 * Trigger the Google Translate DOM dropdown
 */
function triggerGoogleTranslateDOM(langCode: string): boolean {
  if (typeof window === "undefined") return false;

  const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
  if (combo) {
    combo.value = langCode;
    combo.dispatchEvent(new Event("change"));
    return true;
  }
  return false;
}

/**
 * Global function to apply Google Translate across the page
 */
export function applyGoogleTranslation(targetLang: string) {
  if (typeof window === "undefined") return;

  setGoogleCookie(targetLang);
  localStorage.setItem("aegis_language_pref", targetLang);
  window.dispatchEvent(new CustomEvent("aegis-language-changed", { detail: targetLang }));

  const success = triggerGoogleTranslateDOM(targetLang);

  if (!success && targetLang !== "en") {
    // If widget not fully ready yet, reload after setting cookie for immediate translation
    setTimeout(() => {
      const retry = triggerGoogleTranslateDOM(targetLang);
      if (!retry) {
        window.location.reload();
      }
    }, 300);
  }
}

/**
 * Google Translator Provider Component to inject script and setup hidden container
 */
export function GoogleTranslatorProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Define initialization callback
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,bn,or,mr,te,ta,gu",
            autoDisplay: false,
            layout: 0, // InlineLayout.SIMPLE
          },
          "google_translate_element"
        );

        // Check if there was a saved language preference
        const savedLang = localStorage.getItem("aegis_language_pref");
        if (savedLang && savedLang !== "en") {
          setTimeout(() => {
            triggerGoogleTranslateDOM(savedLang);
          }, 400);
        }
      }
    };

    // Check if script is already present
    if (!document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div
      id="google_translate_element"
      className="notranslate"
      style={{
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        visibility: "hidden",
        pointerEvents: "none",
        width: "0px",
        height: "0px",
        overflow: "hidden",
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Header Language Selector Component with Google Translate
 */
export function GoogleLanguageSelector({ variant = "header" }: { variant?: "header" | "compact" }) {
  const [currentLang, setCurrentLang] = useState<string>("en");

  // Sync state on load and on custom events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aegis_language_pref") || "en";
      setCurrentLang(saved);

      const handler = (e: Event) => {
        const ce = e as CustomEvent<string>;
        if (ce.detail) setCurrentLang(ce.detail);
      };

      window.addEventListener("aegis-language-changed", handler);
      return () => window.removeEventListener("aegis-language-changed", handler);
    }
  }, []);

  const handleSelectLanguage = (code: string) => {
    const selected = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    setCurrentLang(code);
    applyGoogleTranslation(code);

    toast.success(`Language changed to ${selected?.nativeName || code.toUpperCase()}`, {
      description: `Powered by Google Translate • ${selected?.name}`,
    });
  };

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-white/15 bg-white/5 hover:bg-white/10 text-neutral-200 px-2.5 gap-1.5 font-medium notranslate"
          title="Change Colliery Portal Language (Google Translate)"
        >
          <IconLanguage className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-semibold text-emerald-400 font-mono">
            {activeLangObj.flag} {activeLangObj.code.toUpperCase()}
          </span>
          <span className="text-[10px] text-neutral-400 hidden sm:inline">
            {activeLangObj.nativeName}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-[#0e141d]/95 border-white/15 backdrop-blur-xl text-white shadow-2xl p-1.5 notranslate"
      >
        <DropdownMenuLabel className="text-[11px] text-muted-foreground px-2 py-1.5 flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wider">Colliery Languages</span>
          <span className="text-[9px] font-mono text-emerald-400">Google Translate</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10 my-1" />

        <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = item.code === currentLang;
            return (
              <DropdownMenuItem
                key={item.code}
                onClick={() => handleSelectLanguage(item.code)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                    : "hover:bg-white/10 text-neutral-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.flag}</span>
                  <div>
                    <div className="leading-tight">{item.nativeName}</div>
                    <div className="text-[9px] text-neutral-400">{item.name} • {item.region}</div>
                  </div>
                </div>
                {isSelected && <IconCheck size={14} className="text-emerald-400 shrink-0 ml-2" />}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="bg-white/10 my-1" />
        <div className="px-2 py-1 text-[10px] text-neutral-400 flex items-center justify-between">
          <span>Translates all 30 colliery views</span>
          <span className="text-emerald-400 font-mono">100% Live</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default GoogleLanguageSelector;

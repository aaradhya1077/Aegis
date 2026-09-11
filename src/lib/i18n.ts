"use client";

import { useState, useEffect } from "react";

export type Language = "en" | "hi";

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const DICTIONARY: TranslationDictionary = {
  // Navigation & Branding
  "app.title": {
    en: "Aegis-Compliance",
    hi: "एजिस-अनुपालन",
  },
  "app.subtitle": {
    en: "Autonomous Mining Regulatory Intelligence System",
    hi: "स्वायत्त खनन विनियामक सतर्कता एवं अनुपालन प्रणाली",
  },
  "nav.dashboard": {
    en: "Executive Dashboard",
    hi: "कार्यकारी डैशबोर्ड",
  },
  "nav.mines": {
    en: "Mines Registry & Risk Radar",
    hi: "खान रजिस्ट्री एवं जोखिम रडार",
  },
  "nav.filings": {
    en: "Statutory Filings",
    hi: "वैधानिक दस्तावेज़ एवं विवरणियां",
  },
  "nav.compliance": {
    en: "Regulatory Engine",
    hi: "विनियामक सत्यापन इंजन",
  },
  "nav.forecasts": {
    en: "Risk Forecaster",
    hi: "जोखिम पूर्वानुमान",
  },
  "nav.violations": {
    en: "Violations & CAPA",
    hi: "उल्लंघन एवं सुधारात्मक कार्य",
  },
  "nav.gis_map": {
    en: "National GIS Radar",
    hi: "राष्ट्रीय जीआईएस रडार",
  },
  "nav.inspector": {
    en: "Field Inspector",
    hi: "फील्ड सुरक्षा निरीक्षक",
  },
  "nav.audit_trail": {
    en: "Blockchain Audit Proof",
    hi: "ब्लॉकचेन ऑडिट प्रमाण",
  },
  "nav.contractors": {
    en: "Contractors & Welfare",
    hi: "ठेकेदार एवं कामगार कल्याण",
  },

  // Emergency & Alert Terms
  "emergency.alert": {
    en: "CRITICAL STATUTORY EMERGENCY",
    hi: "अत्यंत गंभीर वैधानिक आपातकाल",
  },
  "emergency.stop_work": {
    en: "Immediate Section 22(1A) Stop-Work Enforced",
    hi: "धारा 22(1A) के तहत तत्काल कार्य स्थगन आदेश लागू",
  },
  "emergency.ch4_hazard": {
    en: "Methane gas concentration exceeded statutory limit (Reg. 153)",
    hi: "मीथेन गैस सांद्रता वैधानिक सीमा पार कर गई (विनियम 153)",
  },
  "emergency.evacuate": {
    en: "Evacuate Inbye Workings & Deploy Mine Rescue Team",
    hi: "भीतरी कार्यस्थलों को खाली करें और खान बचाव दल तैनात करें",
  },
  "emergency.acknowledge": {
    en: "Acknowledge & Stand Down",
    hi: "स्वीकारें एवं अलर्ट निरस्त करें",
  },
  "emergency.checklist": {
    en: "Statutory Evacuation Checklist",
    hi: "वैधानिक निकासी जांच सूची",
  },

  // Statutory Categories & Severities
  "severity.critical": {
    en: "Critical Hazard",
    hi: "अति गंभीर खतरा",
  },
  "severity.high": {
    en: "High Risk",
    hi: "उच्च जोखिम",
  },
  "severity.medium": {
    en: "Moderate",
    hi: "मध्यम",
  },
  "severity.low": {
    en: "Low / Compliant",
    hi: "निम्न / अनुपालित",
  },

  // Mining Terms
  "mine.worker_count": {
    en: "Underground & Surface Workforce",
    hi: "भूमिगत एवं सतही कार्यबल",
  },
  "mine.subsidiary": {
    en: "Subsidiary Colliery Division",
    hi: "अनुषंगी कोलियरी प्रभाग",
  },
  "mine.risk_score": {
    en: "Composite Statutory Risk Score",
    hi: "समग्र वैधानिक जोखिम सूचकांक",
  },
  "mine.digital_twin": {
    en: "2.5D Colliery Strata & Pit Digital Twin",
    hi: "2.5D कोलियरी संस्तर एवं खदान डिजिटल ट्विन",
  },

  // Circulars & Advisories
  "circulars.title": {
    en: "DGMS Safety Circulars & Directives",
    hi: "डीजीएमएस सुरक्षा परिपत्र एवं दिशा-निर्देश",
  },
  "circulars.scan_all": {
    en: "Scan & Cross-Reference 30 Mines",
    hi: "सभी 30 खानों की अनुपालन जांच करें",
  },
};

import { applyGoogleTranslation } from "@/components/google-translator";

const LANG_STORAGE_KEY = "aegis_language_pref";
const LANG_EVENT_NAME = "aegis-language-changed";

export function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return (stored as Language) || "en";
}

export function setLanguage(lang: Language | string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent(LANG_EVENT_NAME, { detail: lang }));
  applyGoogleTranslation(lang);
}

export function useLanguage() {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    setLangState(getLanguage());

    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail) {
        setLangState(customEvent.detail);
      } else {
        setLangState(getLanguage());
      }
    };

    window.addEventListener(LANG_EVENT_NAME, handleLanguageChange);
    return () => {
      window.removeEventListener(LANG_EVENT_NAME, handleLanguageChange);
    };
  }, []);

  const t = (key: string): string => {
    const item = DICTIONARY[key];
    if (!item) return key;
    return item[lang] || item.en || key;
  };

  const toggleLanguage = () => {
    const nextLang: Language = lang === "en" ? "hi" : "en";
    setLanguage(nextLang);
  };

  return { lang, t, toggleLanguage, setLanguage };
}

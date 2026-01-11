import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getUserSettings, updateUserSettings, getTranslations, type UserSettings, type TranslationsResponse } from "./api";

// Default translations (English)
const DEFAULT_TRANSLATIONS: Record<string, string> = {
  // Navigation
  "Dashboard": "Dashboard",
  "Segments": "Segments",
  "Reports": "Reports",
  "Route Planning": "Route Planning",
  "Plan Trip": "Plan Trip",
  "Trip History": "Trip History",
  "Auto Detection": "Auto Detection",
  "Settings": "Settings",
  "Logout": "Logout",
  // Settings page
  "Auto Detection Settings": "Auto Detection",
  "Enable automatic segment detection": "Enable automatic segment detection",
  "Auto-confirm threshold (reports needed)": "Auto-confirm threshold (reports needed)",
  "Map Settings": "Map Settings",
  "Default map zoom level": "Default map zoom level",
  "Preferred route mode": "Preferred route mode",
  "Fastest": "Fastest",
  "Shortest": "Shortest",
  "Scenic": "Scenic",
  "Notifications": "Notifications",
  "Enable notifications": "Enable notifications",
  "Appearance": "Appearance",
  "Dark mode (preview only)": "Dark mode",
  "Dark mode": "Dark mode",
  "Language": "Language",
  "Save Settings": "Save Settings",
  "Saving...": "Saving...",
  "Settings saved successfully!": "Settings saved successfully!",
  "Loading settings...": "Loading settings...",
  "Configure your preferences and app behavior.": "Configure your preferences and app behavior.",
  // Common
  "User": "User",
  "Backend": "Backend",
  "Refresh": "Refresh",
  "Loading...": "Loading...",
  "Loading": "Loading",
  // Dashboard
  "Overview of users, segments, reports (BBP backend, in-memory).": "Overview of users, segments, reports (BBP backend, in-memory).",
  "Trigger Aggregation": "Trigger Aggregation",
  "Aggregating...": "Aggregating...",
  "Aggregation complete": "Aggregation complete",
  "segments processed": "segments processed",
  "status changes": "status changes",
  "statuses": "statuses",
  "Total reports": "Total reports",
  "Confirmed": "Confirmed",
  "Reports confirmed": "Reports confirmed",
  "Confirm Rate": "Confirm Rate",
  "confirmed / total": "confirmed / total",
  "Total Users": "Total Users",
  "Registered users": "Registered users",
  "Total Trips": "Total Trips",
  "total": "total",
  "Segments Map": "Segments Map",
  "Segments List": "Segments List",
  "Segment": "Segment",
  "status": "status",
  "start": "start",
  "end": "end",
  "obstacle": "obstacle",
  "No segments yet.": "No segments yet.",
  "Latest reports": "Latest reports",
  "Report": "Report",
  "CONFIRMED": "CONFIRMED",
  "UNCONFIRMED": "UNCONFIRMED",
  "No reports yet.": "No reports yet.",
};

// Chinese translations
const ZH_TRANSLATIONS: Record<string, string> = {
  // Navigation
  "Dashboard": "仪表盘",
  "Segments": "路段",
  "Reports": "报告",
  "Route Planning": "路线规划",
  "Plan Trip": "规划行程",
  "Trip History": "行程历史",
  "Auto Detection": "自动检测",
  "Settings": "设置",
  "Logout": "退出登录",
  // Settings page
  "Auto Detection Settings": "自动检测",
  "Enable automatic segment detection": "启用自动路段检测",
  "Auto-confirm threshold (reports needed)": "自动确认阈值（所需报告数）",
  "Map Settings": "地图设置",
  "Default map zoom level": "默认地图缩放级别",
  "Preferred route mode": "首选路线模式",
  "Fastest": "最快",
  "Shortest": "最短",
  "Scenic": "风景优美",
  "Notifications": "通知",
  "Enable notifications": "启用通知",
  "Appearance": "外观",
  "Dark mode (preview only)": "深色模式",
  "Dark mode": "深色模式",
  "Language": "语言",
  "Save Settings": "保存设置",
  "Saving...": "保存中...",
  "Settings saved successfully!": "设置保存成功！",
  "Loading settings...": "加载设置中...",
  "Configure your preferences and app behavior.": "配置您的偏好和应用行为。",
  // Common
  "User": "用户",
  "Backend": "后端",
  "Refresh": "刷新",
  "Loading...": "加载中...",
  "Loading": "加载中",
  // Dashboard
  "Overview of users, segments, reports (BBP backend, in-memory).": "用户、路段、报告概览（BBP后端，内存存储）。",
  "Trigger Aggregation": "触发聚合",
  "Aggregating...": "聚合中...",
  "Aggregation complete": "聚合完成",
  "segments processed": "路段已处理",
  "status changes": "状态变更",
  "statuses": "状态",
  "Total reports": "报告总数",
  "Confirmed": "已确认",
  "Reports confirmed": "已确认的报告",
  "Confirm Rate": "确认率",
  "confirmed / total": "已确认 / 总数",
  "Total Users": "用户总数",
  "Registered users": "注册用户",
  "Total Trips": "行程总数",
  "total": "总计",
  "Segments Map": "路段地图",
  "Segments List": "路段列表",
  "Segment": "路段",
  "status": "状态",
  "start": "起点",
  "end": "终点",
  "obstacle": "障碍物",
  "No segments yet.": "暂无路段。",
  "Latest reports": "最新报告",
  "Report": "报告",
  "CONFIRMED": "已确认",
  "UNCONFIRMED": "未确认",
  "No reports yet.": "暂无报告。",
};

// Italian translations
const IT_TRANSLATIONS: Record<string, string> = {
  // Navigation
  "Dashboard": "Pannello",
  "Segments": "Segmenti",
  "Reports": "Rapporti",
  "Route Planning": "Pianificazione Percorso",
  "Plan Trip": "Pianifica Viaggio",
  "Trip History": "Cronologia Viaggi",
  "Auto Detection": "Rilevamento Auto",
  "Settings": "Impostazioni",
  "Logout": "Esci",
  // Settings page
  "Auto Detection Settings": "Rilevamento Automatico",
  "Enable automatic segment detection": "Abilita rilevamento automatico segmenti",
  "Auto-confirm threshold (reports needed)": "Soglia di conferma automatica (rapporti necessari)",
  "Map Settings": "Impostazioni Mappa",
  "Default map zoom level": "Livello zoom mappa predefinito",
  "Preferred route mode": "Modalità percorso preferita",
  "Fastest": "Più veloce",
  "Shortest": "Più breve",
  "Scenic": "Panoramico",
  "Notifications": "Notifiche",
  "Enable notifications": "Abilita notifiche",
  "Appearance": "Aspetto",
  "Dark mode (preview only)": "Modalità scura",
  "Dark mode": "Modalità scura",
  "Language": "Lingua",
  "Save Settings": "Salva Impostazioni",
  "Saving...": "Salvataggio...",
  "Settings saved successfully!": "Impostazioni salvate con successo!",
  "Loading settings...": "Caricamento impostazioni...",
  "Configure your preferences and app behavior.": "Configura le tue preferenze e il comportamento dell'app.",
  // Common
  "User": "Utente",
  "Backend": "Backend",
  "Refresh": "Aggiorna",
  "Loading...": "Caricamento...",
  "Loading": "Caricamento",
  // Dashboard
  "Overview of users, segments, reports (BBP backend, in-memory).": "Panoramica di utenti, segmenti, rapporti (backend BBP, in memoria).",
  "Trigger Aggregation": "Avvia Aggregazione",
  "Aggregating...": "Aggregazione...",
  "Aggregation complete": "Aggregazione completata",
  "segments processed": "segmenti elaborati",
  "status changes": "cambi di stato",
  "statuses": "stati",
  "Total reports": "Rapporti totali",
  "Confirmed": "Confermati",
  "Reports confirmed": "Rapporti confermati",
  "Confirm Rate": "Tasso di conferma",
  "confirmed / total": "confermati / totale",
  "Total Users": "Utenti totali",
  "Registered users": "Utenti registrati",
  "Total Trips": "Viaggi totali",
  "total": "totale",
  "Segments Map": "Mappa Segmenti",
  "Segments List": "Lista Segmenti",
  "Segment": "Segmento",
  "status": "stato",
  "start": "inizio",
  "end": "fine",
  "obstacle": "ostacolo",
  "No segments yet.": "Nessun segmento ancora.",
  "Latest reports": "Ultimi rapporti",
  "Report": "Rapporto",
  "CONFIRMED": "CONFERMATO",
  "UNCONFIRMED": "NON CONFERMATO",
  "No reports yet.": "Nessun rapporto ancora.",
};

const TRANSLATIONS_MAP: Record<string, Record<string, string>> = {
  en: DEFAULT_TRANSLATIONS,
  zh: ZH_TRANSLATIONS,
  it: IT_TRANSLATIONS,
};

interface AppContextType {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  language: string;
  setLanguage: (v: string) => void;
  t: (key: string) => string;
  userId: number | null;
  setUserId: (id: number | null) => void;
  refreshSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [language, setLanguageState] = useState("en");
  const [userId, setUserId] = useState<number | null>(null);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
      document.body.style.backgroundColor = "#1a1a2e";
      document.body.style.color = "#e5e5e5";
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#111111";
    }
  }, [darkMode]);

  // Load settings when userId changes
  useEffect(() => {
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  async function loadSettings() {
    if (!userId) return;
    try {
      const settings = await getUserSettings(userId);
      setDarkModeState(settings.dark_mode);
      setLanguageState(settings.language);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }

  const setDarkMode = async (v: boolean) => {
    setDarkModeState(v);
    if (userId) {
      try {
        await updateUserSettings(userId, { dark_mode: v });
      } catch (e) {
        console.error("Failed to save dark mode:", e);
      }
    }
  };

  const setLanguage = async (v: string) => {
    setLanguageState(v);
    if (userId) {
      try {
        await updateUserSettings(userId, { language: v });
      } catch (e) {
        console.error("Failed to save language:", e);
      }
    }
  };

  const t = (key: string): string => {
    const translations = TRANSLATIONS_MAP[language] || DEFAULT_TRANSLATIONS;
    return translations[key] || key;
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <AppContext.Provider
      value={{
        darkMode,
        setDarkMode,
        language,
        setLanguage,
        t,
        userId,
        setUserId,
        refreshSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}

import { useEffect, useState } from "react";
import { getUserSettings, updateUserSettings, type UserSettings } from "./api";
import { useAppContext } from "./AppContext";

export default function SettingsPage(props: { userId: number }) {
  const { darkMode, setDarkMode, language, setLanguage, t } = useAppContext();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadSettings() {
    setLoading(true);
    setErr(null);
    try {
      const data = await getUserSettings(props.userId);
      setSettings(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, [props.userId]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setErr(null);
    setSuccess(false);
    try {
      const updated = await updateUserSettings(props.userId, {
        auto_detect_enabled: settings.auto_detect_enabled,
        auto_confirm_threshold: settings.auto_confirm_threshold,
        default_map_zoom: settings.default_map_zoom,
        preferred_route_mode: settings.preferred_route_mode,
        notifications_enabled: settings.notifications_enabled,
        dark_mode: darkMode,
        language: language,
      });
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  // Dark mode aware styles
  const colors = darkMode
    ? {
        text: "#e5e5e5",
        textMuted: "#a0a0a0",
        cardBg: "#16213e",
        cardBorder: "#0f3460",
        inputBg: "#1a1a2e",
        inputBorder: "#0f3460",
        buttonBg: "#e94560",
      }
    : {
        text: "#111",
        textMuted: "#444",
        cardBg: "white",
        cardBorder: "#eee",
        inputBg: "#ffffff",
        inputBorder: "#dcdcdc",
        buttonBg: "#111",
      };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid " + colors.inputBorder,
    background: colors.inputBg,
    color: colors.text,
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textMuted,
    marginBottom: 6,
    display: "block",
  };

  if (loading) {
    return (
      <div style={{ color: colors.text, padding: 20 }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>{t("Settings")}</h1>
        <div style={{ marginTop: 20, color: colors.textMuted }}>{t("Loading")}...</div>
      </div>
    );
  }

  return (
    <div style={{ color: colors.text }}>
      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>{t("Settings")}</h1>
      <div style={{ color: colors.textMuted, marginTop: 6 }}>{t("Configure your preferences and app behavior.")}</div>

      {err && (
        <pre
          style={{
            marginTop: 12,
            whiteSpace: "pre-wrap",
            color: "#b91c1c",
            background: darkMode ? "#3d1a1a" : "#fff5f5",
            border: "1px solid " + (darkMode ? "#5c2828" : "#ffd6d6"),
            padding: 12,
            borderRadius: 10,
            fontSize: 12,
          }}
        >
          {err}
        </pre>
      )}

      {success && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: darkMode ? "#1a3d2e" : "#f0fdf4",
            border: "1px solid " + (darkMode ? "#2d5a43" : "#bbf7d0"),
            borderRadius: 10,
            color: darkMode ? "#7dd3a8" : "#166534",
            fontWeight: 600,
          }}
        >
          ✓ {t("Settings saved successfully!")}
        </div>
      )}

      {settings && (
        <div style={{ marginTop: 20, display: "grid", gap: 20, maxWidth: 600 }}>
          {/* Auto Detection */}
          <div style={{ background: colors.cardBg, border: "1px solid " + colors.cardBorder, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 16 }}>🔍 {t("Auto Detection")}</div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.auto_detect_enabled}
                onChange={(e) => setSettings({ ...settings, auto_detect_enabled: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 500 }}>{t("Enable automatic segment detection")}</span>
            </label>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>{t("Auto-confirm threshold (reports needed)")}</label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.auto_confirm_threshold}
                onChange={(e) => setSettings({ ...settings, auto_confirm_threshold: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Map Settings */}
          <div style={{ background: colors.cardBg, border: "1px solid " + colors.cardBorder, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 16 }}>🗺️ {t("Map Settings")}</div>

            <div>
              <label style={labelStyle}>{t("Default map zoom level")}</label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.default_map_zoom}
                onChange={(e) => setSettings({ ...settings, default_map_zoom: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>{t("Preferred route mode")}</label>
              <select
                value={settings.preferred_route_mode}
                onChange={(e) => setSettings({ ...settings, preferred_route_mode: e.target.value })}
                style={inputStyle}
              >
                <option value="fastest">{t("Fastest")}</option>
                <option value="shortest">{t("Shortest")}</option>
                <option value="scenic">{t("Scenic")}</option>
              </select>
            </div>
          </div>

          {/* Notifications */}
          <div style={{ background: colors.cardBg, border: "1px solid " + colors.cardBorder, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 16 }}>🔔 {t("Notifications")}</div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 500 }}>{t("Enable notifications")}</span>
            </label>
          </div>

          {/* Appearance */}
          <div style={{ background: colors.cardBg, border: "1px solid " + colors.cardBorder, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 16 }}>🎨 {t("Appearance")}</div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 500 }}>{t("Dark mode")}</span>
            </label>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>{t("Language")}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={inputStyle}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="it">Italiano</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "14px 20px",
              borderRadius: 12,
              border: "none",
              background: colors.buttonBg,
              color: "white",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? t("Saving...") : t("Save Settings")}
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { getUserSettings, updateUserSettings, type UserSettings } from "./api";

export default function SettingsPage(props: { userId: number }) {
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
        dark_mode: settings.dark_mode,
        language: settings.language,
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

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdcdc",
    background: "#ffffff",
    color: "#111",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
    marginBottom: 6,
    display: "block",
  };

  if (loading) {
    return (
      <div style={{ color: "#111", padding: 20 }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>Settings</h1>
        <div style={{ marginTop: 20, color: "#666" }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div style={{ color: "#111" }}>
      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>Settings</h1>
      <div style={{ color: "#444", marginTop: 6 }}>Configure your preferences and app behavior.</div>

      {err && (
        <pre
          style={{
            marginTop: 12,
            whiteSpace: "pre-wrap",
            color: "#b91c1c",
            background: "#fff5f5",
            border: "1px solid #ffd6d6",
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
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 10,
            color: "#166534",
            fontWeight: 600,
          }}
        >
          ✓ Settings saved successfully!
        </div>
      )}

      {settings && (
        <div style={{ marginTop: 20, display: "grid", gap: 20, maxWidth: 600 }}>
          {/* Auto Detection */}
          <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 16 }}>🔍 Auto Detection</div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.auto_detect_enabled}
                onChange={(e) => setSettings({ ...settings, auto_detect_enabled: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 500 }}>Enable automatic segment detection</span>
            </label>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Auto-confirm threshold (reports needed)</label>
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
          <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 16 }}>🗺️ Map Settings</div>

            <div>
              <label style={labelStyle}>Default map zoom level</label>
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
              <label style={labelStyle}>Preferred route mode</label>
              <select
                value={settings.preferred_route_mode}
                onChange={(e) => setSettings({ ...settings, preferred_route_mode: e.target.value })}
                style={inputStyle}
              >
                <option value="fastest">Fastest</option>
                <option value="shortest">Shortest</option>
                <option value="scenic">Scenic</option>
              </select>
            </div>
          </div>

          {/* Notifications */}
          <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 16 }}>🔔 Notifications</div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 500 }}>Enable notifications</span>
            </label>
          </div>

          {/* Appearance */}
          <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 16 }}>🎨 Appearance</div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.dark_mode}
                onChange={(e) => setSettings({ ...settings, dark_mode: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 500 }}>Dark mode (preview only)</span>
            </label>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                style={inputStyle}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="ms">Bahasa Melayu</option>
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
              background: "#111",
              color: "white",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}

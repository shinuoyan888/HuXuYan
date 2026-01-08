import { useState } from "react";
import { createOrGetUser, type User } from "./api";

export default function LoginPage(props: { onLogin: (u: User) => void }) {
  const [username, setUsername] = useState("alice");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setLoading(true);

    try {
      const user = await createOrGetUser(username.trim());
      props.onLogin(user);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 520 }}>
      <h1 style={{ marginBottom: 8 }}>Road Monitoring</h1>
      <div style={{ color: "#666", marginBottom: 16 }}>Enter username to create/get a user (BBP backend).</div>

      <label style={{ display: "block", marginBottom: 6 }}>Username</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "1px solid #ccc",
          background: "#fff",
          color: "#111",
        }}
      />

      {err ? (
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
      ) : null}

      <button
        onClick={submit}
        disabled={loading || !username.trim()}
        style={{
          marginTop: 14,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #111",
          background: "#111",
          color: "white",
          cursor: "pointer",
          opacity: loading || !username.trim() ? 0.6 : 1,
        }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}

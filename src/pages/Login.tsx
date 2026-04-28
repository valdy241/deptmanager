import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";

type Mode = "login" | "register";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (e) => setServerError(e.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (e) => setServerError(e.message),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "register") {
      if (!form.name.trim() || form.name.length < 2) e.name = "Nom trop court";
      if (form.password !== form.confirm) e.confirm = "Les mots de passe ne correspondent pas";
    }
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Email invalide";
    if (form.password.length < 8) e.password = "8 caractères minimum";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    if (mode === "login") {
      loginMutation.mutate({ email: form.email, password: form.password });
    } else {
      registerMutation.mutate({ name: form.name, email: form.email, password: form.password });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;
  const field = (key: string) => (val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setServerError("");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Left panel — decorative */}
      <div style={{
        flex: "0 0 45%",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c2a4a 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "60px 48px", position: "relative", overflow: "hidden",
      }} className="login-panel-left">
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(56,189,248,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-100px", right: "-60px", width: "350px", height: "350px", borderRadius: "50%", background: "rgba(56,189,248,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "40%", right: "10%", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(99,179,237,0.07)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ marginBottom: "40px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px",
            background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(56,189,248,0.35)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "22px", letterSpacing: "-0.5px" }}>DeptManager</div>
            <div style={{ color: "rgba(148,163,184,0.8)", fontSize: "12px", marginTop: "2px" }}>Médias & Maintenance</div>
          </div>
        </div>

        <div style={{ textAlign: "center", maxWidth: "320px" }}>
          <h1 style={{ color: "white", fontSize: "32px", fontWeight: 800, lineHeight: 1.2, marginBottom: "16px", letterSpacing: "-1px" }}>
            Gérez votre département avec efficacité
          </h1>
          <p style={{ color: "rgba(148,163,184,0.85)", fontSize: "15px", lineHeight: 1.7 }}>
            Tâches, rendez-vous, documents et équipes — tout centralisé en une seule plateforme.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "40px", justifyContent: "center", maxWidth: "320px" }}>
          {["✅ Gestion des tâches", "📅 Rendez-vous", "📄 Documents", "👥 Équipes", "🔔 Notifications"].map(f => (
            <div key={f} style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px", padding: "6px 14px", color: "rgba(226,232,240,0.85)", fontSize: "13px",
            }}>{f}</div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f8fafc", padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Mode switcher */}
          <div style={{
            display: "flex", background: "#e2e8f0", borderRadius: "12px",
            padding: "4px", marginBottom: "32px",
          }}>
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setServerError(""); setErrors({}); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: "9px", border: "none",
                  cursor: "pointer", fontSize: "14px", fontWeight: 600, transition: "all 0.2s",
                  background: mode === m ? "white" : "transparent",
                  color: mode === m ? "#0f172a" : "#64748b",
                  boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "6px", letterSpacing: "-0.5px" }}>
            {mode === "login" ? "Bon retour 👋" : "Créer un compte"}
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "28px" }}>
            {mode === "login"
              ? "Entrez vos identifiants pour accéder à la plateforme."
              : "Remplissez le formulaire pour rejoindre votre équipe."}
          </p>

          {serverError && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px",
              padding: "12px 16px", marginBottom: "20px", color: "#dc2626", fontSize: "14px",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span>⚠️</span> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Nom complet
                </label>
                <input
                  type="text"
                  placeholder="Jean Dupont"
                  value={form.name}
                  onChange={(e) => field("name")(e.target.value)}
                  style={inputStyle(!!errors.name)}
                  autoComplete="name"
                />
                <FieldError msg={errors.name} />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Adresse email
              </label>
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={(e) => field("email")(e.target.value)}
                style={inputStyle(!!errors.email)}
                autoComplete="email"
              />
              <FieldError msg={errors.email} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => field("password")(e.target.value)}
                style={inputStyle(!!errors.password)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <FieldError msg={errors.password} />
            </div>

            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => field("confirm")(e.target.value)}
                  style={inputStyle(!!errors.confirm)}
                  autoComplete="new-password"
                />
                <FieldError msg={errors.confirm} />
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              style={{
                marginTop: "8px", padding: "14px", borderRadius: "12px", border: "none",
                background: isPending ? "#94a3b8" : "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                color: "white", fontWeight: 700, fontSize: "15px", cursor: isPending ? "not-allowed" : "pointer",
                boxShadow: isPending ? "none" : "0 4px 16px rgba(14,165,233,0.35)",
                transition: "all 0.2s",
              }}
            >
              {isPending ? "⏳ Chargement..." : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
            </button>
          </form>

          {mode === "login" && (
            <p style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                style={{ background: "none", border: "none", color: "#0ea5e9", fontWeight: 600, cursor: "pointer", padding: 0 }}
              >
                S'inscrire
              </button>
            </p>
          )}

          <p style={{ marginTop: "16px", textAlign: "center", fontSize: "11px", color: "#94a3b8" }}>
            Le premier utilisateur inscrit devient Super Administrateur.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-panel-left { display: none !important; }
        }
        input:focus { outline: none !important; }
      `}</style>
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: `1.5px solid ${hasError ? "#f87171" : "#e2e8f0"}`,
    fontSize: "14px", color: "#0f172a", background: "white",
    transition: "border-color 0.2s", boxSizing: "border-box",
    fontFamily: "inherit",
  };
}

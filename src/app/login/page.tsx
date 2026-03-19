"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setError(payload.message ?? "No se pudo iniciar sesion.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-page">
      <form className="auth-card auth-card--compact" onSubmit={handleSubmit}>
        <div className="auth-card__logo-top">
          <Image
            src="/brand/logo-pacifico.jpeg"
            alt="Pacifico"
            width={120}
            height={78}
            className="auth-card__logo"
            style={{ height: "auto" }}
            priority
          />
        </div>

        <h2 className="auth-card__title auth-card__title--center">Iniciar sesion</h2>

        <p className="auth-card__copy">
          Accede con tu correo y contraseña.
        </p>

        <label className="modal-field">
          <span>Correo</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="usuario@pacifico.local"
            required
          />
        </label>

        <label className="modal-field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ingresa tu contraseña"
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="button-primary auth-card__submit" disabled={submitting}>
          {submitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

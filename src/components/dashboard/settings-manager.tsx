"use client";

import { useState } from "react";

import type { AppUser, SystemSettings } from "@/modules/orders/types";

export function SettingsManager({
  initialSettings,
  currentUser,
}: {
  initialSettings: SystemSettings;
  currentUser: AppUser;
}) {
  const [form, setForm] = useState<SystemSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isAdmin = currentUser.role === "ADMIN";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin) {
      setMessage("Solo el administrador puede actualizar la configuracion.");
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as SystemSettings | { message?: string };

    if (!response.ok) {
      setMessage("message" in payload ? payload.message ?? "No se pudo guardar." : "No se pudo guardar.");
      setSaving(false);
      return;
    }

    setForm(payload as SystemSettings);
    setMessage("Configuracion actualizada.");
    setSaving(false);
  }

  return (
    <form className="panel settings-form" onSubmit={handleSubmit}>
      <div className="settings-form__grid">
        <label className="modal-field">
          <span>Razon social</span>
          <input
            value={form.companyName}
            onChange={(event) =>
              setForm((current) => ({ ...current, companyName: event.target.value }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="modal-field">
          <span>RUC</span>
          <input
            value={form.companyRuc}
            onChange={(event) =>
              setForm((current) => ({ ...current, companyRuc: event.target.value }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="modal-field modal-field--full">
          <span>Direccion</span>
          <input
            value={form.companyAddress}
            onChange={(event) =>
              setForm((current) => ({ ...current, companyAddress: event.target.value }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="modal-field">
          <span>Contacto</span>
          <input
            value={form.companyContact}
            onChange={(event) =>
              setForm((current) => ({ ...current, companyContact: event.target.value }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="modal-field">
          <span>Correo</span>
          <input
            value={form.companyEmail}
            onChange={(event) =>
              setForm((current) => ({ ...current, companyEmail: event.target.value }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="modal-field">
          <span>Telefono</span>
          <input
            value={form.companyPhone}
            onChange={(event) =>
              setForm((current) => ({ ...current, companyPhone: event.target.value }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="modal-field">
          <span>Celular / RPM</span>
          <input
            value={form.companyCell}
            onChange={(event) =>
              setForm((current) => ({ ...current, companyCell: event.target.value }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="modal-field">
          <span>IGV %</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.igvRate}
            onChange={(event) =>
              setForm((current) => ({ ...current, igvRate: Number(event.target.value) || 0 }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="modal-field">
          <span>Retencion %</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.retentionRate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                retentionRate: Number(event.target.value) || 0,
              }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="modal-field">
          <span>Umbral retencion</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.retentionThreshold}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                retentionThreshold: Number(event.target.value) || 0,
              }))
            }
            disabled={!isAdmin}
          />
        </label>
        <label className="settings-form__checkbox">
          <input
            type="checkbox"
            checked={form.retentionEnabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                retentionEnabled: event.target.checked,
              }))
            }
            disabled={!isAdmin}
          />
          <span>Activar retencion automatica</span>
        </label>
      </div>

      {message ? <p className="form-hint">{message}</p> : null}

      <div className="modal-actions">
        <button type="submit" className="button-primary" disabled={!isAdmin || saving}>
          {saving ? "Guardando..." : "Guardar configuracion"}
        </button>
      </div>
    </form>
  );
}

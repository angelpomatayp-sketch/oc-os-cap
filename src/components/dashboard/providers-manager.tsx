"use client";

import { useState } from "react";

import { Modal } from "@/components/dashboard/modal";
import type { ProviderFormValues, ProviderSummary } from "@/modules/orders/types";

const emptyProvider: ProviderFormValues = {
  businessName: "",
  ruc: "",
  fiscalAddress: "",
  contactName: "",
  email: "",
  phone: "",
  bankName: "",
  bankAccount: "",
  bankCci: "",
  detraccionAccount: "",
  isRetentionAgent: false,
};

export function ProvidersManager({
  initialProviders,
}: {
  initialProviders: ProviderSummary[];
}) {
  const [providers, setProviders] = useState<ProviderSummary[]>(initialProviders);
  const [open, setOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderSummary | null>(null);
  const [form, setForm] = useState<ProviderFormValues>(emptyProvider);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadProviders() {
    const response = await fetch("/api/providers", { cache: "no-store" });
    const data = (await response.json()) as ProviderSummary[];
    setProviders(data);
  }

  function openCreateModal() {
    setEditingProvider(null);
    setForm(emptyProvider);
    setError("");
    setOpen(true);
  }

  function openEditModal(provider: ProviderSummary) {
    setEditingProvider(provider);
    setForm({
      businessName: provider.businessName,
      ruc: provider.ruc,
      fiscalAddress: provider.fiscalAddress,
      contactName: provider.contactName,
      email: provider.email,
      phone: provider.phone,
      bankName: provider.bankName,
      bankAccount: provider.bankAccount,
      bankCci: provider.bankCci,
      detraccionAccount: provider.detraccionAccount,
      isRetentionAgent: provider.isRetentionAgent,
    });
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditingProvider(null);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editingProvider ? `/api/providers/${editingProvider.id}` : "/api/providers";
    const method = editingProvider ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setError(payload.message ?? "No se pudo guardar el proveedor.");
      setSubmitting(false);
      return;
    }

    await loadProviders();
    setSubmitting(false);
    closeModal();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Deseas eliminar este proveedor?");

    if (!confirmed) {
      return;
    }

    await fetch(`/api/providers/${id}`, { method: "DELETE" });
    await loadProviders();
  }

  return (
    <>
      <div className="section-actions">
        <button type="button" className="button-primary" onClick={openCreateModal}>
          Nuevo proveedor
        </button>
      </div>

      <div className="table-card">
        {providers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">+</div>
            <h3 className="empty-state__title">No hay proveedores registrados</h3>
            <p className="empty-state__description">
              Usa el boton “Nuevo proveedor” para registrar tu primer proveedor.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Razon social</th>
                <th>RUC</th>
                <th>Contacto</th>
                <th>Correo</th>
                <th>Telefono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id}>
                  <td className="text-strong">{provider.businessName}</td>
                  <td>{provider.ruc}</td>
                  <td>{provider.contactName || "-"}</td>
                  <td>{provider.email || "-"}</td>
                  <td>{provider.phone || "-"}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="button-link"
                        onClick={() => openEditModal(provider)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="button-link button-link--danger"
                        onClick={() => handleDelete(provider.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        title={editingProvider ? "Editar proveedor" : "Nuevo proveedor"}
        open={open}
        onClose={closeModal}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="pform__grid">
            <label className="pfield">
              <span>Razon social</span>
              <input
                value={form.businessName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, businessName: event.target.value }))
                }
                required
              />
            </label>
            <label className="pfield">
              <span>RUC</span>
              <input
                value={form.ruc}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ruc: event.target.value }))
                }
                maxLength={11}
                required
              />
            </label>
            <label className="pfield pfield--full">
              <span>Dirección fiscal</span>
              <input
                value={form.fiscalAddress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, fiscalAddress: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Contacto</span>
              <input
                value={form.contactName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactName: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Correo</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Teléfono</span>
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Banco</span>
              <input
                value={form.bankName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankName: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Cuenta bancaria</span>
              <input
                value={form.bankAccount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankAccount: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>CCI</span>
              <input
                value={form.bankCci}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankCci: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Cuenta detracción</span>
              <input
                value={form.detraccionAccount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    detraccionAccount: event.target.value,
                  }))
                }
              />
            </label>
            <label className="pform__check">
              <input
                type="checkbox"
                checked={form.isRetentionAgent}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isRetentionAgent: event.target.checked,
                  }))
                }
              />
              <span>Es agente de retención (no se descuenta el 3%)</span>
            </label>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="pform__actions">
            <button type="button" className="button-secondary" onClick={closeModal}>
              Cancelar
            </button>
            <button type="submit" className="button-primary" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

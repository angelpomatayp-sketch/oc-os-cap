"use client";

import { useState } from "react";

import { Modal } from "@/components/dashboard/modal";
import { Pagination, usePagination } from "@/components/dashboard/pagination";
import type { ProviderFormValues, ProviderSummary } from "@/modules/orders/types";

const emptyProvider: ProviderFormValues = {
  businessName: "",
  ruc: "",
  fiscalAddress: "",
  contactName: "",
  email: "",
  phone: "",
  bankNamePen: "",
  bankAccountPen: "",
  bankCciPen: "",
  detraccionAccountPen: "",
  bankNameUsd: "",
  bankAccountUsd: "",
  bankCciUsd: "",
  detraccionAccountUsd: "",
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
      bankNamePen: provider.bankNamePen,
      bankAccountPen: provider.bankAccountPen,
      bankCciPen: provider.bankCciPen,
      detraccionAccountPen: provider.detraccionAccountPen,
      bankNameUsd: provider.bankNameUsd,
      bankAccountUsd: provider.bankAccountUsd,
      bankCciUsd: provider.bankCciUsd,
      detraccionAccountUsd: provider.detraccionAccountUsd,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = providers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return !q || p.businessName.toLowerCase().includes(q) || p.ruc.includes(q);
  });
  const { pageItems, totalPages } = usePagination(filtered, page);

  return (
    <>
      <div className="orders-header">
        <h1 className="orders-header__title">Proveedores</h1>
        <button type="button" className="button-primary" onClick={openCreateModal}>
          + Nuevo
        </button>
      </div>

      <div className="filters-bar">
        <input
          className="field filters-bar__search"
          placeholder="Buscar por razón social o RUC"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
        />
      </div>

      <div className="table-card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state__title">No hay proveedores registrados</h3>
            <p className="empty-state__description">
              Usa el botón &quot;+ Nuevo&quot; para registrar tu primer proveedor.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Razón social</th>
                <th>RUC</th>
                <th>Contacto</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((provider) => (
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
                        className="btn-action"
                        onClick={() => openEditModal(provider)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-action--danger"
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
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
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
            <div className="pform__section pfield--full">
              <p className="pform__section-title">Cuenta en Soles (PEN)</p>
            </div>
            <label className="pfield">
              <span>Banco (PEN)</span>
              <input
                value={form.bankNamePen}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankNamePen: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Cuenta bancaria (PEN)</span>
              <input
                value={form.bankAccountPen}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankAccountPen: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>CCI (PEN)</span>
              <input
                value={form.bankCciPen}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankCciPen: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Cuenta detracción (PEN)</span>
              <input
                value={form.detraccionAccountPen}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    detraccionAccountPen: event.target.value,
                  }))
                }
              />
            </label>
            <div className="pform__section pfield--full">
              <p className="pform__section-title">Cuenta en Dólares (USD)</p>
            </div>
            <label className="pfield">
              <span>Banco (USD)</span>
              <input
                value={form.bankNameUsd}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankNameUsd: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Cuenta bancaria (USD)</span>
              <input
                value={form.bankAccountUsd}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankAccountUsd: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>CCI (USD)</span>
              <input
                value={form.bankCciUsd}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankCciUsd: event.target.value }))
                }
              />
            </label>
            <label className="pfield">
              <span>Cuenta detracción (USD)</span>
              <input
                value={form.detraccionAccountUsd}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    detraccionAccountUsd: event.target.value,
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

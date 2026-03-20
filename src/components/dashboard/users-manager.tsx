"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/dashboard/modal";
import { Pagination, usePagination } from "@/components/dashboard/pagination";
import type { AppUser, UserFormValues } from "@/modules/orders/types";

const AREA_NAMES: Record<string, string> = {
  ADMIN: "Admin",
  L: "Logística",
  C: "Contabilidad",
  E: "Equipos",
  F: "Finanzas",
};

const emptyUser: UserFormValues = {
  name: "",
  role: "L",
  email: "",
  password: "",
};

export function UsersManager() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState<UserFormValues>(emptyUser);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const response = await fetch("/api/users", { cache: "no-store" });
    const data = (await response.json()) as AppUser[];
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function closeModal() {
    setOpen(false);
    setEditingUser(null);
    setForm(emptyUser);
    setError("");
  }

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyUser);
    setError("");
    setOpen(true);
  }

  function openEditModal(user: AppUser) {
    setEditingUser(user);
    setForm({
      name: user.name,
      role: user.role,
      email: user.email,
      password: "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setError(payload.message ?? "No se pudo guardar el usuario.");
      setSubmitting(false);
      return;
    }

    await loadUsers();
    setSubmitting(false);
    closeModal();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Deseas eliminar este usuario?");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setError(payload.message ?? "No se pudo eliminar el usuario.");
      return;
    }

    await loadUsers();
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
  const { pageItems, totalPages } = usePagination(filtered, page);

  return (
    <>
      <div className="orders-header">
        <h1 className="orders-header__title">Usuarios</h1>
        <button type="button" className="button-primary" onClick={openCreateModal}>
          + Nuevo
        </button>
      </div>

      <div className="filters-bar">
        <input
          className="field filters-bar__search"
          placeholder="Buscar por nombre o correo"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
        />
      </div>

      <div className="table-card">
        {loading ? (
          <div className="empty-state">
            <h3 className="empty-state__title">Cargando usuarios...</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state__title">No hay usuarios registrados</h3>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Área</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((user) => (
                <tr key={user.id}>
                  <td className="text-strong">{user.name}</td>
                  <td>{AREA_NAMES[user.role] ?? user.role}</td>
                  <td>{user.email}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn-action"
                        onClick={() => openEditModal(user)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-action--danger"
                        onClick={() => handleDelete(user.id)}
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
        title={editingUser ? "Editar usuario" : "Nuevo usuario"}
        open={open}
        onClose={closeModal}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-grid">
            <label className="modal-field">
              <span>Nombre</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>
            <label className="modal-field">
              <span>Area / rol</span>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as UserFormValues["role"],
                  }))
                }
              >
                <option value="ADMIN">ADMIN</option>
                <option value="L">L - Logistica</option>
                <option value="C">C - Contabilidad</option>
                <option value="E">E - Equipos</option>
                <option value="F">F - Finanzas</option>
              </select>
            </label>
            <label className="modal-field modal-field--full">
              <span>Correo</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </label>
            <label className="modal-field modal-field--full">
              <span>Contraseña {editingUser ? "(dejar en blanco para no cambiar)" : ""}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required={!editingUser}
              />
            </label>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal-actions">
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

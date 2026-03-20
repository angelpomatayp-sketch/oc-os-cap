"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Modal } from "@/components/dashboard/modal";
import { Pagination, usePagination } from "@/components/dashboard/pagination";
import { amountToWords, calculateOrderTotals, DETRACCION_CATALOG } from "@/lib/order-calculations";
import type {
  AppUser,
  DetraccionType,
  DocumentStatus,
  OrderFormValues,
  OrderItem,
  OrderRecord,
  ProviderSummary,
  SystemSettings,
} from "@/modules/orders/types";

const emptyOrder: OrderFormValues = {
  type: "OC",
  userId: "",
  workUnit: "",
  providerId: "",
  status: "Borrador",
  currency: "PEN",
  items: [],
  applyRetention: false,
  totalAmount: 0,
  issueDate: "",
  operationType: "ninguna",
  itemsIncludeIgv: false,
};

const statusClass: Record<DocumentStatus, string> = {
  Borrador: "status-pill status-pill--draft",
  "Pendiente de aprobacion": "status-pill status-pill--pending",
  Aprobado: "status-pill status-pill--approved",
  Emitido: "status-pill status-pill--issued",
  Anulado: "status-pill status-pill--cancelled",
};

const AREA_NAMES: Record<string, string> = {
  L: "Logística",
  C: "Contabilidad",
  E: "Equipos",
  F: "Finanzas",
};

function sanitizeMoneyInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const [integerPart = "", decimalPart = ""] = normalized.split(".");
  const safeInteger = integerPart.replace(/^0+(?=\d)/, "");

  if (!normalized) {
    return "";
  }

  if (normalized.includes(".")) {
    return `${safeInteger || "0"}.${decimalPart.slice(0, 2)}`;
  }

  return safeInteger || "0";
}

function parseMoneyInput(value: string) {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimalInput(value: number, decimals = 2) {
  if (!value) {
    return "";
  }

  return value.toFixed(decimals);
}

function buildItemDrafts(items: OrderItem[]) {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        quantity: item.quantity ? String(item.quantity) : "",
        unitPrice: formatDecimalInput(item.unitPrice),
      },
    ]),
  );
}

function createEmptyItem(): OrderItem {
  return {
    id: crypto.randomUUID(),
    quantity: 1,
    description: "",
    unitPrice: 0,
    amount: 0,
  };
}

function recalculateItem(item: OrderItem): OrderItem {
  const quantity = Number(item.quantity) || 0;
  const unitPrice = Number(item.unitPrice) || 0;

  return {
    ...item,
    quantity,
    unitPrice,
    amount: Number((quantity * unitPrice).toFixed(2)),
  };
}

function normalizeStoredOrder(order: OrderRecord): OrderRecord {
  const items =
    order.items && order.items.length > 0
      ? order.items.map(recalculateItem)
      : order.totalAmount > 0
        ? [
            {
              id: crypto.randomUUID(),
              quantity: 1,
              description: "Item migrado",
              unitPrice: Number(order.totalAmount.toFixed(2)),
              amount: Number(order.totalAmount.toFixed(2)),
            },
          ]
        : [];

  return {
    ...order,
    items,
    operationType: order.operationType ?? "ninguna",
    detraccionAmount: order.detraccionAmount ?? 0,
    detraccionRate: order.detraccionRate ?? 0,
    itemsIncludeIgv: order.itemsIncludeIgv ?? false,
  };
}

function getOrderSequence(code: string) {
  const match = code.match(/(\d{3})$/);
  return match ? Number(match[1]) : 0;
}

function sortOrdersDescending(items: OrderRecord[]) {
  return items.slice().sort((left, right) => {
    const dateDiff =
      new Date(right.issueDate).getTime() - new Date(left.issueDate).getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return getOrderSequence(right.code) - getOrderSequence(left.code);
  });
}

export function OrdersManager({
  initialOrders,
  initialProviders,
  currentUser,
  settings,
}: {
  initialOrders: OrderRecord[];
  initialProviders: ProviderSummary[];
  currentUser: AppUser;
  settings: SystemSettings;
}) {
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    initialOrders.map((order) => normalizeStoredOrder(order)),
  );
  const [providers, setProviders] = useState<ProviderSummary[]>(initialProviders);
  const [open, setOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [form, setForm] = useState<OrderFormValues>(emptyOrder);
  const [itemDrafts, setItemDrafts] = useState<
    Record<string, { quantity: string; unitPrice: string }>
  >({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);

  async function loadData() {
    const [ordersResponse, providersResponse] = await Promise.all([
      fetch("/api/orders", { cache: "no-store" }),
      fetch("/api/providers", { cache: "no-store" }),
    ]);

    const [ordersData, providersData] = (await Promise.all([
      ordersResponse.json(),
      providersResponse.json(),
    ])) as [OrderRecord[], ProviderSummary[]];

    setOrders(ordersData.map((order) => normalizeStoredOrder(order)));
    setProviders(providersData);
  }
  const visibleOrders =
    currentUser?.role === "ADMIN" || !currentUser
      ? orders
      : orders.filter((order) => order.userId === currentUser.id);

  const filteredOrders = sortOrdersDescending(visibleOrders).filter((order) => {
    const q = searchQuery.toLowerCase();
    if (q && !order.code.toLowerCase().includes(q) && !order.providerName.toLowerCase().includes(q)) return false;
    if (filterArea && order.area !== filterArea) return false;
    if (filterStatus && order.status !== filterStatus) return false;
    if (filterType && order.type !== filterType) return false;
    return true;
  });
  const { pageItems: sortedVisibleOrders, totalPages } = usePagination(filteredOrders, page);

  function openCreateModal() {
    if (!currentUser || currentUser.role === "ADMIN") {
      setError("Debes iniciar sesion con un usuario de area para registrar ordenes.");
      return;
    }

    setEditingOrder(null);
    setForm({
      ...emptyOrder,
      userId: currentUser.id,
      items: [createEmptyItem()],
      applyRetention: false,
      operationType: "ninguna",
      issueDate: new Date().toISOString().slice(0, 10),
    });
    setItemDrafts({});
    setError("");
    setOpen(true);
  }

  function openEditModal(order: OrderRecord) {
    setEditingOrder(order);
    setForm({
      type: order.type,
      userId: order.userId,
      workUnit: order.workUnit,
      providerId: order.providerId,
      status: order.status,
      currency: order.currency,
      items: order.items.map((item) => ({ ...item })),
      applyRetention: order.applyRetention,
      totalAmount: order.totalAmount,
      issueDate: order.issueDate,
      operationType: order.operationType ?? "ninguna",
      itemsIncludeIgv: order.itemsIncludeIgv ?? false,
    });
    setItemDrafts(buildItemDrafts(order.items));
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditingOrder(null);
    setItemDrafts({});
    setError("");
  }

  function setItems(nextItems: OrderItem[]) {
    const normalizedItems = nextItems.map(recalculateItem);
    const selectedProvider = providers.find((p) => p.id === form.providerId);
    const totals = calculateOrderTotals(normalizedItems, settings, {
      operationType: form.operationType,
      orderType: form.type,
      isRetentionAgent: selectedProvider?.isRetentionAgent ?? false,
      itemsIncludeIgv: form.itemsIncludeIgv,
    });

    setForm((current) => ({
      ...current,
      items: normalizedItems,
      applyRetention: totals.applyRetention,
      totalAmount: totals.totalAmount,
    }));
  }

  function updateItem(itemId: string, patch: Partial<OrderItem>) {
    setItems(
      form.items.map((item) =>
        item.id === itemId ? recalculateItem({ ...item, ...patch }) : item,
      ),
    );
  }

  function addItem() {
    const nextItem = createEmptyItem();
    setItems([...form.items, nextItem]);
    setItemDrafts((current) => ({
      ...current,
      [nextItem.id]: {
        quantity: "1",
        unitPrice: "",
      },
    }));
  }

  function removeItem(itemId: string) {
    setItems(form.items.filter((item) => item.id !== itemId));
    setItemDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[itemId];
      return nextDrafts;
    });
  }

  function updateItemDraft(
    itemId: string,
    field: "quantity" | "unitPrice",
    value: string,
  ) {
    const sanitized = sanitizeMoneyInput(value);

    setItemDrafts((current) => ({
      ...current,
      [itemId]: {
        quantity:
          field === "quantity"
            ? sanitized
            : current[itemId]?.quantity ?? buildItemDrafts(form.items)[itemId]?.quantity ?? "",
        unitPrice:
          field === "unitPrice"
            ? sanitized
            : current[itemId]?.unitPrice ?? buildItemDrafts(form.items)[itemId]?.unitPrice ?? "",
      },
    }));

    updateItem(itemId, {
      [field]: parseMoneyInput(sanitized),
    });
  }

  function normalizeItemDraft(itemId: string, field: "quantity" | "unitPrice") {
    const item = form.items.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

    setItemDrafts((current) => ({
      ...current,
      [itemId]: {
        quantity:
          field === "quantity"
            ? (item.quantity ? String(item.quantity) : "")
            : current[itemId]?.quantity ?? "",
        unitPrice:
          field === "unitPrice"
            ? formatDecimalInput(item.unitPrice)
            : current[itemId]?.unitPrice ?? "",
      },
    }));
  }

  const selectedProvider = providers.find((p) => p.id === form.providerId);
  const totals = calculateOrderTotals(form.items, settings, {
    operationType: form.operationType,
    orderType: form.type,
    isRetentionAgent: selectedProvider?.isRetentionAgent ?? false,
    itemsIncludeIgv: form.itemsIncludeIgv,
  });
  const amountInWords = amountToWords(totals.payableAmount, form.currency);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editingOrder ? `/api/orders/${editingOrder.id}` : "/api/orders";
    const method = editingOrder ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setError(payload.message ?? "No se pudo guardar la orden.");
      setSubmitting(false);
      return;
    }

    await loadData();
    setSubmitting(false);
    closeModal();
  }

  async function handleAnular(id: string) {
    const confirmed = window.confirm("¿Deseas anular esta orden? El número quedará reservado y no podrá reutilizarse.");

    if (!confirmed) {
      return;
    }

    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    await loadData();
  }

  return (
    <>
      <div className="orders-header">
        <h1 className="orders-header__title">Órdenes</h1>
        <div className="orders-header__actions">
          {error && !open ? <p className="form-error">{error}</p> : null}
          <button type="button" className="button-primary" onClick={openCreateModal}>
            + Crear
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <input
          className="field filters-bar__search"
          placeholder="Buscar por código o proveedor"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
        />
        <select
          className="field filters-bar__select"
          value={filterArea}
          onChange={(e) => { setFilterArea(e.target.value); setPage(1); }}
        >
          <option value="">Área</option>
          <option value="L">Logística</option>
          <option value="C">Contabilidad</option>
          <option value="E">Equipos</option>
          <option value="F">Finanzas</option>
        </select>
        <select
          className="field filters-bar__select"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">Estado</option>
          <option value="Borrador">Borrador</option>
          <option value="Emitido">Emitido</option>
          <option value="Anulado">Anulado</option>
        </select>
        <select
          className="field filters-bar__select"
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
        >
          <option value="">Tipo</option>
          <option value="OC">Orden de compra</option>
          <option value="OS">Orden de servicio</option>
        </select>
      </div>

      <div className="table-card">
        {sortedVisibleOrders.length === 0 ? (
          <EmptyState
            title="No hay ordenes registradas"
            description='Usa el botón "+ Crear" para registrar tu primera orden.'
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Proveedor</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedVisibleOrders.map((order) => (
                <tr key={order.id}>
                  <td className="text-strong">{order.code}</td>
                  <td className="text-strong">{order.providerName}</td>
                  <td>{AREA_NAMES[order.area] ?? order.area}</td>
                  <td>
                    <span className={statusClass[order.status]}>{order.status}</span>
                  </td>
                  <td className="text-strong">
                    {order.currency === "PEN" ? "S/" : "$"} {order.totalAmount.toFixed(2)}
                  </td>
                  <td>{order.issueDate}</td>
                  <td>
                    <div className="table-actions">
                      <Link
                        href={`/ordenes/${order.id}/pdf`}
                        className="btn-action"
                        target="_blank"
                      >
                        PDF
                      </Link>
                      {order.status === "Borrador" && (
                        <>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => openEditModal(order)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action--danger"
                            onClick={() => handleAnular(order.id)}
                          >
                            Anular
                          </button>
                        </>
                      )}
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
        title={editingOrder ? `Editar orden ${editingOrder.code}` : "Nueva orden"}
        open={open}
        onClose={closeModal}
        wide
      >
        <form className="oform" onSubmit={handleSubmit}>
          {/* ── Main column ── */}
          <div className="oform__main">
            {/* Top fields */}
            <div className="oform__fields">
              <label className="ofield">
                <span>Tipo</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as OrderFormValues["type"],
                    }))
                  }
                >
                  <option value="OC">Orden de compra</option>
                  <option value="OS">Orden de servicio</option>
                </select>
              </label>
              <label className="ofield">
                <span>Solicitante</span>
                <input value={currentUser?.name ?? ""} disabled />
              </label>
              <label className="ofield">
                <span>Fecha</span>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, issueDate: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="ofield ofield--span2">
                <span>Proveedor</span>
                <select
                  value={form.providerId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, providerId: event.target.value }))
                  }
                  required
                >
                  <option value="">Selecciona un proveedor</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.businessName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ofield">
                <span>Moneda</span>
                <select
                  value={form.currency}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currency: event.target.value as OrderFormValues["currency"],
                    }))
                  }
                >
                  <option value="PEN">PEN — Soles</option>
                  <option value="USD">USD — Dólares</option>
                </select>
              </label>
              <label className="ofield ofield--span2">
                <span>Unidad / Obra</span>
                <input
                  value={form.workUnit}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, workUnit: event.target.value }))
                  }
                  placeholder="Ej: PORACOTA"
                />
              </label>
              <label className="ofield">
                <span>Estado</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as OrderFormValues["status"],
                    }))
                  }
                >
                  <option value="Borrador">Borrador</option>
                  <option value="Emitido">Emitido</option>
                </select>
              </label>
            </div>

            {/* IGV toggle */}
            <label className="oform__igv-check">
              <input
                type="checkbox"
                checked={form.itemsIncludeIgv}
                onChange={(event) =>
                  setForm((current) => ({ ...current, itemsIncludeIgv: event.target.checked }))
                }
              />
              Los precios incluyen IGV
            </label>

            {/* Detraction + rule */}
            <div className="oform__tax">
              <label className="ofield">
                <span>Tipo de operación (Detracción)</span>
                <select
                  value={form.operationType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      operationType: event.target.value as DetraccionType,
                    }))
                  }
                >
                  <option value="ninguna">Ninguna</option>
                  <option value="instalacion">Servicio de instalación — 12% (umbral S/700)</option>
                  <option value="alquiler">Servicio de alquiler — 10% (umbral S/700)</option>
                  <option value="transporte">Servicio de transporte — 4% (umbral S/400)</option>
                  <option value="madera">Compra de madera — 4% (umbral S/700)</option>
                </select>
              </label>
              <div className="oform__tax-info">
                <strong>Regla:</strong>
                <p>
                  IGV: {settings.igvRate}% | Retención: {settings.retentionRate}%<br />
                  Aplica si el monto supera el umbral y el proveedor no es agente de retención.
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="oform__items">
              <div className="oform__items-header">
                <h4 className="oform__items-title">Items de la orden</h4>
                <button type="button" className="button-primary" onClick={addItem}>
                  + Agregar
                </button>
              </div>
              {form.items.length === 0 ? (
                <p className="oform__items-empty">
                  No hay items. Usa "+ Agregar" para continuar.
                </p>
              ) : (
                <table className="oform__items-table">
                  <thead>
                    <tr>
                      <th style={{ width: "12%" }}>Cant.</th>
                      <th>Descripción</th>
                      <th style={{ width: "18%" }}>Precio</th>
                      <th style={{ width: "16%" }}>Importe</th>
                      <th style={{ width: "8%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            className="oform__item-input"
                            type="text"
                            inputMode="decimal"
                            value={itemDrafts[item.id]?.quantity ?? (item.quantity ? String(item.quantity) : "")}
                            onChange={(event) =>
                              updateItemDraft(item.id, "quantity", event.target.value)
                            }
                            onBlur={() => normalizeItemDraft(item.id, "quantity")}
                            placeholder="1"
                          />
                        </td>
                        <td>
                          <input
                            className="oform__item-input"
                            value={item.description}
                            onChange={(event) =>
                              updateItem(item.id, { description: event.target.value })
                            }
                            placeholder={`Item ${index + 1}`}
                          />
                        </td>
                        <td>
                          <input
                            className="oform__item-input"
                            type="text"
                            inputMode="decimal"
                            value={itemDrafts[item.id]?.unitPrice ?? formatDecimalInput(item.unitPrice)}
                            onChange={(event) =>
                              updateItemDraft(item.id, "unitPrice", event.target.value)
                            }
                            onBlur={() => normalizeItemDraft(item.id, "unitPrice")}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="oform__item-amount">
                          {form.currency === "PEN" ? "S/" : "$"} {item.amount.toFixed(2)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="button-link button-link--danger"
                            onClick={() => removeItem(item.id)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="oform__sidebar">
            <div className="oform__summary">
              <h3 className="oform__summary-title">Resumen</h3>
              <div className="oform__summary-line">
                <span>Subtotal</span>
                <span>{form.currency === "PEN" ? "S/" : "$"} {totals.subtotalAmount.toFixed(2)}</span>
              </div>
              <div className="oform__summary-line">
                <span>IGV ({settings.igvRate}%)</span>
                <span>{form.currency === "PEN" ? "S/" : "$"} {totals.igvAmount.toFixed(2)}</span>
              </div>
              {totals.applyDetraccion ? (
                <div className="oform__summary-line">
                  <span>Detracción {totals.detraccionRate}%</span>
                  <span>− {form.currency === "PEN" ? "S/" : "$"} {totals.detraccionAmount.toFixed(2)}</span>
                </div>
              ) : totals.applyRetention ? (
                <div className="oform__summary-line">
                  <span>Retención {settings.retentionRate}%</span>
                  <span>− {form.currency === "PEN" ? "S/" : "$"} {totals.retentionAmount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="oform__summary-line oform__summary-line--total">
                <span>Total</span>
                <span>{form.currency === "PEN" ? "S/" : "$"} {totals.payableAmount.toFixed(2)}</span>
              </div>
              <p className="oform__words">{amountInWords}</p>
            </div>

            {providers.length === 0 ? (
              <p className="oform__hint">Registra un proveedor primero.</p>
            ) : null}
            {currentUser?.role === "ADMIN" ? (
              <p className="oform__hint">Inicia sesion con un usuario de area.</p>
            ) : null}
            {error ? <p className="oform__error">{error}</p> : null}

            <div className="oform__sidebar-actions">
              <button
                type="submit"
                className="button-primary"
                style={{ width: "100%" }}
                disabled={submitting || providers.length === 0 || currentUser?.role === "ADMIN"}
              >
                {submitting ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                className="button-secondary"
                style={{ width: "100%" }}
                onClick={closeModal}
              >
                Cancelar
              </button>
            </div>
          </aside>
        </form>
      </Modal>
    </>
  );
}

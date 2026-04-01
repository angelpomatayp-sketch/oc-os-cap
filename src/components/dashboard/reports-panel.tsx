"use client";

import { useMemo, useState } from "react";

import type { OrderRecord } from "@/modules/orders/types";

const AREA_NAMES: Record<string, string> = {
  L: "Logística",
  C: "Contabilidad",
  E: "Equipos",
  F: "Finanzas",
  P: "Recursos Humanos",
};

type Totals = {
  ocPen: number;
  osPen: number;
  ocUsd: number;
  osUsd: number;
};

function sumTotals(totals: Totals) {
  return {
    pen: totals.ocPen + totals.osPen,
    usd: totals.ocUsd + totals.osUsd,
  };
}

function formatTotals(pen: number, usd: number) {
  return `S/ ${pen.toFixed(2)} | $ ${usd.toFixed(2)}`;
}

export function ReportsPanel({ orders }: { orders: OrderRecord[] }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.status !== "Emitido") {
        return false;
      }

      if (fromDate && order.issueDate < fromDate) {
        return false;
      }

      if (toDate && order.issueDate > toDate) {
        return false;
      }

      return true;
    });
  }, [orders, fromDate, toDate]);

  const areaTotals = useMemo(() => {
    const map = new Map<string, Totals>();
    for (const order of filteredOrders) {
      const current =
        map.get(order.area) ?? { ocPen: 0, osPen: 0, ocUsd: 0, osUsd: 0 };
      const isOc = order.type === "OC";
      const isPen = order.currency === "PEN";
      if (isOc && isPen) current.ocPen += order.payableAmount;
      if (isOc && !isPen) current.ocUsd += order.payableAmount;
      if (!isOc && isPen) current.osPen += order.payableAmount;
      if (!isOc && !isPen) current.osUsd += order.payableAmount;
      map.set(order.area, current);
    }
    return map;
  }, [filteredOrders]);

  const totalSummary = useMemo(() => {
    let ocPen = 0;
    let osPen = 0;
    let ocUsd = 0;
    let osUsd = 0;
    for (const totals of areaTotals.values()) {
      ocPen += totals.ocPen;
      osPen += totals.osPen;
      ocUsd += totals.ocUsd;
      osUsd += totals.osUsd;
    }
    return { ocPen, osPen, ocUsd, osUsd };
  }, [areaTotals]);

  const topAreaPen = useMemo(() => {
    let top: { area: string; amount: number } | null = null;
    for (const [area, totals] of areaTotals.entries()) {
      const total = totals.ocPen + totals.osPen;
      if (!top || total > top.amount) {
        top = { area, amount: total };
      }
    }
    return top;
  }, [areaTotals]);

  const topAreaUsd = useMemo(() => {
    let top: { area: string; amount: number } | null = null;
    for (const [area, totals] of areaTotals.entries()) {
      const total = totals.ocUsd + totals.osUsd;
      if (!top || total > top.amount) {
        top = { area, amount: total };
      }
    }
    return top;
  }, [areaTotals]);

  return (
    <section className="stack">
      <div className="orders-header">
        <div>
          <h3 className="subheading">Reportes por área</h3>
          <p className="subcopy">Solo órdenes emitidas. Totales por área y tipo.</p>
        </div>
      </div>

      <div className="filters-bar">
        <label className="ofield">
          <span>Desde</span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>
        <label className="ofield">
          <span>Hasta</span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>
      </div>

      <section className="metrics-grid">
        <div className="metric-card metric-card--blue">
          <div className="metric-card__row">
            <div className="metric-card__icon">OC</div>
            <div>
              <p className="metric-card__label">Total OC</p>
              <p className="metric-card__value">{formatTotals(totalSummary.ocPen, totalSummary.ocUsd)}</p>
            </div>
          </div>
        </div>
        <div className="metric-card metric-card--green">
          <div className="metric-card__row">
            <div className="metric-card__icon">OS</div>
            <div>
              <p className="metric-card__label">Total OS</p>
              <p className="metric-card__value">{formatTotals(totalSummary.osPen, totalSummary.osUsd)}</p>
            </div>
          </div>
        </div>
        <div className="metric-card metric-card--amber">
          <div className="metric-card__row">
            <div className="metric-card__icon">TOP</div>
            <div>
              <p className="metric-card__label">Área top (PEN)</p>
              <p className="metric-card__value">
                {topAreaPen ? `${AREA_NAMES[topAreaPen.area] ?? topAreaPen.area}` : "-"}
              </p>
              <p className="metric-card__helper">
                {topAreaPen ? `S/ ${topAreaPen.amount.toFixed(2)}` : "Sin datos"}
              </p>
            </div>
          </div>
        </div>
        <div className="metric-card metric-card--red">
          <div className="metric-card__row">
            <div className="metric-card__icon">TOP</div>
            <div>
              <p className="metric-card__label">Área top (USD)</p>
              <p className="metric-card__value">
                {topAreaUsd ? `${AREA_NAMES[topAreaUsd.area] ?? topAreaUsd.area}` : "-"}
              </p>
              <p className="metric-card__helper">
                {topAreaUsd ? `$ ${topAreaUsd.amount.toFixed(2)}` : "Sin datos"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="table-card">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state__title">No hay órdenes emitidas</h3>
            <p className="empty-state__description">Ajusta el rango de fechas.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Área</th>
                <th>OC</th>
                <th>OS</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {[...areaTotals.entries()].map(([area, totals]) => {
                const total = sumTotals(totals);
                return (
                  <tr key={area}>
                    <td className="text-strong">{AREA_NAMES[area] ?? area}</td>
                    <td>{formatTotals(totals.ocPen, totals.ocUsd)}</td>
                    <td>{formatTotals(totals.osPen, totals.osUsd)}</td>
                    <td className="text-strong">{formatTotals(total.pen, total.usd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

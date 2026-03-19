import type { MetricCard as MetricCardType } from "@/modules/orders/types";

export function MetricCard({ label, value, helper, accent, icon }: MetricCardType) {
  return (
    <article className={`metric-card metric-card--${accent}`}>
      <div className="metric-card__row">
        <div className="metric-card__icon">{icon}</div>
        <div>
          <p className="metric-card__label">{label}</p>
          <p className="metric-card__value">{value}</p>
        </div>
      </div>
      <p className="metric-card__helper">{helper}</p>
    </article>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PrintPdfButton } from "@/components/dashboard/print-pdf-button";
import { getCurrentUser } from "@/lib/auth";
import { amountToWords, calculateOrderTotals } from "@/lib/order-calculations";
import { getOrders, getProviders, getSettings } from "@/lib/local-db";

export const dynamic = "force-dynamic";

function formatMoney(currency: "PEN" | "USD", amount: number) {
  return `${currency === "PEN" ? "S/" : "$"} ${amount.toFixed(2)}`;
}

function moneyParts(currency: "PEN" | "USD", amount: number) {
  return {
    symbol: currency === "PEN" ? "S/" : "$",
    value: amount.toFixed(2),
  };
}

export default async function OrderPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const { id } = await params;
  const [orders, providers, settings] = await Promise.all([
    getOrders(),
    getProviders(),
    getSettings(),
  ]);

  const order = orders.find((entry) => entry.id === id);

  if (!order) {
    notFound();
  }

  if (currentUser.role !== "ADMIN" && order.userId !== currentUser.id) {
    notFound();
  }

  const provider = providers.find((entry) => entry.id === order.providerId);

  if (!provider) {
    notFound();
  }

  const totals = calculateOrderTotals(order.items ?? [], settings, order.applyRetention);
  const amountInWords = order.amountInWords || amountToWords(totals.payableAmount, order.currency);
  const subtotal = moneyParts(order.currency, totals.subtotalAmount);
  const igv = moneyParts(order.currency, totals.igvAmount);
  const total = moneyParts(order.currency, totals.totalAmount);
  const retention = moneyParts(order.currency, totals.retentionAmount);
  const payable = moneyParts(order.currency, totals.payableAmount);

  return (
    <div className="print-page">
      <div className="print-toolbar">
        <Link href="/ordenes" className="print-toolbar__link">
          Volver
        </Link>
        <PrintPdfButton />
      </div>

      <article className="order-print">
        <header className="order-print__header">
          <div className="order-print__logo-box">
            <Image
              src="/brand/logo-pacifico.jpeg"
              alt="Pacifico"
              width={180}
              height={70}
              className="order-print__logo"
              style={{ height: "auto" }}
              priority
            />
          </div>
          <div className="order-print__title-box">
            <p className="order-print__title-top">FORMATO</p>
            <h1 className="order-print__title">
              ORDEN DE {order.type === "OC" ? "COMPRA" : "SERVICIO"}
            </h1>
          </div>
          <div className="order-print__meta-box">
            <div className="order-print__meta-row">
              <span className="order-print__meta-label">Codigo:</span>
              <strong className="order-print__meta-value">FR-LOG-03</strong>
            </div>
            <div className="order-print__meta-row">
              <span className="order-print__meta-label">Version:</span>
              <strong className="order-print__meta-value">00</strong>
            </div>
            <div className="order-print__meta-row">
              <span className="order-print__meta-label">Fecha:</span>
              <strong className="order-print__meta-value">{order.issueDate}</strong>
            </div>
          </div>
        </header>

        <section className="order-print__block order-print__block--items">
          <table className="order-print__info-table">
            <colgroup>
              <col className="order-print__info-col order-print__info-col--label-left" />
              <col className="order-print__info-col order-print__info-col--value-left" />
              <col className="order-print__info-col order-print__info-col--label-right" />
              <col className="order-print__info-col order-print__info-col--value-right" />
            </colgroup>
            <tbody>
              <tr>
                <td className="order-print__label">N° orden:</td>
                <td>{order.code}</td>
                <td className="order-print__label order-print__label--right">Unidad/Obra</td>
                <td className="order-print__value-strong">{order.workUnit || "-"}</td>
              </tr>
              <tr>
                <td className="order-print__label">Empresa</td>
                <td>{settings.companyName}</td>
                <td className="order-print__label order-print__label--right">N° RUC</td>
                <td className="order-print__value-strong">{settings.companyRuc}</td>
              </tr>
              <tr>
                <td className="order-print__label">Dirección</td>
                <td>{settings.companyAddress}</td>
                <td className="order-print__label order-print__label--right">Cel./Rpm</td>
                <td>{settings.companyCell || "-"}</td>
              </tr>
              <tr>
                <td className="order-print__label">Contacto</td>
                <td>{order.requester}</td>
                <td className="order-print__label order-print__label--right">Telefono</td>
                <td>{settings.companyPhone || "-"}</td>
              </tr>
              <tr>
                <td className="order-print__label">E - mail</td>
                <td className="order-print__linkish">{settings.companyEmail}</td>
                <td className="order-print__label order-print__label--right order-print__highlight">
                  Fecha emitido
                </td>
                <td className="order-print__value-strong order-print__highlight">{order.issueDate}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="order-print__block">
          <h2 className="order-print__section-title">PROVEEDOR</h2>
          <table className="order-print__info-table">
            <colgroup>
              <col className="order-print__info-col order-print__info-col--label-left" />
              <col className="order-print__info-col order-print__info-col--value-left" />
              <col className="order-print__info-col order-print__info-col--label-right" />
              <col className="order-print__info-col order-print__info-col--value-right" />
            </colgroup>
            <tbody>
              <tr>
                <td className="order-print__label">Empresa</td>
                <td>{provider.businessName}</td>
                <td className="order-print__label order-print__label--right">N° RUC</td>
                <td className="order-print__value-strong">{provider.ruc}</td>
              </tr>
              <tr>
                <td className="order-print__label">Dirección</td>
                <td>{provider.fiscalAddress}</td>
                <td className="order-print__label order-print__label--right">Cotización</td>
                <td>-</td>
              </tr>
              <tr>
                <td className="order-print__label">Contacto</td>
                <td>{provider.contactName || "-"}</td>
                <td className="order-print__label order-print__label--right">Telf./Cel.</td>
                <td>{provider.phone || "-"}</td>
              </tr>
              <tr>
                <td className="order-print__label">E - mail</td>
                <td className="order-print__linkish">{provider.email || "-"}</td>
                <td className="order-print__label order-print__label--right order-print__highlight">
                  Fecha recibido
                </td>
                <td className="order-print__value-strong order-print__highlight">{order.issueDate}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="order-print__block">
          <table className="order-print__items">
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "59%" }} />
              <col style={{ width: "14.5%" }} />
              <col style={{ width: "14.5%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>ITEM</th>
                <th>CANT.</th>
                <th>DESCRIPCION</th>
                <th>PRECIO UNIT.</th>
                <th>IMPORTE</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.quantity}</td>
                  <td>{item.description}</td>
                  <td>{formatMoney(order.currency, item.unitPrice)}</td>
                  <td>{formatMoney(order.currency, item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="order-print__totals-empty"></td>
                <td className="order-print__totals-label">SUB TOTAL</td>
                <td className="order-print__money-cell">
                  <span>{subtotal.symbol}</span>
                  <strong>{subtotal.value}</strong>
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="order-print__totals-empty"></td>
                <td className="order-print__totals-label">IGV {settings.igvRate}%</td>
                <td className="order-print__money-cell">
                  <span>{igv.symbol}</span>
                  <strong>{igv.value}</strong>
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="order-print__totals-empty"></td>
                <td className="order-print__totals-label order-print__totals-label--yellow">TOTAL</td>
                <td className="order-print__totals-value order-print__totals-value--yellow order-print__money-cell">
                  <span>{total.symbol}</span>
                  <strong>{total.value}</strong>
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="order-print__totals-empty"></td>
                <td className="order-print__totals-label">RETENCIÓN {settings.retentionRate}%</td>
                <td className="order-print__money-cell">
                  <span>{retention.symbol}</span>
                  <strong>{retention.value}</strong>
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="order-print__totals-empty"></td>
                <td className="order-print__totals-label order-print__totals-label--green">
                  TOTAL A PAGAR
                </td>
                <td className="order-print__totals-value order-print__totals-value--green order-print__money-cell">
                  <span>{payable.symbol}</span>
                  <strong>{payable.value}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="order-print__block order-print__amount-words">
          <span>SON:</span>
          <strong>{amountInWords}</strong>
        </section>

        <section className="order-print__block">
          <h2 className="order-print__section-title">NOTAS COMERCIALES</h2>
          <table className="order-print__notes-table">
            <tbody>
              <tr>
                <td>Forma de pago</td>
                <td>DEPOSITO</td>
              </tr>
              <tr>
                <td>Valor monetario</td>
                <td>{order.currency === "PEN" ? "SOLES" : "DOLARES"}</td>
              </tr>
              <tr>
                <td>Tiempo de entrega</td>
                <td>Inmediata</td>
              </tr>
              <tr>
                <td>Lugar de entrega</td>
                <td>{order.workUnit || "-"}</td>
              </tr>
              <tr>
                <td>CTA.y/o CCI- Banco</td>
                <td>
                  {[provider.bankAccount, provider.bankCci, provider.bankName]
                    .filter(Boolean)
                    .join(" - ") || "-"}
                </td>
              </tr>
              <tr>
                <td>Cta. Detracciones</td>
                <td>{provider.detraccionAccount || "-"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer className="order-print__footer">
          <p>Atentamente,</p>
          <p>{settings.companyContact}</p>
          <p>{settings.companyName}</p>
        </footer>
      </article>
    </div>
  );
}

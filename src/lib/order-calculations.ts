import type { CurrencyCode, OrderItem, SystemSettings } from "@/modules/orders/types";

const UNITS = [
  "",
  "UNO",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
];

const TEENS = [
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISEIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
];

const TENS = [
  "",
  "",
  "VEINTE",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];

const HUNDREDS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

function convertTens(value: number): string {
  if (value < 10) {
    return UNITS[value];
  }

  if (value < 20) {
    return TEENS[value - 10];
  }

  if (value < 30) {
    return value === 20 ? "VEINTE" : `VEINTI${UNITS[value - 20].toLowerCase()}`.toUpperCase();
  }

  const ten = Math.floor(value / 10);
  const unit = value % 10;

  return unit === 0 ? TENS[ten] : `${TENS[ten]} Y ${UNITS[unit]}`;
}

function convertHundreds(value: number): string {
  if (value === 0) {
    return "";
  }

  if (value === 100) {
    return "CIEN";
  }

  const hundred = Math.floor(value / 100);
  const remainder = value % 100;
  const hundredText = HUNDREDS[hundred];
  const tensText = convertTens(remainder);

  return [hundredText, tensText].filter(Boolean).join(" ").trim();
}

function convertThousands(value: number): string {
  if (value < 1000) {
    return convertHundreds(value);
  }

  const thousands = Math.floor(value / 1000);
  const remainder = value % 1000;
  const thousandsText =
    thousands === 1 ? "MIL" : `${convertHundreds(thousands)} MIL`.trim();
  const remainderText = convertHundreds(remainder);

  return [thousandsText, remainderText].filter(Boolean).join(" ").trim();
}

function convertMillions(value: number): string {
  if (value < 1000000) {
    return convertThousands(value);
  }

  const millions = Math.floor(value / 1000000);
  const remainder = value % 1000000;
  const millionsText =
    millions === 1
      ? "UN MILLON"
      : `${convertThousands(millions)} MILLONES`.trim();
  const remainderText = convertThousands(remainder);

  return [millionsText, remainderText].filter(Boolean).join(" ").trim();
}

export function amountToWords(amount: number, currency: CurrencyCode) {
  const safeAmount = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  const integerPart = Math.floor(safeAmount);
  const decimals = Math.round((safeAmount - integerPart) * 100);
  const integerText = integerPart === 0 ? "CERO" : convertMillions(integerPart);
  const currencyLabel = currency === "PEN" ? "SOLES" : "DOLARES";

  return `${integerText} CON ${String(decimals).padStart(2, "0")}/100 ${currencyLabel}`;
}

export function calculateOrderTotals(
  items: OrderItem[],
  settings: Pick<SystemSettings, "igvRate" | "retentionRate" | "retentionEnabled" | "retentionThreshold">,
  applyRetention?: boolean,
) {
  const subtotalAmount = Number(
    items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2),
  );
  const igvAmount = Number((subtotalAmount * ((settings.igvRate || 0) / 100)).toFixed(2));
  const totalAmount = Number((subtotalAmount + igvAmount).toFixed(2));
  const retentionAllowed =
    settings.retentionEnabled && totalAmount >= (settings.retentionThreshold || 0);
  const effectiveRetention = applyRetention ?? retentionAllowed;
  const rawRetentionAmount = effectiveRetention
    ? totalAmount * ((settings.retentionRate || 0) / 100)
    : 0;
  const retentionAmount = effectiveRetention
    ? Number(Math.round(rawRetentionAmount).toFixed(2))
    : 0;
  const payableAmount = Number((totalAmount - retentionAmount).toFixed(2));

  return {
    subtotalAmount,
    igvAmount,
    totalAmount,
    retentionAllowed,
    applyRetention: effectiveRetention,
    retentionAmount,
    payableAmount,
  };
}

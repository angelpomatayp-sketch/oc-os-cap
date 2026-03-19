import type { CurrencyCode, DetraccionType, OrderItem, SystemSettings } from "@/modules/orders/types";

export const DETRACCION_CATALOG: Record<
  Exclude<DetraccionType, "ninguna">,
  { label: string; rate: number; threshold: number }
> = {
  instalacion: { label: "Servicio de instalación", rate: 12, threshold: 700 },
  alquiler:    { label: "Servicio de alquiler",    rate: 10, threshold: 700 },
  transporte:  { label: "Servicio de transporte",  rate:  4, threshold: 400 },
  madera:      { label: "Compra de madera",         rate:  4, threshold: 700 },
};

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
  options: {
    operationType?: DetraccionType;
    orderType?: "OC" | "OS";
    isRetentionAgent?: boolean;
    manualRetention?: boolean;
    itemsIncludeIgv?: boolean;
  } = {},
) {
  const itemsSum = Number(
    items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2),
  );
  const igvRate = settings.igvRate || 0;

  let subtotalAmount: number;
  let igvAmount: number;
  let totalAmount: number;

  if (options.itemsIncludeIgv) {
    // Items already include IGV → back-calculate subtotal
    totalAmount = itemsSum;
    subtotalAmount = Number((totalAmount / (1 + igvRate / 100)).toFixed(2));
    igvAmount = Number((totalAmount - subtotalAmount).toFixed(2));
  } else {
    subtotalAmount = itemsSum;
    igvAmount = Number((subtotalAmount * (igvRate / 100)).toFixed(2));
    totalAmount = Number((subtotalAmount + igvAmount).toFixed(2));
  }

  const {
    operationType = "ninguna",
    orderType = "OC",
    isRetentionAgent = false,
    manualRetention,
  } = options;

  // Detraccion logic
  let detraccionRate = 0;
  let detraccionAmount = 0;
  let applyDetraccion = false;

  if (operationType !== "ninguna") {
    const rule = DETRACCION_CATALOG[operationType];
    if (rule && totalAmount > rule.threshold) {
      detraccionRate = rule.rate;
      detraccionAmount = Number((totalAmount * (rule.rate / 100)).toFixed(2));
      applyDetraccion = true;
    }
  }

  // Retention logic — only when no detraction, order is OC, and provider is not retention agent
  let retentionAmount = 0;
  let applyRetention = false;

  if (!applyDetraccion) {
    const retentionAllowed =
      settings.retentionEnabled &&
      orderType === "OC" &&
      !isRetentionAgent &&
      totalAmount >= (settings.retentionThreshold || 0);
    applyRetention = manualRetention ?? retentionAllowed;
    const rawRetentionAmount = applyRetention
      ? totalAmount * ((settings.retentionRate || 0) / 100)
      : 0;
    retentionAmount = applyRetention
      ? Number(Math.round(rawRetentionAmount).toFixed(2))
      : 0;
  }

  const payableAmount = Number((totalAmount - detraccionAmount - retentionAmount).toFixed(2));

  return {
    subtotalAmount,
    igvAmount,
    totalAmount,
    applyDetraccion,
    detraccionRate,
    detraccionAmount,
    applyRetention,
    retentionAmount,
    payableAmount,
  };
}

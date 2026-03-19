import type {
  DocumentSummary,
  MetricCard,
  ProviderSummary,
} from "@/modules/orders/types";

export const metrics: MetricCard[] = [
  {
    label: "Proveedores activos",
    value: "0",
    helper: "Sin registros",
    accent: "blue",
    icon: "PR",
  },
  {
    label: "Ordenes de compra",
    value: "0",
    helper: "Sin registros",
    accent: "amber",
    icon: "OC",
  },
  {
    label: "Ordenes de servicio",
    value: "0",
    helper: "Sin registros",
    accent: "green",
    icon: "OS",
  },
  {
    label: "Pendientes",
    value: "0",
    helper: "Sin registros",
    accent: "red",
    icon: "AP",
  },
];

export const providers: ProviderSummary[] = [];

export const documents: DocumentSummary[] = [];

export type RoleCode = "ADMIN" | "L" | "C" | "E" | "F";

export type DocumentType = "OC" | "OS";

export type DocumentStatus =
  | "Borrador"
  | "Pendiente de aprobacion"
  | "Aprobado"
  | "Emitido"
  | "Anulado";

export type CurrencyCode = "PEN" | "USD";

export type DetraccionType = "ninguna" | "instalacion" | "alquiler" | "transporte" | "madera";

export type SystemSettings = {
  companyName: string;
  companyRuc: string;
  companyAddress: string;
  companyContact: string;
  companyEmail: string;
  companyPhone: string;
  companyCell: string;
  igvRate: number;
  retentionRate: number;
  retentionEnabled: boolean;
  retentionThreshold: number;
};

export type ProviderSummary = {
  id: string;
  businessName: string;
  ruc: string;
  fiscalAddress: string;
  contactName: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  bankCci: string;
  detraccionAccount: string;
  isRetentionAgent: boolean;
};

export type DocumentSummary = {
  id: string;
  code: string;
  type: DocumentType;
  providerName: string;
  area: Exclude<RoleCode, "ADMIN">;
  requester: string;
  status: DocumentStatus;
  currency: CurrencyCode;
  totalAmount: number;
  issueDate: string;
};

export type ProviderFormValues = Omit<ProviderSummary, "id">;

export type AppUser = {
  id: string;
  name: string;
  role: RoleCode;
  email: string;
};

export type UserRecord = AppUser & {
  passwordHash: string;
};

export type UserFormValues = Omit<AppUser, "id"> & {
  password: string;
};

export type OrderItem = {
  id: string;
  quantity: number;
  description: string;
  unitPrice: number;
  amount: number;
};

export type OrderRecord = {
  id: string;
  code: string;
  type: DocumentType;
  area: Exclude<RoleCode, "ADMIN">;
  userId: string;
  userName: string;
  workUnit: string;
  providerId: string;
  providerName: string;
  requester: string;
  status: DocumentStatus;
  currency: CurrencyCode;
  items: OrderItem[];
  subtotalAmount: number;
  igvAmount: number;
  retentionAmount: number;
  payableAmount: number;
  applyRetention: boolean;
  amountInWords: string;
  totalAmount: number;
  issueDate: string;
  operationType: DetraccionType;
  detraccionAmount: number;
  detraccionRate: number;
};

export type OrderFormValues = {
  type: DocumentType;
  userId: string;
  workUnit: string;
  providerId: string;
  status: DocumentStatus;
  currency: CurrencyCode;
  items: OrderItem[];
  applyRetention: boolean;
  totalAmount: number;
  issueDate: string;
  operationType: DetraccionType;
};

export type MetricCard = {
  label: string;
  value: string;
  helper: string;
  accent: "blue" | "amber" | "green" | "red";
  icon: string;
};

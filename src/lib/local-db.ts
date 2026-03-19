import "server-only";

import {
  CurrencyCode,
  DocumentStatus,
  DocumentType,
  Prisma,
  Role,
} from "@prisma/client";

import { hashPassword } from "@/lib/auth-crypto";
import { prisma } from "@/lib/prisma";
import type {
  OrderRecord,
  ProviderSummary,
  SystemSettings,
  UserRecord,
} from "@/modules/orders/types";

const defaultSettings: SystemSettings = {
  companyName: "CONTRATISTAS ASOCIADOS PACIFICO SRL",
  companyRuc: "20487244423",
  companyAddress: 'UVC 178 SECTOR 037 LT 5B ZONA "O" PROY. ESP. HUAYCAN ATE - LIMA',
  companyContact: "ZENAIDA SANTIAGO JAVIER",
  companyEmail: "zenaida.santiago@pacifico.pe",
  companyPhone: "064-586932",
  companyCell: "995834121",
  igvRate: 18,
  retentionRate: 3,
  retentionEnabled: true,
  retentionThreshold: 700,
};

const defaultPasswordHash = hashPassword("Pacifico2026*");

const defaultUsers: UserRecord[] = [
  {
    id: "user-admin",
    name: "Admin Sistema",
    role: "ADMIN",
    email: "admin@pacifico.local",
    passwordHash: defaultPasswordHash,
  },
  {
    id: "user-l",
    name: "Usuario Logistica",
    role: "L",
    email: "logistica@pacifico.local",
    passwordHash: defaultPasswordHash,
  },
  {
    id: "user-c",
    name: "Usuario Contabilidad",
    role: "C",
    email: "contabilidad@pacifico.local",
    passwordHash: defaultPasswordHash,
  },
  {
    id: "user-e",
    name: "Usuario Equipos",
    role: "E",
    email: "equipos@pacifico.local",
    passwordHash: defaultPasswordHash,
  },
  {
    id: "user-f",
    name: "Usuario Finanzas",
    role: "F",
    email: "finanzas@pacifico.local",
    passwordHash: defaultPasswordHash,
  },
];

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}

function toDbRole(role: UserRecord["role"]) {
  return role as Role;
}

function toDbType(type: OrderRecord["type"]) {
  return type as DocumentType;
}

function toDbCurrency(currency: OrderRecord["currency"]) {
  return currency as CurrencyCode;
}

function toDbStatus(status: OrderRecord["status"]) {
  const map: Record<OrderRecord["status"], DocumentStatus> = {
    Borrador: "BORRADOR",
    "Pendiente de aprobacion": "PENDIENTE_APROBACION",
    Aprobado: "APROBADO",
    Emitido: "EMITIDO",
    Anulado: "ANULADO",
  };

  return map[status];
}

function fromDbStatus(status: DocumentStatus): OrderRecord["status"] {
  const map: Record<DocumentStatus, OrderRecord["status"]> = {
    BORRADOR: "Borrador",
    PENDIENTE_APROBACION: "Pendiente de aprobacion",
    APROBADO: "Aprobado",
    EMITIDO: "Emitido",
    ANULADO: "Anulado",
  };

  return map[status];
}

function mapProvider(provider: {
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
}) {
  return {
    id: provider.id,
    businessName: provider.businessName,
    ruc: provider.ruc,
    fiscalAddress: provider.fiscalAddress,
    contactName: provider.contactName,
    email: provider.email,
    phone: provider.phone,
    bankName: provider.bankName,
    bankAccount: provider.bankAccount,
    bankCci: provider.bankCci,
    detraccionAccount: provider.detraccionAccount,
  } satisfies ProviderSummary;
}

function mapUser(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
  } satisfies UserRecord;
}

function mapOrder(
  order: Prisma.OrderGetPayload<{
    include: {
      user: true;
      provider: true;
      items: { orderBy: { position: "asc" } };
    };
  }>,
) {
  return {
    id: order.id,
    code: order.code,
    type: order.type,
    area: order.area === "ADMIN" ? "L" : order.area,
    userId: order.userId,
    userName: order.user.name,
    workUnit: order.workUnit,
    providerId: order.providerId,
    providerName: order.provider.businessName,
    requester: order.requester,
    status: fromDbStatus(order.status),
    currency: order.currency,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: toNumber(item.quantity),
      description: item.description,
      unitPrice: toNumber(item.unitPrice),
      amount: toNumber(item.amount),
    })),
    subtotalAmount: toNumber(order.subtotalAmount),
    igvAmount: toNumber(order.igvAmount),
    retentionAmount: toNumber(order.retentionAmount),
    payableAmount: toNumber(order.payableAmount),
    applyRetention: order.applyRetention,
    amountInWords: order.amountInWords,
    totalAmount: toNumber(order.totalAmount),
    issueDate: toIsoDate(order.issueDate),
  } satisfies OrderRecord;
}

async function ensureDefaults() {
  const [userCount, settingsCount] = await Promise.all([
    prisma.user.count(),
    prisma.systemSetting.count(),
  ]);

  if (userCount === 0) {
    await prisma.user.createMany({
      data: defaultUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: toDbRole(user.role),
      })),
    });
  }

  if (settingsCount === 0) {
    await prisma.systemSetting.create({
      data: {
        id: 1,
        companyName: defaultSettings.companyName,
        companyRuc: defaultSettings.companyRuc,
        companyAddress: defaultSettings.companyAddress,
        companyContact: defaultSettings.companyContact,
        companyEmail: defaultSettings.companyEmail,
        companyPhone: defaultSettings.companyPhone,
        companyCell: defaultSettings.companyCell,
        igvRate: new Prisma.Decimal(defaultSettings.igvRate),
        retentionRate: new Prisma.Decimal(defaultSettings.retentionRate),
        retentionEnabled: defaultSettings.retentionEnabled,
        retentionThreshold: new Prisma.Decimal(defaultSettings.retentionThreshold),
      },
    });
  }
}

export async function getProviders() {
  await ensureDefaults();
  const providers = await prisma.provider.findMany({
    orderBy: { businessName: "asc" },
  });

  return providers.map(mapProvider);
}

export async function saveProviders(providers: ProviderSummary[]) {
  await ensureDefaults();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.provider.findMany({ select: { id: true } });
    const nextIds = new Set(providers.map((provider) => provider.id));
    const removeIds = existing.filter((provider) => !nextIds.has(provider.id)).map((p) => p.id);

    if (removeIds.length > 0) {
      await tx.provider.deleteMany({ where: { id: { in: removeIds } } });
    }

    for (const provider of providers) {
      await tx.provider.upsert({
        where: { id: provider.id },
        update: {
          businessName: provider.businessName,
          ruc: provider.ruc,
          fiscalAddress: provider.fiscalAddress,
          contactName: provider.contactName,
          email: provider.email,
          phone: provider.phone,
          bankName: provider.bankName,
          bankAccount: provider.bankAccount,
          bankCci: provider.bankCci,
          detraccionAccount: provider.detraccionAccount,
        },
        create: {
          id: provider.id,
          businessName: provider.businessName,
          ruc: provider.ruc,
          fiscalAddress: provider.fiscalAddress,
          contactName: provider.contactName,
          email: provider.email,
          phone: provider.phone,
          bankName: provider.bankName,
          bankAccount: provider.bankAccount,
          bankCci: provider.bankCci,
          detraccionAccount: provider.detraccionAccount,
        },
      });
    }
  });
}

export async function getOrders() {
  await ensureDefaults();
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      provider: true,
      items: { orderBy: { position: "asc" } },
    },
  });

  return orders.map(mapOrder);
}

export async function saveOrders(orders: OrderRecord[]) {
  await ensureDefaults();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findMany({ select: { id: true } });
    const nextIds = new Set(orders.map((order) => order.id));
    const removeIds = existing.filter((order) => !nextIds.has(order.id)).map((o) => o.id);

    if (removeIds.length > 0) {
      await tx.order.deleteMany({ where: { id: { in: removeIds } } });
    }

    for (const order of orders) {
      await tx.order.upsert({
        where: { id: order.id },
        update: {
          code: order.code,
          type: toDbType(order.type),
          area: toDbRole(order.area),
          requester: order.requester,
          status: toDbStatus(order.status),
          currency: toDbCurrency(order.currency),
          workUnit: order.workUnit,
          issueDate: toDate(order.issueDate),
          subtotalAmount: new Prisma.Decimal(order.subtotalAmount),
          igvAmount: new Prisma.Decimal(order.igvAmount),
          retentionAmount: new Prisma.Decimal(order.retentionAmount),
          payableAmount: new Prisma.Decimal(order.payableAmount),
          applyRetention: order.applyRetention,
          amountInWords: order.amountInWords,
          totalAmount: new Prisma.Decimal(order.totalAmount),
          userId: order.userId,
          providerId: order.providerId,
        },
        create: {
          id: order.id,
          code: order.code,
          type: toDbType(order.type),
          area: toDbRole(order.area),
          requester: order.requester,
          status: toDbStatus(order.status),
          currency: toDbCurrency(order.currency),
          workUnit: order.workUnit,
          issueDate: toDate(order.issueDate),
          subtotalAmount: new Prisma.Decimal(order.subtotalAmount),
          igvAmount: new Prisma.Decimal(order.igvAmount),
          retentionAmount: new Prisma.Decimal(order.retentionAmount),
          payableAmount: new Prisma.Decimal(order.payableAmount),
          applyRetention: order.applyRetention,
          amountInWords: order.amountInWords,
          totalAmount: new Prisma.Decimal(order.totalAmount),
          userId: order.userId,
          providerId: order.providerId,
        },
      });

      await tx.orderItem.deleteMany({ where: { orderId: order.id } });

      if (order.items.length > 0) {
        await tx.orderItem.createMany({
          data: order.items.map((item, index) => ({
            id: item.id,
            orderId: order.id,
            position: index + 1,
            quantity: new Prisma.Decimal(item.quantity),
            description: item.description,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            amount: new Prisma.Decimal(item.amount),
          })),
        });
      }
    }
  });
}

export async function getSettings() {
  await ensureDefaults();
  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });

  if (!settings) {
    return defaultSettings;
  }

  return {
    companyName: settings.companyName,
    companyRuc: settings.companyRuc,
    companyAddress: settings.companyAddress,
    companyContact: settings.companyContact,
    companyEmail: settings.companyEmail,
    companyPhone: settings.companyPhone,
    companyCell: settings.companyCell,
    igvRate: toNumber(settings.igvRate),
    retentionRate: toNumber(settings.retentionRate),
    retentionEnabled: settings.retentionEnabled,
    retentionThreshold: toNumber(settings.retentionThreshold),
  } satisfies SystemSettings;
}

export async function saveSettings(settings: SystemSettings) {
  await ensureDefaults();
  await prisma.systemSetting.upsert({
    where: { id: 1 },
    update: {
      companyName: settings.companyName,
      companyRuc: settings.companyRuc,
      companyAddress: settings.companyAddress,
      companyContact: settings.companyContact,
      companyEmail: settings.companyEmail,
      companyPhone: settings.companyPhone,
      companyCell: settings.companyCell,
      igvRate: new Prisma.Decimal(settings.igvRate),
      retentionRate: new Prisma.Decimal(settings.retentionRate),
      retentionEnabled: settings.retentionEnabled,
      retentionThreshold: new Prisma.Decimal(settings.retentionThreshold),
    },
    create: {
      id: 1,
      companyName: settings.companyName,
      companyRuc: settings.companyRuc,
      companyAddress: settings.companyAddress,
      companyContact: settings.companyContact,
      companyEmail: settings.companyEmail,
      companyPhone: settings.companyPhone,
      companyCell: settings.companyCell,
      igvRate: new Prisma.Decimal(settings.igvRate),
      retentionRate: new Prisma.Decimal(settings.retentionRate),
      retentionEnabled: settings.retentionEnabled,
      retentionThreshold: new Prisma.Decimal(settings.retentionThreshold),
    },
  });
}

export async function getUserRecords() {
  await ensureDefaults();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return users.map(mapUser);
}

export async function saveUserRecords(users: UserRecord[]) {
  await ensureDefaults();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findMany({ select: { id: true } });
    const nextIds = new Set(users.map((user) => user.id));
    const removeIds = existing.filter((user) => !nextIds.has(user.id)).map((u) => u.id);

    if (removeIds.length > 0) {
      await tx.user.deleteMany({ where: { id: { in: removeIds } } });
    }

    for (const user of users) {
      await tx.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          role: toDbRole(user.role),
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          role: toDbRole(user.role),
        },
      });
    }
  });
}

export async function getUsers() {
  const users = await getUserRecords();
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
  }));
}

export function generateOrderCode(
  type: OrderRecord["type"],
  area: OrderRecord["area"],
  issueDate: string,
  orders: OrderRecord[],
  currentOrderId?: string,
) {
  const baseDate = issueDate ? new Date(`${issueDate}T00:00:00`) : new Date();
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const prefix = `${type}-CAP${year}-${area}${month}`;

  const maxSequence = orders.reduce((currentMax, order) => {
    if (currentOrderId && order.id === currentOrderId) {
      return currentMax;
    }

    if (!order.code.startsWith(prefix)) {
      return currentMax;
    }

    const sequence = Number(order.code.slice(prefix.length));
    return Number.isNaN(sequence) ? currentMax : Math.max(currentMax, sequence);
  }, 0);

  return `${prefix}${String(maxSequence + 1).padStart(3, "0")}`;
}

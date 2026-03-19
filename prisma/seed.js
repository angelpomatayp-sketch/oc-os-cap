const fs = require("node:fs/promises");
const path = require("node:path");
const { PrismaClient, Role, DocumentType, DocumentStatus, CurrencyCode } = require("@prisma/client");

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), "data");

const defaultSettings = {
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

function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

function toStatus(status) {
  return {
    Borrador: DocumentStatus.BORRADOR,
    "Pendiente de aprobacion": DocumentStatus.PENDIENTE_APROBACION,
    Aprobado: DocumentStatus.APROBADO,
    Emitido: DocumentStatus.EMITIDO,
    Anulado: DocumentStatus.ANULADO,
  }[status];
}

async function readJson(name, fallback) {
  try {
    const file = await fs.readFile(path.join(dataDir, name), "utf8");
    return JSON.parse(file);
  } catch {
    return fallback;
  }
}

async function main() {
  const [users, providers, orders, settings] = await Promise.all([
    readJson("users.json", []),
    readJson("providers.json", []),
    readJson("orders.json", []),
    readJson("settings.json", defaultSettings),
  ]);

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  if (users.length > 0) {
    await prisma.user.createMany({
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role in Role ? user.role : Role.L,
      })),
    });
  }

  if (providers.length > 0) {
    await prisma.provider.createMany({
      data: providers.map((provider) => ({
        id: provider.id,
        businessName: provider.businessName,
        ruc: provider.ruc,
        fiscalAddress: provider.fiscalAddress,
        contactName: provider.contactName || "",
        email: provider.email || "",
        phone: provider.phone || "",
        bankName: provider.bankName || "",
        bankAccount: provider.bankAccount || "",
        bankCci: provider.bankCci || "",
        detraccionAccount: provider.detraccionAccount || "",
      })),
    });
  }

  await prisma.systemSetting.create({
    data: {
      id: 1,
      companyName: settings.companyName,
      companyRuc: settings.companyRuc,
      companyAddress: settings.companyAddress,
      companyContact: settings.companyContact,
      companyEmail: settings.companyEmail,
      companyPhone: settings.companyPhone,
      companyCell: settings.companyCell,
      igvRate: settings.igvRate,
      retentionRate: settings.retentionRate,
      retentionEnabled: settings.retentionEnabled,
      retentionThreshold: settings.retentionThreshold,
    },
  });

  for (const order of orders) {
    await prisma.order.create({
      data: {
        id: order.id,
        code: order.code,
        type: order.type in DocumentType ? order.type : DocumentType.OC,
        area: order.area in Role ? order.area : Role.L,
        requester: order.requester,
        status: toStatus(order.status),
        currency: order.currency in CurrencyCode ? order.currency : CurrencyCode.PEN,
        workUnit: order.workUnit || "",
        issueDate: toDate(order.issueDate),
        subtotalAmount: order.subtotalAmount || 0,
        igvAmount: order.igvAmount || 0,
        retentionAmount: order.retentionAmount || 0,
        payableAmount: order.payableAmount || 0,
        applyRetention: Boolean(order.applyRetention),
        amountInWords: order.amountInWords || "",
        totalAmount: order.totalAmount || 0,
        userId: order.userId,
        providerId: order.providerId,
        items: {
          create: (order.items || []).map((item, index) => ({
            id: item.id,
            position: index + 1,
            quantity: item.quantity,
            description: item.description,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando reset de ordenes...");

  const itemCount = await prisma.orderItem.count();
  const orderCount = await prisma.order.count();
  const seqCount = await prisma.orderSequence.count();

  console.log(`Registros encontrados:`);
  console.log(`  OrderItem:     ${itemCount}`);
  console.log(`  Order:         ${orderCount}`);
  console.log(`  OrderSequence: ${seqCount}`);

  await prisma.orderItem.deleteMany();
  console.log("✓ OrderItem eliminados");

  await prisma.order.deleteMany();
  console.log("✓ Orders eliminadas");

  await prisma.orderSequence.deleteMany();
  console.log("✓ Secuencias reseteadas");

  console.log("\nReset completado. La proxima orden comenzara desde 001.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Error durante el reset:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { id: "uiux-playbook-ebook" },
    update: {},
    create: {
      id: "uiux-playbook-ebook",
      name: "A Real UI/UX Sht",
      r2Bucket: process.env.R2_BUCKET ?? null,
      // Set this to the actual object key of the PDF in R2 before going live.
      r2Key: process.env.EBOOK_R2_KEY ?? null,
      active: true,
    },
  });

  console.log("Seeded product: uiux-playbook-ebook");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

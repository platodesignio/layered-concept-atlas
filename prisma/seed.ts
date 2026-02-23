import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  const adminEmail = process.env.ADMIN_EMAIL_BOOTSTRAP;
  if (adminEmail) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      await prisma.user.create({ data: { email: adminEmail, role: "NETWORK_ADMIN", displayName: "Admin" } });
      console.log(`Created admin user: ${adminEmail}`);
    } else if (existing.role !== "NETWORK_ADMIN") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "NETWORK_ADMIN" } });
      console.log(`Promoted ${adminEmail} to NETWORK_ADMIN`);
    }
  }
  console.log("Seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

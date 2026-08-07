import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = (process.env.DATABASE_URL || "").replace("?sslmode=require", "");
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearUserData() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log(`Found ${users.length} user(s):`, users.map((u) => u.email));

  for (const user of users) {
    console.log(`\nClearing data for: ${user.email}`);

    // DisbursementSlabs are cascade-deleted with EMIs
    const [incomes, expenses, bills, emis, accounts, goals, insights, notifications] =
      await Promise.all([
        prisma.income.deleteMany({ where: { userId: user.id } }),
        prisma.expense.deleteMany({ where: { userId: user.id } }),
        prisma.bill.deleteMany({ where: { userId: user.id } }),
        prisma.eMI.deleteMany({ where: { userId: user.id } }),
        prisma.bankAccount.deleteMany({ where: { userId: user.id } }),
        prisma.goal.deleteMany({ where: { userId: user.id } }),
        prisma.aIInsight.deleteMany({ where: { userId: user.id } }),
        prisma.notification.deleteMany({ where: { userId: user.id } }),
      ]);

    console.log(`  ✓ ${incomes.count} incomes deleted`);
    console.log(`  ✓ ${expenses.count} expenses deleted`);
    console.log(`  ✓ ${bills.count} bills deleted`);
    console.log(`  ✓ ${emis.count} EMI/loan records deleted`);
    console.log(`  ✓ ${accounts.count} bank accounts deleted`);
    console.log(`  ✓ ${goals.count} goals deleted`);
    console.log(`  ✓ ${insights.count} AI insights deleted`);
    console.log(`  ✓ ${notifications.count} notifications deleted`);
  }

  console.log("\n✅ Done! All dummy data has been removed.");
  await prisma.$disconnect();
  await pool.end();
}

clearUserData().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});

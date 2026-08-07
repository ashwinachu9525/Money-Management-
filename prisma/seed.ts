import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Check if test user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "test@example.com" }
  });

  if (existingUser) {
    console.log("Test user already exists. Clearing old data...");
    await prisma.income.deleteMany({ where: { userId: existingUser.id } });
    await prisma.expense.deleteMany({ where: { userId: existingUser.id } });
    await prisma.bankAccount.deleteMany({ where: { userId: existingUser.id } });
    await prisma.eMI.deleteMany({ where: { userId: existingUser.id } });
    await prisma.bill.deleteMany({ where: { userId: existingUser.id } });
    await prisma.goal.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // Create test user
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: "test@example.com",
      password: hashedPassword,
    }
  });

  console.log("Created user with ID:", user.id);

  // Seed Bank Accounts
  await prisma.bankAccount.createMany({
    data: [
      { userId: user.id, bankName: "HDFC Bank", accountNick: "Salary Account", last5Digits: "48291", balance: 145000, accountType: "Savings" },
      { userId: user.id, bankName: "ICICI Bank", accountNick: "Emergency Fund", last5Digits: "19234", balance: 50000, accountType: "Savings" },
    ]
  });

  // Seed Incomes (Current month and previous months)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < 6; i++) {
    const d = new Date(currentYear, currentMonth - i, 15);
    await prisma.income.createMany({
      data: [
        { userId: user.id, sourceName: "Monthly Salary", companyName: "Tech Corp", category: "Salary", amount: 95000, date: d },
        { userId: user.id, sourceName: "Freelance Client", category: "Freelance", amount: 25000, date: new Date(currentYear, currentMonth - i, 20) },
      ]
    });
  }

  // Seed Expenses
  for (let i = 0; i < 6; i++) {
    const m = currentMonth - i;
    await prisma.expense.createMany({
      data: [
        { userId: user.id, category: "Rent", amount: 25000, date: new Date(currentYear, m, 5), isRecurring: true },
        { userId: user.id, category: "Food", amount: 8500, date: new Date(currentYear, m, 10) },
        { userId: user.id, category: "Travel", amount: 4200, date: new Date(currentYear, m, 12) },
        { userId: user.id, category: "Shopping", amount: 12000, date: new Date(currentYear, m, 25) },
      ]
    });
  }

  // Seed EMIs
  await prisma.eMI.create({
    data: {
      userId: user.id,
      name: "Car Loan",
      bank: "SBI",
      totalLoan: 800000,
      emiAmount: 18500,
      startDate: new Date(currentYear - 1, 5, 10),
      endDate: new Date(currentYear + 3, 5, 10),
      remainingMonths: 36,
      interestRate: 8.5
    }
  });

  // Seed Bills
  await prisma.bill.createMany({
    data: [
      { userId: user.id, name: "Electricity", amount: 2400, dueDate: new Date(currentYear, currentMonth, 28), status: "PENDING" },
      { userId: user.id, name: "Internet", amount: 999, dueDate: new Date(currentYear, currentMonth, 15), status: "PAID" },
    ]
  });

  // Seed Goals
  await prisma.goal.createMany({
    data: [
      { userId: user.id, name: "European Vacation", targetAmount: 300000, currentAmount: 120000, startDate: new Date(currentYear - 1, 0, 1), targetDate: new Date(currentYear + 1, 5, 1), priority: "HIGH" },
      { userId: user.id, name: "New Laptop", targetAmount: 150000, currentAmount: 45000, startDate: new Date(currentYear, 0, 1), targetDate: new Date(currentYear, 11, 31), priority: "MEDIUM" },
    ]
  });

  console.log("Seeding complete! You can now login with test@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

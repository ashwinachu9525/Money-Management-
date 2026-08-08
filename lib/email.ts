import nodemailer from "nodemailer";

export function getTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP server details missing in environment variables. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env file.");
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

interface MonthlyEmailData {
  toEmail: string;
  userName: string;
  monthName: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalBills: number;
  totalEMIs: number;
  netSavings: number;
  categories: { name: string; amount: number }[];
  transactions: { name: string; amount: number; type: string; category?: string }[];
}

export async function sendMonthlyFinancialReportEmail(data: MonthlyEmailData) {
  const {
    toEmail,
    userName,
    monthName,
    year,
    totalIncome,
    totalExpense,
    totalBills,
    totalEMIs,
    netSavings,
    categories,
    transactions,
  } = data;

  const totalOutflow = totalExpense + totalBills + totalEMIs;

  const formatINR = (val: number) =>
    `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const categoriesHtml = categories.length > 0
    ? categories
        .slice(0, 6)
        .map(
          (c) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">${c.name}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">${formatINR(c.amount)}</td>
      </tr>
    `
        )
        .join("")
    : `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #64748b; font-size: 13px;">No expenses recorded</td></tr>`;

  const recentTxHtml = transactions
    .slice(0, 8)
    .map((t) => {
      const isIncome = t.type === "income";
      const color = isIncome ? "#10b981" : "#ef4444";
      const sign = isIncome ? "+" : "-";
      return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b;">
          <strong>${t.name}</strong>
          ${t.category ? `<br/><span style="font-size: 11px; color: #64748b;">${t.category}</span>` : ""}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: ${color}; text-align: right;">
          ${sign}${formatINR(t.amount)}
        </td>
      </tr>
    `;
    })
    .join("");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Financial Summary - ${monthName} ${year}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-w: 600px; width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Money Manager</h1>
              <p style="margin: 0; font-size: 15px; opacity: 0.9;">Monthly Financial Report • ${monthName} ${year}</p>
            </td>
          </tr>

          <!-- Welcome & Summary Card Grid -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                Hello <strong>${userName}</strong>,<br/>
                Here is your financial performance summary for <strong>${monthName} ${year}</strong>.
              </p>

              <!-- Summary Cards Grid (2x2) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding-right: 8px; padding-bottom: 16px;">
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px;">
                      <span style="font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Total Income</span>
                      <div style="font-size: 20px; font-weight: 800; color: #15803d; margin-top: 4px;">${formatINR(totalIncome)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px; padding-bottom: 16px;">
                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 12px;">
                      <span style="font-size: 12px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">Total Expenses</span>
                      <div style="font-size: 20px; font-weight: 800; color: #dc2626; margin-top: 4px;">${formatINR(totalExpense)}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 12px;">
                      <span style="font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">Fixed Bills & EMIs</span>
                      <div style="font-size: 20px; font-weight: 800; color: #2563eb; margin-top: 4px;">${formatINR(totalBills + totalEMIs)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <div style="background-color: ${netSavings >= 0 ? "#ecfdf5" : "#fff1f2"}; border: 1px solid ${netSavings >= 0 ? "#a7f3d0" : "#ffe4e6"}; padding: 16px; border-radius: 12px;">
                      <span style="font-size: 12px; font-weight: 600; color: ${netSavings >= 0 ? "#065f46" : "#9f1239"}; text-transform: uppercase; letter-spacing: 0.5px;">Net Cashflow</span>
                      <div style="font-size: 20px; font-weight: 800; color: ${netSavings >= 0 ? "#059669" : "#e11d48"}; margin-top: 4px;">${formatINR(netSavings)}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Category Expense Breakdown Table -->
              <h3 style="margin: 24px 0 12px 0; font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                📊 Expense Breakdown by Category
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                <thead>
                  <tr style="background-color: #f1f5f9;">
                    <th align="left" style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Category</th>
                    <th align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoriesHtml}
                </tbody>
              </table>

              <!-- Recent Transactions Table -->
              <h3 style="margin: 24px 0 12px 0; font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                📑 Top Monthly Activity
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                ${recentTxHtml}
              </table>

              <!-- Action Button -->
              <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/reports" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                  View Full Dashboard Report
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              This is an automated monthly financial summary from <strong>Money Manager</strong>.<br/>
              Sent securely to ${toEmail}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: smtpFrom,
    to: toEmail,
    subject: `📊 Financial Summary: ${monthName} ${year} - ${formatINR(netSavings)} Cashflow`,
    html: htmlContent,
  });

  return info;
}

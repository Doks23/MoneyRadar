import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

const outDir = path.resolve('public/samples');
fs.mkdirSync(outDir, { recursive: true });

function formatDate(day, month, year) {
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

const months = [
  { name: 'Apr', num: 4, year: 2026, days: 30 },
  { name: 'May', num: 5, year: 2026, days: 31 },
  { name: 'Jun', num: 6, year: 2026, days: 30 },
];

function spreadAcrossMonths(txns) {
  const out = [];
  for (const m of months) {
    for (const t of txns) {
      const day = t.day;
      if (day <= m.days) {
        out.push({ ...t, date: formatDate(day, m.num, m.year) });
      }
    }
  }
  return out;
}

function csvRow(row) {
  return Object.values(row).map(v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');
}

function createTxn(date, desc, debit, credit, balance) {
  return { date, description: desc, debit, credit, balance };
}

// ─── HDFC CSV ───────────────────────────────────────────────
(() => {
  // 11 txns per month x 3 months = 33 rows
  const base = [
    { day: 1, desc: 'SALARY CREDIT', debit: '', credit: 85000, balance: 125000 },
    { day: 3, desc: 'AMAZON PAY', debit: 2499, credit: '', balance: 122501 },
    { day: 5, desc: 'SWIGGY DINING', debit: 845, credit: '', balance: 121656 },
    { day: 7, desc: 'BLINKIT GROCERY', debit: 1560, credit: '', balance: 120096 },
    { day: 9, desc: 'ELECTRICITY BILL', debit: 3200, credit: '', balance: 116896 },
    { day: 12, desc: 'NEFT DR-UTR123456', debit: 5000, credit: '', balance: 111896 },
    { day: 15, desc: 'ZOMATO ORDER', debit: 720, credit: '', balance: 111176 },
    { day: 18, desc: 'NETFLIX SUBSCRIPTION', debit: 649, credit: '', balance: 110527 },
    { day: 22, desc: 'MOBILE RECHARGE JIO', debit: 499, credit: '', balance: 110028 },
    { day: 25, desc: 'AMAZON PAY', debit: 1899, credit: '', balance: 108129 },
    { day: 28, desc: 'CREDIT CARD PAYMENT', debit: 15000, credit: '', balance: 93129 },
  ];
  const rows = spreadAcrossMonths(base).map(t => createTxn(t.date, t.desc, t.debit, t.credit, t.balance));
  const header = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];
  const content = [header.join(','), ...rows.map(r => csvRow(r))].join('\n');
  fs.writeFileSync(path.join(outDir, 'hdfc_savings.csv'), content, 'utf-8');
  console.log('✓ hdfc_savings.csv (3 months)');
})();

// ─── SBI TXT ────────────────────────────────────────────────
(() => {
  const base = [
    { day: 1, desc: 'SALARY BY EMPLOYER', debit: '0.00', credit: '85000.00', balance: '125000.00' },
    { day: 3, desc: 'POS-FLIPKART', debit: '3499.00', credit: '0.00', balance: '121501.00' },
    { day: 5, desc: 'UPI-BLINKIT GROCERY', debit: '1240.00', credit: '0.00', balance: '120261.00' },
    { day: 7, desc: 'UPI-ZOMATO', debit: '562.00', credit: '0.00', balance: '119699.00' },
    { day: 9, desc: 'MOBILE RECHARGE-AIRTEL', debit: '599.00', credit: '0.00', balance: '119100.00' },
    { day: 12, desc: 'INSURANCE PREMIUM', debit: '5200.00', credit: '0.00', balance: '113900.00' },
    { day: 15, desc: 'NEFT IN-SALARY ADVANCE', debit: '0.00', credit: '10000.00', balance: '123900.00' },
    { day: 18, desc: 'POS-DECATHLON', debit: '2100.00', credit: '0.00', balance: '121800.00' },
    { day: 22, desc: 'MUTUAL FUND SIP', debit: '5000.00', credit: '0.00', balance: '116800.00' },
    { day: 26, desc: 'AMAZON PRIME RENEWAL', debit: '1499.00', credit: '0.00', balance: '115301.00' },
    { day: 30, desc: 'ATM WITHDRAWAL', debit: '5000.00', credit: '0.00', balance: '110301.00' },
  ];
  const spacer = '------------------------------------------------------------------------------';
  const header = 'Date          Description                        Debit      Credit     Balance';
  const lines = [spacer, header, spacer];
  for (const m of months) {
    const title = `                              STATE BANK OF INDIA\n                   SAVINGS ACCOUNT STATEMENT\n               Account: 12345678901 | Period: ${m.name} ${m.year}`;
    lines.push('', title, '');
    lines.push(header);
    lines.push(spacer);
    for (const t of base) {
      if (t.day <= m.days) {
        const date = formatDate(t.day, m.num, m.year);
        lines.push(`${date}    ${t.desc.padEnd(32)}${t.debit.padStart(10)}   ${t.credit.padStart(10)}   ${t.balance.padStart(10)}`);
      }
    }
    lines.push(spacer);
  }
  fs.writeFileSync(path.join(outDir, 'sbi_savings.txt'), lines.join('\n'), 'utf-8');
  console.log('✓ sbi_savings.txt (3 months)');
})();

// ─── ICICI XLSX ─────────────────────────────────────────────
(() => {
  const header = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];
  const base = [
    { day: 1, desc: 'ONLINE TRANSFER FROM HDFC', debit: '', credit: 50000, balance: 95000 },
    { day: 3, desc: 'AMAZON SHOPPING', debit: 4500, credit: '', balance: 90500 },
    { day: 5, desc: 'SWIGGY FOOD DELIVERY', debit: 890, credit: '', balance: 89610 },
    { day: 8, desc: 'UPI-PAYTM WALLET', debit: 3000, credit: '', balance: 86610 },
    { day: 11, desc: 'BIGBASKET GROCERIES', debit: 1850, credit: '', balance: 84760 },
    { day: 14, desc: 'ELECTRICITY BILL PAY', debit: 2750, credit: '', balance: 82010 },
    { day: 17, desc: 'NEFT IN-TATA CONSULTANCY', debit: '', credit: 65000, balance: 147010 },
    { day: 19, desc: 'MYNTRA FASHION', debit: 2300, credit: '', balance: 144710 },
    { day: 21, desc: 'JIO FIBER RENEWAL', debit: 999, credit: '', balance: 143711 },
    { day: 24, desc: 'DOMINOS PIZZA', debit: 650, credit: '', balance: 143061 },
    { day: 27, desc: 'CREDIT CARD REPAYMENT', debit: 12000, credit: '', balance: 131061 },
    { day: 30, desc: 'DMAT CHARGES', debit: 250, credit: '', balance: 130811 },
  ];
  const allData = [];
  for (const m of months) {
    const prefix = `${m.name}-`;
    for (const t of base) {
      if (t.day <= m.days) {
        allData.push([`${t.day}-${m.name}-${m.year}`, t.desc, t.debit, t.credit, t.balance]);
      }
    }
  }
  const ws = XLSX.utils.aoa_to_sheet([header, ...allData]);
  ws['!cols'] = [{ wch: 18 }, { wch: 32 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Statement');
  XLSX.writeFile(wb, path.join(outDir, 'icici_savings.xlsx'));
  console.log('✓ icici_savings.xlsx (3 months)');
})();

// ─── Axis Bank XLS ──────────────────────────────────────────
(() => {
  const header = ['Date', 'Description', 'Withdrawal', 'Deposit', 'Balance'];
  const base = [
    { day: 1, desc: 'SALARY CREDIT', debit: '', credit: 75000, balance: 110000 },
    { day: 4, desc: 'AMAZON IN', debit: 3200, credit: '', balance: 106800 },
    { day: 7, desc: 'ZOMATO ORDER', debit: 540, credit: '', balance: 106260 },
    { day: 10, desc: 'INSURANCE PREMIUM PAYMENT', debit: 4800, credit: '', balance: 101460 },
    { day: 13, desc: 'UPI-BLINKIT', debit: 1250, credit: '', balance: 100210 },
    { day: 16, desc: 'RELIANCE DIGITAL', debit: 8900, credit: '', balance: 91310 },
    { day: 19, desc: 'HOTEL BOOKING-MAKEMYTRIP', debit: 4200, credit: '', balance: 87110 },
    { day: 22, desc: 'NEFT IN-RENT COLLECTION', debit: '', credit: 18000, balance: 105110 },
    { day: 25, desc: 'URBAN COMPANY SERVICE', debit: 699, credit: '', balance: 104411 },
    { day: 28, desc: 'KFC DINING', debit: 780, credit: '', balance: 103631 },
  ];
  const allData = [];
  for (const m of months) {
    for (const t of base) {
      if (t.day <= m.days) {
        allData.push([formatDate(t.day, m.num, m.year), t.desc, t.debit, t.credit, t.balance]);
      }
    }
  }
  const ws = XLSX.utils.aoa_to_sheet([header, ...allData]);
  ws['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Statement');
  XLSX.writeFile(wb, path.join(outDir, 'axis_savings.xls'), { bookType: 'xls' });
  console.log('✓ axis_savings.xls (3 months)');
})();

// ─── Kotak Mahindra PDF ────────────────────────────────────
(() => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = fs.createWriteStream(path.join(outDir, 'kotak_current.pdf'));
  doc.pipe(stream);

  const base = [
    ['CASH DEPOSIT', '', '25000', '125000'],
    ['AMAZON PAYMENT', '3200', '', '121800'],
    ['SWIGGY ORDER', '445', '', '121355'],
    ['UPI-TRANSFER TO SBI', '5000', '', '116355'],
    ['HDFC TRANSFER IN', '', '30000', '146355'],
    ['BROADBAND RENEWAL', '1299', '', '145056'],
    ['POS-SPENCER RETAIL', '2150', '', '142906'],
    ['INSURANCE PAYMENT', '5500', '', '137406'],
    ['NEFT IN-INTEREST', '', '4200', '141606'],
    ['DINING OUTLET', '1620', '', '139986'],
    ['MOBILE RECHARGE', '299', '', '139687'],
    ['ACCOUNT MAINTENANCE', '500', '', '139187'],
  ];

  const colX = [50, 100, 280, 370, 450];
  const colW = [50, 180, 90, 80, 80];
  const font = 'Helvetica';

  for (const m of months) {
    doc.font(font).fontSize(14).text('KOTAK MAHINDRA BANK', { align: 'center' });
    doc.fontSize(11).text('CURRENT ACCOUNT STATEMENT', { align: 'center' });
    doc.fontSize(9).text(`Account: 5512345678 | Period: ${m.name} ${m.year}`, { align: 'center' });
    doc.moveDown(0.8);

    doc.fontSize(8).font(font);
    doc.font(font).fontSize(8).text('Date', colX[0], doc.y, { width: colW[0] });
    doc.text('Description', colX[1], doc.y, { width: colW[1] });
    doc.text('Debit', colX[2], doc.y, { width: colW[2], align: 'right' });
    doc.text('Credit', colX[3], doc.y, { width: colW[3], align: 'right' });
    doc.text('Balance', colX[4], doc.y, { width: colW[4], align: 'right' });
    doc.moveDown(0.2);
    doc.fontSize(7);

    for (let i = 0; i < base.length; i++) {
      const row = base[i];
      const day = [1, 3, 5, 8, 11, 14, 17, 20, 23, 26, 28, 30][i];
      if (day > m.days) continue;
      const date = formatDate(day, m.num, m.year);
      const y = doc.y;
      doc.text(date, colX[0], y, { width: colW[0] });
      doc.text(row[0], colX[1], y, { width: colW[1] });
      doc.text(row[1], colX[2], y, { width: colW[2], align: 'right' });
      doc.text(row[2], colX[3], y, { width: colW[3], align: 'right' });
      doc.text(row[3], colX[4], y, { width: colW[4], align: 'right' });
      doc.moveDown(0.5);
    }

    doc.moveDown(0.5);
  }

  doc.end();
  stream.on('finish', () => console.log('✓ kotak_current.pdf (3 months)'));
})();

// ─── ICICI Credit Card PDF ──────────────────────────────────
(() => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = fs.createWriteStream(path.join(outDir, 'icici_credit.pdf'));
  doc.pipe(stream);

  const base = [
    { day: 2, desc: 'AMAZON INDIA', amount: '1,299', category: 'Shopping' },
    { day: 5, desc: 'SWIGGY', amount: '845', category: 'Dining' },
    { day: 8, desc: 'UBER INDIA', amount: '320', category: 'Transport' },
    { day: 10, desc: 'NETFLIX.COM', amount: '649', category: 'Entertainment' },
    { day: 12, desc: 'BLINKIT', amount: '567', category: 'Groceries' },
    { day: 15, desc: 'ZOMATO ONLINE', amount: '1,240', category: 'Dining' },
    { day: 18, desc: 'HOTEL BOOKING-MAKEMYTRIP', amount: '4,200', category: 'Travel' },
    { day: 21, desc: 'MYNTRA', amount: '2,999', category: 'Shopping' },
    { day: 24, desc: 'PHARMEASY', amount: '345', category: 'Healthcare' },
    { day: 27, desc: 'PVR CINEMAS', amount: '720', category: 'Entertainment' },
    { day: 29, desc: 'URBAN COMPANY', amount: '499', category: 'Services' },
    { day: 30, desc: 'AMAZON PRIME', amount: '1,499', category: 'Subscriptions' },
  ];

  for (const m of months) {
    doc.font('Helvetica').fontSize(14).text('ICICI BANK', { align: 'center' });
    doc.fontSize(11).text('CREDIT CARD STATEMENT', { align: 'center' });
    doc.fontSize(9).text(`Card: 4315 XXXX XXXX 6008 | Statement Period: ${m.name} ${m.year}`, { align: 'center' });
    doc.moveDown(0.8);

    doc.fontSize(8);
    doc.text('Date', 50, doc.y, { width: 60 });
    doc.text('Description', 110, doc.y, { width: 200 });
    doc.text('Amount (₹)', 310, doc.y, { width: 80, align: 'right' });
    doc.text('Category', 400, doc.y, { width: 100 });
    doc.moveDown(0.2);
    doc.fontSize(7);

    for (const t of base) {
      if (t.day > m.days) continue;
      const date = formatDate(t.day, m.num, m.year);
      const y = doc.y;
      doc.text(date, 50, y, { width: 60 });
      doc.text(t.desc, 110, y, { width: 200 });
      doc.text(t.amount, 310, y, { width: 80, align: 'right' });
      doc.text(t.category, 400, y, { width: 100 });
      doc.moveDown(0.5);
    }

    doc.moveDown(0.5);
  }

  doc.end();
  stream.on('finish', () => console.log('✓ icici_credit.pdf (3 months)'));
})();

console.log('\nAll sample files generated in public/samples/');

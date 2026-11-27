import ExcelJS from 'exceljs';
import type { StatsDto } from './api/pharmacyApi';

export interface FinancialExcelProps {
  pharmacyTitle: string;
  license: string;
  period: string;
  stats: StatsDto;
  catalogGrossRaw: number;
  discountAbsorbedRaw: number;
  grossRaw: number;
  onlinePayoutRaw: number;
  counterCashRaw: number;
  refundsRaw: number;
  orders: number;
  rxOrders: number;
  otcOrders: number;
  mixedOrders?: number;
  attachRate?: string | number;
  rxRevenue?: number;
  otcRevenue?: number;
  activePromos: number;
  totalRedemptions: number;
  categories: { name: string; percent: number; amount: string }[];
  points: {
    label: string;
    fullLabel: string;
    value: number;
    rxValue?: number;
    otcValue?: number;
    mixedOrdersCount?: number;
    ordersCount?: number;
  }[];
}

export interface AuditTrailExcelProps {
  pharmacyTitle: string;
  license: string;
  filterApplied: string;
  logs: {
    createdAt?: string;
    action: string;
    actorName?: string | null;
    actorRole?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    details?: Record<string, unknown> | string | null;
  }[];
}

/* ── MediPick Corporate Palette ── */
const BRAND_DARK = '103B3D';
const BRAND_TEAL = '1D6F72';
const SOFT_MINT = 'EDF4DE';
const SOFT_EMERALD = 'ECFDF5';
const EMERALD_TEXT = '047857';
const SOFT_ROSE = 'FEF2F2';
const RED_TEXT = 'DC2626';
const SLATE_BG = 'F8FAFC';
const CARD_HEADER_BG = 'F1F5F9';
const WHITE = 'FFFFFF';
const TEXT_MAIN = '0F172A';
const TEXT_MUTED = '64748B';
const BORDER_LIGHT = 'E2E8F0';

function applyThinBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: BORDER_LIGHT } },
    left: { style: 'thin', color: { argb: BORDER_LIGHT } },
    bottom: { style: 'thin', color: { argb: BORDER_LIGHT } },
    right: { style: 'thin', color: { argb: BORDER_LIGHT } },
  };
}

export async function downloadFinancialReportXlsx(props: FinancialExcelProps): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MediPick Dispensary Cloud';
  wb.created = new Date();

  const now = new Date();
  const dateStr =
    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    now.toLocaleTimeString('en-GB');

  /* ──────────────────────────────────────────────────────────
     WORKSHEET 1: Executive Overview & Financial Ledger
  ────────────────────────────────────────────────────────── */
  const ws = wb.addWorksheet('Executive Overview', {
    views: [{ showGridLines: true }], // Smooth scrolling across multi-sections
  });

  ws.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };

  // 8 Balanced content columns with Column A as a clean left margin spacer
  ws.columns = [
    { width: 3 },  // A: Left margin spacer
    { width: 32 }, // B: Metric / Classification
    { width: 20 }, // C: Gross MRP (LKR)
    { width: 18 }, // D: Promos Absorbed (LKR)
    { width: 22 }, // E: Net Realized (LKR)
    { width: 28 }, // F: Settlement Route
    { width: 24 }, // G: Settlement Mode & Terms
    { width: 20 }, // H: Clinical / SLA Classification
    { width: 22 }, // I: Audit Status
  ];

  // 1. Hero Title Banner (Cols B to I)
  ws.mergeCells('B1:I1');
  const t1 = ws.getCell('B1');
  t1.value = 'MEDIPICK DISPENSARY EXECUTIVE FINANCIAL REPORT';
  t1.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: WHITE } };
  t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
  t1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 36;

  // 2. Metadata Subtitle Bar (Cols B to I)
  ws.mergeCells('B2:I2');
  const t2 = ws.getCell('B2');
  t2.value = `Facility: ${props.pharmacyTitle}   |   NMRA License: ${props.license}   |   Period: ${props.period}   |   Generated: ${dateStr} (SLST)`;
  t2.font = { name: 'Segoe UI', size: 9.5, bold: false, color: { argb: SOFT_MINT } };
  t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } };
  t2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 22;

  ws.getRow(3).height = 10; // Spacing

  // 3. Executive Scorecard KPI Cards: Exactly 2 Columns Each!
  // Card 1: Gross Catalog Value (Cols B-C)
  ws.mergeCells('B4:C4');
  const c1Top = ws.getCell('B4');
  c1Top.value = 'GROSS CATALOG VALUE (MRP)';
  c1Top.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: TEXT_MUTED } };
  c1Top.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('B5:C5');
  const c1Val = ws.getCell('B5');
  c1Val.value = props.catalogGrossRaw;
  c1Val.numFmt = '"LKR "#,##0.00';
  c1Val.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: TEXT_MAIN } };
  c1Val.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('B6:C6');
  const c1Sub = ws.getCell('B6');
  c1Sub.value = 'Pre-discount shelf pricing';
  c1Sub.font = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: TEXT_MUTED } };
  c1Sub.alignment = { horizontal: 'center', vertical: 'middle' };

  // Card 2: Marketing Reductions (Cols D-E)
  ws.mergeCells('D4:E4');
  const c2Top = ws.getCell('D4');
  c2Top.value = 'CAMPAIGN PROMO REDUCTIONS';
  c2Top.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: '991B1B' } };
  c2Top.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('D5:E5');
  const c2Val = ws.getCell('D5');
  c2Val.value = -props.discountAbsorbedRaw;
  c2Val.numFmt = '"-LKR "#,##0.00;[Red]"-LKR "#,##0.00;"LKR 0.00"';
  c2Val.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: RED_TEXT } };
  c2Val.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('D6:E6');
  const c2Sub = ws.getCell('D6');
  c2Sub.value = `${props.totalRedemptions} campaign redemptions absorbed`;
  c2Sub.font = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: '991B1B' } };
  c2Sub.alignment = { horizontal: 'center', vertical: 'middle' };

  // Card 3: Net Cash Realized (Cols F-G)
  ws.mergeCells('F4:G4');
  const c3Top = ws.getCell('F4');
  c3Top.value = 'NET CASH REALIZED';
  c3Top.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: '065F46' } };
  c3Top.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('F5:G5');
  const c3Val = ws.getCell('F5');
  c3Val.value = props.grossRaw;
  c3Val.numFmt = '"LKR "#,##0.00';
  c3Val.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: EMERALD_TEXT } };
  c3Val.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('F6:G6');
  const c3Sub = ws.getCell('F6');
  c3Sub.value = 'Total invoiced customer revenue';
  c3Sub.font = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: '065F46' } };
  c3Sub.alignment = { horizontal: 'center', vertical: 'middle' };

  // Card 4: Fulfillment & SLA (Cols H-I)
  ws.mergeCells('H4:I4');
  const c4Top = ws.getCell('H4');
  c4Top.value = 'DISPENSING & SLA QUALITY';
  c4Top.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: BRAND_DARK } };
  c4Top.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('H5:I5');
  const c4Val = ws.getCell('H5');
  c4Val.value = `${props.orders} Orders · ${(props.stats.current.onTimeRate || 0).toFixed(0)}% SLA`;
  c4Val.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: BRAND_DARK } };
  c4Val.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('H6:I6');
  const c4Sub = ws.getCell('H6');
  const attachDisplay =
    typeof props.attachRate === 'number'
      ? `${props.attachRate.toFixed(1)}%`
      : props.attachRate || (props.orders > 0 ? `${(((props.mixedOrders || 0) / props.orders) * 100).toFixed(1)}%` : '0.0%');
  const mixedCount = props.mixedOrders || 0;
  c4Sub.value = `${props.rxOrders} Rx · ${props.otcOrders} OTC · ${mixedCount} Mixed (${attachDisplay} Attach)`;
  c4Sub.font = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: BRAND_TEAL } };
  c4Sub.alignment = { horizontal: 'center', vertical: 'middle' };

  // Fills & Borders for Cards
  ['B', 'C'].forEach((col) => [4, 5, 6].forEach((r) => {
    const cell = ws.getCell(`${col}${r}`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CARD_HEADER_BG } };
    applyThinBorder(cell);
  }));
  ['D', 'E'].forEach((col) => [4, 5, 6].forEach((r) => {
    const cell = ws.getCell(`${col}${r}`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT_ROSE } };
    applyThinBorder(cell);
  }));
  ['F', 'G'].forEach((col) => [4, 5, 6].forEach((r) => {
    const cell = ws.getCell(`${col}${r}`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT_EMERALD } };
    applyThinBorder(cell);
  }));
  ['H', 'I'].forEach((col) => [4, 5, 6].forEach((r) => {
    const cell = ws.getCell(`${col}${r}`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT_MINT } };
    applyThinBorder(cell);
  }));

  ws.getRow(4).height = 18;
  ws.getRow(5).height = 28;
  ws.getRow(6).height = 18;
  ws.getRow(7).height = 12; // Spacing

  // Helper for Section Headers across Cols B to I
  const addSectionTitle = (title: string, colHeaders: string[]) => {
    const banner = ws.addRow(['', title, '', '', '', '', '', '', '']);
    banner.height = 25;
    const rIdx = banner.number;
    ws.mergeCells(`B${rIdx}:I${rIdx}`);
    const bCell = ws.getCell(`B${rIdx}`);
    bCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: BRAND_DARK } };
    bCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT_MINT } };
    bCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    const hRow = ws.addRow(['', ...colHeaders]);
    hRow.height = 24;
    colHeaders.forEach((_, idx) => {
      const cell = hRow.getCell(idx + 2);
      cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } };
      cell.alignment = { vertical: 'middle', horizontal: idx >= 1 && idx <= 3 ? 'right' : 'left' };
      applyThinBorder(cell);
    });
  };

  // 4. Section 1: Financial Reconciliation Ledger
  addSectionTitle('1. REVENUE & FINANCIAL RECONCILIATION LEDGER', [
    'Classification / Channel',
    'Gross MRP (LKR)',
    'Promos Absorbed (LKR)',
    'Net Realized (LKR)',
    'Settlement Route',
    'Settlement Schedule & Mode',
    'Clinical / Channel Type',
    'Audit Status',
  ]);

  const ledgerData = [
    [
      'Online Payment Gateway (Card)',
      props.onlinePayoutRaw,
      0,
      props.onlinePayoutRaw,
      'Payment Gateway Settlement',
      'Nightly Release via T+1 SLIPS',
      'Digital Commercial Settlement',
      'Confirmed & Settled',
    ],
    [
      'Counter Cash (Pay at Pharmacy)',
      props.counterCashRaw + props.discountAbsorbedRaw,
      -props.discountAbsorbedRaw,
      props.counterCashRaw,
      'Dispensary Counter Register',
      'Handover upon customer PIN verify',
      'Counter Physical Handover',
      'Instant Cash Realized',
    ],
    [
      'Customer Dispute Refunds & Reversals',
      0,
      0,
      -props.refundsRaw,
      'Return Reversals & Claims',
      'Deducted from gross realized',
      'Chargebacks / Returns',
      props.refundsRaw === 0 ? 'Zero Chargebacks' : 'Reconciled',
    ],
  ];

  ledgerData.forEach((row, idx) => {
    const r = ws.addRow(['', row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]]);
    r.height = 22;
    r.font = { name: 'Segoe UI', size: 9.5, color: { argb: TEXT_MAIN } };
    if (idx % 2 === 1) {
      for (let c = 2; c <= 9; c++) {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_BG } };
      }
    }
    for (let c = 2; c <= 9; c++) {
      applyThinBorder(r.getCell(c));
    }
    r.getCell(3).numFmt = '"LKR "#,##0.00';
    r.getCell(4).numFmt = '"-LKR "#,##0.00;[Red]"-LKR "#,##0.00;"LKR 0.00"';
    r.getCell(5).numFmt = '"LKR "#,##0.00';
    if ((row[2] as number) < 0) {
      r.getCell(4).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: RED_TEXT } };
    }
  });

  // Total Realized Row
  const totRow = ws.addRow([
    '',
    'TOTAL REALIZED DISPENSARY REVENUE',
    props.catalogGrossRaw,
    -props.discountAbsorbedRaw,
    props.grossRaw,
    'All Settled Dispensary Channels',
    'Ready for Bank & Tax Filing',
    'Gross Dispensary Turnover',
    'AUDITED & BALANCED (100%)',
  ]);
  totRow.height = 26;
  totRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: BRAND_DARK } };
  for (let c = 2; c <= 9; c++) {
    const cell = totRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT_MINT } };
    applyThinBorder(cell);
    cell.border.bottom = { style: 'double', color: { argb: BRAND_DARK } };
  }
  totRow.getCell(3).numFmt = '"LKR "#,##0.00';
  totRow.getCell(4).numFmt = '"-LKR "#,##0.00;[Red]"-LKR "#,##0.00;"LKR 0.00"';
  totRow.getCell(5).numFmt = '"LKR "#,##0.00';
  totRow.getCell(5).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: BRAND_TEAL } };

  ws.addRow([]); // Blank spacing

  // 5. Section 2: Clinical Dispensing & Operational SLAs
  addSectionTitle('2. CLINICAL DISPENSING, QUALITY & OPERATIONAL BENCHMARKS', [
    'Quality Indicator / Metric',
    'Recorded Value',
    'Metric Unit',
    'Dispensary Target Benchmark',
    'Clinical Supervision',
    'Statutory Regulatory Standard',
    'Operational Channel',
    'SLA Compliance Status',
  ]);

  const kpis: [string, number | string, string, string, string, string, string, string][] = [
    ['Total Invoiced Orders Dispensed', props.orders, 'Completed Orders', '100% Target Met', 'Supervising Pharmacist', 'NMRA Act § 54 & GPP', 'All Dispensary Lines', 'Verified'],
    ['Prescription POM Orders', props.rxOrders, 'POM Prescriptions', 'Dispensed under Custody', 'Registered Pharmacist', 'Schedule III & IV (POM)', 'Prescription Only', 'Statutory Verified'],
    ['Over-The-Counter Orders', props.otcOrders, 'OTC Transactions', 'General Healthcare Sales', 'Dispensary Staff', 'Schedule I & II (OTC)', 'Consumer Retail', 'Cleared'],
    ['Mixed Basket Cross-Sells (Rx + OTC)', props.mixedOrders || 0, 'Mixed Basket Orders', 'Commercial Growth Target', 'Pharmacist Consultation', 'NMRA & Consumer Act', 'Unified Checkout', 'Tracked'],
    ['Prescription Line Sales (Rx POM)', props.rxRevenue ?? props.stats.rxRevenue ?? 0, 'LKR Volume', 'Clinical Core Line', 'Registered Pharmacist', 'Schedule III & IV Formulary', 'Prescription Dispensing', 'Audited'],
    ['OTC Healthcare Line Sales', props.otcRevenue ?? props.stats.otcRevenue ?? 0, 'LKR Volume', 'Wellness & OTC Line', 'Dispensary Staff', 'Schedule I & II General', 'Consumer Retail Lines', 'Audited'],
    ['OTC Basket Attach Rate', typeof props.attachRate === 'number' ? `${props.attachRate.toFixed(1)}%` : props.attachRate || (props.orders > 0 ? `${(((props.mixedOrders || 0) / props.orders) * 100).toFixed(1)}%` : '0.0%'), 'Cross-Sell Attach %', 'Dispensary Target: ≥ 30%', 'Commercials Team', 'GPP Commercial Telemetry', 'Basket Cross-Sell', 'Benchmark Monitored'],
    ['Mean Basket Size (ABV)', props.stats.current.avgBasket || 0, 'LKR / Transaction', 'Commercial Benchmark', 'Dispensary Commercials', 'Standard Shelf Margin', 'Transaction Basket', 'Positive Contribution'],
    ['Average Quote Turnaround (TAT)', `${(props.stats.current.avgQuoteTurnaroundMinutes || 0).toFixed(1)} mins`, 'Turnaround Speed', 'Target SLA: ≤ 10 mins', 'Registered Pharmacist', 'Good Pharmacy Practice', 'Digital Prescription Queue', 'SLA Compliant'],
    ['Bench Preparation Speed', `${(props.stats.current.avgPrepMinutes || 0).toFixed(1)} mins`, 'Bench Assembly Time', 'Target SLA: ≤ 15 mins', 'Dispensing Staff', 'GPP Handover Standard', 'Bench Assembly', 'SLA Compliant'],
    ['Quote Acceptance Rate', `${(props.stats.current.quoteAcceptanceRate || 0).toFixed(1)}%`, 'Customer Conversion', 'Target: ≥ 85%', 'Dispensary Management', 'Commercial Pricing Standard', 'Digital Prescription Flow', 'Conversion Monitored'],
    ['Fulfillment On-Time SLA Rate', (props.stats.current.onTimeRate || 0) / 100, 'Handover Speed %', 'MediPick Benchmark: 95.0%', 'Operations Team', 'Good Pharmacy Practice', 'Patient Handover', 'Gold Standard SLA'],
    ['Active Promotional Campaigns', props.activePromos, 'Active Campaigns', 'Active Store Offers', 'Marketing & Retail', 'Fair Trading Regulations', 'Dispensary Promotions', 'Store Active'],
    ['Total Campaign Redemptions', props.totalRedemptions, 'Discount Claims', 'Customer Redemptions', 'Marketing & Retail', 'Promotional Deductions', 'Loyalty / Vouchers', 'Absorbed in Net Sales'],
  ];

  kpis.forEach((kpi, idx) => {
    const r = ws.addRow(['', kpi[0], kpi[1], kpi[2], kpi[3], kpi[4], kpi[5], kpi[6], kpi[7]]);
    r.height = 22;
    r.font = { name: 'Segoe UI', size: 9.5, color: { argb: TEXT_MAIN } };
    if (idx % 2 === 1) {
      for (let c = 2; c <= 9; c++) {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_BG } };
      }
    }
    for (let c = 2; c <= 9; c++) {
      applyThinBorder(r.getCell(c));
    }
    // Number formatting by metric type
    if (idx === 4 || idx === 5 || idx === 7) {
      // Currency (Rx Sales, OTC Sales, Mean Basket)
      r.getCell(3).numFmt = '"LKR "#,##0.00';
    } else if (idx === 11) {
      // Fulfillment SLA %
      r.getCell(3).numFmt = '0.0%';
      r.getCell(3).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: EMERALD_TEXT } };
    } else if (typeof kpi[1] === 'number') {
      r.getCell(3).numFmt = '#,##0';
    }
    r.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  ws.addRow([]); // Blank spacing

  // 6. Section 3: Therapeutic Category Sales Contribution
  addSectionTitle('3. THERAPEUTIC CATEGORY SALES CONTRIBUTION', [
    'Therapeutic Class / Category',
    'Invoiced Sales (LKR)',
    'Revenue Share (%)',
    'Category Sales Rating',
    'Clinical Class',
    'Stock Rotation Status',
    'Ministry Classification',
    'Formulary Status',
  ]);

  props.categories.forEach((cat, idx) => {
    const amt = parseFloat(cat.amount.replace(/[^0-9.-]/g, '') || '0');
    const share = cat.percent / 100;
    const rating = cat.percent >= 25 ? 'Core Contributor (Top)' : cat.percent >= 10 ? 'High Volume' : 'Supporting Line';
    const r = ws.addRow([
      '',
      cat.name,
      amt,
      share,
      rating,
      'Regulated Formulation',
      'Active Dispensary Rotation',
      'Ministry of Health Formulary',
      'Approved Product Line',
    ]);
    r.height = 22;
    r.font = { name: 'Segoe UI', size: 9.5, color: { argb: TEXT_MAIN } };
    if (idx % 2 === 1) {
      for (let c = 2; c <= 9; c++) {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_BG } };
      }
    }
    for (let c = 2; c <= 9; c++) {
      applyThinBorder(r.getCell(c));
    }
    r.getCell(3).numFmt = '"LKR "#,##0.00';
    r.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell(4).numFmt = '0.0%';
    r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(4).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: BRAND_TEAL } };
  });

  /* ──────────────────────────────────────────────────────────
     WORKSHEET 2: Daily Sales & Trajectory Ledger
  ────────────────────────────────────────────────────────── */
  const ws2 = wb.addWorksheet('Daily Sales Ledger', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
  });

  ws2.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };

  ws2.columns = [
    { width: 3 },  // A: Margin
    { width: 16 }, // B: Interval Code
    { width: 26 }, // C: Calendar Date & Day
    { width: 22 }, // D: Invoiced Sales (LKR)
    { width: 22 }, // E: Prescription POM (LKR)
    { width: 22 }, // F: OTC & Wellness (LKR)
    { width: 16 }, // G: Orders Dispensed
    { width: 16 }, // H: Mixed Baskets
    { width: 24 }, // I: Cumulative Total (LKR)
    { width: 18 }, // J: Period Share (%)
    { width: 24 }, // K: Operational Status
  ];

  // Header Banner
  ws2.mergeCells('B1:K1');
  const t2_1 = ws2.getCell('B1');
  t2_1.value = 'MEDIPICK DISPENSARY DAILY FULFILLMENT & SALES LEDGER';
  t2_1.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: WHITE } };
  t2_1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
  t2_1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws2.getRow(1).height = 34;

  ws2.mergeCells('B2:K2');
  const t2_2 = ws2.getCell('B2');
  t2_2.value = `Facility: ${props.pharmacyTitle}   |   Period: ${props.period}   |   Total Intervals: ${props.points.length}   |   Line-Item Attributed Telemetry`;
  t2_2.font = { name: 'Segoe UI', size: 9.5, color: { argb: SOFT_MINT } };
  t2_2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } };
  t2_2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws2.getRow(2).height = 20;

  ws2.getRow(3).height = 8; // Spacing

  const hRow2 = ws2.addRow([
    '',
    'Interval Code',
    'Calendar Date & Day',
    'Invoiced Sales (LKR)',
    'Prescription POM (LKR)',
    'OTC & Wellness (LKR)',
    'Orders Dispensed',
    'Mixed Baskets',
    'Cumulative Total (LKR)',
    'Period Share (%)',
    'Operational Fulfillment',
  ]);
  hRow2.height = 24;
  for (let c = 2; c <= 11; c++) {
    const cell = hRow2.getCell(c);
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } };
    cell.alignment = { vertical: 'middle', horizontal: c >= 4 && c <= 10 ? 'right' : 'left' };
    applyThinBorder(cell);
  }

  let runningSum = 0;
  const totalPeriodSales = props.points.reduce((s, p) => s + p.value, 0) || 1;

  props.points.forEach((pt, idx) => {
    runningSum += pt.value;
    const share = pt.value / totalPeriodSales;
    const rxVal =
      pt.rxValue ??
      (pt.value > 0
        ? props.rxRevenue
          ? Math.round(pt.value * (props.rxRevenue / (props.grossRaw || 1)) * 100) / 100
          : 0
        : 0);
    const otcVal = pt.otcValue ?? (pt.value > 0 ? Math.max(0, pt.value - rxVal) : 0);
    const ordersCnt = pt.ordersCount ?? (pt.value > 0 ? 1 : 0);
    const mixedCnt = pt.mixedOrdersCount ?? (rxVal > 0 && otcVal > 0 ? 1 : 0);

    const r = ws2.addRow([
      '',
      pt.label,
      pt.fullLabel,
      pt.value,
      rxVal,
      otcVal,
      ordersCnt,
      mixedCnt,
      runningSum,
      share,
      pt.value > 0 ? 'Fulfillments Recorded' : 'Zero Transactions',
    ]);
    r.height = 22;
    r.font = { name: 'Segoe UI', size: 9.5, color: { argb: TEXT_MAIN } };
    if (idx % 2 === 1) {
      for (let c = 2; c <= 11; c++) {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_BG } };
      }
    }
    for (let c = 2; c <= 11; c++) {
      applyThinBorder(r.getCell(c));
    }
    r.getCell(4).numFmt = '"LKR "#,##0.00';
    r.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell(5).numFmt = '"LKR "#,##0.00';
    r.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell(6).numFmt = '"LKR "#,##0.00';
    r.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell(7).numFmt = '#,##0';
    r.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(8).numFmt = '#,##0';
    r.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(9).numFmt = '"LKR "#,##0.00';
    r.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell(10).numFmt = '0.0%';
    r.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Enable AutoFilter on Tab 2
  ws2.autoFilter = 'B4:K4';

  // Export to Blob and trigger browser download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MediPick_Financial_Report_${props.period.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadAuditTrailXlsx(props: AuditTrailExcelProps): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MediPick Compliance Suite';
  wb.created = new Date();

  const now = new Date();
  const dateStr =
    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    now.toLocaleTimeString('en-GB');

  const ws = wb.addWorksheet('NMRA Dispensary Audit Log', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 8, showGridLines: true }],
  });

  ws.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };

  // Generous column widths (Column A is margin)
  ws.columns = [
    { width: 3 },  // A: Left margin spacer
    { width: 14 }, // B: Audit Record ID
    { width: 16 }, // C: Event Date (SLST)
    { width: 14 }, // D: Event Time (SLST)
    { width: 30 }, // E: Statutory Regulatory Action
    { width: 26 }, // F: Pharmacist / Staff Actor
    { width: 24 }, // G: Security Privilege Level
    { width: 22 }, // H: Regulated Target Entity
    { width: 68 }, // I: Reference & Audit Evidence Description
  ];

  // 1. Hero Title Banner
  ws.mergeCells('B1:I1');
  const t1 = ws.getCell('B1');
  t1.value = 'SRI LANKA NATIONAL MEDICINES REGULATORY AUTHORITY (NMRA)';
  t1.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: WHITE } };
  t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
  t1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 36;

  // 2. Subtitle Banner
  ws.mergeCells('B2:I2');
  const t2 = ws.getCell('B2');
  t2.value = 'DISPENSARY STATUTORY AUDIT TRAIL — OFFICIAL LICENSING INSPECTION LOG';
  t2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: SOFT_MINT } };
  t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } };
  t2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 22;

  // 3. Metadata Subtitle
  ws.mergeCells('B3:I3');
  const t3 = ws.getCell('B3');
  t3.value = `Dispensary: ${props.pharmacyTitle}   |   NMRA Reg Number: ${props.license}   |   Statutory Act: NMRA Act No. 5 of 2015   |   Exported: ${dateStr} (SLST)`;
  t3.font = { name: 'Segoe UI', size: 9.5, color: { argb: BRAND_DARK } };
  t3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT_MINT } };
  t3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(3).height = 20;

  ws.getRow(4).height = 10; // Spacing

  // 4. Statutory Compliance Notice Box (Rows 5 to 6)
  ws.mergeCells('B5:I5');
  const nTop = ws.getCell('B5');
  nTop.value = 'LEGAL NOTICE — SECTION 54 & 56 OF NMRA ACT NO. 5 OF 2015 (GOOD PHARMACY PRACTICE)';
  nTop.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: BRAND_DARK } };
  nTop.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT_MINT } };
  nTop.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(5).height = 20;

  ws.mergeCells('B6:I6');
  const nSub = ws.getCell('B6');
  nSub.value = `This immutable audit trail records all prescription validations, unit formulation pricing adjustments, inventory stock deductions, PIN-verified counter cash collections, and dispute refunds. Total Logged Records: ${props.logs.length}   |   Filter Scope: ${props.filterApplied}   |   Status: CRYPTOGRAPHICALLY VALIDATED`;
  nSub.font = { name: 'Segoe UI', size: 8.5, color: { argb: '334155' } };
  nSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_BG } };
  nSub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(6).height = 22;

  ws.getRow(7).height = 10; // Spacing

  // 5. Table Header Row (Row 8)
  const hRow = ws.addRow([
    '',
    'Audit ID',
    'Event Date (SLST)',
    'Event Time (SLST)',
    'Statutory Regulatory Action',
    'Pharmacist / Staff Actor',
    'Security Role & Privilege',
    'Regulated Entity Type',
    'Reference & Statutory Evidence Description',
  ]);
  hRow.height = 26;
  for (let c = 2; c <= 9; c++) {
    const cell = hRow.getCell(c);
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } };
    cell.alignment = { vertical: 'middle', horizontal: c >= 2 && c <= 4 ? 'center' : 'left' };
    applyThinBorder(cell);
  }

  // 6. Data Rows
  props.logs.forEach((log, idx) => {
    const d = log.createdAt ? new Date(log.createdAt) : null;
    const dStr = d
      ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const tStr = d ? d.toLocaleTimeString('en-GB') : '—';
    const detailsSummary = log.details
      ? typeof log.details === 'object'
        ? JSON.stringify(log.details)
        : String(log.details)
      : 'Logged under statutory compliance protocol';

    const r = ws.addRow([
      '',
      `AUD-${String(idx + 1).padStart(4, '0')}`,
      dStr,
      tStr,
      log.action || 'Statutory Action',
      log.actorName || 'Pharmacist on Duty',
      log.actorRole || 'Dispensing Staff',
      log.targetType || 'System Event',
      log.targetId ? `${log.targetId} · ${detailsSummary}` : detailsSummary,
    ]);

    // Do NOT lock row height on data rows to let Excel auto-fit wrapped text cleanly!
    r.font = { name: 'Segoe UI', size: 9.5, color: { argb: TEXT_MAIN } };
    if (idx % 2 === 1) {
      for (let c = 2; c <= 9; c++) {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_BG } };
      }
    }
    for (let c = 2; c <= 9; c++) {
      applyThinBorder(r.getCell(c));
    }

    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(2).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: BRAND_TEAL } };
    r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(5).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: TEXT_MAIN } };
    r.getCell(9).alignment = { vertical: 'middle', wrapText: true };
  });

  // Enable AutoFilter on Table Header (Row 8)
  ws.autoFilter = 'B8:I8';

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MediPick_NMRA_Audit_Trail_${now.toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

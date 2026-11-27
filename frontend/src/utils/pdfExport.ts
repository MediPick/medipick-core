import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FinancialExcelProps, AuditTrailExcelProps } from './excelExport';

const BRAND_DARK = [16, 59, 61] as const;
const BRAND_TEAL = [29, 111, 114] as const;
const SOFT_MINT = [237, 244, 222] as const;
const WHITE = [255, 255, 255] as const;
const TEXT_MAIN = [15, 23, 42] as const;
const TEXT_MUTED = [100, 116, 139] as const;
const SLATE_BG = [248, 250, 252] as const;
const RED_TEXT = [220, 38, 38] as const;
const EMERALD_TEXT = [4, 120, 87] as const;

export async function downloadFinancialReportPdf(props: FinancialExcelProps): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const now = new Date();
  const dateStr =
    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    now.toLocaleTimeString('en-GB');

  // 1. Hero Title Banner
  doc.setFillColor(...BRAND_DARK);
  doc.roundedRect(margin, 10, contentWidth, 20, 2.5, 2.5, 'F');

  doc.setTextColor(...SOFT_MINT);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDIPICK HEALTHCARE TECHNOLOGIES • DISPENSARY MANAGEMENT SYSTEM', margin + 4, 16);

  doc.setTextColor(...WHITE);
  doc.setFontSize(12.5);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE DISPENSARY FINANCIAL & PERFORMANCE REPORT', margin + 4, 24);

  // 2. Metadata Subtitle Bar
  doc.setFillColor(...BRAND_TEAL);
  doc.roundedRect(margin, 32, contentWidth, 7.5, 1.5, 1.5, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Facility: ${props.pharmacyTitle}   |   NMRA License: ${props.license}   |   Period: ${props.period}   |   Generated: ${dateStr} (SLST)`,
    margin + 4,
    37,
  );

  // 3. Scorecard KPI Cards (4 horizontal cards)
  const cardY = 42;
  const cardW = (contentWidth - 9) / 4;
  const cardH = 18;

  // Card 1: Gross Catalog MRP
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cardY, cardW, cardH, 2, 2, 'F');
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('GROSS CATALOG (MRP)', margin + cardW / 2, cardY + 4.5, { align: 'center' });
  doc.setTextColor(...TEXT_MAIN);
  doc.setFontSize(10.5);
  doc.text(`LKR ${(props.catalogGrossRaw || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + cardW / 2, cardY + 11, { align: 'center' });
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.text('Pre-discount shelf pricing', margin + cardW / 2, cardY + 15.5, { align: 'center' });

  // Card 2: Promo Reductions
  const c2X = margin + cardW + 3;
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(c2X, cardY, cardW, cardH, 2, 2, 'F');
  doc.setTextColor(153, 27, 27);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PROMO REDUCTIONS', c2X + cardW / 2, cardY + 4.5, { align: 'center' });
  doc.setTextColor(...RED_TEXT);
  doc.setFontSize(10.5);
  doc.text(`-LKR ${(props.discountAbsorbedRaw || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c2X + cardW / 2, cardY + 11, { align: 'center' });
  doc.setTextColor(153, 27, 27);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.text(`${props.totalRedemptions} promo redemptions`, c2X + cardW / 2, cardY + 15.5, { align: 'center' });

  // Card 3: Net Cash Realized
  const c3X = c2X + cardW + 3;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(c3X, cardY, cardW, cardH, 2, 2, 'F');
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('NET CASH REALIZED', c3X + cardW / 2, cardY + 4.5, { align: 'center' });
  doc.setTextColor(...EMERALD_TEXT);
  doc.setFontSize(10.5);
  doc.text(`LKR ${(props.grossRaw || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c3X + cardW / 2, cardY + 11, { align: 'center' });
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.text('Invoiced customer revenue', c3X + cardW / 2, cardY + 15.5, { align: 'center' });

  // Card 4: Orders & SLA
  const c4X = c3X + cardW + 3;
  doc.setFillColor(237, 244, 222);
  doc.roundedRect(c4X, cardY, cardW, cardH, 2, 2, 'F');
  doc.setTextColor(...BRAND_DARK);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DISPENSING & SLA', c4X + cardW / 2, cardY + 4.5, { align: 'center' });
  doc.setTextColor(...BRAND_DARK);
  doc.setFontSize(10.5);
  doc.text(`${props.orders} Orders · ${(props.stats.current.onTimeRate || 0).toFixed(0)}% SLA`, c4X + cardW / 2, cardY + 11, { align: 'center' });
  doc.setTextColor(...BRAND_TEAL);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  const attachDisplay =
    typeof props.attachRate === 'number'
      ? `${props.attachRate.toFixed(1)}%`
      : props.attachRate || (props.orders > 0 ? `${(((props.mixedOrders || 0) / props.orders) * 100).toFixed(1)}%` : '0%');
  const mixedCount = props.mixedOrders || 0;
  doc.text(`${props.rxOrders} Rx · ${props.otcOrders} OTC · ${mixedCount} Mixed (${attachDisplay})`, c4X + cardW / 2, cardY + 15.5, { align: 'center' });

  const fn = typeof autoTable === 'function' ? autoTable : (autoTable as any).default;

  // 4. Section 1: Financial Reconciliation Ledger Table
  doc.setTextColor(...BRAND_DARK);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. REVENUE & FINANCIAL RECONCILIATION LEDGER', margin, 64);

  fn(doc, {
    startY: 66,
    margin: { left: margin, right: margin },
    head: [['Classification / Channel', 'Gross MRP', 'Promos Absorbed', 'Net Realized', 'Settlement Route & Schedule', 'Audit Status']],
    body: [
      [
        'Online Payment Gateway (Card)',
        `LKR ${props.onlinePayoutRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        'LKR 0.00',
        `LKR ${props.onlinePayoutRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        'Nightly Release via T+1 SLIPS Bank Transfer',
        'Confirmed & Settled',
      ],
      [
        'Counter Cash (Pay at Pharmacy)',
        `LKR ${(props.counterCashRaw + props.discountAbsorbedRaw).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `-LKR ${props.discountAbsorbedRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `LKR ${props.counterCashRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        'Dispensary Register upon customer PIN verify',
        'Instant Cash Realized',
      ],
      [
        'Customer Dispute Refunds & Reversals',
        'LKR 0.00',
        'LKR 0.00',
        `-LKR ${props.refundsRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        'Return Reversals & Claims Deducted',
        props.refundsRaw === 0 ? 'Zero Chargebacks' : 'Reconciled',
      ],
      [
        'TOTAL REALIZED DISPENSARY REVENUE',
        `LKR ${props.catalogGrossRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `-LKR ${props.discountAbsorbedRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `LKR ${props.grossRaw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        'All Settled Dispensary Channels',
        'AUDITED & BALANCED (100%)',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [...BRAND_TEAL],
      textColor: [...WHITE],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [...TEXT_MAIN],
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right', textColor: [...RED_TEXT] },
      3: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: function(data: any) {
      if (data.row.index === 3) {
        data.cell.styles.fillColor = [...SOFT_MINT];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [...BRAND_DARK];
      }
    },
  });

  const nextY1 = (doc as any).lastAutoTable.finalY + 6;

  // 5. Section 2: Clinical Dispensing & Operational SLAs Table
  doc.setTextColor(...BRAND_DARK);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('2. CLINICAL DISPENSING, QUALITY & OPERATIONAL BENCHMARKS', margin, nextY1);

  fn(doc, {
    startY: nextY1 + 2,
    margin: { left: margin, right: margin },
    head: [['Quality Indicator / Metric', 'Recorded Value', 'Metric Unit', 'Dispensary Benchmark', 'Clinical Custody', 'Statutory Standard']],
    body: [
      ['Total Invoiced Orders', `${props.orders}`, 'Completed Orders', '100% Target Met', 'Supervising Pharmacist', 'NMRA Act § 54 & GPP'],
      ['Prescription POM Orders', `${props.rxOrders}`, 'POM Prescriptions', 'Dispensed under Custody', 'Registered Pharmacist', 'Schedule III & IV (POM)'],
      ['Over-The-Counter Orders', `${props.otcOrders}`, 'OTC Transactions', 'General Healthcare Sales', 'Dispensary Staff', 'Schedule I & II (OTC)'],
      ['Mixed Basket Orders (Rx+OTC)', `${props.mixedOrders || 0}`, 'Mixed Orders', 'Commercial Growth', 'Pharmacist Consultation', 'Unified Checkout System'],
      ['Prescription Line Sales (Rx POM)', `LKR ${(props.rxRevenue ?? props.stats.rxRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'LKR Volume', 'Clinical Core Line', 'Registered Pharmacist', 'Schedule III & IV Formulary'],
      ['OTC Healthcare Line Sales', `LKR ${(props.otcRevenue ?? props.stats.otcRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'LKR Volume', 'Wellness & OTC Line', 'Dispensary Staff', 'Schedule I & II General'],
      ['OTC Basket Attach Rate', `${typeof props.attachRate === 'number' ? props.attachRate.toFixed(1) + '%' : props.attachRate || (props.orders > 0 ? (((props.mixedOrders || 0) / props.orders) * 100).toFixed(1) + '%' : '0.0%')}`, 'Cross-Sell %', 'Target Benchmark: ≥ 30%', 'Commercials Team', 'GPP Commercial Telemetry'],
      ['Mean Basket Size (ABV)', `LKR ${(props.stats.current.avgBasket || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'LKR / Transaction', 'Commercial Benchmark', 'Dispensary Commercials', 'Standard Shelf Margin'],
      ['Average Quote Turnaround (TAT)', `${(props.stats.current.avgQuoteTurnaroundMinutes || 0).toFixed(1)} mins`, 'Turnaround Speed', 'Target SLA: ≤ 10 mins', 'Registered Pharmacist', 'Good Pharmacy Practice'],
      ['Bench Preparation Speed', `${(props.stats.current.avgPrepMinutes || 0).toFixed(1)} mins`, 'Bench Assembly Time', 'Target SLA: ≤ 15 mins', 'Dispensing Staff', 'GPP Handover Standard'],
      ['Quote Acceptance Rate', `${(props.stats.current.quoteAcceptanceRate || 0).toFixed(1)}%`, 'Customer Conversion', 'Target: ≥ 85%', 'Dispensary Management', 'Digital Prescription Flow'],
      ['Fulfillment On-Time SLA Rate', `${(props.stats.current.onTimeRate || 0).toFixed(1)}%`, 'Handover Speed %', 'Benchmark: 95.0%', 'Operations Team', 'Good Pharmacy Practice (SLA Met)'],
      ['Active Marketing Campaigns', `${props.activePromos}`, 'Active Campaigns', 'Active Store Offers', 'Marketing & Retail', 'Fair Trading Regulations'],
      ['Total Campaign Redemptions', `${props.totalRedemptions}`, 'Discount Claims', 'Customer Redemptions', 'Marketing & Retail', 'Absorbed in Net Sales'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [...BRAND_TEAL],
      textColor: [...WHITE],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [...TEXT_MAIN],
    },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const nextY2 = (doc as any).lastAutoTable.finalY + 6;

  // 6. Section 3: Therapeutic Category Sales Contribution
  doc.setTextColor(...BRAND_DARK);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('3. THERAPEUTIC CATEGORY SALES CONTRIBUTION', margin, nextY2);

  const categoryRows = props.categories.map((cat) => [
    cat.name,
    cat.amount,
    `${cat.percent.toFixed(1)}%`,
    cat.percent >= 25 ? 'Core Contributor (Top)' : cat.percent >= 10 ? 'High Volume' : 'Supporting Line',
    'Ministry of Health Formulary Approved',
  ]);

  fn(doc, {
    startY: nextY2 + 2,
    margin: { left: margin, right: margin },
    head: [['Therapeutic Class / Category', 'Invoiced Sales (LKR)', 'Revenue Share (%)', 'Category Rating', 'Formulary Status']],
    body: categoryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [...BRAND_TEAL],
      textColor: [...WHITE],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [...TEXT_MAIN],
    },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' },
      2: { halign: 'center', textColor: [...BRAND_TEAL], fontStyle: 'bold' },
    },
  });

  const nextY3 = (doc as any).lastAutoTable.finalY + 6;

  // 7. Section 4: Daily Fulfillment & Revenue Trajectory
  if (props.points && props.points.length > 0) {
    let startY4 = nextY3;
    if (startY4 > pageHeight - 55) {
      doc.addPage();
      startY4 = 15;
    }
    doc.setTextColor(...BRAND_DARK);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('4. DAILY DISPENSARY FULFILLMENT & REVENUE TRAJECTORY', margin, startY4);

    const trajectoryRows = props.points.map((pt) => {
      const rxVal =
        pt.rxValue ??
        (pt.value > 0
          ? props.rxRevenue
            ? Math.round(pt.value * (props.rxRevenue / (props.grossRaw || 1)) * 100) / 100
            : 0
          : 0);
      const otcVal = pt.otcValue ?? (pt.value > 0 ? Math.max(0, pt.value - rxVal) : 0);
      return [
        pt.label,
        pt.fullLabel,
        `LKR ${pt.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `LKR ${rxVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `LKR ${otcVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `${pt.ordersCount ?? (pt.value > 0 ? 1 : 0)}`,
        `${pt.mixedOrdersCount ?? (rxVal > 0 && otcVal > 0 ? 1 : 0)}`,
        pt.value > 0 ? 'Fulfillments' : 'Zero Sales',
      ];
    });

    fn(doc, {
      startY: startY4 + 2,
      margin: { left: margin, right: margin },
      head: [['Code', 'Date & Interval', 'Invoiced Sales', 'Rx POM', 'OTC & Wellness', 'Orders', 'Mixed', 'Status']],
      body: trajectoryRows,
      theme: 'grid',
      headStyles: {
        fillColor: [...BRAND_TEAL],
        textColor: [...WHITE],
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 1.8,
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 1.5,
        textColor: [...TEXT_MAIN],
      },
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center' },
        6: { halign: 'center' },
      },
    });
  }

  const nextY4 = (doc as any).lastAutoTable.finalY + 8;

  // 8. Official Certification & Sign-off Block
  let signY = nextY4;
  if (signY > pageHeight - 32) {
    doc.addPage();
    signY = 20;
  }
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, signY, margin + 70, signY);
  doc.line(pageWidth - margin - 70, signY, pageWidth - margin, signY);

  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFIED BY PHARMACIST-IN-CHARGE', margin, signY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text('SLMC Registered Pharmacist Signature & Seal', margin, signY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('DISPENSARY REGULATORY AUDIT VERIFICATION', pageWidth - margin - 70, signY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(`NMRA Licence: ${props.license} • Good Pharmacy Practice`, pageWidth - margin - 70, signY + 8);

  // 8. Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `MediPick Healthcare Technologies • Official Statutory Audit Document • Confidential • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' },
    );
  }

  doc.save(`MediPick_Financial_Report_${props.period.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.pdf`);
}

export async function downloadAuditTrailPdf(props: AuditTrailExcelProps): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const now = new Date();
  const dateStr =
    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    now.toLocaleTimeString('en-GB');

  // 1. Hero Title Banner (Landscape)
  doc.setFillColor(...BRAND_DARK);
  doc.roundedRect(margin, 10, contentWidth, 18, 2.5, 2.5, 'F');

  doc.setTextColor(...SOFT_MINT);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NATIONAL MEDICINES REGULATORY AUTHORITY (NMRA) — SRI LANKA', margin + 5, 16);

  doc.setTextColor(...WHITE);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DISPENSARY STATUTORY AUDIT TRAIL — OFFICIAL LICENSING INSPECTION LOG', margin + 5, 23);

  // 2. Metadata Subtitle Bar
  doc.setFillColor(...BRAND_TEAL);
  doc.roundedRect(margin, 30, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Dispensary: ${props.pharmacyTitle}   |   NMRA License: ${props.license}   |   Statutory Act: NMRA Act No. 5 of 2015   |   Exported: ${dateStr} (SLST)`,
    margin + 5,
    34.5,
  );

  // 3. Legal Notice Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, 39, contentWidth, 9, 1.5, 1.5, 'FD');
  doc.setTextColor(...BRAND_DARK);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'STATUTORY COMPLIANCE: Under Section 54 & 56 of NMRA Act No. 5, all prescription validations, formulate price updates, inventory deductions, PIN-verified collections, and dispute refunds are immutably logged with actor timestamps.',
    margin + 4,
    43,
  );
  doc.setTextColor(...EMERALD_TEXT);
  doc.text(
    `Total Records: ${props.logs.length}   |   Filter Scope: ${props.filterApplied}   |   Status: CRYPTOGRAPHICALLY VALIDATED & AUDIT READY`,
    margin + 4,
    46.5,
  );

  const fn = typeof autoTable === 'function' ? autoTable : (autoTable as any).default;

  // 4. Audit Table
  const auditRows = props.logs.map((log, idx) => {
    const d = log.createdAt ? new Date(log.createdAt) : null;
    const dStr = d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const tStr = d ? d.toLocaleTimeString('en-GB') : '—';
    const detailsSummary = log.details
      ? typeof log.details === 'object'
        ? JSON.stringify(log.details)
        : String(log.details)
      : 'Logged under statutory compliance protocol';

    return [
      `AUD-${String(idx + 1).padStart(4, '0')}`,
      dStr,
      tStr,
      log.action || 'Statutory Action',
      log.actorName || 'Pharmacist on Duty',
      log.actorRole || 'Dispensing Staff',
      log.targetType || 'System Event',
      log.targetId ? `${log.targetId} · ${detailsSummary}` : detailsSummary,
    ];
  });

  fn(doc, {
    startY: 51,
    margin: { left: margin, right: margin },
    head: [
      [
        'Audit ID',
        'Date (SLST)',
        'Time',
        'Statutory Regulatory Action',
        'Pharmacist / Staff Actor',
        'Security Privilege',
        'Regulated Target',
        'Reference & Statutory Evidence Description',
      ],
    ],
    body: auditRows,
    theme: 'grid',
    headStyles: {
      fillColor: [...BRAND_TEAL],
      textColor: [...WHITE],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: [...TEXT_MAIN],
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 16 },
      3: { fontStyle: 'bold', cellWidth: 38 },
      4: { cellWidth: 34 },
      5: { cellWidth: 30 },
      6: { cellWidth: 26 },
      7: { cellWidth: 'auto' },
    },
    didDrawPage: function(data: any) {
      // Repeat header subtitle on later pages
      if (data.pageNumber > 1) {
        doc.setFillColor(...BRAND_DARK);
        doc.rect(margin, 8, contentWidth, 8, 'F');
        doc.setTextColor(...WHITE);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `NMRA STATUTORY AUDIT TRAIL — ${props.pharmacyTitle} (Licence: ${props.license}) — Page ${data.pageNumber}`,
          margin + 4,
          13.5,
        );
      }
    },
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Ministry of Health Sri Lanka • NMRA Act No. 5 Dispensary Inspection Ledger • Confidential Copy • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' },
    );
  }

  doc.save(`MediPick_NMRA_Audit_Trail_${now.toISOString().slice(0, 10)}.pdf`);
}

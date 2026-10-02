import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalyticsExportData {
  filter: string;
  dateRange: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    totalItemsSold: number;
    aov: number;
    aoq: number;
    revenueGrowth: number;
    ordersGrowth: number;
  };
  timeline: Array<{
    label: string;
    date: string;
    revenue: number;
    orders: number;
    delivered: number;
    cancelled: number;
  }>;
  productLeaderboard: Array<{
    id: string;
    title: string;
    timesOrdered: number;
    totalQuantity: number;
    totalRevenue: number;
    avgQuantityPerOrder: number;
    revenueShare: number;
    rank: number;
  }>;
  areaAnalytics: Array<{
    area: string;
    orderCount: number;
    totalRevenue: number;
    totalDeliveryCharges: number;
    revenueShare: number;
  }>;
  channels: {
    fulfillment: Array<{
      type: string;
      label: string;
      orderCount: number;
      totalRevenue: number;
      share: number;
    }>;
    marketingSources: Array<{
      source: string;
      label: string;
      orderCount: number;
      totalRevenue: number;
      aov: number;
      share: number;
    }>;
  };
  peakHours: Array<{
    hour: number;
    hourLabel: string;
    orderCount: number;
    totalRevenue: number;
  }>;
}

// ── 1. XLSX Multi-Sheet Excel Export (Requirement #7) ─────────────────────────
export function exportAnalyticsToXLSX(
  data: AnalyticsExportData,
  historicalOrders?: any[]
): void {
  const wb = XLSX.utils.book_new();
  const dateStamp = new Date().toISOString().split('T')[0];

  // Sheet 1: Executive KPI Overview
  const kpiRows = [
    ['Cafe Little Karachi — Executive Analytics Summary'],
    ['Report Period', data.dateRange.label],
    ['Generated At', new Date().toLocaleString()],
    [],
    ['Metric', 'Value', 'Growth vs Prior Period'],
    ['Gross Revenue (PKR)', data.summary.totalRevenue, `${data.summary.revenueGrowth}%`],
    ['Total Orders Placed', data.summary.totalOrders, `${data.summary.ordersGrowth}%`],
    ['Delivered Orders', data.summary.deliveredOrders, '-'],
    ['Cancelled / Voided Orders', data.summary.cancelledOrders, '-'],
    ['Total Dishes Prepared (Units)', data.summary.totalItemsSold, '-'],
    ['Average Order Value (AOV in PKR)', data.summary.aov, '-'],
    ['Average Order Quantity (AOQ in units)', data.summary.aoq, '-'],
  ];
  const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows);
  XLSX.utils.book_append_sheet(wb, wsKPI, 'Executive_Summary');

  // Sheet 2: Product Performance Leaderboard
  const productRows = [
    [
      'Rank',
      'Product Title',
      'Times Ordered (Frequency)',
      'Total Quantity Sold (Units)',
      'Avg Units / Order',
      'Gross Revenue (PKR)',
      'Revenue Contribution (%)',
    ],
    ...data.productLeaderboard.map((p) => [
      p.rank,
      p.title,
      p.timesOrdered,
      p.totalQuantity,
      p.avgQuantityPerOrder,
      p.totalRevenue,
      `${p.revenueShare}%`,
    ]),
  ];
  const wsProducts = XLSX.utils.aoa_to_sheet(productRows);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Product_Sales');

  // Sheet 3: Delivery Areas Performance
  const areaRows = [
    [
      'Rank',
      'Delivery Zone / Area',
      'Delivery Orders Count',
      'Gross Area Revenue (PKR)',
      'Total Delivery Fees Collected (PKR)',
      'Revenue Share (%)',
    ],
    ...data.areaAnalytics.map((a, idx) => [
      idx + 1,
      a.area,
      a.orderCount,
      a.totalRevenue,
      a.totalDeliveryCharges,
      `${a.revenueShare}%`,
    ]),
  ];
  const wsAreas = XLSX.utils.aoa_to_sheet(areaRows);
  XLSX.utils.book_append_sheet(wb, wsAreas, 'Delivery_Areas');

  // Sheet 4: Channels & Acquisition
  const channelRows = [
    ['Fulfillment Channel', 'Order Count', 'Gross Revenue (PKR)', 'Volume Share (%)'],
    ...data.channels.fulfillment.map((f) => [
      f.label,
      f.orderCount,
      f.totalRevenue,
      `${f.share}%`,
    ]),
    [],
    ['Marketing Acquisition Source', 'Order Count', 'Gross Revenue (PKR)', 'Avg Order Value (PKR)', 'Share (%)'],
    ...data.channels.marketingSources.map((m) => [
      m.label,
      m.orderCount,
      m.totalRevenue,
      m.aov,
      `${m.share}%`,
    ]),
  ];
  const wsChannels = XLSX.utils.aoa_to_sheet(channelRows);
  XLSX.utils.book_append_sheet(wb, wsChannels, 'Channels_Attribution');

  // Sheet 5: Historical Orders (if available)
  if (historicalOrders && historicalOrders.length > 0) {
    const orderRows = [
      [
        'Order #',
        'Date & Time',
        'Customer Name',
        'Phone',
        'Order Mode',
        'Table / Area',
        'Items Summary',
        'Total Amount (PKR)',
        'Status',
      ],
      ...historicalOrders.map((ord) => [
        ord.orderNumber,
        new Date(ord.createdAt).toLocaleString(),
        ord.customerName,
        ord.phone || 'N/A',
        ord.ordertype,
        ord.tableNumber ? `Table #${ord.tableNumber}` : ord.area || '-',
        (ord.items || []).map((it: any) => `${it.quantity}x ${it.title}`).join('; '),
        ord.totalAmount,
        ord.status,
      ]),
    ];
    const wsOrders = XLSX.utils.aoa_to_sheet(orderRows);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Historical_Orders');
  }

  // Trigger Excel file download
  const filename = `CLK_Analytics_Report_${data.filter}_${dateStamp}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ── 2. CSV Raw Data Export (Requirement #7) ──────────────────────────────────
export function exportAnalyticsToCSV(data: AnalyticsExportData): void {
  const dateStamp = new Date().toISOString().split('T')[0];
  const headers = [
    'Rank',
    'Product Title',
    'Times Ordered',
    'Total Units Sold',
    'Avg Units Per Order',
    'Gross Revenue PKR',
    'Revenue Share %',
  ];

  const rows = data.productLeaderboard.map((p) => [
    p.rank,
    `"${p.title.replace(/"/g, '""')}"`,
    p.timesOrdered,
    p.totalQuantity,
    p.avgQuantityPerOrder,
    p.totalRevenue,
    `${p.revenueShare}%`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `CLK_Product_Sales_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── 3. Branded Executive PDF Report (Requirement #7) ─────────────────────────
export function exportAnalyticsToPDF(data: AnalyticsExportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const dateStamp = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Top Brand Header Banner
  doc.setFillColor(116, 16, 82); // #741052
  doc.rect(0, 0, 595.28, 70, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CAFE LITTLE KARACHI', 35, 32);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Executive Sales & Operational Report · Period: ${data.dateRange.label}`, 35, 52);
  doc.text(`Generated: ${dateStamp}`, 430, 52);

  // Section 1: Executive KPI Summary Table
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Executive KPI Summary', 35, 95);

  autoTable(doc, {
    startY: 105,
    margin: { left: 35, right: 35 },
    head: [['Metric', 'Current Period', 'Growth / Status']],
    body: [
      ['Gross Revenue', `Rs. ${data.summary.totalRevenue.toLocaleString()}`, `${data.summary.revenueGrowth >= 0 ? '+' : ''}${data.summary.revenueGrowth}% vs prior period`],
      ['Total Orders Placed', `${data.summary.totalOrders}`, `${data.summary.ordersGrowth >= 0 ? '+' : ''}${data.summary.ordersGrowth}% vs prior period`],
      ['Delivered / Fulfilled Orders', `${data.summary.deliveredOrders}`, 'Completed'],
      ['Cancelled / Voided Orders', `${data.summary.cancelledOrders}`, 'Voided'],
      ['Average Order Value (AOV)', `Rs. ${data.summary.aov.toLocaleString()}`, 'Per order basket'],
      ['Average Order Quantity (AOQ)', `${data.summary.aoq} items`, `${data.summary.totalItemsSold} total items sold`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [116, 16, 82], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  // Section 2: Top Selling Products Table
  const lastY1 = (doc as any).lastAutoTable.finalY || 240;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Top Selling Products (Leaderboard)', 35, lastY1 + 25);

  const topProducts = data.productLeaderboard.slice(0, 10);
  autoTable(doc, {
    startY: lastY1 + 32,
    margin: { left: 35, right: 35 },
    head: [['Rank', 'Dish / Platter Name', 'Times Ordered', 'Units Sold', 'Gross Revenue', 'Share %']],
    body: topProducts.map((p) => [
      `#${p.rank}`,
      p.title,
      `${p.timesOrdered}x`,
      `${p.totalQuantity}`,
      `Rs. ${p.totalRevenue.toLocaleString()}`,
      `${p.revenueShare}%`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [116, 16, 82], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
  });

  // Section 3: Delivery Areas Performance
  const lastY2 = (doc as any).lastAutoTable.finalY || 450;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Top Delivery Areas', 35, lastY2 + 25);

  const topAreas = data.areaAnalytics.slice(0, 8);
  autoTable(doc, {
    startY: lastY2 + 32,
    margin: { left: 35, right: 35 },
    head: [['Area / Zone', 'Delivery Orders', 'Gross Area Revenue', 'Delivery Fees Collected']],
    body: topAreas.length > 0 ? topAreas.map((a) => [
      a.area,
      `${a.orderCount} orders`,
      `Rs. ${a.totalRevenue.toLocaleString()}`,
      `Rs. ${a.totalDeliveryCharges.toLocaleString()}`,
    ]) : [['No delivery orders in this period', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
  });

  // Footer Branding
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Cafe Little Karachi — Confidential Business Intelligence Report',
      35,
      820
    );
    doc.text(`Page ${i} of ${pageCount}`, 520, 820);
  }

  doc.save(`CLK_Executive_Report_${data.filter}_${new Date().toISOString().split('T')[0]}.pdf`);
}

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory2 as InventoryIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Category as CategoryIcon,
  Warning as WarningIcon,
  FileDownload as DownloadIcon,
  People as PeopleIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import api from '../api/axios';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtCurrency = (v) =>
  '$' +
  Number(v || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtMonth = (m) =>
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
    (m._id?.month || m.month) - 1
  ] +
  ' ' +
  (m._id?.year || m.year);

const PIE_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0EA5E9'];

/* ------------------------------------------------------------------ */
/*  KPI Card Component                                                 */
/* ------------------------------------------------------------------ */

const KpiCard = ({ title, value, subtitle, icon, color, bgColor }) => (
  <Card
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      height: '100%',
      transition: 'box-shadow 0.2s ease-in-out',
      '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={500}
            sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}
          >
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, color: '#1E293B' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { color, fontSize: 24 },
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

/* ------------------------------------------------------------------ */
/*  Section Wrapper                                                    */
/* ------------------------------------------------------------------ */

const SectionPaper = ({ title, children, action }) => (
  <Paper
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        px: 3,
        pt: 3,
        pb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography variant="h6" fontWeight={600} color="#1E293B">
        {title}
      </Typography>
      {action}
    </Box>
    <Box sx={{ px: 3, pb: 3 }}>{children}</Box>
  </Paper>
);

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'white',
          p: 1.5,
          borderRadius: 2,
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0',
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        {payload.map((entry, i) => (
          <Typography key={i} variant="body2" sx={{ color: entry.color, fontWeight: 600 }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name !== 'Orders'
              ? fmtCurrency(entry.value)
              : entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

const EmptyState = ({ message }) => (
  <Box
    sx={{
      py: 6,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'text.secondary',
      border: '2px dashed',
      borderColor: 'divider',
      borderRadius: 2,
    }}
  >
    <AssessmentIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
    <Typography variant="body2">{message}</Typography>
  </Box>
);

/* ------------------------------------------------------------------ */
/*  Styled Table                                                       */
/* ------------------------------------------------------------------ */

const StyledTableCell = (props) => (
  <TableCell
    {...props}
    sx={{
      fontWeight: props.head ? 600 : 400,
      color: props.head ? '#475569' : '#1E293B',
      fontSize: props.head ? '0.75rem' : '0.85rem',
      textTransform: props.head ? 'uppercase' : 'none',
      letterSpacing: props.head ? 0.5 : 0,
      borderBottom: '1px solid #F1F5F9',
      py: 1.5,
      ...props.sx,
    }}
  />
);

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

const Reports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Data stores
  const [salesData, setSalesData] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch helpers                                                    */
  /* ---------------------------------------------------------------- */

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reports/sales-summary');
      setSalesData(data.data);
    } catch (err) {
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPurchase = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reports/purchase-summary');
      setPurchaseData(data.data);
    } catch (err) {
      toast.error('Failed to load purchase report');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reports/inventory');
      setInventoryData(data.data);
    } catch (err) {
      toast.error('Failed to load inventory report');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reports/invoice-summary');
      setInvoiceData(data.data);
    } catch (err) {
      toast.error('Failed to load invoice report');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Load data when tab changes                                       */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const loaders = [fetchSales, fetchPurchase, fetchInventory, fetchInvoice];
    loaders[activeTab]();
  }, [activeTab, fetchSales, fetchPurchase, fetchInventory, fetchInvoice]);

  /* ---------------------------------------------------------------- */
  /*  CSV export                                                       */
  /* ---------------------------------------------------------------- */

  const exportCsv = () => {
    let csvContent = '';
    let filename = 'report.csv';

    const toCsvRow = (arr) => arr.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',') + '\n';

    if (activeTab === 0 && salesData) {
      filename = 'sales-report.csv';
      // Top products
      csvContent += 'TOP PRODUCTS\n';
      csvContent += toCsvRow(['Product', 'Quantity Sold', 'Revenue']);
      (salesData.topProducts || []).forEach((p) => {
        csvContent += toCsvRow([p.productTitle, p.totalQty, p.totalRevenue]);
      });
      csvContent += '\n';
      // Top customers
      csvContent += 'TOP CUSTOMERS\n';
      csvContent += toCsvRow(['Name', 'Company', 'Orders', 'Total Spent']);
      (salesData.topCustomers || []).forEach((c) => {
        csvContent += toCsvRow([c.name, c.company, c.totalOrders, c.totalSpent]);
      });
      csvContent += '\n';
      // Monthly trend
      csvContent += 'MONTHLY TREND\n';
      csvContent += toCsvRow(['Month', 'Revenue', 'Orders']);
      (salesData.monthlyTrend || []).forEach((m) => {
        csvContent += toCsvRow([fmtMonth(m), m.revenue, m.orders]);
      });
    } else if (activeTab === 1 && purchaseData) {
      filename = 'purchase-report.csv';
      csvContent += 'TOP SUPPLIERS\n';
      csvContent += toCsvRow(['Name', 'Company', 'Orders', 'Total Cost']);
      (purchaseData.topSuppliers || []).forEach((s) => {
        csvContent += toCsvRow([s.name, s.company, s.totalOrders, s.totalCost]);
      });
      csvContent += '\n';
      csvContent += 'MONTHLY TREND\n';
      csvContent += toCsvRow(['Month', 'Cost', 'Orders']);
      (purchaseData.monthlyTrend || []).forEach((m) => {
        csvContent += toCsvRow([fmtMonth(m), m.cost, m.orders]);
      });
    } else if (activeTab === 2 && inventoryData) {
      filename = 'inventory-report.csv';
      csvContent += 'CATEGORY BREAKDOWN\n';
      csvContent += toCsvRow(['Category', 'Product Count', 'Total Stock', 'Total Value']);
      (inventoryData.categoryBreakdown || []).forEach((c) => {
        csvContent += toCsvRow([c._id, c.count, c.totalStock, c.totalValue]);
      });
      csvContent += '\n';
      csvContent += 'LOW STOCK ITEMS\n';
      csvContent += toCsvRow(['Title', 'SKU', 'Stock', 'Reorder Level', 'Price', 'Category']);
      (inventoryData.lowStockItems || []).forEach((item) => {
        csvContent += toCsvRow([item.title, item.sku, item.stock, item.reorderLevel, item.price, item.category]);
      });
    } else if (activeTab === 3 && invoiceData) {
      filename = 'invoice-report.csv';
      csvContent += 'STATUS BREAKDOWN\n';
      csvContent += toCsvRow(['Status', 'Count', 'Total Amount']);
      (invoiceData.statusBreakdown || []).forEach((s) => {
        csvContent += toCsvRow([s._id, s.count, s.totalAmount]);
      });
      csvContent += '\n';
      csvContent += 'OVERDUE INVOICES\n';
      csvContent += toCsvRow(['Invoice #', 'Customer', 'Company', 'Total', 'Due Date']);
      (invoiceData.overdue || []).forEach((inv) => {
        csvContent += toCsvRow([
          inv.invoiceNumber,
          inv.customer?.name,
          inv.customer?.company,
          inv.total,
          dayjs(inv.dueDate).format('MMM D, YYYY'),
        ]);
      });
      csvContent += '\n';
      csvContent += 'RECENT PAID\n';
      csvContent += toCsvRow(['Invoice #', 'Customer', 'Company', 'Total', 'Paid Date']);
      (invoiceData.recentPaid || []).forEach((inv) => {
        csvContent += toCsvRow([
          inv.invoiceNumber,
          inv.customer?.name,
          inv.customer?.company,
          inv.total,
          dayjs(inv.updatedAt).format('MMM D, YYYY'),
        ]);
      });
    }

    if (!csvContent) {
      toast.info('No data to export');
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Report exported successfully');
  };

  /* ================================================================ */
  /*  TAB PANELS                                                       */
  /* ================================================================ */

  /* ---------------------------------------------------------------- */
  /*  Sales Tab                                                        */
  /* ---------------------------------------------------------------- */
  const renderSalesTab = () => {
    if (!salesData) return null;
    const { summary = {}, topProducts = [], topCustomers = [], monthlyTrend = [] } = salesData;

    const chartData = monthlyTrend.map((m) => ({
      month: fmtMonth(m),
      Revenue: m.revenue,
      Orders: m.orders,
    }));

    return (
      <Box>
        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <KpiCard
              title="Total Orders"
              value={Number(summary.totalOrders || 0).toLocaleString()}
              subtitle="All-time sales orders"
              icon={<ShoppingCartIcon />}
              color="#2563EB"
              bgColor="#EFF6FF"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <KpiCard
              title="Total Revenue"
              value={fmtCurrency(summary.totalRevenue)}
              subtitle="Gross revenue earned"
              icon={<TrendingUpIcon />}
              color="#059669"
              bgColor="#F0FDF4"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <KpiCard
              title="Avg Order Value"
              value={fmtCurrency(summary.avgOrderValue)}
              subtitle="Per order average"
              icon={<MoneyIcon />}
              color="#7C3AED"
              bgColor="#F5F3FF"
            />
          </Grid>
        </Grid>

        {/* Revenue Trend Chart */}
        <Box sx={{ mb: 4 }}>
          <SectionPaper title="Monthly Revenue Trend">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ fill: '#2563EB', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="Orders"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#7C3AED', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No monthly sales data available yet" />
            )}
          </SectionPaper>
        </Box>

        {/* Tables */}
        <Grid container spacing={3}>
          {/* Top Products */}
          <Grid item xs={12} lg={6}>
            <SectionPaper title="Top Products">
              {topProducts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell head="true">Product</StyledTableCell>
                        <StyledTableCell head="true" align="right">Qty Sold</StyledTableCell>
                        <StyledTableCell head="true" align="right">Revenue</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProducts.map((p, i) => (
                        <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <StyledTableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 1,
                                  bgcolor: PIE_COLORS[i % PIE_COLORS.length] + '15',
                                  color: PIE_COLORS[i % PIE_COLORS.length],
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {i + 1}
                              </Box>
                              <Typography variant="body2" fontWeight={500} noWrap>
                                {p.productTitle}
                              </Typography>
                            </Box>
                          </StyledTableCell>
                          <StyledTableCell align="right">
                            {Number(p.totalQty).toLocaleString()}
                          </StyledTableCell>
                          <StyledTableCell align="right" sx={{ fontWeight: 600, color: '#059669' }}>
                            {fmtCurrency(p.totalRevenue)}
                          </StyledTableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <EmptyState message="No product data available" />
              )}
            </SectionPaper>
          </Grid>

          {/* Top Customers */}
          <Grid item xs={12} lg={6}>
            <SectionPaper title="Top Customers">
              {topCustomers.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell head="true">Customer</StyledTableCell>
                        <StyledTableCell head="true" align="right">Orders</StyledTableCell>
                        <StyledTableCell head="true" align="right">Total Spent</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCustomers.map((c, i) => (
                        <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <StyledTableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {c.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {c.company}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell align="right">{c.totalOrders}</StyledTableCell>
                          <StyledTableCell align="right" sx={{ fontWeight: 600, color: '#2563EB' }}>
                            {fmtCurrency(c.totalSpent)}
                          </StyledTableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <EmptyState message="No customer data available" />
              )}
            </SectionPaper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Purchase Tab                                                     */
  /* ---------------------------------------------------------------- */
  const renderPurchaseTab = () => {
    if (!purchaseData) return null;
    const { summary = {}, topSuppliers = [], monthlyTrend = [] } = purchaseData;

    const chartData = monthlyTrend.map((m) => ({
      month: fmtMonth(m),
      Cost: m.cost,
      Orders: m.orders,
    }));

    return (
      <Box>
        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <KpiCard
              title="Total PO Count"
              value={Number(summary.totalOrders || 0).toLocaleString()}
              subtitle="All-time purchase orders"
              icon={<ShippingIcon />}
              color="#7C3AED"
              bgColor="#F5F3FF"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <KpiCard
              title="Total Cost"
              value={fmtCurrency(summary.totalCost)}
              subtitle="Gross purchase expenditure"
              icon={<MoneyIcon />}
              color="#DC2626"
              bgColor="#FEF2F2"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <KpiCard
              title="Avg PO Value"
              value={fmtCurrency(summary.avgOrderValue)}
              subtitle="Per order average"
              icon={<AssessmentIcon />}
              color="#0EA5E9"
              bgColor="#F0F9FF"
            />
          </Grid>
        </Grid>

        {/* Monthly Trend Chart */}
        <Box sx={{ mb: 4 }}>
          <SectionPaper title="Monthly Purchase Trend">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="cost"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="cost"
                    type="monotone"
                    dataKey="Cost"
                    stroke="#7C3AED"
                    strokeWidth={3}
                    dot={{ fill: '#7C3AED', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="Orders"
                    stroke="#0EA5E9"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#0EA5E9', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No monthly purchase data available yet" />
            )}
          </SectionPaper>
        </Box>

        {/* Top Suppliers Table */}
        <SectionPaper title="Top Suppliers">
          {topSuppliers.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell head="true">Supplier</StyledTableCell>
                    <StyledTableCell head="true" align="right">Orders</StyledTableCell>
                    <StyledTableCell head="true" align="right">Total Cost</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topSuppliers.map((s, i) => (
                    <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: PIE_COLORS[i % PIE_COLORS.length] + '15',
                              color: PIE_COLORS[i % PIE_COLORS.length],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {s.name?.charAt(0)?.toUpperCase() || 'S'}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {s.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {s.company}
                            </Typography>
                          </Box>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell align="right">{s.totalOrders}</StyledTableCell>
                      <StyledTableCell align="right" sx={{ fontWeight: 600, color: '#7C3AED' }}>
                        {fmtCurrency(s.totalCost)}
                      </StyledTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyState message="No supplier data available" />
          )}
        </SectionPaper>
      </Box>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Inventory Tab                                                    */
  /* ---------------------------------------------------------------- */
  const renderInventoryTab = () => {
    if (!inventoryData) return null;
    const { summary = {}, categoryBreakdown = [], lowStockItems = [] } = inventoryData;

    const pieData = categoryBreakdown.map((c) => ({
      name: c._id || 'Uncategorized',
      value: c.totalValue,
    }));

    return (
      <Box>
        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <KpiCard
              title="Total Products"
              value={Number(summary.totalProducts || 0).toLocaleString()}
              subtitle="SKUs in catalog"
              icon={<InventoryIcon />}
              color="#2563EB"
              bgColor="#EFF6FF"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <KpiCard
              title="Total Stock"
              value={Number(summary.totalStock || 0).toLocaleString()}
              subtitle="Units on hand"
              icon={<CategoryIcon />}
              color="#059669"
              bgColor="#F0FDF4"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <KpiCard
              title="Total Value"
              value={fmtCurrency(summary.totalValue)}
              subtitle="Inventory valuation"
              icon={<MoneyIcon />}
              color="#7C3AED"
              bgColor="#F5F3FF"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <KpiCard
              title="Avg Price"
              value={fmtCurrency(summary.avgPrice)}
              subtitle="Per product average"
              icon={<AssessmentIcon />}
              color="#D97706"
              bgColor="#FFFBEB"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Category Breakdown Pie Chart */}
          <Grid item xs={12} lg={5}>
            <SectionPaper title="Category Breakdown by Value">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={{ stroke: '#94A3B8' }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => fmtCurrency(value)}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: '#475569', fontSize: 12 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No category data available" />
              )}
            </SectionPaper>
          </Grid>

          {/* Low Stock Items */}
          <Grid item xs={12} lg={7}>
            <SectionPaper title="Low Stock Items">
              {lowStockItems.length > 0 ? (
                <TableContainer sx={{ maxHeight: 380 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell head="true">Product</StyledTableCell>
                        <StyledTableCell head="true">SKU</StyledTableCell>
                        <StyledTableCell head="true" align="right">Stock</StyledTableCell>
                        <StyledTableCell head="true" align="right">Reorder Lvl</StyledTableCell>
                        <StyledTableCell head="true" align="right">Price</StyledTableCell>
                        <StyledTableCell head="true">Category</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockItems.map((item, i) => {
                        const critical = item.stock <= Math.floor((item.reorderLevel || 0) / 2);
                        return (
                          <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <StyledTableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {critical && (
                                  <WarningIcon sx={{ fontSize: 16, color: '#DC2626' }} />
                                )}
                                <Typography variant="body2" fontWeight={500}>
                                  {item.title}
                                </Typography>
                              </Box>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography
                                variant="caption"
                                sx={{
                                  bgcolor: '#F1F5F9',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {item.sku}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell
                              align="right"
                              sx={{
                                fontWeight: 600,
                                color: critical ? '#DC2626' : '#D97706',
                              }}
                            >
                              {item.stock}
                            </StyledTableCell>
                            <StyledTableCell align="right">{item.reorderLevel}</StyledTableCell>
                            <StyledTableCell align="right">{fmtCurrency(item.price)}</StyledTableCell>
                            <StyledTableCell>{item.category}</StyledTableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <EmptyState message="All products are well-stocked" />
              )}
            </SectionPaper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Invoice Tab                                                      */
  /* ---------------------------------------------------------------- */
  const renderInvoiceTab = () => {
    if (!invoiceData) return null;
    const { statusBreakdown = [], overdue = [], recentPaid = [] } = invoiceData;

    const pieData = statusBreakdown.map((s) => ({
      name: s._id,
      value: s.totalAmount,
      count: s.count,
    }));

    // Compute totals for KPIs
    const totalInvoices = statusBreakdown.reduce((sum, s) => sum + (s.count || 0), 0);
    const totalAmount = statusBreakdown.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const overdueAmount = overdue.reduce((sum, inv) => sum + (inv.total || 0), 0);

    return (
      <Box>
        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <KpiCard
              title="Total Invoices"
              value={totalInvoices.toLocaleString()}
              subtitle={`Across ${statusBreakdown.length} statuses`}
              icon={<ReceiptIcon />}
              color="#2563EB"
              bgColor="#EFF6FF"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <KpiCard
              title="Total Amount"
              value={fmtCurrency(totalAmount)}
              subtitle="All invoices combined"
              icon={<MoneyIcon />}
              color="#059669"
              bgColor="#F0FDF4"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <KpiCard
              title="Overdue Amount"
              value={fmtCurrency(overdueAmount)}
              subtitle={`${overdue.length} overdue invoice${overdue.length !== 1 ? 's' : ''}`}
              icon={<WarningIcon />}
              color="#DC2626"
              bgColor="#FEF2F2"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Status Breakdown Pie Chart */}
          <Grid item xs={12} lg={5}>
            <SectionPaper title="Invoice Status Breakdown">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={{ stroke: '#94A3B8' }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${fmtCurrency(value)} (${props.payload.count} invoices)`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: '#475569', fontSize: 12 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No invoice data available" />
              )}
            </SectionPaper>
          </Grid>

          {/* Overdue & Recent Paid */}
          <Grid item xs={12} lg={7}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Overdue Invoices */}
              <SectionPaper title="Overdue Invoices">
                {overdue.length > 0 ? (
                  <TableContainer sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell head="true">Invoice #</StyledTableCell>
                          <StyledTableCell head="true">Customer</StyledTableCell>
                          <StyledTableCell head="true" align="right">Total</StyledTableCell>
                          <StyledTableCell head="true" align="right">Due Date</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {overdue.map((inv, i) => (
                          <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <StyledTableCell>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#DC2626' }}>
                                {inv.invoiceNumber}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {inv.customer?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {inv.customer?.company}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell align="right" sx={{ fontWeight: 600 }}>
                              {fmtCurrency(inv.total)}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                              <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 500 }}>
                                {dayjs(inv.dueDate).format('MMM D, YYYY')}
                              </Typography>
                            </StyledTableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <EmptyState message="No overdue invoices -- great job!" />
                )}
              </SectionPaper>

              {/* Recent Paid */}
              <SectionPaper title="Recently Paid">
                {recentPaid.length > 0 ? (
                  <TableContainer sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell head="true">Invoice #</StyledTableCell>
                          <StyledTableCell head="true">Customer</StyledTableCell>
                          <StyledTableCell head="true" align="right">Total</StyledTableCell>
                          <StyledTableCell head="true" align="right">Paid Date</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentPaid.map((inv, i) => (
                          <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <StyledTableCell>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#059669' }}>
                                {inv.invoiceNumber}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {inv.customer?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {inv.customer?.company}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell align="right" sx={{ fontWeight: 600 }}>
                              {fmtCurrency(inv.total)}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                              {dayjs(inv.updatedAt).format('MMM D, YYYY')}
                            </StyledTableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <EmptyState message="No recently paid invoices" />
                )}
              </SectionPaper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  /* ================================================================ */
  /*  Tab Panels Array                                                 */
  /* ================================================================ */

  const tabPanels = [renderSalesTab, renderPurchaseTab, renderInventoryTab, renderInvoiceTab];

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <Box>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1E293B" gutterBottom>
            Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analyze your business performance across sales, purchases, inventory, and invoices
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportCsv}
          disabled={loading}
          sx={{
            borderColor: '#CBD5E1',
            color: '#475569',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              borderColor: '#2563EB',
              color: '#2563EB',
              bgcolor: '#EFF6FF',
            },
          }}
        >
          Export CSV
        </Button>
      </Box>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              bgcolor: '#2563EB',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: 56,
              color: '#64748B',
              '&.Mui-selected': {
                color: '#2563EB',
              },
            },
          }}
        >
          <Tab icon={<TrendingUpIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Sales Report" />
          <Tab icon={<ShippingIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Purchase Report" />
          <Tab icon={<InventoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Inventory Report" />
          <Tab icon={<ReceiptIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Invoice Report" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 12,
            gap: 2,
          }}
        >
          <CircularProgress size={48} sx={{ color: '#2563EB' }} />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Loading report data...
          </Typography>
        </Box>
      ) : (
        <Box>{tabPanels[activeTab]()}</Box>
      )}
    </Box>
  );
};

export default Reports;

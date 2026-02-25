import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Skeleton,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as RevenueIcon,
  ShoppingCart as SalesIcon,
  People as CustomersIcon,
  Inventory2 as ProductsIcon,
  LocalShipping as PurchaseIcon,
  Warning as WarningIcon,
  Receipt as InvoiceIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import api from '../api/axios';
import AIInsights from '../components/AIInsights';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_COLORS = ['#94A3B8', '#2563EB', '#7C3AED', '#059669', '#DC2626'];

const STATUS_MAP = {
  Draft: '#94A3B8',
  Confirmed: '#2563EB',
  Shipped: '#7C3AED',
  Delivered: '#059669',
  Cancelled: '#DC2626',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard');
        const d = data.data;
        setStats(d.stats);

        // Format monthly revenue for chart
        const chartData = (d.monthlyRevenue || []).map((item) => ({
          month: MONTHS[(item._id?.month || 1) - 1],
          revenue: item.revenue || 0,
          orders: item.count || 0,
        }));
        setMonthlyRevenue(chartData);

        // Format status distribution for pie chart
        const pieData = (d.salesStatusDistribution || []).map((item) => ({
          name: item._id,
          value: item.count,
        }));
        setStatusDist(pieData);

        setRecentSales(d.recentSalesOrders || []);
        setRecentPurchases(d.recentPurchaseOrders || []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: stats ? `$${Number(stats.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00',
      subtitle: `${stats?.totalPaid ? `$${Number(stats.totalPaid).toLocaleString()} paid` : 'No payments yet'}`,
      icon: <RevenueIcon />,
      color: '#2563EB',
      bgColor: '#EFF6FF',
    },
    {
      title: 'Sales Orders',
      value: stats?.totalSalesOrders?.toString() || '0',
      subtitle: 'Total orders created',
      icon: <SalesIcon />,
      color: '#059669',
      bgColor: '#F0FDF4',
    },
    {
      title: 'Customers',
      value: stats?.totalCustomers?.toString() || '0',
      subtitle: 'Active customers',
      icon: <CustomersIcon />,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
    },
    {
      title: 'Products',
      value: stats?.totalProducts?.toString() || '0',
      subtitle: stats?.lowStockProducts > 0
        ? `${stats.lowStockProducts} low stock`
        : 'All stocked',
      icon: <ProductsIcon />,
      color: '#D97706',
      bgColor: '#FFFBEB',
      alert: stats?.lowStockProducts > 0,
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 2, boxShadow: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="primary.main" fontWeight={600}>
            Revenue: ${Number(payload[0].value).toLocaleString()}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your business operations
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        {kpiCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                {loading ? (
                  <Box>
                    <Skeleton width={100} height={20} />
                    <Skeleton width={80} height={36} sx={{ my: 1 }} />
                    <Skeleton width={120} height={16} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="h2" sx={{ mb: 0.5 }}>
                        {card.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: card.alert ? 'warning.main' : 'text.secondary',
                          fontWeight: card.alert ? 600 : 400,
                        }}
                      >
                        {card.alert && '⚠ '}{card.subtitle}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: card.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '& svg': { color: card.color, fontSize: 24 },
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Revenue Overview
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              ) : monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2">Revenue chart will appear once you have sales data</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Order Status
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              ) : statusDist.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDist.map((entry, index) => (
                        <Cell key={entry.name} fill={STATUS_MAP[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span style={{ color: '#475569', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2">No order data available yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders Row */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Recent Sales Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 3, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">Recent Sales Orders</Typography>
                <Chip
                  label="View all"
                  size="small"
                  onClick={() => navigate('/sales-orders')}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
              {loading ? (
                <Box sx={{ px: 3, pb: 3 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
                  ))}
                </Box>
              ) : recentSales.length > 0 ? (
                <List disablePadding sx={{ px: 1.5, pb: 1.5 }}>
                  {recentSales.map((order) => (
                    <ListItemButton
                      key={order._id}
                      sx={{ borderRadius: 2, mb: 0.3 }}
                      onClick={() => navigate('/sales-orders')}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 700 }}>
                          SO
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={600}>{order.orderNumber}</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              ${Number(order.totalPrice || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.3 }}>
                            <Typography variant="caption" color="text.secondary">
                              {order.customer?.name || 'Unknown'}
                            </Typography>
                            <Chip
                              label={order.status}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: STATUS_MAP[order.status] ? `${STATUS_MAP[order.status]}15` : '#F1F5F9',
                                color: STATUS_MAP[order.status] || '#475569',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No recent sales orders</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Purchase Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 3, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">Recent Purchase Orders</Typography>
                <Chip
                  label="View all"
                  size="small"
                  onClick={() => navigate('/purchase-orders')}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
              {loading ? (
                <Box sx={{ px: 3, pb: 3 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
                  ))}
                </Box>
              ) : recentPurchases.length > 0 ? (
                <List disablePadding sx={{ px: 1.5, pb: 1.5 }}>
                  {recentPurchases.map((order) => (
                    <ListItemButton
                      key={order._id}
                      sx={{ borderRadius: 2, mb: 0.3 }}
                      onClick={() => navigate('/purchase-orders')}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#F5F3FF', color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>
                          PO
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={600}>{order.orderNumber}</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              ${Number(order.totalPrice || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.3 }}>
                            <Typography variant="caption" color="text.secondary">
                              {order.supplier?.name || 'Unknown'}
                            </Typography>
                            <Chip
                              label={order.status}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: '#F1F5F9',
                                color: '#475569',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No recent purchase orders</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Insights */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <AIInsights />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
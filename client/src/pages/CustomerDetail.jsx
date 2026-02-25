import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack,
  Email,
  Phone,
  Business,
  LocationOn,
  CalendarToday,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import api from '../api/axios';

// ---------------------------------------------------------------------------
// Status chip color maps
// ---------------------------------------------------------------------------
const ORDER_STATUS_COLORS = {
  Draft: '#475569',
  Confirmed: '#2563EB',
  Shipped: '#7C3AED',
  Delivered: '#059669',
  Cancelled: '#DC2626',
};

const INVOICE_STATUS_COLORS = {
  Unpaid: '#D97706',
  Partial: '#2563EB',
  Paid: '#059669',
  Overdue: '#DC2626',
  Cancelled: '#6B7280',
};

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------
const formatCurrency = (value) =>
  '$' +
  Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ---------------------------------------------------------------------------
// Reusable status chip
// ---------------------------------------------------------------------------
const StatusChip = ({ label, colorMap }) => {
  const bgColor = colorMap[label] || '#94A3B8';
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: `${bgColor}18`,
        color: bgColor,
        fontWeight: 600,
        fontSize: '0.75rem',
        border: `1px solid ${bgColor}40`,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// CustomerDetail page component
// ---------------------------------------------------------------------------
const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [salesOrders, setSalesOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // ---- Fetch all data on mount ---------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [customerRes, ordersRes, invoicesRes] = await Promise.all([
          api.get(`/customers/${id}`),
          api.get('/sales-orders', { params: { customer: id } }),
          api.get('/invoices', { params: { customer: id } }),
        ]);

        // Customer data
        const cust =
          customerRes.data?.data ||
          customerRes.data?.customer ||
          customerRes.data;
        if (!cust || !cust._id) {
          setError('Customer not found');
          return;
        }
        setCustomer(cust);

        // Sales orders
        const ordersList =
          ordersRes.data?.data || ordersRes.data?.salesOrders || [];
        setSalesOrders(ordersList);

        // Invoices
        const invoicesList =
          invoicesRes.data?.data || invoicesRes.data?.invoices || [];
        setInvoices(invoicesList);
      } catch (err) {
        const msg =
          err.response?.data?.message || 'Failed to load customer details';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ---- Loading state -------------------------------------------------------
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  // ---- Error / not found state ---------------------------------------------
  if (error || !customer) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error || 'Customer not found'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The customer you are looking for does not exist or could not be
          loaded.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  // ---- Build address string ------------------------------------------------
  const addressParts = [
    customer.address?.street,
    customer.address?.city,
    customer.address?.state,
    customer.address?.zipCode,
    customer.address?.country,
  ].filter(Boolean);
  const fullAddress =
    addressParts.length > 0 ? addressParts.join(', ') : '--';

  // ---- Tab change handler --------------------------------------------------
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // ---- Render --------------------------------------------------------------
  return (
    <Box>
      {/* ---- Back button --------------------------------------------------- */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/customers')}
        sx={{
          mb: 3,
          color: 'text.secondary',
          textTransform: 'none',
          fontWeight: 500,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        Back to Customers
      </Button>

      <Grid container spacing={3}>
        {/* ================================================================== */}
        {/* LEFT COLUMN -- Customer profile card                               */}
        {/* ================================================================== */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            {/* Avatar and name */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: '2rem',
                  fontWeight: 700,
                  bgcolor: '#2563EB',
                  mb: 2,
                }}
              >
                {customer.name?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>
              <Typography variant="h5" fontWeight={700} textAlign="center">
                {customer.name}
              </Typography>
              {customer.company && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 0.5 }}
                >
                  {customer.company}
                </Typography>
              )}
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  label={
                    customer.status === 'Inactive' ||
                    customer.isActive === false
                      ? 'Inactive'
                      : 'Active'
                  }
                  size="small"
                  sx={{
                    bgcolor:
                      customer.status === 'Inactive' ||
                      customer.isActive === false
                        ? '#FEF2F2'
                        : '#F0FDF4',
                    color:
                      customer.status === 'Inactive' ||
                      customer.isActive === false
                        ? '#DC2626'
                        : '#059669',
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* Contact details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Email */}
              <Box
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
              >
                <Email
                  sx={{ color: 'text.secondary', fontSize: 20, mt: 0.2 }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Email
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {customer.email || '--'}
                  </Typography>
                </Box>
              </Box>

              {/* Phone */}
              <Box
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
              >
                <Phone
                  sx={{ color: 'text.secondary', fontSize: 20, mt: 0.2 }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Phone
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {customer.phone || '--'}
                  </Typography>
                </Box>
              </Box>

              {/* Company */}
              <Box
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
              >
                <Business
                  sx={{ color: 'text.secondary', fontSize: 20, mt: 0.2 }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Company
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {customer.company || '--'}
                  </Typography>
                </Box>
              </Box>

              {/* Address */}
              <Box
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
              >
                <LocationOn
                  sx={{ color: 'text.secondary', fontSize: 20, mt: 0.2 }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Address
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {fullAddress}
                  </Typography>
                </Box>
              </Box>

              {/* Member since */}
              <Box
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
              >
                <CalendarToday
                  sx={{ color: 'text.secondary', fontSize: 20, mt: 0.2 }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Member Since
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {customer.createdAt
                      ? dayjs(customer.createdAt).format('MMMM D, YYYY')
                      : '--'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* ================================================================== */}
        {/* RIGHT COLUMN -- Tabs with Sales Orders / Invoices                  */}
        {/* ================================================================== */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {/* Tabs header */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                },
              }}
            >
              <Tab label="Sales Orders" />
              <Tab label="Invoices" />
            </Tabs>

            {/* ---- Sales Orders tab ---------------------------------------- */}
            {activeTab === 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: 'grey.50',
                        '& th': {
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'text.secondary',
                          py: 1.5,
                        },
                      }}
                    >
                      <TableCell>Order #</TableCell>
                      <TableCell align="center">Items</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesOrders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          sx={{
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary',
                          }}
                        >
                          No sales orders found for this customer.
                        </TableCell>
                      </TableRow>
                    ) : (
                      salesOrders.map((order) => (
                        <TableRow
                          key={order._id}
                          hover
                          sx={{
                            '&:last-child td': { borderBottom: 0 },
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            navigate(`/sales-orders/${order._id}`)
                          }
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {order.orderNumber || '--'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {order.items?.length || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <StatusChip
                              label={order.status || 'Draft'}
                              colorMap={ORDER_STATUS_COLORS}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(order.totalPrice || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {order.createdAt
                                ? dayjs(order.createdAt).format(
                                    'MMM D, YYYY'
                                  )
                                : '--'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* ---- Invoices tab -------------------------------------------- */}
            {activeTab === 1 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: 'grey.50',
                        '& th': {
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'text.secondary',
                          py: 1.5,
                        },
                      }}
                    >
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Sales Order</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          sx={{
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary',
                          }}
                        >
                          No invoices found for this customer.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((inv) => (
                        <TableRow
                          key={inv._id}
                          hover
                          sx={{
                            '&:last-child td': { borderBottom: 0 },
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/invoices/${inv._id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {inv.invoiceNumber || '--'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {typeof inv.salesOrder === 'object'
                                ? inv.salesOrder?.orderNumber || '--'
                                : inv.salesOrder || '--'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <StatusChip
                              label={inv.status || 'Unpaid'}
                              colorMap={INVOICE_STATUS_COLORS}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(inv.total || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {inv.dueDate
                                ? dayjs(inv.dueDate).format('MMM D, YYYY')
                                : '--'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerDetail;

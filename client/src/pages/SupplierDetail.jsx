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
// PO status chip color map
// ---------------------------------------------------------------------------
const PO_STATUS_COLORS = {
  Draft: '#475569',
  Sent: '#2563EB',
  Received: '#059669',
  Cancelled: '#DC2626',
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
// SupplierDetail page component
// ---------------------------------------------------------------------------
const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- Fetch all data on mount ---------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [supplierRes, ordersRes] = await Promise.all([
          api.get(`/suppliers/${id}`),
          api.get('/purchase-orders', { params: { supplier: id } }),
        ]);

        // Supplier data
        const sup =
          supplierRes.data?.data ||
          supplierRes.data?.supplier ||
          supplierRes.data;
        if (!sup || !sup._id) {
          setError('Supplier not found');
          return;
        }
        setSupplier(sup);

        // Purchase orders
        const allOrders =
          ordersRes.data?.data || ordersRes.data?.purchaseOrders || [];
        setPurchaseOrders(allOrders);
      } catch (err) {
        const msg =
          err.response?.data?.message || 'Failed to load supplier details';
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
  if (error || !supplier) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error || 'Supplier not found'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The supplier you are looking for does not exist or could not be loaded.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/suppliers')}
        >
          Back to Suppliers
        </Button>
      </Box>
    );
  }

  // ---- Build address string ------------------------------------------------
  const addressParts =
    typeof supplier.address === 'string'
      ? [supplier.address]
      : [
          supplier.address?.street,
          supplier.address?.city,
          supplier.address?.state,
          supplier.address?.zipCode,
          supplier.address?.country,
        ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '--';

  // ---- Determine active status ---------------------------------------------
  const isActive =
    supplier.status === 'Active' ||
    (supplier.status === undefined && supplier.isActive !== false);
  const statusLabel = isActive ? 'Active' : 'Inactive';

  // ---- Render --------------------------------------------------------------
  return (
    <Box>
      {/* ---- Back button --------------------------------------------------- */}
      <IconButton
        onClick={() => navigate('/suppliers')}
        sx={{
          mb: 2,
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ArrowBack />
      </IconButton>

      <Grid container spacing={3}>
        {/* ================================================================== */}
        {/* LEFT COLUMN -- Supplier profile card                               */}
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
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  mb: 2,
                }}
              >
                {(
                  supplier.name?.charAt(0) ||
                  supplier.company?.charAt(0) ||
                  '?'
                ).toUpperCase()}
              </Avatar>
              <Typography variant="h5" fontWeight={700} textAlign="center">
                {supplier.name}
              </Typography>
              {supplier.company && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 0.5 }}
                >
                  {supplier.company}
                </Typography>
              )}
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  label={statusLabel}
                  size="small"
                  sx={{
                    bgcolor: isActive ? '#F0FDF4' : '#FEF2F2',
                    color: isActive ? '#059669' : '#DC2626',
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
                    {supplier.email || '--'}
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
                    {supplier.phone || '--'}
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
                    {supplier.company || '--'}
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

              {/* Supplier since */}
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
                    Supplier Since
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {supplier.createdAt
                      ? dayjs(supplier.createdAt).format('MMMM D, YYYY')
                      : '--'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* ================================================================== */}
        {/* RIGHT COLUMN -- Purchase Orders table                              */}
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
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography variant="h6" fontWeight={700}>
                Purchase Orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {purchaseOrders.length} order
                {purchaseOrders.length !== 1 ? 's' : ''} for this supplier
              </Typography>
            </Box>
            <Divider />
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
                    <TableCell>PO Number</TableCell>
                    <TableCell align="center">Items</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{
                          textAlign: 'center',
                          py: 4,
                          color: 'text.secondary',
                        }}
                      >
                        No purchase orders found for this supplier.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrders.map((po) => (
                      <TableRow
                        key={po._id}
                        hover
                        sx={{
                          '&:last-child td': { borderBottom: 0 },
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/purchase-orders/${po._id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {po.orderNumber || '--'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {po.items?.length || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            label={po.status || 'Draft'}
                            colorMap={PO_STATUS_COLORS}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500}>
                            {formatCurrency(po.totalPrice || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {po.createdAt
                              ? dayjs(po.createdAt).format('MMM D, YYYY')
                              : '--'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SupplierDetail;

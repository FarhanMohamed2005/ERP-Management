import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Grid,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TableContainer,
  TablePagination,
  Skeleton,
  InputAdornment,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import api from '../api/axios';
import DataTable from '../components/DataTable';

const STATUS_OPTIONS = ['Draft', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLORS = {
  Draft: { bg: '#F1F5F9', color: '#475569' },
  Confirmed: { bg: '#EFF6FF', color: '#2563EB' },
  Shipped: { bg: '#F5F3FF', color: '#7C3AED' },
  Delivered: { bg: '#F0FDF4', color: '#059669' },
  Cancelled: { bg: '#FEF2F2', color: '#DC2626' },
};

const emptyItem = { product: '', productTitle: '', quantity: 1, unitPrice: 0 };

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounceRef = useRef(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Status change
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusOrder, setStatusOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchOrders = useCallback(async (page = 1, searchVal = '', status = '') => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (searchVal) params.search = searchVal;
      if (status) params.status = status;
      const { data } = await api.get('/sales-orders', { params });
      setOrders(data.data || []);
      setPagination(data.pagination || { page, limit: 10, total: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1, '', statusFilter);
  }, [fetchOrders, statusFilter]);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOrders(1, value, statusFilter);
    }, 300);
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handlePageChange = (newPage) => {
    fetchOrders(newPage, search, statusFilter);
  };

  // Load customers and products for create form
  const openCreateDialog = async () => {
    setSelectedCustomer('');
    setItems([{ ...emptyItem }]);
    setDiscountType('none');
    setDiscountValue(0);
    setTaxRate(0);
    setNotes('');
    setCreateOpen(true);
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers/all'),
        api.get('/products/all'),
      ]);
      setCustomers(custRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load form data');
    }
  };

  // Item management
  const addItem = () => setItems([...items, { ...emptyItem }]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'product') {
      const prod = products.find((p) => p._id === value);
      if (prod) {
        updated[index].productTitle = prod.title;
        updated[index].unitPrice = prod.price;
      }
    }

    setItems(updated);
  };

  const getSubtotal = () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    if (discountType === 'percentage' && discountValue > 0) return Math.round((subtotal * discountValue / 100) * 100) / 100;
    if (discountType === 'fixed' && discountValue > 0) return discountValue;
    return 0;
  };

  const getAfterDiscount = () => getSubtotal() - getDiscountAmount();
  const getTaxAmount = () => taxRate > 0 ? Math.round((getAfterDiscount() * taxRate / 100) * 100) / 100 : 0;
  const getTotal = () => getAfterDiscount() + getTaxAmount();

  const handleCreate = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    const validItems = items.filter((item) => item.product && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/sales-orders', {
        customer: selectedCustomer,
        items: validItems.map((item) => ({
          product: item.product,
          productTitle: item.productTitle,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
        discountType,
        discountValue: Number(discountValue),
        taxRate: Number(taxRate),
        notes,
      });
      toast.success('Sales order created');
      setCreateOpen(false);
      fetchOrders(1, search, statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  // View order detail
  const openViewDialog = async (order) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const { data } = await api.get(`/sales-orders/${order._id}`);
      setViewOrder(data.data);
    } catch (err) {
      toast.error('Failed to load order details');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Status change
  const openStatusDialog = (order) => {
    setStatusOrder(order);
    setNewStatus(order.status);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === statusOrder.status) {
      setStatusDialogOpen(false);
      return;
    }
    setStatusUpdating(true);
    try {
      await api.put(`/sales-orders/${statusOrder._id}`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      setStatusDialogOpen(false);
      fetchOrders(pagination.page, search, statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const columns = [
    {
      field: 'orderNumber',
      headerName: 'Order #',
      renderCell: (row) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
          {row.orderNumber}
        </Typography>
      ),
    },
    {
      field: 'customer',
      headerName: 'Customer',
      renderCell: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {row.customer?.name || '--'}
          </Typography>
          {row.customer?.company && (
            <Typography variant="caption" color="text.secondary">
              {row.customer.company}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'items',
      headerName: 'Items',
      renderCell: (row) => (
        <Chip label={`${row.items?.length || 0} items`} size="small" variant="outlined" />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      renderCell: (row) => {
        const sc = STATUS_COLORS[row.status] || STATUS_COLORS.Draft;
        return (
          <Chip
            label={row.status}
            size="small"
            sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => openStatusDialog(row)}
          />
        );
      },
    },
    {
      field: 'totalPrice',
      headerName: 'Total',
      renderCell: (row) => (
        <Typography variant="body2" fontWeight={600}>
          ${Number(row.totalPrice || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary">
          {dayjs(row.createdAt).format('MMM DD, YYYY')}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          Sales Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create and manage sales orders for your customers
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search orders..."
        onAdd={openCreateDialog}
        addLabel="New Order"
        emptyMessage="No sales orders found. Click 'New Order' to create one."
        exportFilename="sales_orders"
        headerContent={
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
            label="Status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        }
        actions={(row) => (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="View details">
              <IconButton size="small" onClick={() => openViewDialog(row)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      />

      {/* Create Order Dialog */}
      <Dialog open={createOpen} onClose={() => !submitting && setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Sales Order</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Customer"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}{c.company ? ` — ${c.company}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Line Items */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Line Items</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 100 }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 130 }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 110 }} align="right">Total</TableCell>
                      <TableCell sx={{ width: 50 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={item.product}
                            onChange={(e) => updateItem(index, 'product', e.target.value)}
                            placeholder="Select product"
                          >
                            {products.map((p) => (
                              <MenuItem key={p._id} value={p._id}>
                                {p.title} ({p.sku}) — Stock: {p.stock}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Math.max(1, Number(e.target.value)))}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', Math.max(0, Number(e.target.value)))}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => removeItem(index)} disabled={items.length === 1}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ mt: 1 }}>
                Add Item
              </Button>
            </Grid>

            {/* Totals */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: 320 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2" fontWeight={600}>${getSubtotal().toFixed(2)}</Typography>
                  </Box>

                  {/* Discount */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>Discount</Typography>
                    <TextField
                      select
                      size="small"
                      value={discountType}
                      onChange={(e) => { setDiscountType(e.target.value); if (e.target.value === 'none') setDiscountValue(0); }}
                      sx={{ width: 110 }}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="percentage">%</MenuItem>
                      <MenuItem value="fixed">Fixed $</MenuItem>
                    </TextField>
                    {discountType !== 'none' && (
                      <TextField
                        type="number"
                        size="small"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">{discountType === 'percentage' ? '%' : '$'}</InputAdornment>,
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 100 }}
                      />
                    )}
                  </Box>
                  {getDiscountAmount() > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="error.main">Discount</Typography>
                      <Typography variant="body2" color="error.main">-${getDiscountAmount().toFixed(2)}</Typography>
                    </Box>
                  )}

                  {/* Tax Rate */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Tax Rate</Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      inputProps={{ min: 0, step: 0.1 }}
                      sx={{ width: 100 }}
                    />
                  </Box>
                  {getTaxAmount() > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Tax</Typography>
                      <Typography variant="body2">${getTaxAmount().toFixed(2)}</Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                      ${getTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)} variant="outlined" color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent dividers>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : viewOrder ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Order Number</Typography>
                  <Typography variant="body2" fontWeight={600}>{viewOrder.orderNumber}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Customer</Typography>
                  <Typography variant="body2" fontWeight={500}>{viewOrder.customer?.name}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>
                    <Chip
                      label={viewOrder.status}
                      size="small"
                      sx={{
                        bgcolor: STATUS_COLORS[viewOrder.status]?.bg,
                        color: STATUS_COLORS[viewOrder.status]?.color,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2">{dayjs(viewOrder.createdAt).format('MMM DD, YYYY')}</Typography>
                </Grid>
              </Grid>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewOrder.items?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{item.productTitle || item.product?.title || '--'}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                        <TableCell align="right">${Number(item.total || item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: 250 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2">${Number(viewOrder.subtotal || 0).toFixed(2)}</Typography>
                  </Box>
                  {viewOrder.discountAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="error.main">
                        Discount{viewOrder.discountType === 'percentage' ? ` (${viewOrder.discountValue}%)` : ''}
                      </Typography>
                      <Typography variant="body2" color="error.main">-${Number(viewOrder.discountAmount).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {viewOrder.tax > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tax{viewOrder.taxRate > 0 ? ` (${viewOrder.taxRate}%)` : ''}
                      </Typography>
                      <Typography variant="body2">${Number(viewOrder.tax).toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">Total</Typography>
                    <Typography variant="subtitle2" color="primary.main">
                      ${Number(viewOrder.totalPrice || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {viewOrder.notes && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{viewOrder.notes}</Typography>
                </Box>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {viewOrder && viewOrder.status !== 'Cancelled' && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setViewOpen(false);
                openStatusDialog(viewOrder);
              }}
            >
              Change Status
            </Button>
          )}
          <Button onClick={() => setViewOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => !statusUpdating && setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Order: <strong>{statusOrder?.orderNumber}</strong> — Current status:{' '}
              <Chip label={statusOrder?.status} size="small" sx={{ bgcolor: STATUS_COLORS[statusOrder?.status]?.bg, color: STATUS_COLORS[statusOrder?.status]?.color, fontWeight: 600 }} />
            </Typography>
            <TextField
              select
              fullWidth
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStatusDialogOpen(false)} variant="outlined" color="inherit" disabled={statusUpdating}>
            Cancel
          </Button>
          <Button onClick={handleStatusChange} variant="contained" disabled={statusUpdating}>
            {statusUpdating ? <CircularProgress size={22} color="inherit" /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesOrders;

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  RemoveCircleOutline as RemoveIcon,
  AddCircleOutline as AddRowIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import api from '../api/axios';
import DataTable from '../components/DataTable';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
  'Draft',
  'Approved',
  'Ordered',
  'Partially Received',
  'Received',
  'Cancelled',
];

const STATUS_COLORS = {
  Draft: { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
  Approved: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  Ordered: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  'Partially Received': { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  Received: { bg: '#F0FDF4', color: '#059669', border: '#BBF7D0' },
  Cancelled: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

const emptyLineItem = () => ({
  product: '',
  productTitle: '',
  quantity: 1,
  unitPrice: 0,
});

// ---------------------------------------------------------------------------
// PurchaseOrders Page Component
// ---------------------------------------------------------------------------
const PurchaseOrders = () => {
  // ---- List state --------------------------------------------------------
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ---- Create dialog state -----------------------------------------------
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [lineItems, setLineItems] = useState([emptyLineItem()]);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');

  // ---- View detail dialog state ------------------------------------------
  const [viewOpen, setViewOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ---- Status change dialog state ----------------------------------------
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusOrder, setStatusOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // ---- Debounce ref ------------------------------------------------------
  const debounceRef = useRef(null);

  // ---- Fetch orders ------------------------------------------------------
  const fetchOrders = useCallback(async (page = 1, searchTerm = '', status = '') => {
    try {
      setLoading(true);
      const { data } = await api.get('/purchase-orders', {
        params: { page, limit: 10, search: searchTerm, status },
      });
      const list = data.data || data.purchaseOrders || [];
      setOrders(list);
      setPagination({
        page: data.pagination?.page || data.page || page,
        limit: data.pagination?.limit || data.limit || 10,
        total: data.pagination?.total || data.total || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1, search, statusFilter);
  }, [fetchOrders]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Debounced search --------------------------------------------------
  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchOrders(1, value, statusFilter);
      }, 400);
    },
    [fetchOrders, statusFilter],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ---- Status filter change ----------------------------------------------
  const handleStatusFilter = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    fetchOrders(1, search, value);
  };

  // ---- Pagination --------------------------------------------------------
  const handlePageChange = useCallback(
    (newPage) => {
      fetchOrders(newPage, search, statusFilter);
    },
    [fetchOrders, search, statusFilter],
  );

  // ---- Load suppliers & products for create dialog -----------------------
  const loadDropdownData = async () => {
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        api.get('/suppliers/all'),
        api.get('/products/all'),
      ]);
      setSuppliers(suppliersRes.data.data || suppliersRes.data || []);
      setProducts(productsRes.data.data || productsRes.data || []);
    } catch (err) {
      toast.error('Failed to load suppliers or products');
    }
  };

  // ---- Create dialog open / close ----------------------------------------
  const openCreateDialog = () => {
    setSelectedSupplier('');
    setLineItems([emptyLineItem()]);
    setTax(0);
    setNotes('');
    loadDropdownData();
    setCreateOpen(true);
  };

  const closeCreateDialog = () => {
    if (submitting) return;
    setCreateOpen(false);
  };

  // ---- Line item management ----------------------------------------------
  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // When product is selected, auto-fill title and price
      if (field === 'product') {
        const found = products.find((p) => p._id === value);
        if (found) {
          updated[index].productTitle = found.title;
          updated[index].unitPrice = found.price || 0;
        }
      }

      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  };

  const removeLineItem = (index) => {
    setLineItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  // ---- Calculations ------------------------------------------------------
  const calcLineTotal = (item) => {
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + calcLineTotal(item), 0);
  const totalPrice = subtotal + (Number(tax) || 0);

  // ---- Submit create -----------------------------------------------------
  const handleCreate = async () => {
    // Validation
    if (!selectedSupplier) {
      toast.error('Please select a supplier');
      return;
    }

    const validItems = lineItems.filter((item) => item.product);
    if (validItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    for (let i = 0; i < validItems.length; i++) {
      if (!validItems[i].quantity || Number(validItems[i].quantity) < 1) {
        toast.error(`Item ${i + 1}: Quantity must be at least 1`);
        return;
      }
      if (Number(validItems[i].unitPrice) < 0) {
        toast.error(`Item ${i + 1}: Unit price cannot be negative`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        supplier: selectedSupplier,
        items: validItems.map((item) => ({
          product: item.product,
          productTitle: item.productTitle,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
        tax: Number(tax) || 0,
        notes: notes.trim(),
      };

      await api.post('/purchase-orders', payload);
      toast.success('Purchase order created successfully');
      closeCreateDialog();
      fetchOrders(1, search, statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- View order detail -------------------------------------------------
  const openViewDialog = async (order) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const { data } = await api.get(`/purchase-orders/${order._id}`);
      setViewOrder(data.data || data);
    } catch (err) {
      toast.error('Failed to load order details');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewDialog = () => {
    setViewOpen(false);
    setViewOrder(null);
  };

  // ---- Status change -----------------------------------------------------
  const openStatusDialog = (order) => {
    setStatusOrder(order);
    setNewStatus(order.status);
    setStatusDialogOpen(true);
  };

  const closeStatusDialog = () => {
    if (statusUpdating) return;
    setStatusDialogOpen(false);
    setStatusOrder(null);
    setNewStatus('');
  };

  const handleStatusChange = async () => {
    if (!statusOrder || !newStatus) return;
    if (newStatus === statusOrder.status) {
      closeStatusDialog();
      return;
    }

    try {
      setStatusUpdating(true);
      await api.put(`/purchase-orders/${statusOrder._id}`, { status: newStatus });
      toast.success(`Order status updated to "${newStatus}"`);
      closeStatusDialog();
      fetchOrders(pagination.page, search, statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // ---- Status chip renderer ----------------------------------------------
  const renderStatusChip = (status) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.Draft;
    return (
      <Chip
        label={status}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
          bgcolor: colors.bg,
          color: colors.color,
          border: '1px solid',
          borderColor: colors.border,
        }}
      />
    );
  };

  // ---- Table columns -----------------------------------------------------
  const columns = [
    {
      field: 'orderNumber',
      headerName: 'Order #',
      width: '12%',
      renderCell: (row) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
          {row.orderNumber}
        </Typography>
      ),
    },
    {
      field: 'supplier',
      headerName: 'Supplier',
      width: '20%',
      renderCell: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600} noWrap>
            {row.supplier?.name || '--'}
          </Typography>
          {row.supplier?.company && (
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {row.supplier.company}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'items',
      headerName: 'Items',
      width: '8%',
      renderCell: (row) => (
        <Chip
          label={row.items?.length || 0}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, minWidth: 32 }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: '15%',
      renderCell: (row) => renderStatusChip(row.status),
    },
    {
      field: 'totalPrice',
      headerName: 'Total',
      width: '12%',
      renderCell: (row) => (
        <Typography variant="body2" fontWeight={600}>
          ${Number(row.totalPrice || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: '13%',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.createdAt ? dayjs(row.createdAt).format('MMM DD, YYYY') : '--'}
        </Typography>
      ),
    },
  ];

  // ---- Row actions -------------------------------------------------------
  const renderActions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <Tooltip title="View Details">
        <IconButton
          size="small"
          onClick={() => openViewDialog(row)}
          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Change Status">
        <IconButton
          size="small"
          onClick={() => openStatusDialog(row)}
          sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  // ---- Render ------------------------------------------------------------
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          Purchase Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create and manage purchase orders for your suppliers
        </Typography>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search by order number..."
        onAdd={openCreateDialog}
        addLabel="New Order"
        actions={renderActions}
        emptyMessage="No purchase orders found. Create your first order to get started."
        exportFilename="purchase_orders"
        headerContent={
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={handleStatusFilter}
            sx={{ minWidth: 160 }}
            displayEmpty
          >
            <MenuItem value="">All Statuses</MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {/* ================================================================= */}
      {/* CREATE ORDER DIALOG                                                */}
      {/* ================================================================= */}
      <Dialog
        open={createOpen}
        onClose={closeCreateDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h4">Create Purchase Order</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Fill in the details to create a new purchase order
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            {/* Supplier select */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Supplier"
                fullWidth
                required
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                <MenuItem value="" disabled>
                  Select a supplier
                </MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name}{s.company ? ` (${s.company})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Tax */}
            <Grid item xs={12} sm={3}>
              <TextField
                label="Tax"
                fullWidth
                type="number"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>

            {/* Spacer */}
            <Grid item xs={12} sm={3} />

            {/* Line Items section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                  Line Items
                </Typography>
                <Button size="small" startIcon={<AddRowIcon />} onClick={addLineItem}>
                  Add Item
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '35%' }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '15%' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '20%' }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '20%' }}>Line Total</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '10%' }} align="center" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={item.product}
                            onChange={(e) => handleLineItemChange(index, 'product', e.target.value)}
                            placeholder="Select product"
                          >
                            <MenuItem value="" disabled>
                              Select product
                            </MenuItem>
                            {products.map((p) => (
                              <MenuItem key={p._id} value={p._id}>
                                <Box>
                                  <Typography variant="body2">{p.title}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    SKU: {p.sku} | Stock: {p.stock} {p.unit} | ${Number(p.price).toFixed(2)}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            inputProps={{ min: 0, step: '0.01' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            ${calcLineTotal(item).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeLineItem(index)}
                            disabled={lineItems.length <= 1}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Totals */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ minWidth: 260 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight={500}>${subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography variant="body2" color="text.secondary">Tax:</Typography>
                    <Typography variant="body2" fontWeight={500}>${(Number(tax) || 0).toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography variant="body1" fontWeight={700}>Total:</Typography>
                    <Typography variant="body1" fontWeight={700}>${totalPrice.toFixed(2)}</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or comments (optional)"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={closeCreateDialog} variant="outlined" color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
          >
            {submitting ? 'Creating...' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================================================================= */}
      {/* VIEW ORDER DETAIL DIALOG                                           */}
      {/* ================================================================= */}
      <Dialog
        open={viewOpen}
        onClose={closeViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4">
                Purchase Order {viewOrder?.orderNumber || ''}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {viewOrder?.createdAt
                  ? `Created on ${dayjs(viewOrder.createdAt).format('MMMM DD, YYYY [at] h:mm A')}`
                  : ''}
              </Typography>
            </Box>
            {viewOrder && renderStatusChip(viewOrder.status)}
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : viewOrder ? (
            <Grid container spacing={2.5}>
              {/* Supplier info */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 1 }}>
                  Supplier Information
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {viewOrder.supplier?.name || '--'}
                </Typography>
                {viewOrder.supplier?.company && (
                  <Typography variant="body2" color="text.secondary">
                    {viewOrder.supplier.company}
                  </Typography>
                )}
                {viewOrder.supplier?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {viewOrder.supplier.email}
                  </Typography>
                )}
                {viewOrder.supplier?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {viewOrder.supplier.phone}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 1 }}>
                  Order Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Order Number</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {viewOrder.orderNumber}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Box sx={{ mt: 0.25 }}>{renderStatusChip(viewOrder.status)}</Box>
                  </Box>
                </Box>
              </Grid>

              {/* Items table */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 1 }}>
                  Items ({viewOrder.items?.length || 0})
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Unit Price</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(viewOrder.items || []).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.productTitle || item.product?.title || '--'}
                            </Typography>
                            {item.product?.sku && (
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.product.sku}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              ${Number(item.total || item.quantity * item.unitPrice).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Totals */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Box sx={{ minWidth: 260 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                      <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                      <Typography variant="body2" fontWeight={500}>${Number(viewOrder.subtotal || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                      <Typography variant="body2" color="text.secondary">Tax:</Typography>
                      <Typography variant="body2" fontWeight={500}>${Number(viewOrder.tax || 0).toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                      <Typography variant="body1" fontWeight={700}>Total:</Typography>
                      <Typography variant="body1" fontWeight={700}>${Number(viewOrder.totalPrice || 0).toFixed(2)}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Notes */}
              {viewOrder.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 0.5 }}>
                    Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F9FAFB' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {viewOrder.notes}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={closeViewDialog} variant="outlined" color="inherit">
            Close
          </Button>
          {viewOrder && (
            <Button
              variant="contained"
              onClick={() => {
                closeViewDialog();
                openStatusDialog(viewOrder);
              }}
            >
              Change Status
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ================================================================= */}
      {/* STATUS CHANGE DIALOG                                               */}
      {/* ================================================================= */}
      <Dialog
        open={statusDialogOpen}
        onClose={closeStatusDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h4">Update Order Status</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {statusOrder?.orderNumber ? `Change status for ${statusOrder.orderNumber}` : ''}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Current Status
            </Typography>
            {statusOrder && renderStatusChip(statusOrder.status)}
          </Box>

          <TextField
            select
            label="New Status"
            fullWidth
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={closeStatusDialog} variant="outlined" color="inherit" disabled={statusUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            disabled={statusUpdating || newStatus === statusOrder?.status}
            startIcon={statusUpdating ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {statusUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrders;

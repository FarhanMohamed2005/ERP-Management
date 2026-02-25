import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  Chip,
  MenuItem,
  Autocomplete,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  RemoveCircleOutline as RemoveIcon,
  SwapHoriz as ConvertIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Sent', value: 'Sent' },
  { label: 'Accepted', value: 'Accepted' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Expired', value: 'Expired' },
  { label: 'Converted', value: 'Converted' },
];

const STATUS_COLORS = {
  Draft: { bgcolor: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' },
  Sent: { bgcolor: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' },
  Accepted: { bgcolor: '#F0FDF4', color: '#059669', borderColor: '#BBF7D0' },
  Rejected: { bgcolor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' },
  Expired: { bgcolor: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' },
  Converted: { bgcolor: '#F5F3FF', color: '#7C3AED', borderColor: '#DDD6FE' },
};

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 10 });
  const [statusFilter, setStatusFilter] = useState('');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewQuotation, setViewQuotation] = useState(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingQuotation, setDeletingQuotation] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Convert dialog
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertingQuotation, setConvertingQuotation] = useState(null);
  const [converting, setConverting] = useState(false);

  // Form state
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([{ product: null, quantity: 1, unitPrice: 0 }]);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch quotations
  const fetchQuotations = useCallback(async (page = 1, status = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/quotations', { params: { page, limit: 10, status } });
      setQuotations(data.data || []);
      setPagination(data.pagination || { page, total: 0, limit: 10 });
    } catch {
      toast.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuotations(1, statusFilter); }, [fetchQuotations, statusFilter]);

  // Fetch customers and products for form
  const fetchFormData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers/all'),
        api.get('/products/all'),
      ]);
      setCustomers(custRes.data.data || custRes.data.customers || []);
      setProducts(prodRes.data.data || prodRes.data.products || []);
    } catch {
      toast.error('Failed to load form data');
    }
  };

  // Calculations
  const getSubtotal = () => items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
  const getDiscountAmount = () => {
    const sub = getSubtotal();
    if (discountType === 'percentage') return Math.round((sub * discountValue / 100) * 100) / 100;
    if (discountType === 'fixed') return discountValue;
    return 0;
  };
  const getAfterDiscount = () => getSubtotal() - getDiscountAmount();
  const getTaxAmount = () => Math.round((getAfterDiscount() * taxRate / 100) * 100) / 100;
  const getTotal = () => getAfterDiscount() + getTaxAmount();

  // Item handlers
  const addItem = () => setItems([...items, { product: null, quantity: 1, unitPrice: 0 }]);
  const removeItem = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'product' && value) {
      updated[index].unitPrice = value.price || 0;
      updated[index].productTitle = value.title;
    }
    setItems(updated);
  };

  // Open create dialog
  const openCreateDialog = () => {
    setEditing(null);
    setSelectedCustomer(null);
    setItems([{ product: null, quantity: 1, unitPrice: 0 }]);
    setDiscountType('none');
    setDiscountValue(0);
    setTaxRate(0);
    setValidUntil(dayjs().add(30, 'day').format('YYYY-MM-DD'));
    setNotes('');
    setDialogOpen(true);
    fetchFormData();
  };

  // Open edit dialog
  const openEditDialog = async (quotation) => {
    await fetchFormData();
    setEditing(quotation);
    setSelectedCustomer(quotation.customer || null);
    setItems(quotation.items?.map(i => ({
      product: i.product || null,
      productTitle: i.productTitle,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })) || [{ product: null, quantity: 1, unitPrice: 0 }]);
    setDiscountType(quotation.discountType || 'none');
    setDiscountValue(quotation.discountValue || 0);
    setTaxRate(quotation.taxRate || 0);
    setValidUntil(quotation.validUntil ? dayjs(quotation.validUntil).format('YYYY-MM-DD') : '');
    setNotes(quotation.notes || '');
    setDialogOpen(true);
  };

  // Submit create/edit
  const handleSubmit = async () => {
    if (!selectedCustomer) { toast.error('Please select a customer'); return; }
    if (items.some(i => !i.product && !i.productTitle)) { toast.error('Please select a product for each item'); return; }

    setSubmitting(true);
    try {
      const payload = {
        customer: selectedCustomer._id,
        items: items.map(i => ({
          product: i.product?._id || i.product,
          productTitle: i.productTitle || i.product?.title,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
        discountType,
        discountValue: Number(discountValue),
        taxRate: Number(taxRate),
        validUntil: validUntil || undefined,
        notes,
      };

      if (editing) {
        await api.put(`/quotations/${editing._id}`, payload);
        toast.success('Quotation updated successfully');
      } else {
        await api.post('/quotations', payload);
        toast.success('Quotation created successfully');
      }
      setDialogOpen(false);
      fetchQuotations(editing ? pagination.page : 1, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save quotation');
    } finally {
      setSubmitting(false);
    }
  };

  // View quotation
  const openViewDialog = async (quotation) => {
    try {
      const { data } = await api.get(`/quotations/${quotation._id}`);
      setViewQuotation(data.data);
      setViewOpen(true);
    } catch {
      toast.error('Failed to load quotation details');
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingQuotation) return;
    setDeleting(true);
    try {
      await api.delete(`/quotations/${deletingQuotation._id}`);
      toast.success('Quotation deleted');
      setDeleteOpen(false);
      setDeletingQuotation(null);
      fetchQuotations(pagination.page, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Convert to Sales Order
  const handleConvert = async () => {
    if (!convertingQuotation) return;
    setConverting(true);
    try {
      const { data } = await api.post(`/quotations/${convertingQuotation._id}/convert`);
      toast.success(data.message || 'Converted to Sales Order');
      setConvertOpen(false);
      setConvertingQuotation(null);
      fetchQuotations(pagination.page, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  // Columns
  const columns = [
    {
      field: 'quoteNumber',
      headerName: 'Quote #',
      width: '14%',
      renderCell: (row) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.quoteNumber}</Typography>
      ),
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: '20%',
      renderCell: (row) => row.customer?.name || '-',
    },
    {
      field: 'items',
      headerName: 'Items',
      width: '8%',
      renderCell: (row) => row.items?.length || 0,
    },
    {
      field: 'totalPrice',
      headerName: 'Total',
      width: '14%',
      renderCell: (row) => `$${Number(row.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: '12%',
      renderCell: (row) => {
        const sc = STATUS_COLORS[row.status] || STATUS_COLORS.Draft;
        return (
          <Chip label={row.status} size="small" sx={{ ...sc, fontWeight: 600, fontSize: '0.75rem', border: '1px solid', height: 24 }} />
        );
      },
    },
    {
      field: 'validUntil',
      headerName: 'Valid Until',
      width: '12%',
      renderCell: (row) => row.validUntil ? dayjs(row.validUntil).format('MMM DD, YYYY') : '-',
    },
  ];

  // Actions
  const renderActions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <IconButton size="small" color="info" onClick={() => openViewDialog(row)}><ViewIcon fontSize="small" /></IconButton>
      {!['Converted', 'Rejected', 'Expired'].includes(row.status) && (
        <IconButton size="small" color="primary" onClick={() => openEditDialog(row)}><EditIcon fontSize="small" /></IconButton>
      )}
      {['Draft', 'Sent', 'Accepted'].includes(row.status) && (
        <IconButton size="small" sx={{ color: '#7C3AED' }} onClick={() => { setConvertingQuotation(row); setConvertOpen(true); }}>
          <ConvertIcon fontSize="small" />
        </IconButton>
      )}
      {row.status !== 'Converted' && (
        <IconButton size="small" color="error" onClick={() => { setDeletingQuotation(row); setDeleteOpen(true); }}><DeleteIcon fontSize="small" /></IconButton>
      )}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h2" gutterBottom>Quotations</Typography>
          <Typography variant="body1" color="text.secondary">Create and manage customer quotations</Typography>
        </Box>
      </Box>

      {/* Status Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((sf) => (
          <Chip
            key={sf.value}
            label={sf.label}
            onClick={() => setStatusFilter(sf.value)}
            variant={statusFilter === sf.value ? 'filled' : 'outlined'}
            color={statusFilter === sf.value ? 'primary' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Box>

      <DataTable
        columns={columns}
        data={quotations}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchQuotations(p, statusFilter)}
        onSearch={() => {}}
        searchPlaceholder="Search quotations..."
        onAdd={openCreateDialog}
        addLabel="New Quotation"
        actions={renderActions}
        emptyMessage="No quotations found. Create your first quotation to get started."
        exportFilename="quotations"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h4">{editing ? 'Edit Quotation' : 'New Quotation'}</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={customers}
                getOptionLabel={(o) => `${o.name}${o.company ? ` (${o.company})` : ''}`}
                value={selectedCustomer}
                onChange={(_, v) => setSelectedCustomer(v)}
                renderInput={(params) => <TextField {...params} label="Customer *" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Valid Until" type="date" fullWidth InputLabelProps={{ shrink: true }} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>Line Items</Typography>
              {items.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
                  <Autocomplete
                    sx={{ flex: 2 }}
                    options={products}
                    getOptionLabel={(o) => `${o.title} (${o.sku})`}
                    value={item.product && typeof item.product === 'object' ? item.product : null}
                    onChange={(_, v) => updateItem(index, 'product', v)}
                    renderInput={(params) => <TextField {...params} label="Product" size="small" />}
                  />
                  <TextField label="Qty" type="number" size="small" sx={{ width: 80 }} value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1 }}
                  />
                  <TextField label="Price" type="number" size="small" sx={{ width: 110 }} value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <Typography variant="body2" sx={{ width: 80, textAlign: 'right', fontWeight: 600 }}>
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </Typography>
                  <IconButton size="small" color="error" onClick={() => removeItem(index)} disabled={items.length === 1}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={addItem}>Add Item</Button>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            <Grid item xs={12} sm={4}>
              <TextField select label="Discount Type" fullWidth size="small" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <MenuItem value="none">No Discount</MenuItem>
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed Amount ($)</MenuItem>
              </TextField>
            </Grid>
            {discountType !== 'none' && (
              <Grid item xs={12} sm={4}>
                <TextField label={discountType === 'percentage' ? 'Discount %' : 'Discount $'} type="number" fullWidth size="small" value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <TextField label="Tax Rate %" type="number" fullWidth size="small" value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField label="Notes" multiline rows={2} fullWidth value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Grid>

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2">${getSubtotal().toFixed(2)}</Typography>
                </Box>
                {discountType !== 'none' && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Discount</Typography>
                    <Typography variant="body2" color="error.main">-${getDiscountAmount().toFixed(2)}</Typography>
                  </Box>
                )}
                {taxRate > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Tax ({taxRate}%)</Typography>
                    <Typography variant="body2">${getTaxAmount().toFixed(2)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                  <Typography variant="subtitle1" fontWeight={700}>${getTotal().toFixed(2)}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit" disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : editing ? 'Update Quotation' : 'Create Quotation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">{viewQuotation?.quoteNumber}</Typography>
            {viewQuotation && (
              <Chip label={viewQuotation.status} size="small"
                sx={{ ...STATUS_COLORS[viewQuotation.status], fontWeight: 600, border: '1px solid', height: 24 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewQuotation && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body1" fontWeight={600}>{viewQuotation.customer?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{viewQuotation.customer?.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">{dayjs(viewQuotation.createdAt).format('MMM DD, YYYY')}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Valid Until</Typography>
                <Typography variant="body2">{viewQuotation.validUntil ? dayjs(viewQuotation.validUntil).format('MMM DD, YYYY') : '-'}</Typography>
              </Grid>

              {viewQuotation.convertedToOrder && (
                <Grid item xs={12}>
                  <Chip label={`Converted to ${viewQuotation.convertedToOrder.orderNumber || 'Sales Order'}`} color="secondary" size="small" />
                </Grid>
              )}

              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewQuotation.items?.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.productTitle || item.product?.title || '-'}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                          <TableCell align="right">${Number(item.total || item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2">${Number(viewQuotation.subtotal || 0).toFixed(2)}</Typography>
                  </Box>
                  {viewQuotation.discountAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Discount {viewQuotation.discountType === 'percentage' ? `(${viewQuotation.discountValue}%)` : ''}
                      </Typography>
                      <Typography variant="body2" color="error.main">-${Number(viewQuotation.discountAmount).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {viewQuotation.tax > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Tax ({viewQuotation.taxRate}%)</Typography>
                      <Typography variant="body2">${Number(viewQuotation.tax).toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>${Number(viewQuotation.totalPrice || 0).toFixed(2)}</Typography>
                  </Box>
                </Paper>
              </Grid>

              {viewQuotation.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{viewQuotation.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {viewQuotation && ['Draft', 'Sent', 'Accepted'].includes(viewQuotation.status) && (
            <Button variant="contained" color="secondary" startIcon={<ConvertIcon />}
              onClick={() => { setViewOpen(false); setConvertingQuotation(viewQuotation); setConvertOpen(true); }}>
              Convert to Sales Order
            </Button>
          )}
          <Button onClick={() => setViewOpen(false)} variant="outlined" color="inherit">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingQuotation(null); }}
        onConfirm={handleDelete}
        title="Delete Quotation"
        message={`Are you sure you want to delete "${deletingQuotation?.quoteNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />

      {/* Convert Confirmation */}
      <ConfirmDialog
        open={convertOpen}
        onClose={() => { setConvertOpen(false); setConvertingQuotation(null); }}
        onConfirm={handleConvert}
        title="Convert to Sales Order"
        message={`Convert "${convertingQuotation?.quoteNumber}" to a Sales Order? The quotation will be marked as Converted.`}
        confirmText="Convert"
        loading={converting}
      />
    </Box>
  );
};

export default Quotations;

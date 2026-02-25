import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Add as AddIcon,
  Assignment as CreditNoteIcon,
  TrendingDown as StatusIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import api from '../api/axios';
import DataTable from '../components/DataTable';

// ---------------------------------------------------------------------------
// Status chip color mapping
// ---------------------------------------------------------------------------
const STATUS_CHIP_COLORS = {
  Draft: { bg: '#F1F5F9', color: '#475569' },
  Approved: { bg: '#EFF6FF', color: '#2563EB' },
  Refunded: { bg: '#F0FDF4', color: '#059669' },
  Cancelled: { bg: '#FEF2F2', color: '#DC2626' },
};

const getStatusChipSx = (status) => {
  const scheme = STATUS_CHIP_COLORS[status] || STATUS_CHIP_COLORS.Draft;
  return {
    fontWeight: 600,
    fontSize: '0.75rem',
    bgcolor: scheme.bg,
    color: scheme.color,
    border: '1px solid',
    borderColor: scheme.color,
  };
};

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Refunded', value: 'Refunded' },
  { label: 'Cancelled', value: 'Cancelled' },
];

// ---------------------------------------------------------------------------
// Next-status options (for the status-change flow)
// Draft -> Approved -> Refunded, or -> Cancelled at any actionable stage
// ---------------------------------------------------------------------------
const NEXT_STATUS_MAP = {
  Draft: ['Approved', 'Cancelled'],
  Approved: ['Refunded', 'Cancelled'],
};

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------
const fmt = (v) =>
  '$' +
  Number(v).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const CreditNotes = () => {
  // ---- list state ----
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');

  // ---- create dialog ----
  const [createOpen, setCreateOpen] = useState(false);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loadingSOs, setLoadingSOs] = useState(false);
  const [selectedSO, setSelectedSO] = useState(null);
  const [createForm, setCreateForm] = useState({
    salesOrder: '',
    reason: '',
    tax: '',
    notes: '',
    items: [],
  });
  const [creating, setCreating] = useState(false);

  // ---- view detail dialog ----
  const [viewOpen, setViewOpen] = useState(false);
  const [viewCN, setViewCN] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ---- status change dialog ----
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  // ======================================================================
  // Fetch list
  // ======================================================================
  const fetchCreditNotes = useCallback(async (page = 1, status = '') => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (status) params.status = status;
      const { data } = await api.get('/credit-notes', { params });
      setCreditNotes(data.data || []);
      setPagination({
        page: data.pagination?.page || page,
        limit: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch credit notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreditNotes(1, statusFilter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- filter / page ----
  const handleFilterChange = (val) => {
    setStatusFilter(val);
    fetchCreditNotes(1, val);
  };

  const handlePageChange = useCallback(
    (newPage) => fetchCreditNotes(newPage, statusFilter),
    [fetchCreditNotes, statusFilter]
  );

  // ======================================================================
  // Create dialog
  // ======================================================================
  const handleOpenCreate = async () => {
    setCreateForm({ salesOrder: '', reason: '', tax: '', notes: '', items: [] });
    setSelectedSO(null);
    setCreateOpen(true);
    try {
      setLoadingSOs(true);
      const { data } = await api.get('/sales-orders', { params: { limit: 100 } });
      setSalesOrders(data.data || data.salesOrders || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load sales orders');
    } finally {
      setLoadingSOs(false);
    }
  };

  const handleCloseCreate = () => {
    if (creating) return;
    setCreateOpen(false);
    setSalesOrders([]);
    setSelectedSO(null);
  };

  const handleSOChange = (e) => {
    const soId = e.target.value;
    const so = salesOrders.find((s) => s._id === soId);
    setSelectedSO(so || null);
    const items = so
      ? (so.items || []).map((i) => ({
          productTitle: i.productTitle || i.product?.title || i.name || 'Item',
          quantity: i.quantity,
          unitPrice: i.unitPrice || i.price || 0,
        }))
      : [];
    setCreateForm((prev) => ({ ...prev, salesOrder: soId, items }));
  };

  const handleItemQtyChange = (index, value) => {
    setCreateForm((prev) => {
      const items = [...prev.items];
      const maxQty = selectedSO?.items[index]?.quantity || 1;
      let qty = parseInt(value, 10);
      if (isNaN(qty) || qty < 1) qty = 1;
      if (qty > maxQty) qty = maxQty;
      items[index] = { ...items[index], quantity: qty };
      return { ...prev, items };
    });
  };

  const handleCreateSubmit = async () => {
    if (!createForm.salesOrder) {
      toast.error('Please select a Sales Order');
      return;
    }
    if (!createForm.reason.trim()) {
      toast.error('Please enter a return reason');
      return;
    }
    try {
      setCreating(true);
      await api.post('/credit-notes', {
        salesOrder: createForm.salesOrder,
        items: createForm.items,
        reason: createForm.reason,
        tax: createForm.tax ? Number(createForm.tax) : 0,
        notes: createForm.notes,
      });
      toast.success('Credit note created successfully');
      handleCloseCreate();
      fetchCreditNotes(1, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create credit note');
    } finally {
      setCreating(false);
    }
  };

  // ======================================================================
  // View detail dialog
  // ======================================================================
  const handleViewDetail = async (cn) => {
    try {
      setViewOpen(true);
      setLoadingDetail(true);
      const { data } = await api.get(`/credit-notes/${cn._id}`);
      setViewCN(data.data || data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load credit note');
      setViewOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewCN(null);
  };

  // ======================================================================
  // Status change dialog
  // ======================================================================
  const handleOpenStatus = (cn) => {
    setStatusTarget(cn);
    setNewStatus('');
    setStatusOpen(true);
  };

  const handleCloseStatus = () => {
    if (changingStatus) return;
    setStatusOpen(false);
    setStatusTarget(null);
    setNewStatus('');
  };

  const handleStatusSubmit = async () => {
    if (!newStatus) {
      toast.error('Please select a new status');
      return;
    }
    try {
      setChangingStatus(true);
      await api.put(`/credit-notes/${statusTarget._id}`, { status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      handleCloseStatus();
      fetchCreditNotes(pagination.page, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change status');
    } finally {
      setChangingStatus(false);
    }
  };

  // ======================================================================
  // Table columns
  // ======================================================================
  const columns = [
    {
      field: 'creditNoteNumber',
      headerName: 'Credit Note #',
      width: '15%',
      renderCell: (row) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {row.creditNoteNumber}
        </Typography>
      ),
    },
    {
      field: 'salesOrder',
      headerName: 'Sales Order #',
      width: '14%',
      renderCell: (row) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
          {row.salesOrder?.orderNumber || '--'}
        </Typography>
      ),
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: '20%',
      renderCell: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600} noWrap>
            {row.customer?.name || '--'}
          </Typography>
          {row.customer?.company && (
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {row.customer.company}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: '12%',
      renderCell: (row) => (
        <Typography variant="body2" fontWeight={600}>
          {fmt(row.total || 0)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: '12%',
      renderCell: (row) => (
        <Chip label={row.status || 'Unknown'} size="small" sx={getStatusChipSx(row.status)} />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: '12%',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary">
          {dayjs(row.createdAt).format('MMM DD, YYYY')}
        </Typography>
      ),
    },
  ];

  // ---- actions column ----
  const renderActions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <Tooltip title="View Details">
        <IconButton
          size="small"
          onClick={() => handleViewDetail(row)}
          sx={{ color: 'primary.main', '&:hover': { bgcolor: '#EFF6FF' } }}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {(row.status === 'Draft' || row.status === 'Approved') && (
        <Tooltip title="Change Status">
          <IconButton
            size="small"
            onClick={() => handleOpenStatus(row)}
            sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
          >
            <StatusIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  // ---- filter chips ----
  const filterChips = (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {STATUS_FILTERS.map((f) => (
        <Chip
          key={f.value}
          label={f.label}
          size="small"
          onClick={() => handleFilterChange(f.value)}
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            px: 0.5,
            ...(statusFilter === f.value
              ? { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }
              : {
                  bgcolor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid',
                  borderColor: '#E2E8F0',
                  '&:hover': { bgcolor: '#E2E8F0' },
                }),
          }}
        />
      ))}
    </Box>
  );

  // ======================================================================
  // Render
  // ======================================================================
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          Credit Notes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Issue and manage return / refund notes against sales orders
        </Typography>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={creditNotes}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchPlaceholder="Search credit notes..."
        onAdd={handleOpenCreate}
        addLabel="New Credit Note"
        actions={renderActions}
        emptyMessage="No credit notes found. Click 'New Credit Note' to issue one from a sales order."
        exportFilename="credit_notes"
        headerContent={filterChips}
      />

      {/* ================================================================ */}
      {/* CREATE Credit Note Dialog                                        */}
      {/* ================================================================ */}
      <Dialog
        open={createOpen}
        onClose={handleCloseCreate}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditNoteIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4">New Credit Note</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Issue a return / refund note from an existing sales order
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            {/* Sales Order Select */}
            <Grid item xs={12}>
              <TextField
                select
                label="Sales Order"
                fullWidth
                required
                value={createForm.salesOrder}
                onChange={handleSOChange}
                disabled={loadingSOs}
                helperText={loadingSOs ? 'Loading sales orders...' : 'Select the sales order to issue a credit note against'}
              >
                {loadingSOs && (
                  <MenuItem value="" disabled>
                    Loading...
                  </MenuItem>
                )}
                {!loadingSOs && salesOrders.length === 0 && (
                  <MenuItem value="" disabled>
                    No sales orders found
                  </MenuItem>
                )}
                {salesOrders.map((so) => (
                  <MenuItem key={so._id} value={so._id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {so.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {so.customer?.name || 'Unknown Customer'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Items table (editable quantities) */}
            {createForm.items.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', color: 'text.secondary' }}
                >
                  Return Items (adjust quantities for partial returns)
                </Typography>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: '1px solid', borderColor: '#E2E8F0', borderRadius: 2 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Product</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          Qty
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          Unit Price
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          Line Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {createForm.items.map((item, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {idx + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.productTitle || 'Item'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ width: 100 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                              inputProps={{
                                min: 1,
                                max: selectedSO?.items[idx]?.quantity || 1,
                                style: { textAlign: 'center' },
                              }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{fmt(item.unitPrice)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {fmt(item.quantity * item.unitPrice)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Subtotal row */}
                      <TableRow>
                        <TableCell colSpan={4} align="right">
                          <Typography variant="body2" fontWeight={600}>
                            Subtotal
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {fmt(createForm.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* Reason */}
            <Grid item xs={12}>
              <TextField
                label="Return Reason"
                fullWidth
                required
                multiline
                rows={2}
                value={createForm.reason}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Describe why the items are being returned"
              />
            </Grid>

            {/* Tax */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tax Amount"
                fullWidth
                type="number"
                value={createForm.tax}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, tax: e.target.value }))}
                placeholder="0.00"
                inputProps={{ min: 0, step: '0.01' }}
                helperText="Tax amount in dollars (if applicable)"
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={1}
                value={createForm.notes}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional internal notes"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={handleCloseCreate} variant="outlined" color="inherit" disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSubmit}
            variant="contained"
            disabled={creating}
            startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
          >
            {creating ? 'Creating...' : 'Create Credit Note'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================================================================ */}
      {/* VIEW Credit Note Detail Dialog                                   */}
      {/* ================================================================ */}
      <Dialog
        open={viewOpen}
        onClose={handleCloseView}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditNoteIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h4">Credit Note {viewCN?.creditNoteNumber || ''}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Full credit note details and line items
                </Typography>
              </Box>
            </Box>
            {viewCN && (
              <Chip label={viewCN.status} size="small" sx={getStatusChipSx(viewCN.status)} />
            )}
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : viewCN ? (
            <Box>
              {/* Info cards */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0' }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}
                    >
                      Credit Note Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Credit Note #</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                          {viewCN.creditNoteNumber}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Sales Order</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                          {viewCN.salesOrder?.orderNumber || '--'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Date</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {dayjs(viewCN.createdAt).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip label={viewCN.status} size="small" sx={getStatusChipSx(viewCN.status)} />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0' }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}
                    >
                      Customer Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {viewCN.customer?.name || '--'}
                        </Typography>
                      </Box>
                      {viewCN.customer?.company && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Company</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {viewCN.customer.company}
                          </Typography>
                        </Box>
                      )}
                      {viewCN.customer?.email && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {viewCN.customer.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Reason */}
              <Paper
                elevation={0}
                sx={{ p: 2, mb: 3, bgcolor: '#FEF2F2', borderRadius: 2, border: '1px solid', borderColor: '#FECACA' }}
              >
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: '#991B1B', mb: 0.5 }}>
                  Return Reason
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewCN.reason}
                </Typography>
              </Paper>

              {/* Line Items Table */}
              <Typography
                variant="subtitle2"
                sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', color: 'text.secondary' }}
              >
                Line Items
              </Typography>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: '1px solid', borderColor: '#E2E8F0', borderRadius: 2, mb: 3 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Item</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(viewCN.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">No line items</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (viewCN.items || []).map((item, index) => (
                        <TableRow key={item._id || index} hover>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{index + 1}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.productTitle || 'Item'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{item.quantity}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{fmt(item.unitPrice)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>{fmt(item.total)}</Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Paper
                  elevation={0}
                  sx={{ p: 2.5, minWidth: 280, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0' }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2" fontWeight={500}>{fmt(viewCN.subtotal || 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Tax</Typography>
                    <Typography variant="body2" fontWeight={500}>{fmt(viewCN.tax || 0)}</Typography>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight={700}>Total</Typography>
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                      {fmt(viewCN.total || 0)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              {/* Notes */}
              {viewCN.notes && (
                <Paper
                  elevation={0}
                  sx={{ p: 2, bgcolor: '#FFFBEB', borderRadius: 2, border: '1px solid', borderColor: '#FDE68A' }}
                >
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: '#92400E', mb: 0.5 }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewCN.notes}
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          {viewCN && (viewCN.status === 'Draft' || viewCN.status === 'Approved') && (
            <Button
              variant="contained"
              startIcon={<StatusIcon />}
              onClick={() => {
                handleCloseView();
                handleOpenStatus(viewCN);
              }}
              sx={{ mr: 'auto' }}
            >
              Change Status
            </Button>
          )}
          <Button onClick={handleCloseView} variant="outlined" color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================================================================ */}
      {/* STATUS CHANGE Dialog                                             */}
      {/* ================================================================ */}
      <Dialog
        open={statusOpen}
        onClose={handleCloseStatus}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StatusIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4">Change Status</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {statusTarget?.creditNoteNumber || ''}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Current Status
            </Typography>
            <Chip
              label={statusTarget?.status || ''}
              size="small"
              sx={getStatusChipSx(statusTarget?.status)}
            />
          </Box>

          <TextField
            select
            label="New Status"
            fullWidth
            required
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {(NEXT_STATUS_MAP[statusTarget?.status] || []).map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={handleCloseStatus} variant="outlined" color="inherit" disabled={changingStatus}>
            Cancel
          </Button>
          <Button
            onClick={handleStatusSubmit}
            variant="contained"
            disabled={changingStatus || !newStatus}
            startIcon={changingStatus ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {changingStatus ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreditNotes;

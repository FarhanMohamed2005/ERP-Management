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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TableContainer,
  Skeleton,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import api from '../api/axios';
import DataTable from '../components/DataTable';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_LIMIT = 10;

// ---------------------------------------------------------------------------
// Table columns for GRN list
// ---------------------------------------------------------------------------
const columns = [
  {
    field: 'grnNumber',
    headerName: 'GRN #',
    width: '16%',
    renderCell: (row) => (
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
        {row.grnNumber}
      </Typography>
    ),
  },
  {
    field: 'purchaseOrder',
    headerName: 'PO #',
    width: '16%',
    renderCell: (row) => (
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
        {row.purchaseOrder?.orderNumber || '-'}
      </Typography>
    ),
  },
  {
    field: 'receivedDate',
    headerName: 'Received Date',
    width: '18%',
    renderCell: (row) => (
      <Typography variant="body2" color="text.secondary">
        {row.receivedDate ? dayjs(row.receivedDate).format('MMM D, YYYY') : '-'}
      </Typography>
    ),
  },
  {
    field: 'itemsCount',
    headerName: 'Items',
    width: '10%',
    renderCell: (row) => (
      <Chip
        label={row.receivedItems?.length || 0}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
          bgcolor: '#EFF6FF',
          color: '#2563EB',
          minWidth: 32,
        }}
      />
    ),
  },
  {
    field: 'receivedBy',
    headerName: 'Received By',
    width: '18%',
    renderCell: (row) => (
      <Typography variant="body2" color="text.secondary">
        {row.receivedBy?.name || '-'}
      </Typography>
    ),
  },
];

// ---------------------------------------------------------------------------
// GoodsReceipt Page Component
// ---------------------------------------------------------------------------
const GoodsReceipt = () => {
  // ─── List state ───────────────────────────────────────────────────────
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: PAGE_LIMIT });
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  // ─── View dialog state ────────────────────────────────────────────────
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingGrn, setViewingGrn] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ─── Create dialog state ──────────────────────────────────────────────
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [eligiblePOs, setEligiblePOs] = useState([]);
  const [posLoading, setPosLoading] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState('');
  const [selectedPODetails, setSelectedPODetails] = useState(null);
  const [poDetailsLoading, setPoDetailsLoading] = useState(false);
  const [receivedItems, setReceivedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch GRN list ───────────────────────────────────────────────────
  const fetchGrns = useCallback(async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const { data } = await api.get('/grn', { params });

      setGrns(data.grns || data.data || []);
      setPagination({
        page: data.page || data.pagination?.page || page,
        total: data.total || data.pagination?.total || data.totalCount || 0,
        limit: data.limit || data.pagination?.limit || PAGE_LIMIT,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch goods receipt notes');
      setGrns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrns(1, search);
  }, [fetchGrns]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Debounced search ─────────────────────────────────────────────────
  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchGrns(1, value);
      }, 400);
    },
    [fetchGrns]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ─── Pagination ───────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    (newPage) => {
      fetchGrns(newPage, search);
    },
    [fetchGrns, search]
  );

  // ─── View GRN detail ─────────────────────────────────────────────────
  const handleViewOpen = async (grn) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    try {
      const { data } = await api.get(`/grn/${grn._id}`);
      setViewingGrn(data.grn || data.data || data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load GRN details');
      setViewDialogOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setViewingGrn(null);
  };

  // ─── Create GRN dialog ───────────────────────────────────────────────
  const handleCreateOpen = async () => {
    setCreateDialogOpen(true);
    setSelectedPOId('');
    setSelectedPODetails(null);
    setReceivedItems([]);
    setNotes('');
    setPosLoading(true);

    try {
      const { data } = await api.get('/purchase-orders', {
        params: {
          status: ['Approved', 'Ordered', 'Partially Received'],
          limit: 100,
        },
      });
      setEligiblePOs(data.purchaseOrders || data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch purchase orders');
    } finally {
      setPosLoading(false);
    }
  };

  const handleCreateClose = () => {
    if (submitting) return;
    setCreateDialogOpen(false);
    setSelectedPOId('');
    setSelectedPODetails(null);
    setReceivedItems([]);
    setNotes('');
    setEligiblePOs([]);
  };

  // ─── PO selection change ──────────────────────────────────────────────
  const handlePOChange = async (event) => {
    const poId = event.target.value;
    setSelectedPOId(poId);
    setSelectedPODetails(null);
    setReceivedItems([]);

    if (!poId) return;

    setPoDetailsLoading(true);
    try {
      const { data } = await api.get(`/purchase-orders/${poId}`);
      const po = data.purchaseOrder || data.data || data;
      setSelectedPODetails(po);

      // Build items list from PO items
      const items = (po.items || []).map((item) => ({
        product: item.product?._id || item.product,
        productTitle: item.product?.title || item.productTitle || item.title || item.name || 'Unknown Product',
        orderedQuantity: item.quantity || item.orderedQuantity || 0,
        receivedQuantity: 0,
      }));
      setReceivedItems(items);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load purchase order details');
      setSelectedPOId('');
    } finally {
      setPoDetailsLoading(false);
    }
  };

  // ─── Update received quantity for an item ─────────────────────────────
  const handleReceivedQtyChange = (index, value) => {
    setReceivedItems((prev) => {
      const updated = [...prev];
      const parsed = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
      updated[index] = { ...updated[index], receivedQuantity: parsed };
      return updated;
    });
  };

  // ─── Submit GRN ───────────────────────────────────────────────────────
  const handleCreateSubmit = async () => {
    // Validation
    if (!selectedPOId) {
      toast.error('Please select a purchase order');
      return;
    }

    const hasReceivedItems = receivedItems.some(
      (item) => item.receivedQuantity !== '' && item.receivedQuantity > 0
    );
    if (!hasReceivedItems) {
      toast.error('Please enter received quantity for at least one item');
      return;
    }

    // Check for any quantities exceeding ordered
    const overReceived = receivedItems.find(
      (item) => item.receivedQuantity > item.orderedQuantity
    );
    if (overReceived) {
      toast.error(
        `Received quantity for "${overReceived.productTitle}" exceeds ordered quantity`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        purchaseOrder: selectedPOId,
        receivedItems: receivedItems.map((item) => ({
          product: item.product,
          productTitle: item.productTitle,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: typeof item.receivedQuantity === 'number' ? item.receivedQuantity : 0,
        })),
        notes: notes.trim(),
      };

      await api.post('/grn', payload);
      toast.success('Goods Receipt Note created successfully');
      handleCreateClose();
      fetchGrns(1, search);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create Goods Receipt Note');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Table row actions ────────────────────────────────────────────────
  const renderActions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <IconButton
        size="small"
        onClick={() => handleViewOpen(row)}
        sx={{
          color: 'text.secondary',
          '&:hover': { color: 'primary.main', bgcolor: '#EFF6FF' },
        }}
      >
        <VisibilityIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          Goods Receipt Notes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Receive goods against purchase orders
        </Typography>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={grns}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search GRNs..."
        onAdd={handleCreateOpen}
        addLabel="New GRN"
        actions={renderActions}
        emptyMessage="No goods receipt notes found. Create your first GRN to start receiving goods."
        exportFilename="goods_receipts"
      />

      {/* ─── View GRN Detail Dialog ───────────────────────────────────── */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleViewClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h4">GRN Details</Typography>
          {viewingGrn && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {viewingGrn.grnNumber}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent dividers>
          {viewLoading ? (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : viewingGrn ? (
            <Box>
              {/* GRN Summary */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  mb: 3,
                  mt: 1,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    GRN Number
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                    {viewingGrn.grnNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Purchase Order
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                    {viewingGrn.purchaseOrder?.orderNumber || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Received Date
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {viewingGrn.receivedDate
                      ? dayjs(viewingGrn.receivedDate).format('MMM D, YYYY [at] h:mm A')
                      : '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Received By
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {viewingGrn.receivedBy?.name || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Created At
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {viewingGrn.createdAt
                      ? dayjs(viewingGrn.createdAt).format('MMM D, YYYY [at] h:mm A')
                      : '-'}
                  </Typography>
                </Box>
                {viewingGrn.notes && (
                  <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Notes
                    </Typography>
                    <Typography variant="body2">{viewingGrn.notes}</Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Received Items Table */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Received Items ({viewingGrn.receivedItems?.length || 0})
              </Typography>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Ordered Qty
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Received Qty
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(viewingGrn.receivedItems || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No items recorded
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (viewingGrn.receivedItems || []).map((item, idx) => {
                        const ordered = item.orderedQuantity || 0;
                        const received = item.receivedQuantity || 0;
                        const isFull = received >= ordered;
                        const isPartial = received > 0 && received < ordered;
                        const isNone = received === 0;

                        return (
                          <TableRow key={item._id || idx}>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {idx + 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {item.product?.title || item.productTitle || 'Unknown Product'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">{ordered}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{
                                  color: isFull
                                    ? '#059669'
                                    : isPartial
                                    ? '#D97706'
                                    : 'text.primary',
                                }}
                              >
                                {received}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={
                                  isFull
                                    ? 'Complete'
                                    : isPartial
                                    ? 'Partial'
                                    : isNone
                                    ? 'Not Received'
                                    : '-'
                                }
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: 22,
                                  bgcolor: isFull
                                    ? '#F0FDF4'
                                    : isPartial
                                    ? '#FFFBEB'
                                    : '#F9FAFB',
                                  color: isFull
                                    ? '#059669'
                                    : isPartial
                                    ? '#D97706'
                                    : '#6B7280',
                                  border: '1px solid',
                                  borderColor: isFull
                                    ? '#BBF7D0'
                                    : isPartial
                                    ? '#FDE68A'
                                    : '#E5E7EB',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No data available
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleViewClose} variant="outlined" color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Create GRN Dialog ────────────────────────────────────────── */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCreateClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h4">Create Goods Receipt Note</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Receive goods against a purchase order
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            {/* Step 1: Select Purchase Order */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Select Purchase Order
            </Typography>

            {posLoading ? (
              <Box sx={{ mb: 3 }}>
                <Skeleton variant="rounded" height={56} />
              </Box>
            ) : (
              <TextField
                select
                fullWidth
                label="Purchase Order"
                value={selectedPOId}
                onChange={handlePOChange}
                disabled={submitting}
                sx={{ mb: 3 }}
                helperText={
                  eligiblePOs.length === 0 && !posLoading
                    ? 'No eligible purchase orders found (must be Approved, Ordered, or Partially Received)'
                    : ''
                }
              >
                <MenuItem value="">
                  <em>-- Select a Purchase Order --</em>
                </MenuItem>
                {eligiblePOs.map((po) => (
                  <MenuItem key={po._id} value={po._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {po.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>
                        |
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {po.supplier?.name || po.supplier?.company || 'Unknown Supplier'}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip
                        label={po.status}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.675rem',
                          height: 20,
                          bgcolor:
                            po.status === 'Approved'
                              ? '#F0FDF4'
                              : po.status === 'Ordered'
                              ? '#EFF6FF'
                              : '#FFFBEB',
                          color:
                            po.status === 'Approved'
                              ? '#059669'
                              : po.status === 'Ordered'
                              ? '#2563EB'
                              : '#D97706',
                        }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Loading PO details */}
            {poDetailsLoading && (
              <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading purchase order details...
                </Typography>
              </Box>
            )}

            {/* Step 2: Items table once PO is selected */}
            {selectedPODetails && !poDetailsLoading && (
              <>
                {/* PO summary bar */}
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: '#F8FAFC',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 3,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      PO Number
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {selectedPODetails.orderNumber}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Supplier
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedPODetails.supplier?.name ||
                        selectedPODetails.supplier?.company ||
                        '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Status
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedPODetails.status || '-'}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Items to Receive
                </Typography>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          Ordered Qty
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, minWidth: 140 }}>
                          Received Qty
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {receivedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No items found in this purchase order
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        receivedItems.map((item, idx) => (
                          <TableRow key={item.product || idx}>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {idx + 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {item.productTitle}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight={500}>
                                {item.orderedQuantity}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                size="small"
                                value={item.receivedQuantity}
                                onChange={(e) => handleReceivedQtyChange(idx, e.target.value)}
                                disabled={submitting}
                                inputProps={{
                                  min: 0,
                                  max: item.orderedQuantity,
                                  style: { textAlign: 'center' },
                                }}
                                sx={{
                                  width: 100,
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                  },
                                }}
                                error={
                                  typeof item.receivedQuantity === 'number' &&
                                  item.receivedQuantity > item.orderedQuantity
                                }
                                helperText={
                                  typeof item.receivedQuantity === 'number' &&
                                  item.receivedQuantity > item.orderedQuantity
                                    ? 'Exceeds order'
                                    : ''
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Notes field */}
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                  placeholder="Any additional notes about this receipt (optional)"
                />
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCreateClose} variant="outlined" color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSubmit}
            variant="contained"
            disabled={submitting || !selectedPODetails || poDetailsLoading}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          >
            {submitting ? 'Creating...' : 'Create GRN'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoodsReceipt;

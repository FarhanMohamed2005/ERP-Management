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
  CheckCircle as PaidIcon,
  PictureAsPdf as PdfIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../api/axios';
import DataTable from '../components/DataTable';

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Unpaid', value: 'Unpaid' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Overdue', value: 'Overdue' },
];

// ---------------------------------------------------------------------------
// Status chip color mapping
// ---------------------------------------------------------------------------
const getStatusChipProps = (status) => {
  switch (status) {
    case 'Paid':
      return {
        bgcolor: '#F0FDF4',
        color: '#059669',
        borderColor: '#BBF7D0',
      };
    case 'Unpaid':
      return {
        bgcolor: '#FFFBEB',
        color: '#D97706',
        borderColor: '#FDE68A',
      };
    case 'Partial':
      return {
        bgcolor: '#EFF6FF',
        color: '#2563EB',
        borderColor: '#BFDBFE',
      };
    case 'Overdue':
      return {
        bgcolor: '#FEF2F2',
        color: '#DC2626',
        borderColor: '#FECACA',
      };
    case 'Cancelled':
      return {
        bgcolor: '#F9FAFB',
        color: '#6B7280',
        borderColor: '#E5E7EB',
      };
    default:
      return {
        bgcolor: '#F3F4F6',
        color: '#6B7280',
        borderColor: '#E5E7EB',
      };
  }
};

// ---------------------------------------------------------------------------
// PDF Generation
// ---------------------------------------------------------------------------
const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ---- Color palette ----
  const primaryColor = [41, 98, 255];
  const darkColor = [30, 41, 59];
  const grayColor = [100, 116, 139];
  const lightBg = [248, 250, 252];

  // ---- Company Header ----
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('INVOICE', 20, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('ERP Management System', 20, 32);

  // Invoice number on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(invoice.invoiceNumber || 'N/A', pageWidth - 20, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const statusText = (invoice.status || 'Unknown').toUpperCase();
  doc.text(`Status: ${statusText}`, pageWidth - 20, 32, { align: 'right' });

  // ---- Invoice Info Section ----
  let yPos = 60;

  // Left column - Invoice details
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Invoice Details', 20, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);

  const invoiceDetails = [
    ['Invoice Number:', invoice.invoiceNumber || 'N/A'],
    ['Sales Order:', invoice.salesOrder?.orderNumber || 'N/A'],
    ['Issue Date:', dayjs(invoice.createdAt).format('MMM DD, YYYY')],
    ['Due Date:', invoice.dueDate ? dayjs(invoice.dueDate).format('MMM DD, YYYY') : 'N/A'],
    ['Paid Date:', invoice.paidDate ? dayjs(invoice.paidDate).format('MMM DD, YYYY') : '--'],
  ];

  invoiceDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text(value, 65, yPos);
    yPos += 6;
  });

  // Right column - Customer details
  let rightY = 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text('Bill To', pageWidth - 80, rightY);

  rightY += 8;
  doc.setFontSize(9);

  const customerName = invoice.customer?.name || 'N/A';
  const customerCompany = invoice.customer?.company || '';
  const customerEmail = invoice.customer?.email || '';

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(customerName, pageWidth - 80, rightY);
  rightY += 6;

  if (customerCompany) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(customerCompany, pageWidth - 80, rightY);
    rightY += 6;
  }

  if (customerEmail) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(customerEmail, pageWidth - 80, rightY);
    rightY += 6;
  }

  // ---- Separator ----
  yPos = Math.max(yPos, rightY) + 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // ---- Items Table ----
  const items = invoice.items || [];
  const tableBody = items.map((item, index) => [
    index + 1,
    item.product?.title || item.name || item.description || 'Item',
    item.quantity || 0,
    `$${Number(item.unitPrice || item.price || 0).toFixed(2)}`,
    `$${Number(item.totalPrice || (item.quantity || 0) * (item.unitPrice || item.price || 0)).toFixed(2)}`,
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableBody,
    theme: 'plain',
    margin: { left: 20, right: 20 },
    headStyles: {
      fillColor: lightBg,
      textColor: darkColor,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      lineWidth: { bottom: 0.5 },
      lineColor: [226, 232, 240],
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
      cellPadding: { top: 3.5, bottom: 3.5, left: 6, right: 6 },
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253],
    },
    didDrawPage: () => {},
  });

  // ---- Totals Section ----
  const finalY = doc.lastAutoTable.finalY + 10;
  const totalsX = pageWidth - 80;
  let totalsY = finalY;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text('Subtotal:', totalsX, totalsY);
  doc.setTextColor(...darkColor);
  doc.text(`$${Number(invoice.subtotal || 0).toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
  totalsY += 7;

  // Tax
  doc.setTextColor(...grayColor);
  doc.text('Tax:', totalsX, totalsY);
  doc.setTextColor(...darkColor);
  doc.text(`$${Number(invoice.tax || 0).toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
  totalsY += 3;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX, totalsY, pageWidth - 20, totalsY);
  totalsY += 7;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Total:', totalsX, totalsY);
  doc.text(`$${Number(invoice.total || 0).toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });

  // ---- Notes ----
  if (invoice.notes) {
    const notesY = totalsY + 20;
    doc.setFillColor(...lightBg);
    doc.roundedRect(20, notesY - 4, pageWidth - 40, 25, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    doc.text('Notes:', 25, notesY + 3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 55);
    doc.text(splitNotes, 25, notesY + 10);
  }

  // ---- Footer ----
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text('Generated by ERP Management System', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated on ${dayjs().format('MMM DD, YYYY [at] h:mm A')}`, pageWidth / 2, footerY + 4, { align: 'center' });

  // Save
  doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
};

// ---------------------------------------------------------------------------
// Invoices Page Component
// ---------------------------------------------------------------------------
const Invoices = () => {
  // ---- State ----
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loadingSOs, setLoadingSOs] = useState(false);
  const [createForm, setCreateForm] = useState({
    salesOrder: '',
    tax: '',
    dueDate: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  // View detail dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Mark as paid loading
  const [markingPaidId, setMarkingPaidId] = useState(null);

  // Record payment dialog
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Bank Transfer', reference: '', notes: '' });
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // ---- Fetch invoices ----
  const fetchInvoices = useCallback(async (page = 1, status = '') => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (status) params.status = status;

      const { data } = await api.get('/invoices', { params });
      setInvoices(data.invoices || data.data || []);
      setPagination({
        page: data.page || page,
        limit: data.limit || 10,
        total: data.total || data.totalCount || 0,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices(1, statusFilter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Filter change ----
  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    fetchInvoices(1, newStatus);
  };

  // ---- Page change ----
  const handlePageChange = useCallback(
    (newPage) => {
      fetchInvoices(newPage, statusFilter);
    },
    [fetchInvoices, statusFilter],
  );

  // ---- Create dialog open ----
  const handleOpenCreate = async () => {
    setCreateForm({ salesOrder: '', tax: '', dueDate: '', notes: '' });
    setCreateOpen(true);

    try {
      setLoadingSOs(true);
      const { data } = await api.get('/sales-orders', {
        params: { status: ['Confirmed', 'Delivered'], limit: 100 },
      });
      setSalesOrders(data.salesOrders || data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load sales orders');
    } finally {
      setLoadingSOs(false);
    }
  };

  // ---- Create dialog close ----
  const handleCloseCreate = () => {
    if (creating) return;
    setCreateOpen(false);
    setCreateForm({ salesOrder: '', tax: '', dueDate: '', notes: '' });
    setSalesOrders([]);
  };

  // ---- Create form change ----
  const handleCreateFormChange = (field) => (e) => {
    setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // ---- Submit create ----
  const handleCreateSubmit = async () => {
    if (!createForm.salesOrder) {
      toast.error('Please select a Sales Order');
      return;
    }
    if (!createForm.dueDate) {
      toast.error('Please select a due date');
      return;
    }

    try {
      setCreating(true);
      await api.post('/invoices', {
        salesOrder: createForm.salesOrder,
        tax: createForm.tax ? Number(createForm.tax) : 0,
        dueDate: createForm.dueDate,
        notes: createForm.notes,
      });
      toast.success('Invoice created successfully');
      handleCloseCreate();
      fetchInvoices(1, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  // ---- View detail ----
  const handleViewDetail = async (invoice) => {
    try {
      setViewOpen(true);
      setLoadingDetail(true);
      const { data } = await api.get(`/invoices/${invoice._id}`);
      setViewInvoice(data.invoice || data.data || data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load invoice details');
      setViewOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewInvoice(null);
  };

  // ---- Mark as paid ----
  const handleMarkAsPaid = async (invoice) => {
    try {
      setMarkingPaidId(invoice._id);
      await api.put(`/invoices/${invoice._id}`, {
        status: 'Paid',
        paidDate: new Date().toISOString(),
      });
      toast.success(`Invoice ${invoice.invoiceNumber} marked as paid`);
      fetchInvoices(pagination.page, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update invoice');
    } finally {
      setMarkingPaidId(null);
    }
  };

  // ---- Download PDF ----
  const handleDownloadPDF = async (invoice) => {
    try {
      // Fetch full invoice detail for PDF
      const { data } = await api.get(`/invoices/${invoice._id}`);
      const fullInvoice = data.invoice || data.data || data;
      generateInvoicePDF(fullInvoice);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate PDF');
    }
  };

  // ---- Record Payment ----
  const openPaymentDialog = async (invoice) => {
    setPaymentInvoice(invoice);
    setPaymentForm({ amount: '', method: 'Bank Transfer', reference: '', notes: '' });
    setPaymentOpen(true);
    try {
      const { data } = await api.get(`/payments/${invoice._id}`);
      setPaymentHistory(data.data || []);
    } catch {
      setPaymentHistory([]);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setRecordingPayment(true);
    try {
      const { data } = await api.post('/payments', {
        invoice: paymentInvoice._id,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      });
      toast.success(data.message);
      setPaymentOpen(false);
      fetchInvoices(pagination.page, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  // ---- Table columns ----
  const columns = [
    {
      field: 'invoiceNumber',
      headerName: 'Invoice #',
      width: '14%',
      renderCell: (row) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {row.invoiceNumber}
        </Typography>
      ),
    },
    {
      field: 'salesOrder',
      headerName: 'SO #',
      width: '12%',
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
          ${Number(row.total || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: '12%',
      renderCell: (row) => {
        const chipColors = getStatusChipProps(row.status);
        return (
          <Chip
            label={row.status || 'Unknown'}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: chipColors.bgcolor,
              color: chipColors.color,
              border: '1px solid',
              borderColor: chipColors.borderColor,
            }}
          />
        );
      },
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: '12%',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.dueDate ? dayjs(row.dueDate).format('MMM DD, YYYY') : '--'}
        </Typography>
      ),
    },
  ];

  // ---- Actions column ----
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

      {(row.status === 'Unpaid' || row.status === 'Overdue' || row.status === 'Partial') && (
        <Tooltip title="Record Payment">
          <IconButton
            size="small"
            onClick={() => openPaymentDialog(row)}
            sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
          >
            <PaymentIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {(row.status === 'Unpaid' || row.status === 'Overdue') && (
        <Tooltip title="Mark as Paid">
          <IconButton
            size="small"
            onClick={() => handleMarkAsPaid(row)}
            disabled={markingPaidId === row._id}
            sx={{ color: '#059669', '&:hover': { bgcolor: '#F0FDF4' } }}
          >
            {markingPaidId === row._id ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <PaidIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Download PDF">
        <IconButton
          size="small"
          onClick={() => handleDownloadPDF(row)}
          sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}
        >
          <PdfIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  // ---- Filter chips for header ----
  const filterChips = (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {STATUS_FILTERS.map((filter) => (
        <Chip
          key={filter.value}
          label={filter.label}
          size="small"
          onClick={() => handleFilterChange(filter.value)}
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            px: 0.5,
            ...(statusFilter === filter.value
              ? {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'primary.dark' },
                }
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

  // ---- Render ----
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          Invoices
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, manage, and track invoices for your sales orders
        </Typography>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchPlaceholder="Search invoices..."
        onAdd={handleOpenCreate}
        addLabel="Create Invoice"
        actions={renderActions}
        emptyMessage="No invoices found. Click 'Create Invoice' to generate one from a sales order."
        exportFilename="invoices"
        headerContent={filterChips}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Create Invoice Dialog                                               */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={createOpen}
        onClose={handleCloseCreate}
        maxWidth="sm"
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
              <ReceiptIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4">Create Invoice</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Generate an invoice from a confirmed or delivered sales order
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
                onChange={handleCreateFormChange('salesOrder')}
                disabled={loadingSOs}
                helperText={loadingSOs ? 'Loading sales orders...' : 'Select a confirmed or delivered sales order'}
              >
                {loadingSOs && (
                  <MenuItem value="" disabled>
                    Loading...
                  </MenuItem>
                )}
                {!loadingSOs && salesOrders.length === 0 && (
                  <MenuItem value="" disabled>
                    No eligible sales orders found
                  </MenuItem>
                )}
                {salesOrders.map((so) => (
                  <MenuItem key={so._id} value={so._id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {so.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {so.customer?.name || 'Unknown Customer'} &mdash; ${Number(so.total || so.totalAmount || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Tax */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tax Amount"
                fullWidth
                type="number"
                value={createForm.tax}
                onChange={handleCreateFormChange('tax')}
                placeholder="0.00"
                inputProps={{ min: 0, step: '0.01' }}
                helperText="Tax amount in dollars"
              />
            </Grid>

            {/* Due Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Due Date"
                fullWidth
                type="date"
                required
                value={createForm.dueDate}
                onChange={handleCreateFormChange('dueDate')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: dayjs().format('YYYY-MM-DD') }}
                helperText="Payment due date"
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={createForm.notes}
                onChange={handleCreateFormChange('notes')}
                placeholder="Additional notes or payment instructions (optional)"
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
            {creating ? 'Creating...' : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* View Invoice Detail Dialog                                          */}
      {/* ------------------------------------------------------------------ */}
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
                <ReceiptIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h4">
                  Invoice {viewInvoice?.invoiceNumber || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Full invoice details and line items
                </Typography>
              </Box>
            </Box>
            {viewInvoice && (
              <Chip
                label={viewInvoice.status}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  ...(() => {
                    const c = getStatusChipProps(viewInvoice.status);
                    return { bgcolor: c.bgcolor, color: c.color, border: '1px solid', borderColor: c.borderColor };
                  })(),
                }}
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : viewInvoice ? (
            <Box>
              {/* Invoice Info Grid */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0' }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                      Invoice Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Invoice #</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                          {viewInvoice.invoiceNumber}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Sales Order</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                          {viewInvoice.salesOrder?.orderNumber || '--'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Issue Date</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {dayjs(viewInvoice.createdAt).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Due Date</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {viewInvoice.dueDate ? dayjs(viewInvoice.dueDate).format('MMM DD, YYYY') : '--'}
                        </Typography>
                      </Box>
                      {viewInvoice.paidDate && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Paid Date</Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#059669' }}>
                            {dayjs(viewInvoice.paidDate).format('MMM DD, YYYY')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0' }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                      Customer Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {viewInvoice.customer?.name || '--'}
                        </Typography>
                      </Box>
                      {viewInvoice.customer?.company && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Company</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {viewInvoice.customer.company}
                          </Typography>
                        </Box>
                      )}
                      {viewInvoice.customer?.email && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {viewInvoice.customer.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Line Items Table */}
              <Typography variant="subtitle2" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                Line Items
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: '#E2E8F0', borderRadius: 2, mb: 3 }}>
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
                    {(viewInvoice.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">No line items</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (viewInvoice.items || []).map((item, index) => {
                        const unitPrice = Number(item.unitPrice || item.price || 0);
                        const quantity = Number(item.quantity || 0);
                        const lineTotal = Number(item.totalPrice || unitPrice * quantity);
                        return (
                          <TableRow key={item._id || index} hover>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{index + 1}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {item.product?.title || item.name || item.description || 'Item'}
                              </Typography>
                              {item.product?.sku && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                  {item.product.sku}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">{quantity}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">${unitPrice.toFixed(2)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>${lineTotal.toFixed(2)}</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    minWidth: 280,
                    bgcolor: '#F8FAFC',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      ${Number(viewInvoice.subtotal || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Tax</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      ${Number(viewInvoice.tax || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight={700}>Total</Typography>
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                      ${Number(viewInvoice.total || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              {/* Notes */}
              {viewInvoice.notes && (
                <Paper
                  elevation={0}
                  sx={{ p: 2, bgcolor: '#FFFBEB', borderRadius: 2, border: '1px solid', borderColor: '#FDE68A' }}
                >
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: '#92400E', mb: 0.5 }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewInvoice.notes}
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          {viewInvoice && (viewInvoice.status === 'Unpaid' || viewInvoice.status === 'Overdue') && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PaidIcon />}
              onClick={() => {
                handleMarkAsPaid(viewInvoice);
                handleCloseView();
              }}
              sx={{ mr: 'auto' }}
            >
              Mark as Paid
            </Button>
          )}
          {viewInvoice && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<PdfIcon />}
              onClick={() => handleDownloadPDF(viewInvoice)}
            >
              Download PDF
            </Button>
          )}
          <Button onClick={handleCloseView} variant="outlined" color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Record Payment Dialog                                               */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={paymentOpen}
        onClose={() => !recordingPayment && setPaymentOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PaymentIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4">Record Payment</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Invoice {paymentInvoice?.invoiceNumber} — Total: ${Number(paymentInvoice?.total || 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                Payment History
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Method</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Reference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentHistory.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell><Typography variant="body2">{dayjs(p.createdAt).format('MMM DD, YYYY')}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>${Number(p.amount).toFixed(2)}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{p.method}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{p.reference || '--'}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                <Typography variant="body2" color="text.secondary">Paid so far</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  ${paymentHistory.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Remaining</Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  ${(Number(paymentInvoice?.total || 0) - paymentHistory.reduce((s, p) => s + p.amount, 0)).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                fullWidth
                required
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                inputProps={{ min: 0.01, step: '0.01' }}
                helperText="Payment amount in dollars"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Payment Method"
                fullWidth
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              >
                {['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'Other'].map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reference / Transaction ID"
                fullWidth
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="e.g., TXN-12345"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={() => setPaymentOpen(false)} variant="outlined" color="inherit" disabled={recordingPayment}>
            Cancel
          </Button>
          <Button
            onClick={handleRecordPayment}
            variant="contained"
            disabled={recordingPayment}
            startIcon={recordingPayment ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
          >
            {recordingPayment ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoices;

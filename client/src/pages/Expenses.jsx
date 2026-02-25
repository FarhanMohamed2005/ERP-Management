import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
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
  Card,
  CardContent,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AccountBalance as ExpenseIcon,
  TrendingUp as TotalIcon,
  HourglassEmpty as PendingIcon,
  CheckCircleOutline as ApprovedIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

const CATEGORIES = ['Office Supplies', 'Travel', 'Utilities', 'Rent', 'Salaries', 'Marketing', 'Maintenance', 'Shipping', 'Software', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'Other'];
const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
];

const STATUS_COLORS = {
  Pending: { bgcolor: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' },
  Approved: { bgcolor: '#F0FDF4', color: '#059669', borderColor: '#BBF7D0' },
  Rejected: { bgcolor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' },
};

const PIE_COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#4F46E5', '#EA580C', '#64748B'];

const defaultForm = {
  category: 'Office Supplies',
  amount: '',
  date: dayjs().format('YYYY-MM-DD'),
  description: '',
  paymentMethod: 'Cash',
  vendor: '',
  reference: '',
  notes: '',
  isRecurring: false,
};

const Expenses = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'Admin';

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 10 });
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summaryTotal, setSummaryTotal] = useState(0);

  // Summary data
  const [categorySummary, setCategorySummary] = useState([]);
  const [summaryStats, setSummaryStats] = useState({ pending: 0, approved: 0, monthTotal: 0 });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewExpense, setViewExpense] = useState(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch expenses
  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get('/expenses', { params });
      setExpenses(data.data || []);
      setPagination(data.pagination || { page, total: 0, limit: 10 });
      setSummaryTotal(data.summary?.totalAmount || 0);
    } catch {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, startDate, endDate]);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/expenses/summary', { params: { year: new Date().getFullYear() } });
      setCategorySummary((data.data?.byCategory || []).map(c => ({ name: c._id, value: c.total })));

      // Get status counts
      const [pendRes, appRes] = await Promise.all([
        api.get('/expenses', { params: { status: 'Pending', limit: 1 } }),
        api.get('/expenses', { params: { status: 'Approved', limit: 1 } }),
      ]);
      setSummaryStats({
        pending: pendRes.data.pagination?.total || 0,
        approved: appRes.data.pagination?.total || 0,
        monthTotal: data.data?.grandTotal || 0,
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchExpenses(1); }, [fetchExpenses]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Form handlers
  const updateForm = (field, value) => setForm({ ...form, [field]: value });

  const openCreateDialog = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (expense) => {
    setEditing(expense);
    setForm({
      category: expense.category,
      amount: expense.amount,
      date: dayjs(expense.date).format('YYYY-MM-DD'),
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      vendor: expense.vendor || '',
      reference: expense.reference || '',
      notes: expense.notes || '',
      isRecurring: expense.isRecurring || false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.description) { toast.error('Description is required'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Valid amount is required'); return; }

    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) {
        await api.put(`/expenses/${editing._id}`, payload);
        toast.success('Expense updated');
      } else {
        await api.post('/expenses', payload);
        toast.success('Expense created');
      }
      setDialogOpen(false);
      fetchExpenses(editing ? pagination.page : 1);
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  // View
  const openViewDialog = async (expense) => {
    try {
      const { data } = await api.get(`/expenses/${expense._id}`);
      setViewExpense(data.data);
      setViewOpen(true);
    } catch {
      toast.error('Failed to load expense details');
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingExpense) return;
    setDeleting(true);
    try {
      await api.delete(`/expenses/${deletingExpense._id}`);
      toast.success('Expense deleted');
      setDeleteOpen(false);
      setDeletingExpense(null);
      fetchExpenses(pagination.page);
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Approve/Reject
  const handleApprove = async (expense, status) => {
    try {
      await api.put(`/expenses/${expense._id}/approve`, { status });
      toast.success(`Expense ${status.toLowerCase()}`);
      fetchExpenses(pagination.page);
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Columns
  const columns = [
    {
      field: 'expenseNumber',
      headerName: 'Expense #',
      width: '12%',
      renderCell: (row) => <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.expenseNumber}</Typography>,
    },
    { field: 'category', headerName: 'Category', width: '14%' },
    {
      field: 'description',
      headerName: 'Description',
      width: '20%',
      renderCell: (row) => (
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{row.description}</Typography>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: '12%',
      renderCell: (row) => <Typography variant="body2" fontWeight={600}>${Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>,
    },
    {
      field: 'date',
      headerName: 'Date',
      width: '12%',
      renderCell: (row) => dayjs(row.date).format('MMM DD, YYYY'),
    },
    {
      field: 'paymentMethod',
      headerName: 'Payment',
      width: '12%',
      renderCell: (row) => row.paymentMethod || '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: '10%',
      renderCell: (row) => {
        const sc = STATUS_COLORS[row.status] || STATUS_COLORS.Pending;
        return <Chip label={row.status} size="small" sx={{ ...sc, fontWeight: 600, fontSize: '0.75rem', border: '1px solid', height: 24 }} />;
      },
    },
  ];

  const renderActions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <IconButton size="small" color="info" onClick={() => openViewDialog(row)}><ViewIcon fontSize="small" /></IconButton>
      <IconButton size="small" color="primary" onClick={() => openEditDialog(row)}><EditIcon fontSize="small" /></IconButton>
      {isAdmin && row.status === 'Pending' && (
        <>
          <IconButton size="small" sx={{ color: '#059669' }} onClick={() => handleApprove(row, 'Approved')}><ApproveIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleApprove(row, 'Rejected')}><RejectIcon fontSize="small" /></IconButton>
        </>
      )}
      {isAdmin && (
        <IconButton size="small" color="error" onClick={() => { setDeletingExpense(row); setDeleteOpen(true); }}><DeleteIcon fontSize="small" /></IconButton>
      )}
    </Box>
  );

  const kpiCards = [
    { title: 'Total Expenses', value: `$${summaryStats.monthTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: <TotalIcon />, color: '#2563EB', bgColor: '#EFF6FF' },
    { title: 'Approved', value: summaryStats.approved.toString(), icon: <ApprovedIcon />, color: '#059669', bgColor: '#F0FDF4' },
    { title: 'Pending', value: summaryStats.pending.toString(), icon: <PendingIcon />, color: '#D97706', bgColor: '#FFFBEB' },
    { title: 'Filtered Total', value: `$${summaryTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: <ExpenseIcon />, color: '#7C3AED', bgColor: '#F5F3FF' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom>Expenses</Typography>
        <Typography variant="body1" color="text.secondary">Track and manage business expenses</Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpiCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <Card>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{card.title}</Typography>
                    <Typography variant="h4" sx={{ mt: 0.5 }}>{card.value}</Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: card.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { color: card.color, fontSize: 20 } }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Category Chart + Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {categorySummary.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" gutterBottom>By Category</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categorySummary} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {categorySummary.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid item xs={12} md={categorySummary.length > 0 ? 8 : 12}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" gutterBottom>Filters</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Category" fullWidth size="small" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <MenuItem value="">All Categories</MenuItem>
                    {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField label="Start Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField label="End Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        {STATUS_FILTERS.map((sf) => (
          <Chip key={sf.value} label={sf.label} onClick={() => setStatusFilter(sf.value)}
            variant={statusFilter === sf.value ? 'filled' : 'outlined'}
            color={statusFilter === sf.value ? 'primary' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Box>

      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchExpenses(p)}
        onSearch={() => {}}
        searchPlaceholder="Search expenses..."
        onAdd={openCreateDialog}
        addLabel="Add Expense"
        actions={renderActions}
        emptyMessage="No expenses found. Start tracking your business expenses."
        exportFilename="expenses"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Typography variant="h4">{editing ? 'Edit Expense' : 'Add Expense'}</Typography></DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField select label="Category *" fullWidth value={form.category} onChange={(e) => updateForm('category', e.target.value)}>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Amount *" type="number" fullWidth value={form.amount} onChange={(e) => updateForm('amount', e.target.value)} inputProps={{ min: 0, step: 0.01 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Date *" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => updateForm('date', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Payment Method" fullWidth value={form.paymentMethod} onChange={(e) => updateForm('paymentMethod', e.target.value)}>
                {PAYMENT_METHODS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description *" fullWidth value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Vendor" fullWidth value={form.vendor} onChange={(e) => updateForm('vendor', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Reference" fullWidth value={form.reference} onChange={(e) => updateForm('reference', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" multiline rows={2} fullWidth value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={form.isRecurring} onChange={(e) => updateForm('isRecurring', e.target.checked)} />} label="Recurring expense" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit" disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Add Expense'}</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">{viewExpense?.expenseNumber}</Typography>
            {viewExpense && <Chip label={viewExpense.status} size="small" sx={{ ...STATUS_COLORS[viewExpense.status], fontWeight: 600, border: '1px solid' }} />}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewExpense && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Category</Typography><Typography variant="body1" fontWeight={600}>{viewExpense.category}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="body1" fontWeight={600}>${Number(viewExpense.amount).toFixed(2)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body2">{dayjs(viewExpense.date).format('MMM DD, YYYY')}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Payment Method</Typography><Typography variant="body2">{viewExpense.paymentMethod}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption" color="text.secondary">Description</Typography><Typography variant="body2">{viewExpense.description}</Typography></Grid>
              {viewExpense.vendor && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Vendor</Typography><Typography variant="body2">{viewExpense.vendor}</Typography></Grid>}
              {viewExpense.reference && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Reference</Typography><Typography variant="body2">{viewExpense.reference}</Typography></Grid>}
              {viewExpense.notes && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography variant="body2">{viewExpense.notes}</Typography></Grid>}
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Recurring</Typography><Typography variant="body2">{viewExpense.isRecurring ? 'Yes' : 'No'}</Typography></Grid>
              {viewExpense.createdBy && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Created By</Typography><Typography variant="body2">{viewExpense.createdBy.name}</Typography></Grid>}
              {viewExpense.approvedBy && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Approved By</Typography><Typography variant="body2">{viewExpense.approvedBy.name}</Typography></Grid>}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {isAdmin && viewExpense?.status === 'Pending' && (
            <>
              <Button variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => { handleApprove(viewExpense, 'Approved'); setViewOpen(false); }}>Approve</Button>
              <Button variant="contained" color="error" startIcon={<RejectIcon />} onClick={() => { handleApprove(viewExpense, 'Rejected'); setViewOpen(false); }}>Reject</Button>
            </>
          )}
          <Button onClick={() => setViewOpen(false)} variant="outlined" color="inherit">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingExpense(null); }}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete "${deletingExpense?.expenseNumber}"?`}
        confirmText="Delete"
        loading={deleting}
      />
    </Box>
  );
};

export default Expenses;

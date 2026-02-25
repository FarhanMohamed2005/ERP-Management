import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  Typography,
  Box,
  Chip,
  MenuItem,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import CSVImportDialog from '../components/CSVImportDialog';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const customerSchema = yup.object().shape({
  name: yup
    .string()
    .required('Customer name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: yup
    .string()
    .email('Enter a valid email address')
    .notRequired(),
  phone: yup
    .string()
    .notRequired()
    .max(20, 'Phone number is too long'),
  company: yup
    .string()
    .notRequired()
    .max(100, 'Company name is too long'),
  address: yup.object().shape({
    street: yup.string().notRequired().max(200, 'Street is too long'),
    city: yup.string().notRequired().max(100, 'City is too long'),
    state: yup.string().notRequired().max(100, 'State is too long'),
    zipCode: yup.string().notRequired().max(20, 'Zip code is too long'),
    country: yup.string().notRequired().max(100, 'Country is too long'),
  }),
  isActive: yup.boolean(),
});

const defaultValues = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  isActive: true,
};

// ---------------------------------------------------------------------------
// Customers page component
// ---------------------------------------------------------------------------
const Customers = () => {
  // ---- State -----------------------------------------------------------
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Debounce ref
  const debounceRef = useRef(null);

  // ---- Form ------------------------------------------------------------
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(customerSchema),
    defaultValues,
  });

  // ---- Fetch customers --------------------------------------------------
  const fetchCustomers = useCallback(async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const { data } = await api.get('/customers', {
        params: { page, limit: 10, search: searchTerm },
      });

      // Support both { customers, ...pagination } and { data, ...pagination }
      const list = data.customers || data.data || [];
      setCustomers(list);
      setPagination({
        page: data.page || page,
        limit: data.limit || 10,
        total: data.total || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCustomers(1, '');
  }, [fetchCustomers]);

  // ---- Search with debounce ---------------------------------------------
  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchCustomers(1, value);
      }, 400);
    },
    [fetchCustomers],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ---- Pagination -------------------------------------------------------
  const handlePageChange = useCallback(
    (newPage) => {
      fetchCustomers(newPage, search);
    },
    [fetchCustomers, search],
  );

  // ---- Dialog open / close ----------------------------------------------
  const openAddDialog = () => {
    setEditingCustomer(null);
    reset(defaultValues);
    setDialogOpen(true);
  };

  const openEditDialog = (customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      address: {
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        zipCode: customer.address?.zipCode || '',
        country: customer.address?.country || '',
      },
      isActive: customer.isActive !== undefined ? customer.isActive : true,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
    reset(defaultValues);
  };

  // ---- Create / Update --------------------------------------------------
  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);

      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, formData);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer created successfully');
      }

      closeDialog();
      fetchCustomers(editingCustomer ? pagination.page : 1, search);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          `Failed to ${editingCustomer ? 'update' : 'create'} customer`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete -----------------------------------------------------------
  const handleDeleteClick = (customer) => {
    setDeleteTarget(customer);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/customers/${deleteTarget._id}`);
      toast.success('Customer deleted successfully');
      setDeleteTarget(null);

      // If deleting the last item on the current page, go back one page
      const isLastOnPage = customers.length === 1 && pagination.page > 1;
      fetchCustomers(isLastOnPage ? pagination.page - 1 : pagination.page, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  // ---- Table columns ----------------------------------------------------
  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      renderCell: (row) => (
        <Typography variant="body2" fontWeight={600} noWrap>
          {row.name}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {row.email || '--'}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {row.phone || '--'}
        </Typography>
      ),
    },
    {
      field: 'company',
      headerName: 'Company',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {row.company || '--'}
        </Typography>
      ),
    },
    {
      field: 'city',
      headerName: 'City',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {row.address?.city || '--'}
        </Typography>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 110,
      renderCell: (row) => (
        <Chip
          label={row.isActive !== false ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            bgcolor: row.isActive !== false ? '#F0FDF4' : '#FEF2F2',
            color: row.isActive !== false ? '#059669' : '#DC2626',
            fontWeight: 600,
          }}
        />
      ),
    },
  ];

  // ---- Render -----------------------------------------------------------
  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h2" gutterBottom>
            Customers
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your customer records, contacts, and company information
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<UploadIcon />}
          onClick={() => setImportOpen(true)}
          sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E5E7EB' }}
        >
          Import CSV
        </Button>
      </Box>

      {/* Data table */}
      <DataTable
        title=""
        columns={columns}
        data={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search customers..."
        onAdd={openAddDialog}
        addLabel="Add Customer"
        emptyMessage="No customers found. Add your first customer to get started."
        exportFilename="customers"
        actions={(row) => (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => navigate(`/customers/${row._id}`)}
                sx={{ color: 'text.secondary', '&:hover': { color: 'info.main' } }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => openEditDialog(row)}
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(row)}
                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      />

      {/* ---- Add / Edit dialog ----------------------------------------- */}
      <Dialog
        open={dialogOpen}
        onClose={!submitting ? closeDialog : undefined}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {editingCustomer
                ? 'Update the customer details below'
                : 'Fill in the details to create a new customer'}
            </Typography>
          </DialogTitle>

          <DialogContent dividers sx={{ pt: 3 }}>
            <Grid container spacing={2.5}>
              {/* ---- Basic fields ---- */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Customer Name"
                      placeholder="Enter full name"
                      fullWidth
                      required
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email Address"
                      placeholder="email@example.com"
                      type="email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone Number"
                      placeholder="+1 (555) 000-0000"
                      fullWidth
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Company"
                      placeholder="Company name"
                      fullWidth
                      error={!!errors.company}
                      helperText={errors.company?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Status"
                      fullWidth
                      value={field.value === true || field.value === 'true' ? 'true' : 'false'}
                      onChange={(e) => field.onChange(e.target.value === 'true')}
                    >
                      <MenuItem value="true">Active</MenuItem>
                      <MenuItem value="false">Inactive</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              {/* ---- Address section ---- */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.75rem',
                  }}
                >
                  Address Information
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="address.street"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Street Address"
                      placeholder="123 Main St, Suite 100"
                      fullWidth
                      error={!!errors.address?.street}
                      helperText={errors.address?.street?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="address.city"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="City"
                      placeholder="City"
                      fullWidth
                      error={!!errors.address?.city}
                      helperText={errors.address?.city?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="address.state"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="State / Province"
                      placeholder="State"
                      fullWidth
                      error={!!errors.address?.state}
                      helperText={errors.address?.state?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="address.zipCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Zip / Postal Code"
                      placeholder="10001"
                      fullWidth
                      error={!!errors.address?.zipCode}
                      helperText={errors.address?.zipCode?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="address.country"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Country"
                      placeholder="United States"
                      fullWidth
                      error={!!errors.address?.country}
                      helperText={errors.address?.country?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2.5 }}>
            <Button
              onClick={closeDialog}
              variant="outlined"
              color="inherit"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {submitting
                ? editingCustomer
                  ? 'Updating...'
                  : 'Creating...'
                : editingCustomer
                  ? 'Update Customer'
                  : 'Create Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ---- Delete confirmation --------------------------------------- */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />

      <CSVImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entityType="Customers"
        apiEndpoint="/customers/import"
        requiredFields={['name', 'email']}
        onSuccess={() => fetchCustomers(1, search)}
      />
    </Box>
  );
};

export default Customers;

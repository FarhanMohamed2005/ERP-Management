import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import CSVImportDialog from '../components/CSVImportDialog';

// --------------- validation schema ---------------
const supplierSchema = yup.object().shape({
  name: yup.string().required('Supplier name is required').trim(),
  email: yup.string().email('Invalid email address').nullable().default(''),
  phone: yup.string().nullable().default(''),
  company: yup.string().nullable().default(''),
  address: yup.object().shape({
    street: yup.string().nullable().default(''),
    city: yup.string().nullable().default(''),
    state: yup.string().nullable().default(''),
    zipCode: yup.string().nullable().default(''),
    country: yup.string().nullable().default(''),
  }),
  isActive: yup.boolean().default(true),
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

// --------------- table columns ---------------
const columns = [
  {
    field: 'name',
    headerName: 'Name',
    width: '20%',
  },
  {
    field: 'email',
    headerName: 'Email',
    width: '20%',
    renderCell: (row) => row.email || '-',
  },
  {
    field: 'phone',
    headerName: 'Phone',
    width: '14%',
    renderCell: (row) => row.phone || '-',
  },
  {
    field: 'company',
    headerName: 'Company',
    width: '16%',
    renderCell: (row) => row.company || '-',
  },
  {
    field: 'city',
    headerName: 'City',
    width: '12%',
    renderCell: (row) => row.address?.city || '-',
  },
  {
    field: 'isActive',
    headerName: 'Status',
    width: '10%',
    renderCell: (row) => (
      <Chip
        label={row.isActive ? 'Active' : 'Inactive'}
        color={row.isActive ? 'success' : 'default'}
        size="small"
        variant="outlined"
      />
    ),
  },
];

// --------------- component ---------------
const Suppliers = () => {
  // data state
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 10 });
  const [search, setSearch] = useState('');

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // debounce ref
  const debounceRef = useRef(null);

  // react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(supplierSchema),
    defaultValues,
  });

  // --------------- fetch suppliers ---------------
  const fetchSuppliers = useCallback(async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/suppliers', {
        params: { page, limit: 10, search: searchTerm },
      });
      setSuppliers(data.suppliers || data.data || []);
      setPagination({
        page: data.page || page,
        total: data.total || data.totalCount || 0,
        limit: data.limit || 10,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers(1, search);
  }, [fetchSuppliers]); // eslint-disable-line react-hooks/exhaustive-deps

  // --------------- debounced search ---------------
  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchSuppliers(1, value);
      }, 400);
    },
    [fetchSuppliers]
  );

  // clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // --------------- pagination ---------------
  const handlePageChange = (newPage) => {
    fetchSuppliers(newPage, search);
  };

  // --------------- add / edit dialog ---------------
  const openAddDialog = () => {
    setEditingSupplier(null);
    reset(defaultValues);
    setDialogOpen(true);
  };

  const openEditDialog = (supplier) => {
    setEditingSupplier(supplier);
    reset({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      company: supplier.company || '',
      address: {
        street: supplier.address?.street || '',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        zipCode: supplier.address?.zipCode || '',
        country: supplier.address?.country || '',
      },
      isActive: supplier.isActive !== undefined ? supplier.isActive : true,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingSupplier(null);
    reset(defaultValues);
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier._id}`, formData);
        toast.success('Supplier updated successfully');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier created successfully');
      }
      closeDialog();
      fetchSuppliers(editingSupplier ? pagination.page : 1, search);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSubmitting(false);
    }
  };

  // --------------- delete ---------------
  const openDeleteDialog = (supplier) => {
    setDeletingSupplier(supplier);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingSupplier(null);
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    setDeleting(true);
    try {
      await api.delete(`/suppliers/${deletingSupplier._id}`);
      toast.success('Supplier deleted successfully');
      closeDeleteDialog();
      fetchSuppliers(pagination.page, search);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete supplier');
    } finally {
      setDeleting(false);
    }
  };

  // --------------- row actions ---------------
  const renderActions = (row) => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <IconButton size="small" color="info" onClick={() => navigate(`/suppliers/${row._id}`)}>
        <ViewIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" color="primary" onClick={() => openEditDialog(row)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" color="error" onClick={() => openDeleteDialog(row)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  // --------------- render ---------------
  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h2" gutterBottom>
            Suppliers
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your suppliers and their contact information
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
        columns={columns}
        data={suppliers}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search suppliers..."
        onAdd={openAddDialog}
        addLabel="Add Supplier"
        actions={renderActions}
        emptyMessage="No suppliers found. Add your first supplier to get started."
        exportFilename="suppliers"
      />

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            <Typography variant="h4">
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </Typography>
          </DialogTitle>

          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {/* Basic info */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  fullWidth
                  required
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  {...register('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company"
                  fullWidth
                  {...register('company')}
                  error={!!errors.company}
                  helperText={errors.company?.message}
                />
              </Grid>

              {/* Address section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
                  Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Street"
                  fullWidth
                  {...register('address.street')}
                  error={!!errors.address?.street}
                  helperText={errors.address?.street?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="City"
                  fullWidth
                  {...register('address.city')}
                  error={!!errors.address?.city}
                  helperText={errors.address?.city?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="State"
                  fullWidth
                  {...register('address.state')}
                  error={!!errors.address?.state}
                  helperText={errors.address?.state?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Zip Code"
                  fullWidth
                  {...register('address.zipCode')}
                  error={!!errors.address?.zipCode}
                  helperText={errors.address?.zipCode?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Country"
                  fullWidth
                  {...register('address.country')}
                  error={!!errors.address?.country}
                  helperText={errors.address?.country?.message}
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Status"
                  select
                  fullWidth
                  defaultValue={editingSupplier ? (editingSupplier.isActive ? 'true' : 'false') : 'true'}
                  {...register('isActive')}
                  error={!!errors.isActive}
                  helperText={errors.isActive?.message}
                >
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={closeDialog} variant="outlined" color="inherit" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Add Supplier'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${deletingSupplier?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />

      <CSVImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entityType="Suppliers"
        apiEndpoint="/suppliers/import"
        requiredFields={['name', 'email']}
        onSuccess={() => fetchSuppliers(1, search)}
      />
    </Box>
  );
};

export default Suppliers;

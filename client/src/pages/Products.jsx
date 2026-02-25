import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  FormControlLabel,
  Switch,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, WarningAmber as LowStockIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import CSVImportDialog from '../components/CSVImportDialog';

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------
const productSchema = yup.object().shape({
  title: yup
    .string()
    .required('Title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title must be at most 150 characters'),
  sku: yup
    .string()
    .required('SKU is required')
    .min(2, 'SKU must be at least 2 characters')
    .max(30, 'SKU must be at most 30 characters')
    .transform((value) => (value ? value.toUpperCase() : value)),
  description: yup.string().max(1000, 'Description must be at most 1000 characters'),
  category: yup
    .string()
    .required('Category is required')
    .min(2, 'Category must be at least 2 characters'),
  price: yup
    .number()
    .typeError('Price must be a number')
    .required('Price is required')
    .min(0, 'Price cannot be negative'),
  stock: yup
    .number()
    .typeError('Stock must be a number')
    .required('Stock is required')
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  reorderLevel: yup
    .number()
    .typeError('Reorder level must be a number')
    .required('Reorder level is required')
    .integer('Reorder level must be a whole number')
    .min(0, 'Reorder level cannot be negative'),
  unit: yup.string().required('Unit is required'),
  isActive: yup.boolean(),
});

// ---------------------------------------------------------------------------
// Default form values
// ---------------------------------------------------------------------------
const defaultValues = {
  title: '',
  sku: '',
  description: '',
  category: '',
  price: '',
  stock: '',
  reorderLevel: '',
  unit: 'pcs',
  isActive: true,
};

// ---------------------------------------------------------------------------
// Category options (common ERP categories)
// ---------------------------------------------------------------------------
const categoryOptions = [
  'Electronics',
  'Furniture',
  'Office Supplies',
  'Raw Materials',
  'Packaging',
  'Food & Beverage',
  'Clothing',
  'Tools',
  'Machinery',
  'Other',
];

// ---------------------------------------------------------------------------
// Products Page Component
// ---------------------------------------------------------------------------
const Products = () => {
  // ----- State -----
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Debounce ref
  const searchTimer = useRef(null);

  // ----- react-hook-form -----
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(productSchema),
    defaultValues,
  });

  // ----- Fetch Products -----
  const fetchProducts = useCallback(async (page = 1, searchQuery = '', lowStock = false) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: searchQuery,
        category: '',
      };
      if (lowStock) params.lowStock = true;
      const { data } = await api.get('/products', { params });
      setProducts(data.products || data.data || []);
      setPagination({
        page: data.page || page,
        limit: data.limit || 10,
        total: data.total || data.totalCount || 0,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1, search, lowStockOnly);
  }, [lowStockOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----- Debounced Search Handler -----
  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
      searchTimer.current = setTimeout(() => {
        fetchProducts(1, value, lowStockOnly);
      }, 300);
    },
    [fetchProducts]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  // ----- Page Change Handler -----
  const handlePageChange = useCallback(
    (newPage) => {
      fetchProducts(newPage, search, lowStockOnly);
    },
    [fetchProducts, search, lowStockOnly]
  );

  // ----- Open Add Dialog -----
  const handleAdd = () => {
    setEditingProduct(null);
    reset(defaultValues);
    setDialogOpen(true);
  };

  // ----- Open Edit Dialog -----
  const handleEdit = (product) => {
    setEditingProduct(product);
    reset({
      title: product.title || '',
      sku: product.sku || '',
      description: product.description || '',
      category: product.category || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      reorderLevel: product.reorderLevel ?? '',
      unit: product.unit || 'pcs',
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setDialogOpen(true);
  };

  // ----- Close Dialog -----
  const handleDialogClose = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingProduct(null);
    reset(defaultValues);
  };

  // ----- Submit (Create / Update) -----
  const onSubmit = async (formData) => {
    try {
      setSaving(true);
      const payload = {
        ...formData,
        sku: formData.sku.toUpperCase(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        reorderLevel: Number(formData.reorderLevel),
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', payload);
        toast.success('Product created successfully');
      }

      handleDialogClose();
      fetchProducts(editingProduct ? pagination.page : 1, search, lowStockOnly);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        (editingProduct ? 'Failed to update product' : 'Failed to create product');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ----- Delete Handlers -----
  const handleDeleteClick = (product) => {
    setDeletingProduct(product);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    try {
      setDeleting(true);
      await api.delete(`/products/${deletingProduct._id}`);
      toast.success('Product deleted successfully');
      setConfirmOpen(false);
      setDeletingProduct(null);
      // If current page has only one item and it's not the first page, go to previous page
      if (products.length === 1 && pagination.page > 1) {
        fetchProducts(pagination.page - 1, search, lowStockOnly);
      } else {
        fetchProducts(pagination.page, search, lowStockOnly);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setDeletingProduct(null);
  };

  // ----- Table Columns -----
  const columns = [
    {
      field: 'title',
      headerName: 'Title',
      width: '20%',
      renderCell: (row) => (
        <Typography variant="body2" fontWeight={600} noWrap>
          {row.title}
        </Typography>
      ),
    },
    {
      field: 'sku',
      headerName: 'SKU',
      width: '10%',
      renderCell: (row) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
          {row.sku}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: '12%',
    },
    {
      field: 'price',
      headerName: 'Price',
      width: '10%',
      renderCell: (row) => (
        <Typography variant="body2" fontWeight={500}>
          ${Number(row.price).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: '10%',
      renderCell: (row) => {
        const isLow = row.stock <= (row.reorderLevel || 0);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: isLow ? 'error.main' : 'text.primary',
              }}
            >
              {row.stock}
            </Typography>
            {isLow && (
              <Chip
                label="Low"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  bgcolor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: 'unit',
      headerName: 'Unit',
      width: '8%',
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: '10%',
      renderCell: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            bgcolor: row.isActive ? '#F0FDF4' : '#F9FAFB',
            color: row.isActive ? '#059669' : '#6B7280',
            border: '1px solid',
            borderColor: row.isActive ? '#BBF7D0' : '#E5E7EB',
          }}
        />
      ),
    },
  ];

  // ----- Actions Column -----
  const renderActions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <IconButton
        size="small"
        onClick={() => handleEdit(row)}
        sx={{
          color: 'primary.main',
          '&:hover': { bgcolor: '#EFF6FF' },
        }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleDeleteClick(row)}
        sx={{
          color: 'error.main',
          '&:hover': { bgcolor: '#FEF2F2' },
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  // ----- Render -----
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2" gutterBottom>
            Products
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your product catalog
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<UploadIcon />}
            onClick={() => setImportOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E5E7EB' }}
          >
            Import CSV
          </Button>
          <Button
            variant={lowStockOnly ? 'contained' : 'outlined'}
            color={lowStockOnly ? 'error' : 'inherit'}
            startIcon={<LowStockIcon />}
            onClick={() => setLowStockOnly((prev) => !prev)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: lowStockOnly ? undefined : '#E5E7EB',
            }}
          >
            {lowStockOnly ? 'Showing Low Stock' : 'Low Stock Filter'}
          </Button>
        </Box>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search products..."
        onAdd={handleAdd}
        addLabel="Add Product"
        actions={renderActions}
        emptyMessage="No products found. Click 'Add Product' to create one."
        exportFilename="products"
      />

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {editingProduct
                ? 'Update the product details below'
                : 'Fill in the details to add a new product'}
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={2.5} sx={{ mt: 0 }}>
              {/* Title */}
              <Grid item xs={12} sm={8}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Title"
                      fullWidth
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      placeholder="Enter product title"
                    />
                  )}
                />
              </Grid>

              {/* SKU */}
              <Grid item xs={12} sm={4}>
                <Controller
                  name="sku"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="SKU"
                      fullWidth
                      error={!!errors.sku}
                      helperText={errors.sku?.message}
                      placeholder="e.g. PROD-001"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      inputProps={{ style: { textTransform: 'uppercase' } }}
                    />
                  )}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Category"
                      fullWidth
                      select
                      error={!!errors.category}
                      helperText={errors.category?.message}
                    >
                      {categoryOptions.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Price */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Price"
                      fullWidth
                      type="number"
                      error={!!errors.price}
                      helperText={errors.price?.message}
                      placeholder="0.00"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                      inputProps={{ min: 0, step: '0.01' }}
                    />
                  )}
                />
              </Grid>

              {/* Stock */}
              <Grid item xs={12} sm={4}>
                <Controller
                  name="stock"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Stock"
                      fullWidth
                      type="number"
                      error={!!errors.stock}
                      helperText={errors.stock?.message}
                      placeholder="0"
                      inputProps={{ min: 0 }}
                    />
                  )}
                />
              </Grid>

              {/* Reorder Level */}
              <Grid item xs={12} sm={4}>
                <Controller
                  name="reorderLevel"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Reorder Level"
                      fullWidth
                      type="number"
                      error={!!errors.reorderLevel}
                      helperText={errors.reorderLevel?.message}
                      placeholder="0"
                      inputProps={{ min: 0 }}
                    />
                  )}
                />
              </Grid>

              {/* Unit */}
              <Grid item xs={12} sm={4}>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Unit"
                      fullWidth
                      select
                      error={!!errors.unit}
                      helperText={errors.unit?.message}
                    >
                      {['pcs', 'kg', 'g', 'lbs', 'oz', 'liters', 'ml', 'meters', 'feet', 'box', 'pack', 'set'].map(
                        (unit) => (
                          <MenuItem key={unit} value={unit}>
                            {unit}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      placeholder="Enter product description (optional)"
                    />
                  )}
                />
              </Grid>

              {/* Active Toggle */}
              <Grid item xs={12}>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Active Product
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Inactive products will not appear in sales orders
                          </Typography>
                        </Box>
                      }
                      sx={{ ml: 0 }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={handleDialogClose}
              variant="outlined"
              color="inherit"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving
                ? 'Saving...'
                : editingProduct
                ? 'Update Product'
                : 'Create Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={
          deletingProduct
            ? `Are you sure you want to delete "${deletingProduct.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this product?'
        }
        confirmText="Delete"
        loading={deleting}
      />

      <CSVImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entityType="Products"
        apiEndpoint="/products/import"
        requiredFields={['title', 'sku']}
        onSuccess={() => fetchProducts(1, search, lowStockOnly)}
      />
    </Box>
  );
};

export default Products;

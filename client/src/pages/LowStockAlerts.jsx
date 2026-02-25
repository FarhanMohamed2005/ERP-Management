import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import {
  WarningAmber,
  CheckCircleOutline,
  Refresh,
  FileDownload,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../api/axios';

// ---------------------------------------------------------------------------
// CSV Export Utility
// ---------------------------------------------------------------------------
const exportCSV = (items) => {
  const headers = ['Product', 'SKU', 'Category', 'Stock', 'Reorder Level', 'Deficit', 'Unit Price'];
  const rows = items.map((p) => [
    p.title,
    p.sku,
    p.category,
    p.stock,
    p.reorderLevel,
    p.reorderLevel - p.stock,
    p.price,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `low_stock_alerts_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
};

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
const getStatus = (product) => {
  if (product.stock === 0) return 'Critical';
  if (product.stock < product.reorderLevel / 2) return 'Low';
  return 'Warning';
};

const statusColors = {
  Critical: { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Low: { bg: '#FFEDD5', color: '#EA580C', border: '#FED7AA' },
  Warning: { bg: '#FEF9C3', color: '#A16207', border: '#FDE68A' },
};

const rowTints = {
  Critical: 'rgba(220, 38, 38, 0.04)',
  Low: 'rgba(234, 88, 12, 0.03)',
  Warning: 'transparent',
};

// ---------------------------------------------------------------------------
// Low Stock Alerts Page Component
// ---------------------------------------------------------------------------
const LowStockAlerts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----- Fetch Low Stock Products -----
  const fetchLowStock = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products', {
        params: { lowStock: true, limit: 100 },
      });
      setProducts(data.products || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch low stock products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  // ----- Computed summary values -----
  const totalItems = products.length;
  const totalReorderCost = products.reduce(
    (sum, p) => sum + (p.reorderLevel - p.stock) * p.price,
    0
  );

  // ----- Handle refresh -----
  const handleRefresh = () => {
    fetchLowStock();
  };

  // ----- Handle export -----
  const handleExport = () => {
    if (products.length === 0) {
      toast.info('No data to export');
      return;
    }
    exportCSV(products);
    toast.success('CSV exported successfully');
  };

  // ----- Render -----
  return (
    <Box>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <WarningAmber sx={{ fontSize: 32, color: '#D97706' }} />
            <Typography variant="h2">Low Stock Alerts</Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ ml: 0.5 }}>
            Products that need to be reordered
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#E5E7EB',
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<FileDownload />}
            onClick={handleExport}
            disabled={loading || products.length === 0}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#E5E7EB',
            }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Summary Bar */}
      {!loading && products.length > 0 && (
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          <Paper
            elevation={0}
            sx={{
              px: 3,
              py: 2,
              borderRadius: 2,
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: 200,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarningAmber sx={{ color: '#D97706', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Items Needing Reorder
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {totalItems}
              </Typography>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              px: 3,
              py: 2,
              borderRadius: 2,
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: 240,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontWeight: 700, color: '#DC2626', fontSize: 18 }}>$</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Estimated Reorder Cost
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ${totalReorderCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 10,
          }}
        >
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading low stock data...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 3,
            border: '1px solid #D1FAE5',
            bgcolor: '#F0FDF4',
          }}
        >
          <CheckCircleOutline sx={{ fontSize: 64, color: '#059669', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#065F46', mb: 1 }}>
            All products are sufficiently stocked
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No products are currently at or below their reorder level.
          </Typography>
        </Paper>
      )}

      {/* Data Table */}
      {!loading && products.length > 0 && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 3, border: '1px solid #E5E7EB' }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: '#F9FAFB',
                  '& th': {
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#6B7280',
                    borderBottom: '2px solid #E5E7EB',
                    py: 1.5,
                  },
                }}
              >
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Current Stock</TableCell>
                <TableCell align="right">Reorder Level</TableCell>
                <TableCell align="right">Deficit</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const status = getStatus(product);
                const deficit = product.reorderLevel - product.stock;
                const colors = statusColors[status];

                return (
                  <TableRow
                    key={product._id}
                    sx={{
                      bgcolor: rowTints[status],
                      '&:hover': { bgcolor: 'action.hover' },
                      '& td': { borderBottom: '1px solid #F3F4F6' },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {product.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontWeight: 500 }}
                      >
                        {product.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{product.category}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: product.stock === 0 ? '#DC2626' : '#EA580C',
                        }}
                      >
                        {product.stock}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{product.reorderLevel}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626' }}>
                        {deficit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ${Number(product.price).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default LowStockAlerts;

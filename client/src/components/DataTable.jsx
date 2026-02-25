import { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Paper,
  Typography,
  Button,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, FileDownload as ExportIcon } from '@mui/icons-material';

// ---------------------------------------------------------------------------
// CSV export utility
// ---------------------------------------------------------------------------
const exportToCSV = (columns, data, filename = 'export') => {
  const headers = columns.map((col) => col.headerName);
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col.field];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
  );

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const DataTable = ({
  title,
  columns,
  data,
  loading,
  pagination,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search...',
  onAdd,
  addLabel = 'Add New',
  actions,
  emptyMessage = 'No records found',
  headerContent,
  exportFilename,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2">{title}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {headerContent}
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />
          {exportFilename && data.length > 0 && (
            <Tooltip title="Export to CSV">
              <IconButton
                onClick={() => exportToCSV(columns, data, exportFilename)}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: '#F0FDF4', color: '#059669', borderColor: '#BBF7D0' },
                }}
              >
                <ExportIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onAdd && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
              {addLabel}
            </Button>
          )}
        </Box>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.field} sx={{ width: col.width }}>
                    {col.headerName}
                  </TableCell>
                ))}
                {actions && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col.field}>
                        <Skeleton variant="text" width="80%" />
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell>
                        <Skeleton variant="text" width={80} />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => (
                  <TableRow key={row._id || rowIndex} hover>
                    {columns.map((col) => (
                      <TableCell key={col.field}>
                        {col.renderCell ? col.renderCell(row) : row[col.field]}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell align="right">{actions(row)}</TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total || 0}
            page={(pagination.page || 1) - 1}
            rowsPerPage={pagination.limit || 10}
            onPageChange={(e, newPage) => onPageChange(newPage + 1)}
            rowsPerPageOptions={[10]}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default DataTable;

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  TextField,
  MenuItem,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import api from '../api/axios';
import DataTable from '../components/DataTable';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_OPTIONS = ['', 'create', 'update', 'delete', 'status_change', 'login'];

const ENTITY_OPTIONS = [
  '',
  'Product',
  'Customer',
  'Supplier',
  'SalesOrder',
  'PurchaseOrder',
  'GRN',
  'Invoice',
  'User',
];

const ACTION_CHIP_STYLES = {
  create: { color: '#059669', bg: '#F0FDF4', label: 'Create' },
  update: { color: '#2563EB', bg: '#EFF6FF', label: 'Update' },
  delete: { color: '#DC2626', bg: '#FEF2F2', label: 'Delete' },
  status_change: { color: '#7C3AED', bg: '#F5F3FF', label: 'Status Change' },
  login: { color: '#475569', bg: '#F1F5F9', label: 'Login' },
};

const PAGE_LIMIT = 10;
const DEBOUNCE_DELAY = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getActionChipStyle = (action) =>
  ACTION_CHIP_STYLES[action] || { color: '#475569', bg: '#F1F5F9', label: action };

const formatActionLabel = (action) => {
  if (!action) return '-';
  const style = ACTION_CHIP_STYLES[action];
  return style ? style.label : action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ');
};

const formatEntityLabel = (entity) => {
  if (!entity) return '-';
  // Insert space before capital letters for camelCase names like SalesOrder
  return entity.replace(/([a-z])([A-Z])/g, '$1 $2');
};

// ---------------------------------------------------------------------------
// ActivityLog Page Component
// ---------------------------------------------------------------------------

const ActivityLog = () => {
  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: PAGE_LIMIT });
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Debounce ref
  const debounceRef = useRef(null);

  // ----- Fetch Activity Logs -----
  const fetchLogs = useCallback(async (page = 1, action = '', entity = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_LIMIT,
      };
      if (action) params.action = action;
      if (entity) params.entity = entity;

      const { data } = await api.get('/activity-log', { params });

      setLogs(data.data || []);
      setPagination({
        page: data.pagination?.page || page,
        total: data.pagination?.total || 0,
        limit: data.pagination?.limit || PAGE_LIMIT,
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch activity logs';
      toast.error(message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    fetchLogs(1, actionFilter, entityFilter);
  }, [fetchLogs, actionFilter, entityFilter]);

  // ----- Search Handler (debounced) -----
  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        fetchLogs(1, actionFilter, entityFilter);
      }, DEBOUNCE_DELAY);
    },
    [fetchLogs, actionFilter, entityFilter]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ----- Pagination Handler -----
  const handlePageChange = useCallback(
    (newPage) => {
      fetchLogs(newPage, actionFilter, entityFilter);
    },
    [fetchLogs, actionFilter, entityFilter]
  );

  // ----- Filter Handlers -----
  const handleActionFilterChange = (e) => {
    setActionFilter(e.target.value);
  };

  const handleEntityFilterChange = (e) => {
    setEntityFilter(e.target.value);
  };

  // ----- Table Columns -----
  const columns = [
    {
      field: 'userName',
      headerName: 'User',
      width: '15%',
      renderCell: (row) => (
        <Typography variant="body2" fontWeight={500}>
          {row.userName || row.user?.name || '-'}
        </Typography>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: '14%',
      renderCell: (row) => {
        const style = getActionChipStyle(row.action);
        return (
          <Chip
            label={formatActionLabel(row.action)}
            size="small"
            sx={{
              color: style.color,
              bgcolor: style.bg,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      field: 'entity',
      headerName: 'Entity',
      width: '14%',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary">
          {formatEntityLabel(row.entity)}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: '40%',
      renderCell: (row) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}
        >
          {row.description || '-'}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Timestamp',
      width: '17%',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.createdAt ? dayjs(row.createdAt).format('MMM D, YYYY h:mm A') : '-'}
        </Typography>
      ),
    },
  ];

  // ----- Header Content (Filter Dropdowns) -----
  const headerContent = (
    <>
      <TextField
        select
        size="small"
        label="Action"
        value={actionFilter}
        onChange={handleActionFilterChange}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">
          <em>All Actions</em>
        </MenuItem>
        {ACTION_OPTIONS.filter(Boolean).map((action) => (
          <MenuItem key={action} value={action}>
            {formatActionLabel(action)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Entity"
        value={entityFilter}
        onChange={handleEntityFilterChange}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">
          <em>All Entities</em>
        </MenuItem>
        {ENTITY_OPTIONS.filter(Boolean).map((entity) => (
          <MenuItem key={entity} value={entity}>
            {formatEntityLabel(entity)}
          </MenuItem>
        ))}
      </TextField>
    </>
  );

  // ----- Render -----
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
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
            <HistoryIcon sx={{ color: '#2563EB', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h2">Activity Log</Typography>
            <Typography variant="body2" color="text.secondary">
              Track all changes and actions across the system
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Data Table */}
      <DataTable
        title=""
        columns={columns}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search activity logs..."
        headerContent={headerContent}
        emptyMessage="No activity logs found. Try adjusting your filters."
        exportFilename="activity_log"
      />
    </Box>
  );
};

export default ActivityLog;

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonOutline as PersonIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLES = ['Admin', 'Sales', 'Purchase', 'Inventory', 'Viewer'];

const ROLE_COLORS = {
  Admin: { color: '#DC2626', bg: '#FEF2F2' },
  Sales: { color: '#2563EB', bg: '#EFF6FF' },
  Purchase: { color: '#7C3AED', bg: '#F5F3FF' },
  Inventory: { color: '#D97706', bg: '#FFFBEB' },
  Viewer: { color: '#64748B', bg: '#F8FAFC' },
};

const PAGE_LIMIT = 10;
const DEBOUNCE_DELAY = 300;

// ─── Validation Schema ──────────────────────────────────────────────────────

const editUserSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  role: yup
    .string()
    .oneOf(ROLES, 'Invalid role selected')
    .required('Role is required'),
  isActive: yup.boolean(),
});

// ─── Helper: Get initials from name ─────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Main Component ─────────────────────────────────────────────────────────

const Users = () => {
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: PAGE_LIMIT });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce ref
  const debounceRef = useRef(null);

  // ─── React Hook Form ────────────────────────────────────────────────────

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editUserSchema),
    defaultValues: {
      name: '',
      role: '',
      isActive: true,
    },
  });

  // ─── Fetch Users ────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async (page = 1, searchQuery = '', role = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_LIMIT,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (role) params.role = role;

      const { data } = await api.get('/users', { params });

      setUsers(data.users || data.data || []);
      setPagination({
        page: data.page || data.pagination?.page || page,
        total: data.total || data.pagination?.total || 0,
        limit: data.limit || data.pagination?.limit || PAGE_LIMIT,
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch users';
      toast.error(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUsers(1, search, roleFilter);
  }, [fetchUsers, roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Search Handler (debounced) ─────────────────────────────────────────

  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        fetchUsers(1, value, roleFilter);
      }, DEBOUNCE_DELAY);
    },
    [fetchUsers, roleFilter]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ─── Pagination Handler ─────────────────────────────────────────────────

  const handlePageChange = useCallback(
    (newPage) => {
      fetchUsers(newPage, search, roleFilter);
    },
    [fetchUsers, search, roleFilter]
  );

  // ─── Role Filter Handler ────────────────────────────────────────────────

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
  };

  // ─── Edit Handlers ──────────────────────────────────────────────────────

  const handleEditOpen = (user) => {
    setEditingUser(user);
    reset({
      name: user.name || '',
      role: user.role || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
    reset({ name: '', role: '', isActive: true });
  };

  const handleEditSubmit = async (formData) => {
    if (!editingUser) return;
    setEditLoading(true);
    try {
      await api.put(`/users/${editingUser._id}`, {
        name: formData.name,
        role: formData.role,
        isActive: formData.isActive,
      });
      toast.success('User updated successfully');
      handleEditClose();
      fetchUsers(pagination.page, search, roleFilter);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Delete Handlers ────────────────────────────────────────────────────

  const handleDeleteOpen = (user) => {
    setDeletingUser(user);
    setConfirmOpen(true);
  };

  const handleDeleteClose = () => {
    setConfirmOpen(false);
    setDeletingUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${deletingUser._id}`);
      toast.success('User deleted successfully');
      handleDeleteClose();
      // If last item on page, go back one page
      const isLastItemOnPage = users.length === 1 && pagination.page > 1;
      const targetPage = isLastItemOnPage ? pagination.page - 1 : pagination.page;
      fetchUsers(targetPage, search, roleFilter);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Table Columns ──────────────────────────────────────────────────────

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      width: '25%',
      renderCell: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: '0.813rem',
              fontWeight: 600,
              bgcolor: ROLE_COLORS[row.role]?.bg || '#F1F5F9',
              color: ROLE_COLORS[row.role]?.color || '#64748B',
            }}
          >
            {getInitials(row.name)}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {row.name}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: '25%',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.email}
        </Typography>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: '15%',
      renderCell: (row) => {
        const roleStyle = ROLE_COLORS[row.role] || ROLE_COLORS.Viewer;
        return (
          <Chip
            label={row.role}
            size="small"
            sx={{
              color: roleStyle.color,
              bgcolor: roleStyle.bg,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: '12%',
      renderCell: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            color: row.isActive ? '#059669' : '#DC2626',
            bgcolor: row.isActive ? '#F0FDF4' : '#FEF2F2',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: '13%',
      renderCell: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.createdAt ? dayjs(row.createdAt).format('MMM D, YYYY') : '-'}
        </Typography>
      ),
    },
  ];

  // ─── Table Actions ──────────────────────────────────────────────────────

  const renderActions = (row) => (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
      <Tooltip title="Edit user">
        <IconButton
          size="small"
          onClick={() => handleEditOpen(row)}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'primary.main', bgcolor: '#EFF6FF' },
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete user">
        <IconButton
          size="small"
          onClick={() => handleDeleteOpen(row)}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'error.main', bgcolor: '#FEF2F2' },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  // ─── Header Content (Role Filter) ──────────────────────────────────────

  const headerContent = (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel id="role-filter-label">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FilterIcon sx={{ fontSize: 16 }} />
          Role
        </Box>
      </InputLabel>
      <Select
        labelId="role-filter-label"
        value={roleFilter}
        onChange={handleRoleFilterChange}
        label="Role Filter"
        sx={{ borderRadius: 2 }}
      >
        <MenuItem value="">
          <em>All Roles</em>
        </MenuItem>
        {ROLES.map((role) => (
          <MenuItem key={role} value={role}>
            {role}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  // ─── Render ─────────────────────────────────────────────────────────────

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
            <PersonIcon sx={{ color: '#2563EB', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h2">User Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage user accounts, roles, and permissions
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Data Table */}
      <DataTable
        title=""
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search by name or email..."
        actions={renderActions}
        headerContent={headerContent}
        emptyMessage="No users found. Try adjusting your search or filters."
        exportFilename="users"
      />

      {/* ─── Edit User Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <form onSubmit={handleSubmit(handleEditSubmit)}>
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
                <EditIcon sx={{ color: '#2563EB', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h4">Edit User</Typography>
                <Typography variant="caption" color="text.secondary">
                  {editingUser?.email}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {/* Name Field */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="Enter user's full name"
                  />
                )}
              />

              {/* Role Field */}
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Role"
                    fullWidth
                    error={!!errors.role}
                    helperText={errors.role?.message}
                  >
                    {ROLES.map((role) => (
                      <MenuItem key={role} value={role}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: ROLE_COLORS[role]?.color || '#64748B',
                            }}
                          />
                          {role}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              {/* Active Status */}
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: field.value ? '#F0FDF4' : '#FEF2F2',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color={field.value ? 'success' : 'default'}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Account Status
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {field.value
                              ? 'User can access the system'
                              : 'User access is suspended'}
                          </Typography>
                        </Box>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>
                )}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={handleEditClose}
              variant="outlined"
              color="inherit"
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editLoading}
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={
          deletingUser
            ? `Are you sure you want to delete "${deletingUser.name}"? This action cannot be undone and all associated data will be permanently removed.`
            : 'Are you sure you want to delete this user?'
        }
        confirmText="Delete"
        loading={deleteLoading}
      />
    </Box>
  );
};

export default Users;

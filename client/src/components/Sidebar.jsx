import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory2 as ProductsIcon,
  People as CustomersIcon,
  LocalShipping as SuppliersIcon,
  ShoppingCart as SalesIcon,
  Receipt as PurchaseIcon,
  AssignmentTurnedIn as GRNIcon,
  Description as InvoiceIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as ReportsIcon,
  WarningAmber as LowStockIcon,
  AssignmentReturn as CreditNoteIcon,
  History as ActivityLogIcon,
  RequestQuote as QuotationIcon,
  AccountBalanceWallet as ExpenseIcon,
} from '@mui/icons-material';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, roles: null },
  { label: 'Products', path: '/products', icon: <ProductsIcon />, roles: null },
  { label: 'Low Stock Alerts', path: '/low-stock', icon: <LowStockIcon />, roles: ['Admin', 'Inventory'] },
  { label: 'Customers', path: '/customers', icon: <CustomersIcon />, roles: ['Admin', 'Sales'] },
  { label: 'Suppliers', path: '/suppliers', icon: <SuppliersIcon />, roles: ['Admin', 'Purchase'] },
  { divider: true, label: 'Orders' },
  { label: 'Sales Orders', path: '/sales-orders', icon: <SalesIcon />, roles: ['Admin', 'Sales'] },
  { label: 'Quotations', path: '/quotations', icon: <QuotationIcon />, roles: ['Admin', 'Sales'] },
  { label: 'Purchase Orders', path: '/purchase-orders', icon: <PurchaseIcon />, roles: ['Admin', 'Purchase'] },
  { label: 'Goods Receipt', path: '/grn', icon: <GRNIcon />, roles: ['Admin', 'Purchase', 'Inventory'] },
  { divider: true, label: 'Finance' },
  { label: 'Invoices', path: '/invoices', icon: <InvoiceIcon />, roles: ['Admin', 'Sales'] },
  { label: 'Credit Notes', path: '/credit-notes', icon: <CreditNoteIcon />, roles: ['Admin', 'Sales'] },
  { label: 'Expenses', path: '/expenses', icon: <ExpenseIcon />, roles: ['Admin', 'Sales', 'Purchase'] },
  { label: 'Reports', path: '/reports', icon: <ReportsIcon />, roles: ['Admin', 'Sales', 'Purchase'] },
  { divider: true, label: 'Administration' },
  { label: 'Activity Log', path: '/activity-log', icon: <ActivityLogIcon />, roles: ['Admin'] },
  { label: 'User Management', path: '/users', icon: <AdminIcon />, roles: ['Admin'] },
];

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isAllowed = (roles) => {
    if (!roles) return true;
    return roles.includes(user?.role);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <Box sx={{ px: 2.5, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>E</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ color: '#F8FAFC', fontWeight: 700, lineHeight: 1.2 }}>
            ERP System
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1 }}>
            Management Portal
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 1.5, py: 2, overflowY: 'auto' }}>
        <List disablePadding>
          {menuItems.map((item, index) => {
            if (item.divider) {
              return (
                <Typography
                  key={`divider-${index}`}
                  variant="caption"
                  sx={{
                    px: 1.5,
                    pt: index === 0 ? 0 : 2.5,
                    pb: 1,
                    display: 'block',
                    color: '#475569',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: '0.688rem',
                  }}
                >
                  {item.label}
                </Typography>
              );
            }

            if (!isAllowed(item.roles)) return null;

            const isActive = location.pathname === item.path;

            return (
              <ListItemButton
                key={item.path}
                selected={isActive}
                onClick={() => handleNav(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.3,
                  px: 1.5,
                  py: 1,
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  bgcolor: isActive ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: '#FFFFFF',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? '#60A5FA' : '#64748B',
                    minWidth: 40,
                  },
                  '&:hover .MuiListItemIcon-root': {
                    color: isActive ? '#60A5FA' : '#94A3B8',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Bottom section */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography variant="caption" sx={{ color: '#475569' }}>
          ERP Management v1.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;

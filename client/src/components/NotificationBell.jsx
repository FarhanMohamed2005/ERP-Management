import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as BellIcon,
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import api from '../api/axios';

const severityConfig = {
  error: { icon: <ErrorIcon fontSize="small" />, color: '#DC2626', bg: '#FEF2F2' },
  warning: { icon: <WarningIcon fontSize="small" />, color: '#D97706', bg: '#FFFBEB' },
  info: { icon: <InfoIcon fontSize="small" />, color: '#2563EB', bg: '#EFF6FF' },
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
      setCount(data.count || 0);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => setAnchorEl(null);

  const handleClick = (link) => {
    handleClose();
    if (link) navigate(link);
  };

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ color: 'text.secondary', mr: 1 }}>
        <Badge badgeContent={count} color="error" max={99}>
          <BellIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 460,
            borderRadius: 2,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Notifications
          </Typography>
          {count > 0 && (
            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
              {count} alert{count !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.map((n, i) => {
              const cfg = severityConfig[n.severity] || severityConfig.info;
              return (
                <Box key={n.id || i}>
                  <ListItemButton
                    onClick={() => handleClick(n.link)}
                    sx={{ px: 2.5, py: 1.5, '&:hover': { bgcolor: cfg.bg } }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: cfg.color }}>
                      {cfg.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={n.title}
                      secondary={n.message}
                      primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: '0.75rem', mt: 0.3 }}
                    />
                  </ListItemButton>
                  {i < notifications.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell;

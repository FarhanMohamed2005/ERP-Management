import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  TrendingUp,
  TrendingDown,
  Warning,
  Info,
  ExpandMore,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../api/axios';

/* ── colour / icon map per insight type ────────────────────────── */
const insightConfig = {
  positive: {
    icon: <TrendingUp fontSize="small" />,
    color: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
  warning: {
    icon: <Warning fontSize="small" />,
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  critical: {
    icon: <Warning fontSize="small" />,
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
  info: {
    icon: <Info fontSize="small" />,
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
};

/* ── component ─────────────────────────────────────────────────── */
const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ── fetch data ──────────────────────────────────────────────── */
  const fetchInsights = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const { data } = await api.get('/ai/insights');

      if (data?.success) {
        setInsights(data.data?.insights || []);
        setMetrics(data.data?.metrics || null);
      } else {
        setInsights([]);
        setMetrics(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load AI insights. Please try again later.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── helpers ─────────────────────────────────────────────────── */
  const revenueChange = metrics?.revenueChange ?? null;
  const revenuePositive = revenueChange !== null && revenueChange >= 0;

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderTop: 'none',
        overflow: 'visible',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          borderRadius: '12px 12px 0 0',
          background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 100%)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* ── Header ──────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                color: '#fff',
              }}
            >
              <AIIcon fontSize="small" />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              AI Business Insights
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => fetchInsights(true)}
              disabled={refreshing}
              sx={{
                color: 'text.secondary',
                transition: 'transform 0.3s',
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setExpanded((prev) => !prev)}
              sx={{
                color: 'text.secondary',
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.25s ease',
              }}
            >
              <ExpandMore fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* ── Collapsible body ────────────────────────────────── */}
        <Collapse in={expanded} timeout="auto">
          {/* Loading state */}
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[1, 2, 3, 4].map((k) => (
                <Box
                  key={k}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={22}
                    sx={{ borderRadius: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    width="90%"
                    height={18}
                    sx={{ borderRadius: 1, mt: 0.5 }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Error state */}
          {!loading && error && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#FEF2F2',
                border: '1px solid #FECACA',
                textAlign: 'center',
              }}
            >
              <Warning
                sx={{ color: '#DC2626', fontSize: 28, mb: 0.5 }}
              />
              <Typography
                variant="body2"
                sx={{ color: '#991B1B', fontWeight: 500 }}
              >
                {error}
              </Typography>
            </Box>
          )}

          {/* Empty state */}
          {!loading && !error && insights.length === 0 && (
            <Box
              sx={{
                py: 4,
                px: 2,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: '#F9FAFB',
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <AIIcon
                sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                No insights available yet. Add more data to see AI-powered
                analysis.
              </Typography>
            </Box>
          )}

          {/* Insights list */}
          {!loading && !error && insights.length > 0 && (
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}
            >
              {insights.map((insight, idx) => {
                const cfg =
                  insightConfig[insight.type] || insightConfig.info;
                return (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: cfg.bg,
                      border: '1px solid',
                      borderColor: cfg.border,
                      transition: 'box-shadow 0.2s',
                      '&:hover': {
                        boxShadow: `0 2px 8px ${cfg.border}80`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        mt: '2px',
                        color: cfg.color,
                        display: 'flex',
                        flexShrink: 0,
                      }}
                    >
                      {cfg.icon}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: cfg.color, lineHeight: 1.4 }}
                      >
                        {insight.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.25, lineHeight: 1.5 }}
                      >
                        {insight.message}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* ── Metrics chips row ─────────────────────────────── */}
          {!loading && !error && metrics && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              {/* Revenue change chip */}
              {revenueChange !== null && (
                <Chip
                  size="small"
                  icon={
                    revenuePositive ? (
                      <TrendingUp sx={{ fontSize: 16 }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16 }} />
                    )
                  }
                  label={`Revenue ${revenuePositive ? '+' : ''}${revenueChange}%`}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: revenuePositive ? '#F0FDF4' : '#FEF2F2',
                    color: revenuePositive ? '#16A34A' : '#DC2626',
                    border: '1px solid',
                    borderColor: revenuePositive ? '#BBF7D0' : '#FECACA',
                    '& .MuiChip-icon': {
                      color: revenuePositive ? '#16A34A' : '#DC2626',
                    },
                  }}
                />
              )}

              {/* Low stock chip */}
              {metrics.lowStockCount != null && (
                <Chip
                  size="small"
                  icon={<Warning sx={{ fontSize: 16 }} />}
                  label={`${metrics.lowStockCount} Low Stock`}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor:
                      metrics.lowStockCount > 0 ? '#FFFBEB' : '#F0FDF4',
                    color:
                      metrics.lowStockCount > 0 ? '#D97706' : '#16A34A',
                    border: '1px solid',
                    borderColor:
                      metrics.lowStockCount > 0 ? '#FDE68A' : '#BBF7D0',
                    '& .MuiChip-icon': {
                      color:
                        metrics.lowStockCount > 0 ? '#D97706' : '#16A34A',
                    },
                  }}
                />
              )}

              {/* Overdue invoices chip */}
              {metrics.overdueInvoices != null && (
                <Chip
                  size="small"
                  icon={<Warning sx={{ fontSize: 16 }} />}
                  label={`${metrics.overdueInvoices} Overdue`}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor:
                      metrics.overdueInvoices > 0 ? '#FEF2F2' : '#F0FDF4',
                    color:
                      metrics.overdueInvoices > 0 ? '#DC2626' : '#16A34A',
                    border: '1px solid',
                    borderColor:
                      metrics.overdueInvoices > 0 ? '#FECACA' : '#BBF7D0',
                    '& .MuiChip-icon': {
                      color:
                        metrics.overdueInvoices > 0 ? '#DC2626' : '#16A34A',
                    },
                  }}
                />
              )}
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AIInsights;

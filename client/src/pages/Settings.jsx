import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Receipt as InvoiceIcon,
  Notifications as NotifIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../api/axios';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      const flat = {};
      if (res.data.raw) {
        res.data.raw.forEach((s) => { flat[s.key] = s.value; });
      }
      setSettings(flat);
    } catch (err) {
      // Init settings if first time
      try {
        await api.post('/settings/init');
        const res = await api.get('/settings');
        const flat = {};
        if (res.data.raw) {
          res.data.raw.forEach((s) => { flat[s.key] = s.value; });
        }
        setSettings(flat);
      } catch (e) {
        setError('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure your ERP system
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          Save Changes
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<BusinessIcon />} label="General" iconPosition="start" />
        <Tab icon={<InvoiceIcon />} label="Invoice & Tax" iconPosition="start" />
        <Tab icon={<NotifIcon />} label="Notifications" iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Company Information</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={settings.companyName || ''}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Email"
                  value={settings.companyEmail || ''}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Phone"
                  value={settings.companyPhone || ''}
                  onChange={(e) => handleChange('companyPhone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Currency"
                  value={settings.currency || 'USD'}
                  onChange={(e) => handleChange('currency', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Currency Symbol"
                  value={settings.currencySymbol || '$'}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Company Address"
                  value={settings.companyAddress || ''}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Invoice Settings</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Invoice Prefix"
                  value={settings.invoicePrefix || 'INV-'}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Payment Terms (days)"
                  type="number"
                  value={settings.paymentTermsDays || 30}
                  onChange={(e) => handleChange('paymentTermsDays', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Invoice Footer Text"
                  value={settings.invoiceFooter || ''}
                  onChange={(e) => handleChange('invoiceFooter', e.target.value)}
                />
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>Tax Settings</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.taxEnabled !== false}
                      onChange={(e) => handleChange('taxEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Tax Calculation"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Default Tax Rate (%)"
                  type="number"
                  value={settings.defaultTaxRate || 0}
                  onChange={(e) => handleChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Notification Preferences</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications !== false}
                      onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.lowStockAlert !== false}
                      onChange={(e) => handleChange('lowStockAlert', e.target.checked)}
                    />
                  }
                  label="Low Stock Alerts"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.overdueInvoiceAlert !== false}
                      onChange={(e) => handleChange('overdueInvoiceAlert', e.target.checked)}
                    />
                  }
                  label="Overdue Invoice Alerts"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Settings;

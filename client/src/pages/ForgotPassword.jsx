import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Email as EmailIcon, ArrowBack } from '@mui/icons-material';
import api from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address');
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F1F5F9',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: 'primary.main',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, letterSpacing: 1 }}>
              E
            </Typography>
          </Box>
          <Typography variant="h2" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your email and we'll send you a reset link
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 4 }}>
            {success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                If that email is registered, a password reset link has been sent. Please check your inbox.
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}
                <form onSubmit={handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{ py: 1.4 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          <Link component={RouterLink} to="/login" underline="hover" fontWeight={600} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <ArrowBack sx={{ fontSize: 16 }} /> Back to Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default ForgotPassword;

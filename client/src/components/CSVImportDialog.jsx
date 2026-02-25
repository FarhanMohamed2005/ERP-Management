import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Upload as UploadIcon, CheckCircle as SuccessIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../api/axios';

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
};

const CSVImportDialog = ({ open, onClose, entityType, apiEndpoint, requiredFields, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const { headers, rows } = parseCSV(event.target.result);
      setParsed({ headers, rows });
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0) return;

    setImporting(true);
    try {
      const { data } = await api.post(apiEndpoint, { rows: parsed.rows });
      setResult(data.data);
      toast.success(data.message);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsed(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UploadIcon sx={{ color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h4">Import {entityType}</Typography>
            <Typography variant="body2" color="text.secondary">Upload a CSV file to bulk import {entityType.toLowerCase()}</Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Required columns: <strong>{requiredFields.join(', ')}</strong>. First row must be headers.
        </Alert>

        <Box
          sx={{
            border: '2px dashed',
            borderColor: file ? 'primary.main' : '#E2E8F0',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: file ? '#F0F9FF' : '#F8FAFC',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'primary.main', bgcolor: '#F0F9FF' },
            mb: 2,
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {file ? (
            <Box>
              <SuccessIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" fontWeight={600}>{file.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {parsed ? `${parsed.rows.length} rows found` : 'Parsing...'}
              </Typography>
            </Box>
          ) : (
            <Box>
              <UploadIcon sx={{ fontSize: 36, color: '#94A3B8', mb: 1 }} />
              <Typography variant="body1" fontWeight={500} color="text.secondary">
                Click to select a CSV file
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported format: .csv
              </Typography>
            </Box>
          )}
        </Box>

        {parsed && parsed.rows.length > 0 && !result && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview (first 5 rows)</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 250 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {parsed.headers.map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsed.rows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      {parsed.headers.map((h) => (
                        <TableCell key={h}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{row[h]}</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {result && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip label={`${result.created} Created`} color="success" variant="outlined" />
              <Chip label={`${result.skipped} Skipped`} color="warning" variant="outlined" />
            </Box>
            {result.errors && result.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Errors:</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, maxHeight: 150, overflow: 'auto' }}>
                  {result.errors.map((err, i) => (
                    <Typography key={i} variant="body2" color="error.main" sx={{ mb: 0.5 }}>
                      Row {err.row}: {err.message}
                    </Typography>
                  ))}
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          {result ? 'Done' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!parsed || parsed.rows.length === 0 || importing}
            startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
          >
            {importing ? 'Importing...' : `Import ${parsed?.rows.length || 0} Rows`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CSVImportDialog;

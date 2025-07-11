import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/**
 * SettingsPanel component provides application settings and configuration options.
 * Handles user preferences and system settings.
 */
const SettingsPanel = ({ onBack }) => {
  const [settings, setSettings] = useState({
    restaurantName: '',
    tableCount: '',
    theme: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Settings could not be loaded!', severity: 'error' });
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => setSettings({ ...settings, [e.target.name]: e.target.value });

  const handleSave = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then(res => res.json())
      .then(() => {
        setSnackbar({ open: true, message: 'Settings saved!', severity: 'success' });
        setLoading(false);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Settings could not be saved!', severity: 'error' });
        setLoading(false);
      });
  };

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>Back</Button>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>System Settings</Typography>
        <TextField fullWidth label="Restaurant Name" name="restaurantName" value={settings.restaurantName} onChange={handleChange} sx={{ mb: 2 }} disabled={loading} />
        <TextField fullWidth label="Table Count" name="tableCount" type="number" value={settings.tableCount} onChange={handleChange} sx={{ mb: 2 }} disabled={loading} />
        <TextField fullWidth label="Theme" name="theme" value={settings.theme} onChange={handleChange} sx={{ mb: 2 }} disabled={loading} />
        <Button variant="contained" onClick={handleSave} disabled={loading}>SAVE</Button>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPanel; 
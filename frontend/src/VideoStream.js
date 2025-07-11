import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Paper, Button, Alert, MenuItem, Select, InputLabel, FormControl, Stack, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * VideoStream component displays the real-time video feed and handles food/QR detection.
 * Manages pending orders and user confirmation actions.
 */
function VideoStream({ tables = [], waiters = [], foods = [], delayWarning }) {
  const [lastQR, setLastQR] = useState('');
  const [lastFood, setLastFood] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [imgKey, setImgKey] = useState(0); // for retrying image reload
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedWaiter, setSelectedWaiter] = useState('');
  const [selectedFood, setSelectedFood] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testError, setTestError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:5000/last_qr')
        .then((res) => res.json())
        .then((data) => setLastQR(data.last_qr || ''))
        .catch(() => setLastQR(''));
      fetch('http://localhost:5000/last_food')
        .then((res) => res.json())
        .then((data) => setLastFood(data.last_food || ''))
        .catch(() => setLastFood(''));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pending order kontrolü
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:5000/pending_order')
        .then(res => res.json())
        .then(data => {
          if (data.pending_order && data.pending_order.food_name && data.pending_order.table_id) {
            setPendingOrder(data.pending_order);
            setModalOpen(true);
          } else {
            setPendingOrder(null);
            setModalOpen(false);
          }
        })
        .catch(() => {
          setPendingOrder(null);
          setModalOpen(false);
        });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Görüntü yüklenince loading'i kapat
  const handleImgLoad = () => {
    setImgLoaded(true);
    setLoading(false);
    setImgError(false);
  };
  const handleImgError = () => {
    setImgLoaded(false);
    setLoading(false);
    setImgError(true);
  };
  const handleRetry = () => {
    setImgLoaded(false);
    setLoading(true);
    setImgError(false);
    setImgKey(prev => prev + 1); // reloads image when img src key changes
  };

  const handleTestOrder = async () => {
    setTestResult(''); setTestError('');
    if (!selectedTable || !selectedFood) {
      setTestError('You must select a table and food!'); setSnackbarOpen(true); return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/camera/food_detected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: selectedTable, food_id: selectedFood, quantity: 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      setTestResult(data.message || 'Success');
      setSnackbarOpen(true);
    } catch (err) {
      setTestError(err.message);
      setSnackbarOpen(true);
    }
  };
  const handleTestWaiter = async () => {
    setTestResult(''); setTestError('');
    if (!selectedTable || !selectedWaiter) {
      setTestError('You must select a table and waiter!'); setSnackbarOpen(true); return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/camera/waiter_detected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: selectedTable, waiter_id: selectedWaiter })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      setTestResult(data.message || 'Success');
      setSnackbarOpen(true);
    } catch (err) {
      setTestError(err.message);
      setSnackbarOpen(true);
    }
  };

  const handleConfirmOrder = async () => {
    setPendingLoading(true);
    try {
      const res = await fetch('http://localhost:5000/confirm_order', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      setTestResult(data.message || 'Order added');
      setSnackbarOpen(true);
      setModalOpen(false);
      setPendingOrder(null);
    } catch (err) {
      setTestError(err.message);
      setSnackbarOpen(true);
    } finally {
      setPendingLoading(false);
    }
  };
  const handleRejectOrder = async () => {
    setPendingLoading(true);
    try {
      await fetch('http://localhost:5000/reject_order', { method: 'POST' });
      setModalOpen(false);
      setPendingOrder(null);
    } catch (err) {
      setModalOpen(false);
      setPendingOrder(null);
    } finally {
      setPendingLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 900, margin: '0 auto', boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          Live Video Stream
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 320, bgcolor: theme.palette.background.paper, borderRadius: 2, mb: 2 }}>
          {loading && <CircularProgress />}
          {imgError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2, width: '100%' }}>
              Image could not be loaded. Please check your camera and server.
              <Button onClick={handleRetry} variant="outlined" color="primary" size="small" sx={{ ml: 2 }}>
                Retry
              </Button>
            </Alert>
          )}
          <img
            key={imgKey}
            src="http://localhost:5000/video_feed"
            alt="Live Stream"
            style={{ maxWidth: '100%', display: imgLoaded && !imgError ? 'block' : 'none', borderRadius: 8 }}
            onLoad={handleImgLoad}
            onError={handleImgError}
          />
        </Box>
        <Paper elevation={2} sx={{ p: 2, mb: 1, bgcolor: theme.palette.info.main, color: theme.palette.primary.contrastText, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Last Scanned QR/Number: <span style={{ fontWeight: 700 }}>{lastQR || 'None'}</span>
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Last Predicted Food: <span style={{ fontWeight: 700 }}>{lastFood || 'None'}</span>
          </Typography>
        </Paper>
        <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Camera Test Panel</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Table</InputLabel>
              <Select value={selectedTable} label="Table" onChange={e => setSelectedTable(e.target.value)}>
                <MenuItem value=""><em>Select</em></MenuItem>
                {tables.map(t => <MenuItem key={t.table_id} value={t.table_id}>{t.table_id}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Waiter</InputLabel>
              <Select value={selectedWaiter} label="Waiter" onChange={e => setSelectedWaiter(e.target.value)}>
                <MenuItem value=""><em>Select</em></MenuItem>
                {waiters.map(w => <MenuItem key={w.waiter_id} value={w.waiter_id}>{w.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Food</InputLabel>
              <Select value={selectedFood} label="Food" onChange={e => setSelectedFood(e.target.value)}>
                <MenuItem value=""><em>Select</em></MenuItem>
                {foods.map(f => <MenuItem key={f.food_id} value={f.food_id}>{f.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" color="primary" onClick={handleTestOrder} sx={{ minWidth: 120 }}>Test Order</Button>
            <Button variant="outlined" color="secondary" onClick={handleTestWaiter} sx={{ minWidth: 120 }}>Test Waiter</Button>
          </Stack>
          {(testResult || testError) && (
            <Alert severity={testError ? 'error' : 'success'} sx={{ mt: 2 }}>{testError || testResult}</Alert>
          )}
        </Box>
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setSnackbarOpen(false)} severity={testError ? 'error' : 'success'} sx={{ width: '100%' }}>
            {testError || testResult}
          </Alert>
        </Snackbar>
        {/* Pending Order Modal */}
        <Dialog open={modalOpen} onClose={handleRejectOrder}>
          <DialogTitle>Food Detection</DialogTitle>
          <DialogContent>
            {pendingOrder && (
              <Box>
                <Typography variant="h6">{pendingOrder.food_name} detected.</Typography>
                <Typography>Table: <b>{pendingOrder.table_id}</b></Typography>
                <Typography>Waiter: <b>{pendingOrder.waiter_id}</b></Typography>
                <Typography>Confidence: <b>{(pendingOrder.confidence * 100).toFixed(1)}%</b></Typography>
                <Typography>Price: <b>{pendingOrder.price ?? '-'} TL</b></Typography>
                <Typography sx={{ mt: 1 }}>Add to bill?</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRejectOrder} color="secondary" disabled={pendingLoading}>No</Button>
            <Button onClick={handleConfirmOrder} color="primary" variant="contained" disabled={pendingLoading} autoFocus>Yes</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default VideoStream; 
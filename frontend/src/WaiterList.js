import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box, Snackbar, Alert, Button, TextField, Stack, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { FaUserTie } from 'react-icons/fa';
import { MdDelete, MdCheckCircle, MdError } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

/**
 * WaiterList component displays and manages the list of waiters in the restaurant.
 * Handles adding, editing, and updating waiter information.
 */
function WaiterList() {
  // State for storing waiter items
  const [waiters, setWaiters] = useState([]);
  // State for loading status
  const [loading, setLoading] = useState(true);
  // State for form data
  const [form, setForm] = useState({ waiter_id: '', name: '', code: '' });
  // State for snackbar messages
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  // State for confirmation dialog visibility
  const [confirmOpen, setConfirmOpen] = useState(false);
  // State for selected waiter for deletion
  const [selectedWaiter, setSelectedWaiter] = useState(null);

  // Function to fetch waiters from the backend
  const fetchWaiters = () => {
    setLoading(true);
    fetch('http://localhost:5000/waiters')
      .then((res) => res.json())
      .then((data) => {
        setWaiters(data);
        setLoading(false);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Waiters could not be loaded!', severity: 'error' });
        setLoading(false);
      });
  };

  // Effect to fetch waiters and set up socket listeners
  useEffect(() => {
    fetchWaiters();
    const socket = io('http://localhost:5000');
    socket.on('order_update', () => {
      fetchWaiters();
    });
    socket.on('waiter_update', () => {
      fetchWaiters();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Function to handle input changes in the form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Function to handle form submission for adding a new waiter
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch('http://localhost:5000/waiters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error occurred!');
        setForm({ waiter_id: '', name: '', code: '' });
        setSnackbar({ open: true, message: 'Waiter added!', severity: 'success' });
        fetchWaiters();
        setLoading(false);
      })
      .catch((err) => {
        setSnackbar({ open: true, message: err.message || 'Error occurred!', severity: 'error' });
        setLoading(false);
      });
  };

  // Function to handle click for deleting a waiter
  const handleDeleteClick = (waiter_id) => {
    setSelectedWaiter(waiter_id);
    setConfirmOpen(true);
  };

  // Function to handle confirmation of deletion
  const handleDeleteConfirm = () => {
    setConfirmOpen(false);
    if (!selectedWaiter) return;
    setLoading(true);
    fetch(`http://localhost:5000/waiters/${selectedWaiter}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        setSnackbar({ open: true, message: 'Waiter deleted!', severity: 'success' });
        fetchWaiters();
        setLoading(false);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Deletion failed!', severity: 'error' });
        setLoading(false);
      });
    setSelectedWaiter(null);
  };

  // Function to handle cancellation of deletion
  const handleDeleteCancel = () => {
    setConfirmOpen(false);
    setSelectedWaiter(null);
  };

  // Function to handle closing the snackbar
  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  // Render loading state
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <CircularProgress />
    </Box>
  );

  // Render the waiter list and add waiter dialog
  return (
    <Card sx={{ maxWidth: 900, margin: '0 auto', boxShadow: 6, borderRadius: 4, bgcolor: 'background.paper', mt: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}>
          Waiters
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mt: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Interest Level</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {waiters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 5, color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <FaUserTie size={54} style={{ marginBottom: 8, color: '#bdbdbd' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.secondary' }}>No waiters found.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : waiters.map((waiter, idx) => (
                <TableRow key={waiter.waiter_id} hover sx={{ transition: 'background 0.2s', bgcolor: idx % 2 === 0 ? 'grey.50' : 'background.paper', ':hover': { bgcolor: 'primary.lighter' } }}>
                  <TableCell>{waiter.name}</TableCell>
                  <TableCell>{waiter.waiter_id}</TableCell>
                  <TableCell>{waiter.code}</TableCell>
                  <TableCell>{waiter.performance}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: waiter.interest_level > 0 ? 'success.main' : waiter.interest_level < 0 ? 'error.main' : 'text.secondary' }}>
                        {waiter.interest_level ?? 0}
                      </Typography>
                      <Box sx={{ width: 60, ml: 1 }}>
                        <Box sx={{ height: 8, borderRadius: 4, background: '#eee', overflow: 'hidden' }}>
                          <Box sx={{ width: `${Math.min(Math.max((waiter.interest_level ?? 0) * 10, 0), 100)}%`, height: '100%', background: waiter.interest_level > 0 ? '#4CB572' : waiter.interest_level < 0 ? '#d32f2f' : '#aaa', transition: 'width 0.3s' }} />
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete waiter" arrow>
                      <IconButton color="error" onClick={() => handleDeleteClick(waiter.waiter_id)}>
                        <MdDelete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={confirmOpen} onClose={handleDeleteCancel} aria-labelledby="confirm-dialog-title" TransitionComponent={motion.div} transition={{ duration: 0.3 }}>
          <DialogTitle id="confirm-dialog-title">Delete Waiter</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this waiter? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>Yes, Delete</Button>
          </DialogActions>
        </Dialog>
        <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'secondary.main' }}>
          Add New Waiter
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField name="waiter_id" label="ID" value={form.waiter_id} onChange={handleChange} required size="small" />
            <TextField name="name" label="Name" value={form.name} onChange={handleChange} required size="small" />
            <TextField name="code" label="Code/Barcode" value={form.code} onChange={handleChange} required size="small" helperText="Unique code or barcode to be used for waiter's entry/exit." />
            <Tooltip title="Add new waiter" arrow>
              <span>
                <Button type="submit" variant="contained" color="secondary" sx={{ minWidth: 120 }} disabled={loading}>
                  {loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                  Add
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Box>
        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} TransitionComponent={motion.div} transition={{ duration: 0.3 }}>
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%', display: 'flex', alignItems: 'center', fontSize: 18, borderRadius: 2 }} icon={
            <AnimatePresence>
              {snackbar.severity === 'success' ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <MdCheckCircle size={28} color="#4CB572" />
                </motion.span>
              ) : snackbar.severity === 'error' ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <MdError size={28} color="#d32f2f" />
                </motion.span>
              ) : null}
            </AnimatePresence>
          }>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}

/**
 * Export the WaiterList component.
 */
export default WaiterList; 
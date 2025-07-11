import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box, Snackbar, Alert, Button, TextField, Stack, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { GiMeal } from 'react-icons/gi';
import { MdDelete, MdCheckCircle, MdError } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

/**
 * FoodList component displays and manages the list of food items in the restaurant.
 * Handles adding, editing, and deleting foods.
 */
function FoodList() {
  // State for storing food items
  const [foods, setFoods] = useState([]);
  // State for loading status
  const [loading, setLoading] = useState(true);
  // State for form data
  const [form, setForm] = useState({ food_id: '', name: '', category: '', price: '' });
  // State for snackbar messages
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  // State for confirmation dialog visibility
  const [confirmOpen, setConfirmOpen] = useState(false);
  // State for selected food for deletion
  const [selectedFood, setSelectedFood] = useState(null);

  // Function to fetch food items from the backend
  const fetchFoods = () => {
    setLoading(true);
    fetch('http://localhost:5000/foods')
      .then((res) => res.json())
      .then((data) => {
        setFoods(data);
        setLoading(false);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Foods could not be loaded!', severity: 'error' });
        setLoading(false);
      });
  };

  // Effect to fetch foods on component mount and set up socket listener
  useEffect(() => {
    fetchFoods();
    const socket = io('http://localhost:5000');
    socket.on('food_update', () => {
      fetchFoods();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Function to handle input changes in the form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Function to handle form submission for adding a new food
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0) {
      setSnackbar({ open: true, message: 'Price must be a positive number!', severity: 'error' });
      return;
    }
    setLoading(true);
    fetch('http://localhost:5000/foods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error occurred!');
        setForm({ food_id: '', name: '', category: '', price: '' });
        setSnackbar({ open: true, message: 'Food added!', severity: 'success' });
        fetchFoods();
        setLoading(false);
      })
      .catch((err) => {
        setSnackbar({ open: true, message: err.message || 'Error occurred!', severity: 'error' });
        setLoading(false);
      });
  };

  // Function to handle clicking the delete button
  const handleDeleteClick = (food_id) => {
    setSelectedFood(food_id);
    setConfirmOpen(true);
  };

  // Function to handle confirming food deletion
  const handleDeleteConfirm = () => {
    setConfirmOpen(false);
    if (!selectedFood) return;
    setLoading(true);
    fetch(`http://localhost:5000/foods/${selectedFood}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        setSnackbar({ open: true, message: 'Food deleted!', severity: 'success' });
        fetchFoods();
        setLoading(false);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Deletion failed!', severity: 'error' });
        setLoading(false);
      });
    setSelectedFood(null);
  };

  // Function to handle cancelling food deletion
  const handleDeleteCancel = () => {
    setConfirmOpen(false);
    setSelectedFood(null);
  };

  // Function to handle closing the snackbar
  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  // Render loading state
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <CircularProgress />
    </Box>
  );

  // Render the main food list and add food dialog
  return (
    <Card sx={{ maxWidth: 900, margin: '0 auto', boxShadow: 6, borderRadius: 4, bgcolor: 'background.paper', mt: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}>
          Foods
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mt: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {foods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box sx={{ py: 5, color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <GiMeal size={54} style={{ marginBottom: 8, color: '#bdbdbd' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.secondary' }}>No food found.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : foods.map((food, idx) => (
                <TableRow key={food.food_id} hover sx={{ transition: 'background 0.2s', bgcolor: idx % 2 === 0 ? 'grey.50' : 'background.paper', ':hover': { bgcolor: 'primary.lighter' } }}>
                  <TableCell>{food.name}</TableCell>
                  <TableCell>{food.food_id}</TableCell>
                  <TableCell>{food.category}</TableCell>
                  <TableCell>{food.price}₺</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete food" arrow>
                      <IconButton color="error" onClick={() => handleDeleteClick(food.food_id)}>
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
          <DialogTitle id="confirm-dialog-title">Delete Food</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this food? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>Yes, Delete</Button>
          </DialogActions>
        </Dialog>
        <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'secondary.main' }}>
          Add New Food
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField name="food_id" label="ID" value={form.food_id} onChange={handleChange} required size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: { xs: '100%', sm: '20%' } }} />
            <TextField name="name" label="Name" value={form.name} onChange={handleChange} required size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: { xs: '100%', sm: '20%' } }} />
            <TextField name="category" label="Category" value={form.category} onChange={handleChange} required size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: { xs: '100%', sm: '20%' } }} helperText="e.g., Main Course, Dessert, Drink" />
            <TextField name="price" label="Price" value={form.price} onChange={handleChange} required type="number" size="small" inputProps={{ step: '0.01' }} InputLabelProps={{ shrink: true }} sx={{ minWidth: { xs: '100%', sm: '20%' } }} />
            <Tooltip title="Add new food" arrow>
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
 * Export the FoodList component.
 */
export default FoodList; 
import React, { useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import { ArrowBack, Delete } from '@mui/icons-material';

const initialUsers = [
  { id: 1, name: 'Admin', role: 'admin', email: 'admin@example.com' },
  { id: 2, name: 'Garson 1', role: 'waiter', email: 'waiter1@example.com' },
  { id: 3, name: 'Garson 2', role: 'waiter', email: 'waiter2@example.com' },
];

/**
 * UserManagement component manages user accounts and permissions.
 * Handles adding, editing, and deleting users.
 */
const UserManagement = ({ onBack }) => {
  const [users, setUsers] = useState(initialUsers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'waiter' });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAdd = () => {
    if (!form.name || !form.email) return;
    setUsers([...users, { ...form, id: Date.now() }]);
    setForm({ name: '', email: '', role: 'waiter' });
    setOpen(false);
  };
  const handleDelete = (id) => setUsers(users.filter(u => u.id !== id));

  return (
    <Box maxWidth={700} mx="auto" mt={4}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={onBack}><ArrowBack /></IconButton>
        <Typography variant="h5" sx={{ ml: 2, fontWeight: 600 }}>Kullanıcı Yönetimi</Typography>
      </Box>
      <Button variant="contained" onClick={handleOpen} sx={{ mb: 2 }}>Kullanıcı Ekle</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ad</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right">İşlem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(user.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Kullanıcı Ekle</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="name" label="Ad" fullWidth value={form.name} onChange={handleChange} />
          <TextField margin="dense" name="email" label="Email" fullWidth value={form.email} onChange={handleChange} />
          <TextField margin="dense" name="role" label="Rol" fullWidth value={form.role} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleAdd} variant="contained">Ekle</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 
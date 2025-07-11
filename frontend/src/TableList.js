import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Snackbar, Alert, Typography, Card, CardContent, CircularProgress, Box, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { MdOutlineTableRestaurant, MdCheckCircle, MdError, MdOutlineInsights } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { AssignmentInd, AddCircle } from '@mui/icons-material';

/**
 * TableList component displays and manages the list of tables in the restaurant.
 * Handles table status, assignment, and related actions.
 */
function TableList({ tables = [], fetchTables, waiters = [] }) {
  // Now tables and fetchTables come from App.js, local fetchTables is not used here.
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportData, setReportData] = useState({ orders: [], waiter: null, foods: [] });
  const [reportTableId, setReportTableId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignResult, setAssignResult] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignSnackbarOpen, setAssignSnackbarOpen] = useState(false);
  const [newTableId, setNewTableId] = useState('');
  const [addTableLoading, setAddTableLoading] = useState(false);
  const [addTableResult, setAddTableResult] = useState('');
  const [addTableError, setAddTableError] = useState('');
  const [addTableSnackbarOpen, setAddTableSnackbarOpen] = useState(false);

  const fetchWaiters = useCallback(() => {
    return fetch('http://localhost:5000/waiters').then(res => res.json()).catch(() => []);
  }, []);
  const fetchFoods = useCallback(() => {
    return fetch('http://localhost:5000/foods').then(res => res.json()).catch(() => []);
  }, []);
  const fetchOrdersByTable = useCallback((table_id) => {
    return fetch(`http://localhost:5000/orders?table_id=${encodeURIComponent(table_id)}`)
      .then(res => res.json()).catch(() => []);
  }, []);

  const handleReportClick = async (table_id, waiter_id) => {
    setReportTableId(table_id);
    setReportOpen(true);
    const [orders, waiters, foods] = await Promise.all([
      fetchOrdersByTable(table_id),
      fetchWaiters(),
      fetchFoods()
    ]);
    const waiter = waiters.find(w => w.waiter_id === waiter_id);
    setReportData({ orders, waiter, foods });
  };
  const handleReportClose = () => {
    setReportOpen(false);
    setReportData({ orders: [], waiter: null, foods: [] });
    setReportTableId(null);
  };

  // Loading state removed, only tables from App.js are used.

  const handleResetClick = (table_id) => {
    setSelectedTable(table_id);
    setConfirmOpen(true);
  };

  const handleResetConfirm = () => {
    setConfirmOpen(false);
    if (!selectedTable) return;
    setLoading(true);
    fetch('http://localhost:5000/reset_table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_id: selectedTable }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message || 'Başarılı');
        setSnackbarOpen(true);
      })
      .catch(() => {
        setError('Hata oluştu!');
        setSnackbarOpen(true);
      })
      .finally(() => {
        if (fetchTables) fetchTables();
        setLoading(false);
      });
    setSelectedTable(null);
  };

  const handleResetCancel = () => {
    setConfirmOpen(false);
    setSelectedTable(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setMessage('');
    setError('');
  };

  const handleAutoAssign = async () => {
    setAssignLoading(true); setAssignResult(''); setAssignError('');
    try {
      const res = await fetch('http://localhost:5000/tables/auto_assign', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      setAssignResult(data.message || 'Başarılı');
      setAssignSnackbarOpen(true);
    } catch (err) {
      setAssignError(err.message);
      setAssignSnackbarOpen(true);
    } finally {
      setAssignLoading(false);
      if (fetchTables) fetchTables();
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableId) {
      setAddTableError('Masa numarası giriniz!');
      setAddTableSnackbarOpen(true);
      return;
    }
    setAddTableLoading(true); setAddTableResult(''); setAddTableError('');
    try {
      const res = await fetch('http://localhost:5000/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: `table_${newTableId}`, waiter_id: null, status: 'empty' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      setAddTableResult(data.message || 'Masa eklendi');
      setNewTableId('');
      setAddTableSnackbarOpen(true);
    } catch (err) {
      setAddTableError(err.message);
      setAddTableSnackbarOpen(true);
    } finally {
      setAddTableLoading(false);
      if (fetchTables) fetchTables();
    }
  };

  // Socket integration for live updates
  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('table_update', () => {
      if (fetchTables) fetchTables();
    });
    socket.on('order_update', () => {
      if (fetchTables) fetchTables();
    });
    return () => {
      socket.disconnect();
    };
  }, [fetchTables]);

  return (
    <Card sx={{ maxWidth: 900, margin: '0 auto', boxShadow: 6, borderRadius: 4, bgcolor: 'background.paper', mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}>
            Tables
          </Typography>
          <Button variant="contained" color="secondary" startIcon={<AssignmentInd />} onClick={handleAutoAssign} disabled={assignLoading} sx={{ minWidth: 180, fontWeight: 700 }}>
            {assignLoading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Auto Assign Waiter
          </Button>
        </Box>
        <Box component="form" onSubmit={handleAddTable} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Table No</InputLabel>
            <Select value={newTableId} label="Table No" onChange={e => setNewTableId(e.target.value)}>
              <MenuItem value=""><em>Select</em></MenuItem>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <MenuItem key={n} value={String(n)}>{n}</MenuItem>)}
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" color="primary" startIcon={<AddCircle />} disabled={addTableLoading} sx={{ minWidth: 140 }}>
            {addTableLoading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Add Table
          </Button>
        </Box>
        <Snackbar open={addTableSnackbarOpen} autoHideDuration={3000} onClose={() => setAddTableSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setAddTableSnackbarOpen(false)} severity={addTableError ? 'error' : 'success'} sx={{ width: '100%' }}>
            {addTableError || addTableResult}
          </Alert>
        </Snackbar>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mt: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell>Table</TableCell>
                <TableCell>Waiter</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Interest Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
                <TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 5, color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <MdOutlineTableRestaurant size={54} style={{ marginBottom: 8, color: '#bdbdbd' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.secondary' }}>No tables found.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : tables.map((table, idx) => {
                const waiter = table.waiter_id ? waiters.find(w => w.waiter_id === table.waiter_id) : null;
                return (
                  <TableRow key={table.table_id} hover sx={{ transition: 'background 0.2s', bgcolor: idx % 2 === 0 ? 'grey.50' : 'background.paper', ':hover': { bgcolor: 'primary.lighter' } }}>
                    <TableCell>{table.table_id}</TableCell>
                    <TableCell>{waiter ? waiter.name : <span style={{color:'#aaa'}}>None</span>}</TableCell>
                    <TableCell>{waiter ? waiter.performance : '-'}</TableCell>
                    <TableCell>
                      {waiter ? (
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
                      ) : '-' }
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: table.status === 'occupied' ? 'success.main' : 'text.secondary' }}>
                        {table.status === 'occupied' ? 'Occupied' : 'Empty'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Reset all orders and bill for this table" arrow placement="top" slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] } }} sx={{ fontSize: 18, bgcolor: 'background.paper', color: 'primary.main' }}>
                        <span>
                          <Button variant="outlined" color="secondary" size="small" onClick={() => handleResetClick(table.table_id)} disabled={loading}>
                            {loading && selectedTable === table.table_id ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                            Reset Bill
                          </Button>
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Table Report" arrow>
                        <Button variant="contained" color="primary" size="small" startIcon={<MdOutlineInsights />} onClick={() => handleReportClick(table.table_id, table.waiter_id)}>
                          Details
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={confirmOpen} onClose={handleResetCancel} aria-labelledby="confirm-dialog-title" TransitionComponent={motion.div} transition={{ duration: 0.3 }}>
          <DialogTitle id="confirm-dialog-title">Reset Bill</DialogTitle>
          <DialogContent>
            <DialogContentText>
              All orders and bills for this table will be reset. Are you sure you want to proceed?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleResetCancel} color="primary">Cancel</Button>
            <Button onClick={handleResetConfirm} color="secondary" variant="contained" autoFocus>Yes, Reset</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={reportOpen} onClose={handleReportClose} maxWidth="md" fullWidth>
          <DialogTitle>Table Report - {reportTableId}</DialogTitle>
          <DialogContent>
            {reportData.orders.length === 0 ? (
              <Typography sx={{ py: 3, color: 'text.secondary' }}>No orders found for this table.</Typography>
            ) : (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Orders</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Food</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.orders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell>{order.food_name}</TableCell>
                        <TableCell>{order.quantity ?? 1}</TableCell>
                        <TableCell>{order.price !== undefined ? order.price + '₺' : '-'}</TableCell>
                        <TableCell>{new Date(order.timestamp).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Total Bill: {reportData.orders.reduce((sum, o) => sum + (o.price || 0), 0)}₺</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Most Ordered Items:</Typography>
                  {(() => {
                    const counts = {};
                    reportData.orders.forEach(o => { counts[o.food_name] = (counts[o.food_name] || 0) + (o.quantity || 1); });
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                    return sorted.length === 0 ? <Typography color="text.secondary">None</Typography> : (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {sorted.slice(0, 3).map(([name, count]) => <li key={name}>{name} <b>({count})</b></li>)}
      </ul>
                    );
                  })()}
                </Box>
                {reportData.waiter && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Waiter Performance and Interest Level:</Typography>
                    <Typography variant="body2">Name: {reportData.waiter.name}</Typography>
                    <Typography variant="body2">Performance: {reportData.waiter.performance}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: reportData.waiter.interest_level > 0 ? 'success.main' : reportData.waiter.interest_level < 0 ? 'error.main' : 'text.secondary' }}>
                        Interest Level: {reportData.waiter.interest_level ?? 0}
                      </Typography>
                      <Box sx={{ width: 60, ml: 1 }}>
                        <Box sx={{ height: 8, borderRadius: 4, background: '#eee', overflow: 'hidden' }}>
                          <Box sx={{ width: `${Math.min(Math.max((reportData.waiter.interest_level ?? 0) * 10, 0), 100)}%`, height: '100%', background: reportData.waiter.interest_level > 0 ? '#4CB572' : reportData.waiter.interest_level < 0 ? '#d32f2f' : '#aaa', transition: 'width 0.3s' }} />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleReportClose} color="primary">Close</Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} TransitionComponent={motion.div} transition={{ duration: 0.3 }}>
          <Alert onClose={handleSnackbarClose} severity={error ? 'error' : 'success'} sx={{ width: '100%', display: 'flex', alignItems: 'center', fontSize: 18, borderRadius: 2 }} icon={
            <AnimatePresence>
              {error ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <MdError size={28} color="#d32f2f" />
                </motion.span>
              ) : (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <MdCheckCircle size={28} color="#4CB572" />
                </motion.span>
              )}
            </AnimatePresence>
          }>
            {error || message}
          </Alert>
        </Snackbar>
        <Snackbar open={assignSnackbarOpen} autoHideDuration={3000} onClose={() => setAssignSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setAssignSnackbarOpen(false)} severity={assignError ? 'error' : 'success'} sx={{ width: '100%' }}>
            {assignError || assignResult}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}

/**
 * Export the TableList component.
 */
export default TableList; 
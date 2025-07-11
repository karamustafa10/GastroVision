import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box, Snackbar, Alert, Button, TextField, Stack, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton } from '@mui/material';
import { MdOutlineReceiptLong, MdDeleteSweep, MdCheckCircle, MdError } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { io } from 'socket.io-client';

/**
 * ReportList component displays and manages the list of orders and reports in the restaurant.
 * Handles filtering, summary statistics, and report actions.
 */
function ReportList() {
  const [orders, setOrders] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [tables, setTables] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ waiter_id: '', food_name: '', start_date: '', end_date: '', table_id: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sorts, setSorts] = useState({ foods: 'desc', waiters: 'desc', tables: 'desc' });

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = [];
    if (filters.waiter_id) params.push(`waiter_id=${encodeURIComponent(filters.waiter_id)}`);
    if (filters.food_name) params.push(`food_name=${encodeURIComponent(filters.food_name)}`);
    if (filters.table_id) params.push(`table_id=${encodeURIComponent(filters.table_id)}`);
    if (dateRange.start) params.push(`start_date=${encodeURIComponent(dateRange.start)}`);
    if (dateRange.end) params.push(`end_date=${encodeURIComponent(dateRange.end)}`);
    const url = 'http://localhost:5000/orders' + (params.length ? `?${params.join('&')}` : '');
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Reports could not be loaded!');
        return res.json();
      })
      .then((data) => {
        setOrders(data);
        setLoading(false);
        if (data.length === 0) {
          setSnackbar({ open: true, message: 'No report/order found for your filter.', severity: 'info' });
        }
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Reports could not be loaded!', severity: 'error' });
        setOrders([]);
        setLoading(false);
      });
  }, [filters, dateRange]);

  const fetchWaiters = useCallback(() => {
    fetch('http://localhost:5000/waiters')
      .then((res) => {
        if (!res.ok) throw new Error('Waiters could not be loaded!');
        return res.json();
      })
      .then((data) => setWaiters(data))
      .catch(() => {
        setWaiters([]);
        setSnackbar({ open: true, message: 'Waiters could not be loaded!', severity: 'error' });
      });
  }, []);
  const fetchTables = useCallback(() => {
    fetch('http://localhost:5000/tables')
      .then((res) => {
        if (!res.ok) throw new Error('Tables could not be loaded!');
        return res.json();
      })
      .then((data) => setTables(data))
      .catch(() => {
        setTables([]);
        setSnackbar({ open: true, message: 'Tables could not be loaded!', severity: 'error' });
      });
  }, []);
  const fetchFoods = useCallback(() => {
    fetch('http://localhost:5000/foods')
      .then((res) => {
        if (!res.ok) throw new Error('Foods could not be loaded!');
        return res.json();
      })
      .then((data) => setFoods(data))
      .catch(() => {
        setFoods([]);
        setSnackbar({ open: true, message: 'Foods could not be loaded!', severity: 'error' });
      });
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchWaiters();
    fetchTables();
    fetchFoods();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('order_update', (order) => {
      setOrders(prev => [order, ...prev]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Functions and variables mistakenly written in useEffect are moved here:
  // Data for summary boxes
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
  const activeWaiters = waiters.length;
  const activeTables = tables.length;

  // Most ordered foods
  const foodCounts = {};
  orders.forEach(o => { foodCounts[o.food_name] = (foodCounts[o.food_name] || 0) + (o.quantity || 1); });
  const topFoods = Object.entries(foodCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 7);

  // Waiter performance ranking
  const waiterPerf = waiters.map(w => ({ name: w.name, performance: w.performance })).sort((a, b) => b.performance - a.performance).slice(0, 7);
  // Total turnover by table
  const tableRevenue = tables.map(t => ({
    name: t.table_id,
    revenue: orders.filter(o => o.table_id === t.table_id).reduce((sum, o) => sum + (o.price || 0), 0)
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 7);

  // Order trend by time (daily order count)
  const orderTrends = (() => {
    const days = {};
    orders.forEach(o => {
      const day = o.timestamp ? o.timestamp.slice(0, 10) : 'Unknown';
      days[day] = (days[day] || 0) + 1;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)).slice(-14); // last 14 days
  })();
  // Total turnover by food category
  const categoryRevenue = (() => {
    const foodMap = {};
    foods.forEach(f => { foodMap[f.food_id] = f; });
    const cats = {};
    orders.forEach(o => {
      const food = foodMap[o.food_id];
      const cat = food ? food.category : 'Unknown';
      cats[cat] = (cats[cat] || 0) + (o.price || 0);
    });
    return Object.entries(cats).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
  })();
  const pieColors = ['#4CB572', '#1976d2', '#ff9800', '#d32f2f', '#9c27b0', '#00bcd4', '#607d8b'];

  // Sorting functions
  const sortedTopFoods = [...topFoods].sort((a, b) => sorts.foods === 'desc' ? b.count - a.count : a.count - b.count);
  const sortedWaiterPerf = [...waiterPerf].sort((a, b) => sorts.waiters === 'desc' ? b.performance - a.performance : a.performance - b.performance);
  const sortedTableRevenue = [...tableRevenue].sort((a, b) => sorts.tables === 'desc' ? b.revenue - a.revenue : a.revenue - b.revenue);

  const handleSortChange = (e) => {
    setSorts({ ...sorts, [e.target.name]: e.target.value });
  };

  // Function to clear filters
  const handleClearFilters = () => {
    setFilters({ waiter_id: '', food_name: '', start_date: '', end_date: '', table_id: '' });
    setDateRange({ start: '', end: '' });
    fetchOrders();
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <CircularProgress />
    </Box>
  );

  const handleDateFilter = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleFilterDropdown = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDeleteAllClick = () => {
    setConfirmOpen(true);
  };

  const handleDeleteAllCancel = () => {
    setConfirmOpen(false);
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const total = orders.reduce((sum, order) => sum + (order.price || 0), 0);

  const handleDeleteAllConfirm = () => {
    setConfirmOpen(false);
    setLoading(true);
    fetch('http://localhost:5000/orders', {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        setSnackbar({ open: true, message: 'All reports/orders deleted!', severity: 'success' });
        fetchOrders();
        setLoading(false);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Deletion failed!', severity: 'error' });
        setLoading(false);
      });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Card sx={{ maxWidth: 1100, margin: '0 auto', boxShadow: 6, borderRadius: 4, bgcolor: 'background.paper', mt: 3, px: { xs: 1, sm: 3 } }}>
      <CardContent sx={{ px: { xs: 0.5, sm: 2 }, py: { xs: 1, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, fontSize: { xs: 18, sm: 24 } }}>
            Operation/Order Report
          </Typography>
          <form onSubmit={handleDateFilter} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginLeft: 8, width: '100%' }}>
            <TextField
              name="start"
              label="Start"
              type="datetime-local"
              value={dateRange.start}
              onChange={handleDateChange}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { xs: '100%', sm: 120 } }}
            />
            <TextField
              name="end"
              label="End"
              type="datetime-local"
              value={dateRange.end}
              onChange={handleDateChange}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { xs: '100%', sm: 120 } }}
            />
            <TextField
              select
              name="waiter_id"
              label="Waiter"
              value={filters.waiter_id}
              onChange={handleFilterDropdown}
              size="small"
              SelectProps={{ native: true }}
              sx={{ minWidth: { xs: '100%', sm: 120 } }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">All</option>
              {waiters.map(w => <option key={w.waiter_id} value={w.waiter_id}>{w.name}</option>)}
            </TextField>
            <TextField
              select
              name="food_name"
              label="Food"
              value={filters.food_name}
              onChange={handleFilterDropdown}
              size="small"
              SelectProps={{ native: true }}
              sx={{ minWidth: { xs: '100%', sm: 120 } }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">All</option>
              {foods.map(f => <option key={f.food_id} value={f.name}>{f.name}</option>)}
            </TextField>
            <TextField
              select
              name="table_id"
              label="Table"
              value={filters.table_id || ''}
              onChange={handleFilterDropdown}
              size="small"
              SelectProps={{ native: true }}
              sx={{ minWidth: { xs: '100%', sm: 100 } }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">All</option>
              {tables.map(t => <option key={t.table_id} value={t.table_id}>{t.table_id}</option>)}
            </TextField>
            <Button type="submit" variant="contained" color="secondary" sx={{ minWidth: 120, boxShadow: 2, borderRadius: 2, transition: 'all 0.2s', ':hover': { boxShadow: 4, transform: 'scale(1.04)' } }}>
              Filter
            </Button>
            <Button type="button" variant="outlined" color="primary" sx={{ minWidth: 120, borderRadius: 2, fontWeight: 700, borderWidth: 2, borderColor: 'primary.main', background: 'rgba(25, 118, 210, 0.06)', color: 'primary.main', transition: 'all 0.2s', ':hover': { boxShadow: 2, transform: 'scale(1.04)', background: 'rgba(25, 118, 210, 0.12)' } }} onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </form>
          <Tooltip title="Delete all reports/orders" arrow>
            <span>
              <IconButton color="error" onClick={handleDeleteAllClick} disabled={orders.length === 0 || loading} sx={{ transition: 'all 0.2s', ':hover': { transform: 'scale(1.1)' } }}>
                {loading ? <CircularProgress size={22} sx={{ mr: 1 }} /> : <MdDeleteSweep size={26} />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, p: 2, minWidth: 180, boxShadow: 2 }}>
            <Typography variant="subtitle2">Total Orders</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalOrders}</Typography>
          </Box>
          <Box sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', borderRadius: 2, p: 2, minWidth: 180, boxShadow: 2 }}>
            <Typography variant="subtitle2">Total Revenue</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalRevenue}₺</Typography>
          </Box>
          <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', borderRadius: 2, p: 2, minWidth: 180, boxShadow: 2 }}>
            <Typography variant="subtitle2">Active Waiters</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{activeWaiters}</Typography>
          </Box>
          <Box sx={{ bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 2, p: 2, minWidth: 180, boxShadow: 2 }}>
            <Typography variant="subtitle2">Active Tables</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{activeTables}</Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Most Ordered Foods</Typography>
            <TextField select name="foods" value={sorts.foods} onChange={handleSortChange} size="small" sx={{ minWidth: 120 }}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </TextField>
          </Box>
          {sortedTopFoods.length === 0 ? (
            <Typography color="text.secondary">No data</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sortedTopFoods} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="count" fill="#4CB572" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
        <Box sx={{ mt: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Waiter Performance & Interest Level</Typography>
            <TextField select name="waiters" value={sorts.waiters} onChange={handleSortChange} size="small" sx={{ minWidth: 120 }}>
              <option value="desc">Highest to Lowest</option>
              <option value="asc">Lowest to Highest</option>
            </TextField>
          </Box>
          <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Waiter</TableCell>
                  <TableCell>Total Orders</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell>Interest Level</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedWaiterPerf.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center">No data</TableCell></TableRow>
                ) : sortedWaiterPerf.map((w, i) => {
                  const waiter = waiters.find(x => x.name === w.name);
                  return (
                    <TableRow key={w.name}>
                      <TableCell>{w.name}</TableCell>
                      <TableCell>{orders.filter(o => o.waiter_id === (waiter ? waiter.waiter_id : '')).length}</TableCell>
                      <TableCell>{waiter ? waiter.performance : '-'}</TableCell>
                      <TableCell>
                        {waiter ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: waiter.interest_level > 0 ? 'success.main' : waiter.interest_level < 0 ? 'error.main' : 'text.secondary' }}>{waiter.interest_level ?? 0}</Typography>
                            <Box sx={{ width: 60, ml: 1 }}>
                              <Box sx={{ height: 8, borderRadius: 4, background: '#eee', overflow: 'hidden' }}>
                                <Box sx={{ width: `${Math.min(Math.max((waiter.interest_level ?? 0) * 10, 0), 100)}%`, height: '100%', background: waiter.interest_level > 0 ? '#4CB572' : waiter.interest_level < 0 ? '#d32f2f' : '#aaa', transition: 'width 0.3s' }} />
                              </Box>
                            </Box>
                          </Box>
                        ) : '-' }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {sortedWaiterPerf.length === 0 ? (
            <Typography color="text.secondary">No data</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sortedWaiterPerf.map(w => {
                const waiter = waiters.find(x => x.name === w.name);
                return { ...w, interest_level: waiter ? waiter.interest_level : 0 };
              })} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="performance" fill="#1976d2" name="Performance" />
                <Bar dataKey="interest_level" fill="#4CB572" name="Interest Level" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
        <Box sx={{ mt: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Table-Based Total Revenue</Typography>
            <TextField select name="tables" value={sorts.tables} onChange={handleSortChange} size="small" sx={{ minWidth: 120 }}>
              <option value="desc">Highest to Lowest</option>
              <option value="asc">Lowest to Highest</option>
            </TextField>
          </Box>
          {sortedTableRevenue.length === 0 ? (
            <Typography color="text.secondary">No data</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sortedTableRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#ff9800" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
        <Box sx={{ mt: 2, mb: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 320 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Daily Order Trend</Typography>
            {orderTrends.length === 0 ? (
              <Typography color="text.secondary">No data</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={orderTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#9c27b0" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 320 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Revenue by Food Category</Typography>
            {categoryRevenue.length === 0 ? (
              <Typography color="text.secondary">No data</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryRevenue} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryRevenue.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField name="waiter_id" label="Waiter ID" value={filters.waiter_id} onChange={handleChange} size="small" />
            <TextField name="food_name" label="Food Name" value={filters.food_name} onChange={handleChange} size="small" />
            <TextField name="start_date" label="Start" type="datetime-local" value={filters.start_date} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
            <TextField name="end_date" label="End" type="datetime-local" value={filters.end_date} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
            <Tooltip title="Filter" arrow>
              <Button type="submit" variant="contained" color="secondary" sx={{ minWidth: 120 }}>
                Filter
              </Button>
            </Tooltip>
          </Stack>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mt: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Waiter ID</TableCell>
                <TableCell>Waiter Name</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Interest Level</TableCell>
                <TableCell>Food</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 5, color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <MdOutlineReceiptLong size={54} style={{ marginBottom: 8, color: '#bdbdbd' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.secondary' }}>No order/report found.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : orders.map((order, idx) => {
                const waiter = waiters.find(w => w.waiter_id === order.waiter_id);
                return (
                  <TableRow key={order.order_id} hover sx={{ transition: 'background 0.2s', bgcolor: idx % 2 === 0 ? 'grey.50' : 'background.paper', ':hover': { bgcolor: 'primary.lighter' } }}>
                    <TableCell>{order.order_id}</TableCell>
                    <TableCell>{order.waiter_id}</TableCell>
                    <TableCell>{waiter ? waiter.name : '-'}</TableCell>
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
                    <TableCell>{order.food_name}</TableCell>
                    <TableCell>{order.price !== undefined ? order.price + '₺' : '-'}</TableCell>
                    <TableCell>{order.timestamp ? new Date(order.timestamp).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>
            Total Amount: {total}₺
          </Typography>
        </Box>
        <Dialog open={confirmOpen} onClose={handleDeleteAllCancel} aria-labelledby="confirm-dialog-title" TransitionComponent={motion.div} transition={{ duration: 0.3 }}>
          <DialogTitle id="confirm-dialog-title">Delete All Reports/Orders</DialogTitle>
          <DialogContent>
            <DialogContentText>
              All reports and orders will be deleted. This action cannot be undone. Do you want to proceed?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteAllCancel} color="primary">Cancel</Button>
            <Button onClick={handleDeleteAllConfirm} color="error" variant="contained" autoFocus>Yes, Delete</Button>
          </DialogActions>
        </Dialog>
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
export default ReportList; 
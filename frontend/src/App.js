import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, CssBaseline, Tooltip, useTheme, Avatar, LinearProgress, Container, Paper, MenuItem, Select, FormControl, InputLabel, Switch, FormControlLabel, Snackbar, Alert, Button, Menu, Stack, TextField } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TableBarIcon from '@mui/icons-material/TableBar';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VideocamIcon from '@mui/icons-material/Videocam';
import TableList from './TableList';
import WaiterList from './WaiterList';
import FoodList from './FoodList';
import VideoStream from './VideoStream';
import ReportList from './ReportList';
import './fade.css';
import { Helmet } from 'react-helmet';
import { ReactComponent as Logo } from './assets/logo.svg';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PaletteIcon from '@mui/icons-material/Palette';

// Global loading context
export const LoadingContext = createContext({ loading: false, setLoading: () => { } });

const pages = [
  { label: 'Live Video', icon: <VideocamIcon />, component: <VideoStream />, title: 'Live Video Stream', description: 'Watch the live video stream of the restaurant tables.' },
  { label: 'Tables', icon: <TableBarIcon />, component: <TableList />, title: 'Tables', description: 'View all tables and their status in the restaurant.' },
  { label: 'Waiters', icon: <PeopleIcon />, component: <WaiterList />, title: 'Waiters', description: 'View the waiter list, performance, and management screen.' },
  { label: 'Foods', icon: <RestaurantIcon />, component: <FoodList />, title: 'Foods', description: 'Manage all foods in the menu and their prices.' },
  { label: 'Reports', icon: <AssessmentIcon />, component: <ReportList />, title: 'Reports', description: 'View and filter order and operation reports.' },
  // Admin Panel removed
];

const themeOptions = [
  {
    key: 'modernTeal',
    name: 'Modern Teal',
    palette: {
      mode: 'light',
      primary: { main: '#009688', contrastText: '#fff' },
      secondary: { main: '#FFC107', contrastText: '#232936' },
      background: { default: '#F4F6FA', paper: '#fff' },
      text: { primary: '#232936', secondary: '#1976D2' },
      info: { main: '#1976D2' },
      success: { main: '#4CB572' },
      error: { main: '#d32f2f' },
    },
  },
  {
    key: 'earthyFresh',
    name: 'Earthy Fresh',
    palette: {
      mode: 'light',
      primary: { main: '#388E3C', contrastText: '#fff' },
      secondary: { main: '#FFB300', contrastText: '#333' },
      background: { default: '#F5F5F5', paper: '#fff' },
      text: { primary: '#333', secondary: '#795548' },
      info: { main: '#795548' },
      success: { main: '#388E3C' },
      error: { main: '#d32f2f' },
    },
  },
  {
    key: 'vibrant',
    name: 'Vibrant',
    palette: {
      mode: 'light',
      primary: { main: '#673AB7', contrastText: '#fff' },
      secondary: { main: '#FF5252', contrastText: '#fff' },
      background: { default: '#F3F3F3', paper: '#fff' },
      text: { primary: '#222', secondary: '#00BCD4' },
      info: { main: '#00BCD4' },
      success: { main: '#4CB572' },
      error: { main: '#d32f2f' },
    },
  },
  {
    key: 'minimalLight',
    name: 'Minimal Light',
    palette: {
      mode: 'light',
      primary: { main: '#1976D2', contrastText: '#fff' },
      secondary: { main: '#FFB300', contrastText: '#222' },
      background: { default: '#FAFAFA', paper: '#fff' },
      text: { primary: '#222', secondary: '#757575' },
      info: { main: '#0288d1' },
      success: { main: '#4CB572' },
      error: { main: '#d32f2f' },
    },
  },
];

// Footer function removed because it was never used

/**
 * Main entry point for the GastroVision frontend application.
 * Handles routing, layout, and global state management.
 */
function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(() => {
    const saved = localStorage.getItem('selectedPage');
    return saved ? Number(saved) : 0;
  });
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'modernTeal');
  const [themeMenuAnchor, setThemeMenuAnchor] = useState(null);
  const theme = React.useMemo(() => createTheme({
    palette: themeOptions.find(t => t.key === themeKey).palette,
    shape: { borderRadius: 8 },
    typography: { fontFamily: 'Inter, Roboto, Arial, sans-serif' },
    components: {
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
      MuiPaper: { styleOverrides: { root: { boxShadow: '0 2px 12px #0002' } } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 700, fontSize: 16 } } },
    },
  }), [themeKey]);
  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [delayWarning, setDelayWarning] = useState(null);
  const [foods, setFoods] = useState([]);
  const [globalError, setGlobalError] = useState('');
  const [globalErrorOpen, setGlobalErrorOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const fetchTables = () => {
    axios.get('http://localhost:5000/tables')
      .then(res => setTables(res.data))
      .catch(() => setTables([]));
  };
  const fetchWaiters = () => {
    axios.get('http://localhost:5000/waiters')
      .then(res => setWaiters(res.data))
      .catch(() => setWaiters([]));
  };
  const fetchFoods = () => {
    axios.get('http://localhost:5000/foods')
      .then(res => setFoods(res.data))
      .catch(() => setFoods([]));
  };

  useEffect(() => {
    const socket = io('http://localhost:5000'); // Update backend port if necessary
    socket.on('connect', () => {
    });
    socket.on('server_message', (data) => {
    });
    socket.on('order_update', (data) => {
      fetchTables(); // Live update
    });
    socket.on('waiter_update', (data) => {
      fetchWaiters();
    });
    socket.on('waiter_delay_warning', (data) => {
      setDelayWarning({
        table_id: data.table_id,
        waiter_id: data.waiter_id,
        time: Date.now()
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchTables();
    fetchWaiters();
    fetchFoods();
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedPage', selectedPage);
  }, [selectedPage]);
  useEffect(() => {
    localStorage.setItem('themeKey', themeKey);
  }, [themeKey]);

  const [delaySnackbarOpen, setDelaySnackbarOpen] = useState(false);
  useEffect(() => {
    if (delayWarning) setDelaySnackbarOpen(true);
  }, [delayWarning]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple role check: admin / staff
    if (loginForm.username === 'admin' && loginForm.password === 'admin') {
      setUser({ username: 'admin', role: 'admin' });
      localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'admin' }));
    } else if (loginForm.username === 'personel' && loginForm.password === 'personel') {
      setUser({ username: 'personel', role: 'personel' });
      localStorage.setItem('user', JSON.stringify({ username: 'personel', role: 'personel' }));
    } else {
      setLoginError('Invalid username or password!');
    }
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, borderRadius: 3, minWidth: 320, boxShadow: 6 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>GastroVision Login</Typography>
          <form onSubmit={handleLogin}>
            <Stack spacing={2}>
              <TextField label="Username" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} required />
              <TextField label="Password" type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
              {loginError && <Typography color="error">{loginError}</Typography>}
              <Button type="submit" variant="contained" color="primary">Login</Button>
            </Stack>
          </form>
          <Box sx={{ mt: 2, color: 'text.secondary', fontSize: 14 }}>
            <b>Demo Users:</b><br />
            <b>admin / admin</b> (full access)<br />
            <b>personel / personel</b> (only viewing)
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
        <CssBaseline />
        {/* Modern Header + Drawer */}
        <AppBar position="static" color="primary" elevation={2} sx={{ mb: 3, px: { xs: 1, sm: 3 } }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 0.5, sm: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 1, display: { xs: 'inline-flex', md: 'none' } }} onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Box sx={{ width: 120, height: 40 }}>
                <Logo style={{ width: '100%', height: '100%', filter: 'brightness(0) invert(1)' }} />
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              {pages.map((page, idx) => (
                <Button
                  key={page.label}
                  color={selectedPage === idx ? 'secondary' : 'inherit'}
                  startIcon={page.icon}
                  sx={{ fontWeight: selectedPage === idx ? 700 : 500, borderBottom: selectedPage === idx ? 2 : 0, borderColor: 'secondary.main', borderRadius: 0, mx: 0.5 }}
                  onClick={() => setSelectedPage(idx)}
                >
                  {page.label}
                </Button>
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Select Theme">
                <IconButton color="inherit" onClick={e => setThemeMenuAnchor(e.currentTarget)}>
                  <PaletteIcon />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={themeMenuAnchor} open={!!themeMenuAnchor} onClose={() => setThemeMenuAnchor(null)}>
                {themeOptions.map(opt => (
                  <MenuItem key={opt.key} selected={themeKey === opt.key} onClick={() => { setThemeKey(opt.key); setThemeMenuAnchor(null); }}>
                    <ListItemIcon><PaletteIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>{opt.name}</ListItemText>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        {/* Drawer (Sidebar) for mobile */}
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 240, pt: 2 }}>
            {pages.map((page, idx) => (
              <Button
                key={page.label}
                color={selectedPage === idx ? 'secondary' : 'inherit'}
                startIcon={page.icon}
                sx={{ justifyContent: 'flex-start', width: '100%', fontWeight: selectedPage === idx ? 700 : 500, borderLeft: selectedPage === idx ? 4 : 0, borderColor: 'secondary.main', borderRadius: 0, mb: 0.5 }}
                onClick={() => { setSelectedPage(idx); setDrawerOpen(false); }}
              >
                {page.label}
              </Button>
            ))}
          </Box>
        </Drawer>
        <Container maxWidth="md" sx={{ pb: 6, px: { xs: 0.5, sm: 2 } }}>
          <Helmet>
            <title>{pages[selectedPage].title} | GastroVision</title>
            <meta name="description" content={pages[selectedPage].description} />
          </Helmet>
          {pages[selectedPage].label === 'Live Video' ? (
            <VideoStream tables={tables} waiters={waiters} foods={foods} delayWarning={delayWarning} />
          ) : pages[selectedPage].label === 'Tables' ? (
            <TableList tables={tables} fetchTables={fetchTables} waiters={waiters} />
          ) : pages[selectedPage].component}
        </Container>
        {/* Modern Footer */}
        <Box component="footer" sx={{ bgcolor: 'background.paper', color: 'text.secondary', py: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider', mt: 6, fontSize: { xs: 12, sm: 14 } }}>
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: 12, sm: 14 } }}>
            © {new Date().getFullYear()} GastroVision | v1.0 | <a href="https://github.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'none' }}>GitHub</a>
          </Typography>
        </Box>
        {/* Delay warning global snackbar */}
        <Snackbar open={delaySnackbarOpen} autoHideDuration={5000} onClose={() => setDelaySnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={() => setDelaySnackbarOpen(false)} severity="warning" sx={{ width: '100%' }}>
            {delayWarning ? `Table ${delayWarning.table_id} waiter (${delayWarning.waiter_id}) is delayed! Performance and attention level negatively affected.` : ''}
          </Alert>
        </Snackbar>
        {/* Global error snackbar */}
        <Snackbar open={globalErrorOpen} autoHideDuration={4000} onClose={() => setGlobalErrorOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={() => setGlobalErrorOpen(false)} severity="error" sx={{ width: '100%' }}>
            {globalError}
          </Alert>
        </Snackbar>
        {/* ... mevcut snackbar ve diğer global bileşenler ... */}
      </Box>
    </ThemeProvider>
  );
}

/**
 * Export the main App component.
 */
export default App; 
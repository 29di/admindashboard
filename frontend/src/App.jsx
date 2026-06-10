import React, { useState, useEffect, useCallback } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Grid,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  TextField,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  PhoneAndroid as AndroidIcon,
  Apple as IosIcon,
  People as UsersIcon,
  CancelPresentation as UninstallIcon,
  ExitToApp as LogoutIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Security as AdminIcon,
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from './components/SocketProvider';
import KPICard from './components/KPICard';
import AnalyticsChart from './components/AnalyticsChart';
import DateFilter from './components/DateFilter';

// Custom sleek dark theme matching dark-slate design
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0b0f19',
      paper: '#0f172a',
    },
    primary: {
      main: '#3b82f6', // bright blue
    },
    secondary: {
      main: '#f43f5e', // rose/pink for iOS
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  const { socket, connected } = useSocket();

  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Filter States
  const [filterType, setFilterType] = useState('30d');
  const [customRange, setCustomRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // KPI Metrics States
  const [downloads, setDownloads] = useState({ total: 0, android: 0, ios: 0 });
  const [uninstalls, setUninstalls] = useState({ total: 0, android: 0, ios: 0 });
  const [dids, setDids] = useState({ total: 0, today: 0, monthly: 0 });

  // Live Today Metrics State (from real-time events)
  const [liveToday, setLiveToday] = useState({
    downloads: 0,
    androidDownloads: 0,
    iosDownloads: 0,
    uninstalls: 0,
    androidUninstalls: 0,
    iosUninstalls: 0,
    dids: 0,
  });

  // Trend Chart States
  const [dauData, setDauData] = useState([]);
  const [wauData, setWauData] = useState([]);
  const [mauData, setMauData] = useState([]);

  // Fetch Dashboard Analytics Data
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Set up parameters
      const params = {
        filterType,
        startDate: filterType === 'custom' ? customRange.startDate : undefined,
        endDate: filterType === 'custom' ? customRange.endDate : undefined,
      };

      const [resDownloads, resUninstalls, resDids, resDau, resWau, resMau] = await Promise.all([
        axios.get('/api/dashboard/downloads', { headers, params }),
        axios.get('/api/dashboard/uninstalls', { headers, params }),
        axios.get('/api/dashboard/dids', { headers, params }),
        axios.get('/api/dashboard/dau', { headers, params }),
        axios.get('/api/dashboard/wau', { headers, params }),
        axios.get('/api/dashboard/mau', { headers, params }),
      ]);

      // Populate KPI states
      setDownloads({
        total: resDownloads.data.totalDownloads,
        android: resDownloads.data.androidDownloads,
        ios: resDownloads.data.iosDownloads,
      });

      setUninstalls({
        total: resUninstalls.data.totalUninstalls,
        android: resUninstalls.data.androidUninstalls,
        ios: resUninstalls.data.iosUninstalls,
      });

      setDids({
        total: resDids.data.totalDids,
        today: resDids.data.todayDids,
        monthly: resDids.data.monthlyDids,
      });

      // Populate Chart states
      setDauData(resDau.data);
      setWauData(resWau.data);
      setMauData(resMau.data);
    } catch (err) {
      console.error('[Dashboard Fetch Error]', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleLogout();
      }
    }
  }, [token, filterType, customRange]);

  // Initial Fetch & Refresh logic
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, filterType, customRange, fetchDashboardData]);

  // Live WebSocket Listeners
  useEffect(() => {
    if (!socket || !token) return;

    // Listen to real-time events and update UI state instantly
    socket.on('download_event', (event) => {
      // Increment overall KPIs
      setDownloads((prev) => ({
        ...prev,
        total: prev.total + 1,
        android: event.platform === 'android' ? prev.android + 1 : prev.android,
        ios: event.platform === 'ios' ? prev.ios + 1 : prev.ios,
      }));

      // Increment Today's Live Counter
      setLiveToday((prev) => ({
        ...prev,
        downloads: prev.downloads + 1,
        androidDownloads: event.platform === 'android' ? prev.androidDownloads + 1 : prev.androidDownloads,
        iosDownloads: event.platform === 'ios' ? prev.iosDownloads + 1 : prev.iosDownloads,
      }));
    });

    socket.on('uninstall_event', (event) => {
      setUninstalls((prev) => ({
        ...prev,
        total: prev.total + 1,
        android: event.platform === 'android' ? prev.android + 1 : prev.android,
        ios: event.platform === 'ios' ? prev.ios + 1 : prev.ios,
      }));

      setLiveToday((prev) => ({
        ...prev,
        uninstalls: prev.uninstalls + 1,
        androidUninstalls: event.platform === 'android' ? prev.androidUninstalls + 1 : prev.androidUninstalls,
        iosUninstalls: event.platform === 'ios' ? prev.iosUninstalls + 1 : prev.iosUninstalls,
      }));
    });

    socket.on('did_event', (event) => {
      setDids((prev) => ({
        ...prev,
        total: prev.total + 1,
        today: prev.today + 1,
        monthly: prev.monthly + 1,
      }));

      setLiveToday((prev) => ({
        ...prev,
        dids: prev.dids + 1,
      }));
    });

    return () => {
      socket.off('download_event');
      socket.off('uninstall_event');
      socket.off('did_event');
    };
  }, [socket, token]);

  // Authentication Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Failed to authenticate. Try admin/admin123');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Metric,TotalCount,AndroidCount,IosCount\n';
    csvContent += `Downloads,${downloads.total},${downloads.android},${downloads.ios}\n`;
    csvContent += `Uninstalls,${uninstalls.total},${uninstalls.android},${uninstalls.ios}\n`;
    csvContent += `DIDs (Users),${dids.total},${dids.today} (Today),${dids.monthly} (Month)\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics_export_${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. RENDER LOGIN SCREEN
  if (!token) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          sx={{ background: '#0b0f19', p: 2 }}
        >
          <Card
            sx={{
              maxWidth: 420,
              width: '100%',
              borderRadius: 4,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <AdminIcon sx={{ fontSize: 50, color: '#3b82f6', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                  Admin Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                  Access real-time analytics reports
                </Typography>
              </Box>

              {authError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {authError}
                </Alert>
              )}

              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{ mb: 2.5 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={authLoading}
                  sx={{ py: 1.5, fontSize: 16 }}
                >
                  {authLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Box>
      </ThemeProvider>
    );
  }

  // 2. RENDER MAIN DASHBOARD
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" minHeight="100vh">
        {/* Navigation Header */}
        <AppBar
          position="static"
          sx={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'none',
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <AdminIcon sx={{ color: '#3b82f6', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                  AlphaThoughts
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    ml: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#60a5fa',
                    fontWeight: 700,
                  }}
                >
                  10 Lakhs Scale
                </Typography>
              </Box>

              {/* Server connection status indicator */}
              <Box display="flex" alignItems="center" gap={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  {connected ? (
                    <>
                      <ConnectedIcon sx={{ color: '#10b981', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                        Live
                      </Typography>
                    </>
                  ) : (
                    <>
                      <DisconnectedIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600 }}>
                        Offline
                      </Typography>
                    </>
                  )}
                </Box>

                <IconButton onClick={fetchDashboardData} color="inherit">
                  <RefreshIcon />
                </IconButton>

                <Button
                  onClick={handleLogout}
                  variant="outlined"
                  color="inherit"
                  startIcon={<LogoutIcon />}
                  sx={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  Logout
                </Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Dashboard Body */}
        <Box flexGrow={1} py={4} sx={{ backgroundColor: '#0b0f19' }}>
          <Container maxWidth="xl">
            {/* Action Bar */}
            <Box
              display="flex"
              flexDirection={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              gap={2}
              mb={4}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                  Analytics Dashboard
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mt: 0.5 }}>
                  Real-time device signups, installation stats, and user sessions.
                </Typography>
              </Box>

              <Box display="flex" gap={2} alignItems="center" width={{ xs: '100%', md: 'auto' }}>
                <DateFilter
                  filterType={filterType}
                  setFilterType={setFilterType}
                  customRange={customRange}
                  setCustomRange={setCustomRange}
                />
                <Button
                  variant="contained"
                  onClick={handleExportCSV}
                  startIcon={<ExportIcon />}
                  sx={{ backgroundColor: '#1e293b', '&:hover': { backgroundColor: '#334155' } }}
                >
                  Export CSV
                </Button>
              </Box>
            </Box>

            {/* KPI Cards Grid */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={4}>
                <KPICard
                  title="Total Downloads"
                  value={downloads.total}
                  subtitle="Total downloads across all app stores"
                  icon={<DownloadIcon />}
                  color="#3b82f6"
                  androidVal={downloads.android}
                  iosVal={downloads.ios}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <KPICard
                  title="Uninstalls"
                  value={uninstalls.total}
                  subtitle="Total app removals registered"
                  icon={<UninstallIcon />}
                  color="#f43f5e"
                  androidVal={uninstalls.android}
                  iosVal={uninstalls.ios}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <KPICard
                  title="Decentralized IDs (DIDs)"
                  value={dids.total}
                  subtitle={`Today: +${dids.today} | Month: +${dids.monthly}`}
                  icon={<UsersIcon />}
                  color="#10b981"
                />
              </Grid>
            </Grid>

            {/* Live Today Activity Counters Alert banner */}
            {connected && (
              <Box mb={4}>
                <Card
                  sx={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ py: 1.5, px: 3, '&:last-child': { pb: 1.5 } }}>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700 }}>
                          🔥 LIVE EVENTS INGESTED TODAY:
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={8} display="flex" gap={4}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          Downloads: <strong style={{ color: '#f8fafc' }}>+{liveToday.downloads}</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          Uninstalls: <strong style={{ color: '#f8fafc' }}>+{liveToday.uninstalls}</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          DIDs: <strong style={{ color: '#f8fafc' }}>+{liveToday.dids}</strong>
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Charts Grid */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <AnalyticsChart title="Daily Active Users (DAU) Trend" data={dauData} type="dau" color="#3b82f6" />
              </Grid>
              <Grid item xs={12} lg={6}>
                <AnalyticsChart title="Weekly Active Users (WAU) Trend" data={wauData} type="wau" color="#818cf8" />
              </Grid>
              <Grid item xs={12}>
                <AnalyticsChart title="Monthly Active Users (MAU) Trend" data={mauData} type="mau" color="#10b981" />
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;

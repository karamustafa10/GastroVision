import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

/**
 * AdvancedReports component displays advanced analytics and reporting features.
 * Handles data visualization and filtering for reports.
 */
const AdvancedReports = ({ onBack }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/reports/summary')
      .then(res => setSummary(res.data))
      .catch(() => setError('Rapor verisi alınamadı.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box maxWidth={700} mx="auto" mt={4}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>Geri Dön</Button>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Gelişmiş Raporlar</Typography>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {summary && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Toplam Sipariş: <b>{summary.total_orders}</b></Typography>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>En Çok Tüketilen 5 Yemek:</Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Yemek</TableCell>
                    <TableCell>Adet</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.top_foods.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row._id}</TableCell>
                      <TableCell>{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1">Garson Performansı:</Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Garson ID</TableCell>
                    <TableCell>Sipariş Sayısı</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.waiter_performance.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row._id}</TableCell>
                      <TableCell>{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1">Masa Bazlı Toplam Ciro:</Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Masa ID</TableCell>
                    <TableCell>Toplam Ciro (₺)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.table_revenue.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row._id}</TableCell>
                      <TableCell>{row.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AdvancedReports; 
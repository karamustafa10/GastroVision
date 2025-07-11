import React from 'react';
import { Box, Typography, Grid, Card, Button, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TableBarIcon from '@mui/icons-material/TableBar';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';

const panels = [
  {
    title: 'Garson/Kullanıcı Yönetimi',
    desc: 'Garson ve kullanıcı ekle, sil, rollerini düzenle.',
    icon: <PeopleIcon sx={{ fontSize: 48, color: 'primary.main' }} />, 
    button: 'Kullanıcılar',
    color: 'primary',
  },
  {
    title: 'Yemek Yönetimi',
    desc: 'Yemek ekle, sil, fiyat ve kategori güncelle.',
    icon: <RestaurantIcon sx={{ fontSize: 48, color: 'secondary.main' }} />, 
    button: 'Yemekler',
    color: 'secondary',
  },
  {
    title: 'Masa Yönetimi',
    desc: 'Masa ekle, sil, garson ata ve sıfırla.',
    icon: <TableBarIcon sx={{ fontSize: 48, color: 'success.main' }} />, 
    button: 'Masalar',
    color: 'success',
  },
  {
    title: 'Sistem Ayarları',
    desc: 'Sistem genel ayarlarını ve parametreleri düzenle.',
    icon: <SettingsIcon sx={{ fontSize: 48, color: 'info.main' }} />, 
    button: 'Ayarlar',
    color: 'info',
  },
  {
    title: 'Gelişmiş Raporlar',
    desc: 'Detaylı analiz ve geçmiş raporları görüntüle.',
    icon: <AssessmentIcon sx={{ fontSize: 48, color: 'warning.main' }} />, 
    button: 'Raporlar',
    color: 'warning',
  },
];

/**
 * AdminPanel component provides administrative controls and settings for the application.
 * Handles navigation between admin features and panels.
 */
function AdminPanel() {
  const theme = useTheme();
  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h3" align="center" sx={{ fontWeight: 800, mb: 1, letterSpacing: 1, color: 'primary.main' }}>
        Admin Paneli
      </Typography>
      <Typography align="center" sx={{ color: 'text.secondary', mb: 4, fontSize: 18 }}>
        Restoran yönetimi için tüm işlemleri buradan kolayca gerçekleştirebilirsiniz.
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {panels.map((panel, i) => (
          <Grid item xs={12} sm={6} md={4} key={panel.title}>
            <Card
              sx={{
                borderRadius: 5,
                boxShadow: 6,
                p: 2,
                minHeight: { xs: 240, sm: 280 },
                height: { xs: 240, sm: 280 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.18s, box-shadow 0.18s',
                '&:hover': {
                  transform: 'scale(1.035)',
                  boxShadow: 12,
                },
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Box sx={{ mb: 2 }}>{panel.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>{panel.title}</Typography>
              <Typography sx={{ color: 'text.secondary', mb: 2, textAlign: 'center', flexGrow: 1 }}>{panel.desc}</Typography>
              <Button
                variant="contained"
                color={panel.color}
                size="large"
                sx={{
                  fontWeight: 700,
                  borderRadius: 3,
                  px: 4,
                  py: 1.2,
                  fontSize: 18,
                  boxShadow: 2,
                  transition: 'all 0.18s',
                  ':hover': { boxShadow: 4, transform: 'scale(1.07)' },
                  mt: 'auto',
                }}
              >
                {panel.button}
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default AdminPanel; 
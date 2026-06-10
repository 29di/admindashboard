import React from 'react';
import { ToggleButtonGroup, ToggleButton, Box, TextField } from '@mui/material';

const DateFilter = ({ filterType, setFilterType, customRange, setCustomRange }) => {
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilterType(newFilter);
    }
  };

  const handleCustomDateChange = (field) => (e) => {
    setCustomRange((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} alignItems="center">
      <ToggleButtonGroup
        value={filterType}
        exclusive
        onChange={handleFilterChange}
        size="small"
        sx={{
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 2.5,
          p: 0.5,
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: 2,
            px: 2,
            py: 0.75,
            color: '#94a3b8',
            textTransform: 'none',
            fontWeight: 600,
            '&.Mui-selected': {
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#2563eb',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
            },
          },
        }}
      >
        <ToggleButton value="today">Today</ToggleButton>
        <ToggleButton value="7d">Last 7 Days</ToggleButton>
        <ToggleButton value="30d">Last 30 Days</ToggleButton>
        <ToggleButton value="90d">Last 90 Days</ToggleButton>
        <ToggleButton value="custom">Custom Range</ToggleButton>
      </ToggleButtonGroup>

      {filterType === 'custom' && (
        <Box display="flex" gap={1.5} alignItems="center">
          <TextField
            type="date"
            label="Start Date"
            value={customRange.startDate}
            onChange={handleCustomDateChange('startDate')}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
              '& .MuiInputLabel-root': { color: '#94a3b8' },
            }}
          />
          <TextField
            type="date"
            label="End Date"
            value={customRange.endDate}
            onChange={handleCustomDateChange('endDate')}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
              '& .MuiInputLabel-root': { color: '#94a3b8' },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default DateFilter;

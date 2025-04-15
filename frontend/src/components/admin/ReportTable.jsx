import React, { useState } from 'react';
import { Box, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { formatCurrency } from '../../utils/formatCurrency';

const ReportTable = () => {
  const [appointments, setAppointments] = useState([]);

  // For rendering appointment details row
  const renderAppointmentDetails = (appointment) => {
    return (
      <TableRow key={`details-${appointment.id}`} sx={{ bgcolor: 'background.paper' }}>
        <TableCell colSpan={6} sx={{ py: 2, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" component="span">
                Клиент:
              </Typography>{' '}
              <Typography component="span">
                {appointment.client_name || 'Анонимный клиент'} {appointment.client_phone && `(${appointment.client_phone})`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" component="span">
                Услуга:
              </Typography>{' '}
              <Typography component="span">
                {appointment.service_name} ({formatCurrency(appointment.price)})
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" component="span">
                Мастер:
              </Typography>{' '}
              <Typography component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>
                {appointment.employee_name}
              </Typography>
            </Box>
            {appointment.notes && (
              <Box>
                <Typography variant="subtitle2" component="span">
                  Примечания:
                </Typography>{' '}
                <Typography component="span">{appointment.notes}</Typography>
              </Box>
            )}
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Table>
      <TableBody>
        {appointments.map((appointment) => (
          renderAppointmentDetails(appointment)
        ))}
      </TableBody>
    </Table>
  );
};

export default ReportTable; 
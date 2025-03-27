const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../config/logger');
const { verifyToken, checkRole, checkSalonAccess } = require('../middleware/auth');

// Get all appointments for a salon (admin and salon employees)
router.get('/salon/:salonId', verifyToken, checkRole('admin', 'employee'), checkSalonAccess, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const salonId = req.params.salonId;

    let query = `
      SELECT a.*, 
             s.name as service_name, s.duration, s.price,
             e.name as employee_name,
             c.name as client_name, c.contact_info as client_contact
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN employees e ON a.employee_id = e.id
      JOIN clients c ON a.client_id = c.id
      WHERE a.salon_id = $1
    `;
    
    const params = [salonId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND a.date_time >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND a.date_time <= $${paramCount}`;
      params.push(endDate);
    }

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY a.date_time';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    logger.error('Get appointments error:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// Get client's appointments
router.get('/client', verifyToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT a.*, 
              s.name as service_name, s.duration, s.price,
              e.name as employee_name,
              sal.name as salon_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN employees e ON a.employee_id = e.id
       JOIN salons sal ON a.salon_id = sal.id
       WHERE a.client_id = $1
       ORDER BY a.date_time`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    logger.error('Get client appointments error:', error);
    res.status(500).json({ message: 'Error fetching client appointments' });
  }
});

// Create new appointment
router.post('/', verifyToken, async (req, res) => {
  try {
    const { service_id, employee_id, salon_id, date_time, notes } = req.body;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Check if the time slot is available
      const { rows: [service] } = await client.query(
        'SELECT duration FROM services WHERE id = $1',
        [service_id]
      );

      if (!service) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Service not found' });
      }

      const appointmentEnd = new Date(new Date(date_time).getTime() + service.duration * 60000);

      // Check for overlapping appointments
      const { rows: overlapping } = await client.query(
        `SELECT * FROM appointments
         WHERE employee_id = $1
         AND salon_id = $2
         AND date_time < $3
         AND date_time + (SELECT duration FROM services WHERE id = $4) * interval '1 minute' > $5
         AND status != 'cancelled'`,
        [employee_id, salon_id, appointmentEnd, service_id, date_time]
      );

      if (overlapping.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Time slot is not available' });
      }

      // Create appointment
      const { rows: [appointment] } = await client.query(
        `INSERT INTO appointments (client_id, service_id, employee_id, salon_id, date_time, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, service_id, employee_id, salon_id, date_time, notes]
      );

      await client.query('COMMIT');
      res.status(201).json(appointment);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Create appointment error:', error);
    res.status(500).json({ message: 'Error creating appointment' });
  }
});

// Update appointment
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { date_time, notes, status } = req.body;
    const appointmentId = req.params.id;

    // Check if user has permission to update this appointment
    const { rows: [appointment] } = await db.query(
      `SELECT a.*, e.salon_id
       FROM appointments a
       JOIN employees e ON a.employee_id = e.id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only allow updates if user is the client, admin, or salon employee
    if (req.user.role === 'client' && appointment.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    if (req.user.role === 'employee' && appointment.salon_id !== req.user.salon_id) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      if (date_time) {
        // Check if the new time slot is available
        const { rows: [service] } = await client.query(
          'SELECT duration FROM services WHERE id = $1',
          [appointment.service_id]
        );

        const appointmentEnd = new Date(new Date(date_time).getTime() + service.duration * 60000);

        const { rows: overlapping } = await client.query(
          `SELECT * FROM appointments
           WHERE employee_id = $1
           AND salon_id = $2
           AND id != $3
           AND date_time < $4
           AND date_time + (SELECT duration FROM services WHERE id = $5) * interval '1 minute' > $6
           AND status != 'cancelled'`,
          [appointment.employee_id, appointment.salon_id, appointmentId, appointmentEnd, appointment.service_id, date_time]
        );

        if (overlapping.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'Time slot is not available' });
        }
      }

      // Update appointment
      const { rows: [updatedAppointment] } = await client.query(
        `UPDATE appointments
         SET date_time = COALESCE($1, date_time),
             notes = COALESCE($2, notes),
             status = COALESCE($3, status)
         WHERE id = $4
         RETURNING *`,
        [date_time, notes, status, appointmentId]
      );

      await client.query('COMMIT');
      res.json(updatedAppointment);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Update appointment error:', error);
    res.status(500).json({ message: 'Error updating appointment' });
  }
});

// Cancel appointment
router.post('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Check if user has permission to cancel this appointment
    const { rows: [appointment] } = await db.query(
      `SELECT a.*, e.salon_id
       FROM appointments a
       JOIN employees e ON a.employee_id = e.id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only allow cancellation if user is the client, admin, or salon employee
    if (req.user.role === 'client' && appointment.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (req.user.role === 'employee' && appointment.salon_id !== req.user.salon_id) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    const { rows } = await db.query(
      `UPDATE appointments
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
      [appointmentId]
    );

    res.json(rows[0]);
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Error cancelling appointment' });
  }
});

module.exports = router; 
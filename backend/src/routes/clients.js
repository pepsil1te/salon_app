// Create new client
router.post('/', 
  verifyToken, 
  checkRole('admin', 'employee'), 
  async (req, res) => {
  try {
    const { first_name, last_name, contact_info, birth_date, preferences } = req.body;

    // Проверка обязательных полей
    if (!first_name || !last_name) {
      return res.status(400).json({ 
        message: 'First name and last name are required'
      });
    }

    const { rows } = await db.query(
      `INSERT INTO clients (first_name, last_name, contact_info, birth_date, preferences) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [first_name, last_name, contact_info, birth_date, preferences]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Create client error:', error);
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
});

// Update client
router.put('/:id', 
  verifyToken, 
  checkRole('admin', 'employee'), 
  async (req, res) => {
  try {
    const { first_name, last_name, contact_info, birth_date, preferences } = req.body;

    // Проверка обязательных полей
    if (!first_name || !last_name) {
      return res.status(400).json({ 
        message: 'First name and last name are required'
      });
    }

    const { rows } = await db.query(
      `UPDATE clients 
       SET first_name = $1,
           last_name = $2,
           contact_info = COALESCE($3, contact_info),
           birth_date = COALESCE($4, birth_date),
           preferences = COALESCE($5, preferences),
           updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [first_name, last_name, contact_info, birth_date, preferences, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    logger.error('Update client error:', error);
    res.status(500).json({ message: 'Error updating client', error: error.message });
  }
}); 
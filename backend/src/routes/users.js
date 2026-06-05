const express = require('express');
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.phone_number, u.address, 
             r.name as role, u.is_active, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get users by role (admin only)
router.get('/role/:role', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.phone_number, 
             r.name as role, u.is_active, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = $1
      ORDER BY u.full_name
    `, [req.params.role]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get user by id (admin or own user)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Allow user to get own info, or admin to get anyone's
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    const result = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.phone_number, u.address, 
             r.name as role, u.is_active, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update user (admin can update anyone, user can update own)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { full_name, phone_number, address } = req.body;

    // Allow user to update own info, or admin to update anyone
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone_number = COALESCE($2, phone_number),
           address = COALESCE($3, address)
       WHERE id = $4
       RETURNING id, email, full_name, phone_number, address`,
      [full_name, phone_number, address, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Toggle user active status (admin only)
router.put('/:id/toggle-status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users 
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING id, email, full_name, is_active`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

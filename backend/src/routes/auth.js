const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone_number, role } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full_name are required',
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Get role id
    let roleId = 2; // Default: mahasiswa
    if (role) {
      const roleResult = await pool.query(
        'SELECT id FROM roles WHERE name = $1',
        [role]
      );
      if (roleResult.rows.length > 0) {
        roleId = roleResult.rows[0].id;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password, full_name, phone_number, role_id) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role_id`,
      [email, hashedPassword, full_name, phone_number, roleId]
    );

    const user = result.rows[0];

    // Get role name
    const roleQuery = await pool.query(
      'SELECT name FROM roles WHERE id = $1',
      [user.role_id]
    );
    const roleName = roleQuery.rows[0].name;

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: roleName,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: roleName,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role_name,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role_name,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, phone_number, address FROM users WHERE id = $1',
      [req.user.id]
    );

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

module.exports = router;

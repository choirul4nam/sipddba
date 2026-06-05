const express = require('express');
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all active products (public, untuk catalog)
router.get('/catalog', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.code, p.name, p.description, p.category, 
             p.unit_price, p.unit_type, p.image_url
      FROM products p
      WHERE p.is_active = true
      ORDER BY p.category, p.name
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get all products with stock (for gudang dashboard)
router.get('/with-stock', authMiddleware, roleMiddleware(['admin', 'gudang']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id, p.code, p.name, p.description, p.category, 
        p.unit_price, p.unit_type, p.image_url, p.is_active,
        s.stock_onhand, s.stock_order, s.stock_akhir
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.is_active = 'true'
      ORDER BY p.category, p.name
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get products with stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/top-selling', authMiddleware, roleMiddleware(['admin', 'gudang']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
          SUM(a.quantity) AS quantity,
          b.id,
          b.name,
          b.description,
          b.code,
          b.category
      FROM order_items a
      JOIN products b
          ON a.product_id = b.id
      GROUP BY
          b.id,
          b.name,
          b.description,
          b.code,
          b.category
      ORDER BY quantity DESC LIMIT 10;
    `);

    res.json({
      success: true,
      data: result.rows,
    });    
  } catch (error) {    
    console.error('Get top selling products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get product by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, s.stock_onhand, s.stock_order, s.stock_akhir
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.id = $1 AND p.is_active='true'
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create product (gudang only)
router.post('/', authMiddleware, roleMiddleware(['gudang']), async (req, res) => {
  try {
    const { name, description, code, category, unit_price, unit_type, stock_onhand } = req.body;

    if (!name || !code || !unit_price) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, and unit_price are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO products 
       (name, description, code, category, unit_price, unit_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, code, category, unit_price, unit_type, req.user.id]
    );

    // Create initial stock record
    await pool.query(
      `INSERT INTO stock (product_id, stock_onhand, stock_order, stock_akhir, updated_by)
       VALUES ($1, $2, 0, $3, $4)`,
      [result.rows[0].id, stock_onhand, stock_onhand, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update product (gudang only)
router.put('/:id', authMiddleware, roleMiddleware(['gudang']), async (req, res) => {
  try {
    const { name, description, category, unit_price, unit_type, is_active, code } = req.body;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           unit_price = COALESCE($4, unit_price),
           unit_type = COALESCE($5, unit_type),
           is_active = COALESCE($6, is_active),
           code = COALESCE($7, code)
       WHERE id = $8
       RETURNING *`,
      [name, description, category, unit_price, unit_type, is_active, code, id]
    );

    // pool.query(
    //   `UPDATE stock 
    //    SET name = COALESCE($1, name),
    //        description = COALESCE($2, description),
    //        category = COALESCE($3, category),
    //        unit_price = COALESCE($4, unit_price),
    //        unit_type = COALESCE($5, unit_type),
    //        is_active = COALESCE($6, is_active),
    //        code = COALESCE($7, code)
    //    WHERE id = $8
    //    RETURNING *`,
    //   [name, description, category, unit_price, unit_type, is_active, code, id]
    // );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.put('/:id/deactivate', authMiddleware, roleMiddleware(['gudang', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE products
       SET is_active = false
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Deactivate product error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

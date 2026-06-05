const express = require('express');
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all stock
router.get('/', authMiddleware, roleMiddleware(['gudang', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, s.product_id, p.code, p.name, p.category,
        s.stock_onhand, s.stock_order, s.stock_akhir, s.last_updated
      FROM stock s
      JOIN products p ON s.product_id = p.id
      WHERE p.is_active = true
      ORDER BY p.category, p.name
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get stock by product id
router.get('/product/:productId', authMiddleware, roleMiddleware(['gudang', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, p.name, p.code
      FROM stock s
      JOIN products p ON s.product_id = p.id
      WHERE s.product_id = $1
    `, [req.params.productId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update stock (gudang only)
router.put('/:productId', authMiddleware, roleMiddleware(['gudang']), async (req, res) => {
  try {
    const { stock_onhand, stock_order } = req.body;
    const { productId } = req.params;

    if (stock_onhand === undefined && stock_order === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (stock_onhand or stock_order) is required',
      });
    }

    // Calculate stock_akhir = stock_onhand - stock_order
    const onhand = stock_onhand !== undefined ? stock_onhand : null;
    const order = stock_order !== undefined ? stock_order : null;

    let updateQuery = `
      UPDATE stock 
      SET 
        stock_onhand = COALESCE($1, stock_onhand),
        stock_order = COALESCE($2, stock_order),
        stock_akhir = COALESCE($1, stock_onhand) - COALESCE($2, stock_order),
        last_updated = CURRENT_TIMESTAMP,
        updated_by = $3
      WHERE product_id = $4
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [onhand, order, req.user.id, productId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found',
      });
    }

    // Record stock movement
    await pool.query(
      `INSERT INTO stock_movements (product_id, movement_type, quantity_change, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, 'adjustment', (stock_onhand || 0), 'Manual stock adjustment', req.user.id]
    );

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

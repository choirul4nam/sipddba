const express = require('express');
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const timestamp = date.getTime();
  return `ORD-${date.getFullYear()}-${timestamp}`;
};

// Get all orders (admin view)
router.get('/admin/all', authMiddleware, roleMiddleware(['admin', 'gudang']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id, o.order_number, u.full_name, u.email,
        o.order_date, o.status, o.total_amount,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, o.order_number, u.full_name, u.email, o.order_date, o.status, o.total_amount
      ORDER BY o.order_date DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/by_status/:status', authMiddleware, roleMiddleware(['admin', 'gudang']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id, o.order_number, u.full_name, u.email,
        o.order_date, o.status, o.total_amount,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = $1
      GROUP BY o.id, o.order_number, u.full_name, u.email, o.order_date, o.status, o.total_amount
      ORDER BY o.order_date DESC
    `, [req.params.status]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get user's orders (mahasiswa view)
router.get('/my-orders', authMiddleware, roleMiddleware(['mahasiswa']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id, o.order_number, o.order_date, o.status, 
        o.total_amount, o.expected_delivery_date, o.actual_delivery_date
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get order details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Get order
    const orderResult = await pool.query(
      `SELECT o.*, u.email, u.full_name, u.phone_number, u.address
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = orderResult.rows[0];

    // Check authorization (mahasiswa can only see own order, gudang/admin can see all)
    if (req.user.role === 'mahasiswa' && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    // Get order items
    const itemsResult = await pool.query(
      `SELECT oi.id, oi.product_id, p.code, p.name, oi.quantity, oi.unit_price, oi.subtotal
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create order (mahasiswa only)
router.post('/', authMiddleware, roleMiddleware(['mahasiswa']), async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required',
      });
    }

    await client.query('BEGIN');

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const productResult = await client.query(
        'SELECT unit_price FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const unitPrice = parseFloat(productResult.rows[0].unit_price);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;
    }

    // Create order
    const orderNumber = generateOrderNumber();
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, user_id, total_amount, notes, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [orderNumber, req.user.id, totalAmount, notes || null]
    );

    const orderId = orderResult.rows[0].id;

    // Add order items and update stock
    for (const item of items) {
      const productResult = await client.query(
        'SELECT unit_price FROM products WHERE id = $1',
        [item.product_id]
      );

      const unitPrice = parseFloat(productResult.rows[0].unit_price);
      const subtotal = unitPrice * item.quantity;

      // Insert order item
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.quantity, unitPrice, subtotal]
      );

      // Update stock_order
      await client.query(
        `UPDATE stock 
         SET stock_order = stock_order + $1,
             stock_akhir = stock_onhand - (stock_order + $1),
             last_updated = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );

      // Record stock movement
      await client.query(
      `INSERT INTO stock_movements (
          product_id,
          order_id,
          movement_type,
          quantity_change,
          notes,
          created_by
      )
      VALUES ($1, $2, 'order', ($3 * -1), 'Order created', $4)`,
      [item.product_id, orderId, item.quantity, req.user.id]
    )
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount,
        status: 'pending',
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  } finally {
    client.release();
  }
});

// Update order status (admin/gudang)
router.put('/:id/status', authMiddleware, roleMiddleware(['admin', 'gudang']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'payment_submitted', 'payment_approved', 'shipped', 'received', 'cancelled', 'rejected'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Mark order as received (mahasiswa)
router.put('/:id/received', authMiddleware, roleMiddleware(['mahasiswa']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check order belongs to user
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const result = await pool.query(
      `UPDATE orders 
       SET status = 'received', actual_delivery_date = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Order marked as received',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Mark received error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Setup multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads/payment_proofs';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  },
});

// Get pending payment approvals (admin only)
router.get('/pending', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        pa.id, o.order_number, u.full_name, u.email,
        o.total_amount, pa.upload_date, pa.document_type, pa.status
      FROM payment_approvals pa
      JOIN orders o ON pa.order_id = o.id
      JOIN users u ON pa.user_id = u.id
      WHERE pa.status = 'pending'
      ORDER BY pa.upload_date ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get payment approval by order id
router.get('/order/:orderId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM payment_approvals
      WHERE order_id = $1
      ORDER BY upload_date DESC
      LIMIT 1
    `, [req.params.orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment approval not found',
      });
    }
    const payment = result.rows[0]

    payment.file_url =
      `${req.protocol}://${req.get('host')}/` +
      payment.document_file_path.replace(/\\/g, '/')


    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Upload payment proof (mahasiswa)
router.post('/upload/:orderId', authMiddleware, roleMiddleware(['mahasiswa']), upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Document file is required',
      });
    }

    const { orderId } = req.params;
    const { document_type } = req.body;

    // Check order exists and belongs to user
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Create payment approval record
    const result = await pool.query(
      `INSERT INTO payment_approvals 
       (order_id, user_id, document_file_path, document_type, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [orderId, req.user.id, req.file.path, document_type || 'transfer_proof']
    );

    // Update order status
    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['payment_submitted', orderId]
    );

    res.status(201).json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: result.rows[0],
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Approve payment (admin)
router.post('/:id/approve', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get payment approval and order
    const paymentResult = await pool.query(
      'SELECT * FROM payment_approvals WHERE id = $1',
      [id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment approval not found',
      });
    }

    const payment = paymentResult.rows[0];

    // Update payment approval
    const result = await pool.query(
      `UPDATE payment_approvals 
       SET status = 'approved', approval_by = $1, approval_date = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user.id, id]
    );

    // Update order status
    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['payment_approved', payment.order_id]
    );

    res.json({
      success: true,
      message: 'Payment approved successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Reject payment (admin)
router.post('/:id/reject', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    // Update payment approval
    const result = await pool.query(
      `UPDATE payment_approvals 
       SET status = 'rejected', approval_by = $1, approval_date = CURRENT_TIMESTAMP, rejection_reason = $2
       WHERE id = $3
       RETURNING *`,
      [req.user.id, rejection_reason, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment approval not found',
      });
    }

    res.json({
      success: true,
      message: 'Payment rejected successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Download payment proof (admin/gudang)
router.get('/download/:id', authMiddleware, roleMiddleware(['admin', 'gudang']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT document_file_path FROM payment_approvals WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment proof not found',
      });
    }

    const filePath = result.rows[0].document_file_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Download payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { parseCSV, validateHeaders } = require('./csvParser');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/csv' ||
        file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Routes

/**
 * POST /api/csv/upload
 * Upload and parse CSV files
 */
app.post('/api/csv/upload', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded' 
      });
    }

    const results = [];
    
    for (const file of req.files) {
      try {
        const { headers, rows } = await parseCSV(file.buffer);
        
        results.push({
          filename: file.originalname,
          headers,
          rows,
          rowCount: rows.length
        });
      } catch (parseError) {
        results.push({
          filename: file.originalname,
          error: parseError.message
        });
      }
    }

    res.json({
      success: true,
      files: results
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process uploaded files' 
    });
  }
});

/**
 * POST /api/csv/validate
 * Validate strings against classifications
 * This is a placeholder for Stage 02 implementation
 */
app.post('/api/csv/validate', (req, res) => {
  res.json({
    message: 'Validation endpoint - to be implemented in Stage 02',
    valid: true,
    invalidRows: []
  });
});

/**
 * POST /api/csv/export
 * Export data as CSV
 * This is a placeholder for Stage 03 implementation
 */
app.post('/api/csv/export', (req, res) => {
  res.json({
    message: 'Export endpoint - to be implemented in Stage 03'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware (must be after routes)
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB.' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Maximum is 5 files.' 
      });
    }
  }
  
  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({ 
      error: 'Only CSV files are allowed' 
    });
  }
  
  console.error('Error:', error);
  res.status(500).json({ 
    error: error.message || 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

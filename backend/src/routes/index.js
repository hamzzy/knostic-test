const express = require('express');
const csvRoutes = require('./csvRoutes');

const router = express.Router();

// Health check route
router.get('/health', (req, res, next) => {
  const csvController = require('../controllers/csvController');
  csvController.healthCheck(req, res, next);
});

// CSV routes
router.use('/csv', csvRoutes);

module.exports = router;

const express = require('express');
const cors = require('cors');
const { errorHandler, AppError } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');
const operationRoutes = require('./routes/operationRoutes');
const moveHistoryRoutes = require('./routes/moveHistoryRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const partnerRoutes = require('./routes/partnerRoutes');

const app = express();

// Security and standard middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'StockSense IMS Backend',
    database: 'PostgreSQL 18 (Local)',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/move-history', moveHistoryRoutes);
app.use('/api/settings', warehouseRoutes);
app.use('/api/partners', partnerRoutes);

// Catch-all 404 for unmatched API routes
app.all('*', (req, res, next) => {
  next(new AppError(`Endpoint ${req.originalUrl} not found on this server.`, 404, 'ROUTE_NOT_FOUND'));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./src/routes/authRoutes');
const paintingRoutes = require('./src/routes/paintingRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const sellerRoutes = require('./src/routes/sellerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const newsletterRoutes = require('./src/routes/newsletterRoutes');

const { notFound, errorHandler } = require('./src/middleware/errorHandler');

/**
 * The Express app is assembled here, separate from server.js, so it
 * can be imported directly in tests (e.g. with supertest) without
 * binding a real port.
 */
function createApp() {
  const app = express();

  app.set('trust proxy', 1); // needed for correct client IPs behind a proxy/load balancer (rate limiting)

  app.use(helmet());
  // Open CORS: any origin is allowed. `origin: true` reflects the request's
  // own Origin back in Access-Control-Allow-Origin (a bare '*' can't be
  // combined with credentials: true per the CORS spec), so every client is
  // accepted without needing to configure allowed origins anywhere.
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize()); // strips $ / . operators from req.body/query/params to prevent NoSQL injection

  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  // Public catalog: paintings + artists share the /api prefix directly.
  app.use('/api', paintingRoutes);
  app.use('/api/categories', categoryRoutes);

  app.use('/api/auth', authRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/seller', sellerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/newsletter', newsletterRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;

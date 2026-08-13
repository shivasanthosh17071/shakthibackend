require('dotenv').config();
const mongoose = require('mongoose');
const createApp = require('../app');
const connectDB = require('../src/config/db');

/**
 * Vercel serverless entry point. Unlike server.js (which calls app.listen()
 * for a traditional always-on process), Vercel invokes this file's default
 * export as a plain (req, res) handler per request — there is no persistent
 * server to bind a port to.
 *
 * The DB connection and Express app are built once per warm container and
 * reused across invocations, rather than reconnecting on every request.
 */
let appPromise;

function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      if (mongoose.connection.readyState === 0) {
        await connectDB();
      }
      return createApp();
    })();
  }
  return appPromise;
}

module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};

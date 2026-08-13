/**
 * Seeds baseline reference data: art categories + one demo admin user.
 * Safe to re-run — uses upsert-style "find or create" so it won't
 * duplicate records on repeated runs.
 *
 * Usage: node seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const Category = require('./src/models/Category');
const User = require('./src/models/User');

const CATEGORIES = ['Abstract', 'Portrait', 'Landscape', 'Madhubani', 'Warli', 'Tanjore', 'Contemporary'];

const DEMO_ADMIN = {
  name: 'Shakti Crafts Admin',
  email: 'admin@shakticrafts.com',
  password: 'ChangeMe123!', // change immediately after first login in a real deployment
  mobile: '9999999999',
};

async function seed() {
  await connectDB();

  console.log('[seed] Seeding categories...');
  for (const name of CATEGORIES) {
    const slug = slugify(name, { lower: true });
    const existing = await Category.findOne({ slug });
    if (existing) {
      console.log(`[seed]   - "${name}" already exists, skipping.`);
      continue;
    }
    await Category.create({ name, slug });
    console.log(`[seed]   - created "${name}"`);
  }

  console.log('[seed] Seeding demo admin user...');
  const existingAdmin = await User.findOne({ email: DEMO_ADMIN.email });
  if (existingAdmin) {
    console.log('[seed]   - demo admin already exists, skipping.');
  } else {
    const passwordHash = await bcrypt.hash(DEMO_ADMIN.password, 12);
    await User.create({
      name: DEMO_ADMIN.name,
      email: DEMO_ADMIN.email,
      passwordHash,
      mobile: DEMO_ADMIN.mobile,
      role: 'admin',
      isEmailVerified: true, // admin doesn't need the email verification flow
    });
    console.log(`[seed]   - created demo admin (${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}) — change this password immediately.`);
  }

  console.log('[seed] Done.');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});

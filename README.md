# Shakti Crafts — Backend API

Production-quality Node.js + Express REST API for Shakti Crafts, an art marketplace.
Consumed by a separate React frontend — this repo is API-only, no server-rendered UI.

## Stack
Node.js · Express · MongoDB/Mongoose · JWT + bcrypt · Nodemailer (all email, no SMS/OTP) ·
Cloudinary (all image storage) · express-validator · helmet/cors/express-rate-limit · dotenv · morgan

## Getting started

```bash
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, CLOUDINARY_*, SMTP_*, CLIENT_URL
npm run seed            # creates categories + a demo admin (admin@shakticrafts.com / ChangeMe123!)
npm run dev              # nodemon, http://localhost:5000
```

`GET /health` returns `{ status: "ok" }` once the server and DB connection are up.

## Project layout

```
/src
  /config        Mongoose connection, Cloudinary + multer storage, Nodemailer transporter
  /models        User, Category, Painting, Order
  /middleware    auth (JWT), role, sellerApproved, upload (multer), validate, errorHandler
  /controllers   business logic per resource
  /routes        Express routers, wired to /api/* in app.js
  /utils         tokenGen, emailTemplates, statusHistory
  /validators    express-validator chains per resource
app.js            Express app assembly (importable for tests)
server.js         boots the app, connects DB, handles graceful shutdown
seed.js           seeds categories + a demo admin user
```

## Core flows

- **Auth**: signup → email verification link (Nodemailer) → login blocked until verified → JWT
  carries `{ userId, role, sellerStatus }`, but `auth` middleware always reloads the user from
  the DB so role/status changes apply immediately, no re-login required.
- **Seller onboarding**: any verified user can `POST /api/seller/apply` (role stays `buyer` while
  `sellerStatus` is `pending`). An admin approves or rejects; approval flips `role` to `seller`.
  Seller-only routes require `role === 'seller' && sellerStatus === 'approved'`.
- **Catalog**: public paintings listing with category/price/text-search filters, sort, pagination.
  Public responses never expose seller email/mobile.
- **Orders & manual payment verification**: buyer places an order (painting is *not* locked as sold
  yet, to avoid stranding stock on abandoned checkouts) → uploads payment proof → seller verifies
  (painting flips to `sold`, order to `confirmed`) or rejects (buyer re-prompted) → seller moves the
  order forward through `packed → shipped → delivered` (strictly sequential, enforced server-side) →
  buyer gets an email at every step.
- **Uploads**: one generic `POST /api/uploads/image` (Cloudinary via multer) used for painting
  photos, seller sample work, profile images, and payment proof alike.

## Security notes

- Passwords hashed with bcrypt (12 rounds); verification tokens stored only as SHA-256 hashes.
- `role`, `sellerStatus`, and any `*Id`-as-ownership field are **never** taken from client request
  bodies where they could escalate privilege or act on someone else's data — always derived from
  `req.user` / route params + a DB lookup that also checks ownership.
- `express-mongo-sanitize` strips `$`/`.` operators from input to prevent NoSQL injection.
- `express-rate-limit` on all `/api/auth/*` routes (10 req / 15 min / IP).
- Global error handler returns clear messages for operational errors (400/401/403/404/422) and a
  generic message (with full detail logged server-side) for unexpected 500s.

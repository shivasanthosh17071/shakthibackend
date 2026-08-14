const mongoose = require('mongoose');
const Painting = require('../models/Painting');
const Category = require('../models/Category');
const Order = require('../models/Order');
const { ApiError } = require('../middleware/errorHandler');

const PUBLIC_SELLER_FIELDS = 'name sellerProfileImage sellerBio'; // never email/mobile publicly
const PUBLIC_CATEGORY_FIELDS = 'name slug';

/** GET /api/paintings — public catalog listing with filters/search/sort/pagination */
async function listPaintings(req, res, next) {
  try {
    const { category, minPrice, maxPrice, search, sort } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 100);

    const filter = { status: 'active', blocked: { $ne: true } };

    if (category) {
      if (mongoose.isValidObjectId(category)) {
        filter.category = category;
      } else {
        // The frontend filters by category name (e.g. "Coastal & Seascapes"),
        // not slug, so a category must resolve by either — a slug-only lookup
        // silently returns nothing for any multi-word/special-char name whose
        // slug ("coastal-and-seascapes") no longer matches the raw name.
        const cat = await Category.findOne({ $or: [{ slug: category }, { name: category }] });
        // If neither resolves, fall back to a filter that matches nothing
        // rather than erroring or returning everything.
        filter.category = cat ? cat._id : null;
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      // A case-insensitive partial match, not $text — $text only matches whole
      // (stemmed) words, so a realistic partial query like "yaksh" for
      // "Yakshagana" would return nothing even though the word is right there.
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { description: regex }, { medium: regex }];
    }

    let sortOption = { createdAt: -1 }; // newest first, default
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };

    const [paintings, total] = await Promise.all([
      Painting.find(filter)
        .populate('category', PUBLIC_CATEGORY_FIELDS)
        .populate('sellerId', PUBLIC_SELLER_FIELDS)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit),
      Painting.countDocuments(filter),
    ]);

    res.status(200).json({
      paintings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/paintings/:id — public */
async function getPainting(req, res, next) {
  try {
    const painting = await Painting.findOne({
      _id: req.params.id,
      status: { $ne: 'removed' },
      blocked: { $ne: true },
    })
      .populate('category', PUBLIC_CATEGORY_FIELDS)
      .populate('sellerId', PUBLIC_SELLER_FIELDS);

    if (!painting) throw new ApiError(404, 'Painting not found.');

    res.status(200).json({ painting });
  } catch (err) {
    next(err);
  }
}

/** GET /api/artists/:id — public artist profile + their active paintings */
async function getArtistProfile(req, res, next) {
  try {
    const User = require('../models/User');
    const artist = await User.findOne({ _id: req.params.id, role: 'seller', sellerStatus: 'approved' })
      .select('name sellerBio sellerProfileImage portfolioLinks createdAt');

    if (!artist) throw new ApiError(404, 'Artist not found.');

    const paintings = await Painting.find({
      sellerId: artist._id,
      status: 'active',
      blocked: { $ne: true },
    })
      .populate('category', PUBLIC_CATEGORY_FIELDS)
      .sort({ createdAt: -1 });

    res.status(200).json({ artist, paintings });
  } catch (err) {
    next(err);
  }
}

// --- Seller-scoped CRUD ---

/** GET /api/seller/paintings — seller's own listings */
async function listMyPaintings(req, res, next) {
  try {
    const paintings = await Painting.find({ sellerId: req.user._id })
      .populate('category', PUBLIC_CATEGORY_FIELDS)
      .sort({ createdAt: -1 });

    res.status(200).json({ paintings });
  } catch (err) {
    next(err);
  }
}

/** POST /api/seller/paintings */
async function createPainting(req, res, next) {
  try {
    const { title, description, category, medium, dimensions, yearCreated, price, images } = req.body;

    if (!images || images.length < 1 || images.length > 6) {
      throw new ApiError(400, 'A painting must have between 1 and 6 images.');
    }

    const painting = await Painting.create({
      sellerId: req.user._id, // always derived from the authenticated seller, never trusted from body
      title,
      description,
      category,
      medium,
      dimensions,
      yearCreated,
      price,
      images,
    });

    res.status(201).json({ painting });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/seller/paintings/:id */
async function updatePainting(req, res, next) {
  try {
    const painting = await Painting.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!painting) throw new ApiError(404, 'Painting not found.');

    const allowedFields = ['title', 'description', 'category', 'medium', 'dimensions', 'yearCreated', 'price', 'images', 'status'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) painting[field] = req.body[field];
    }

    if (painting.images.length < 1 || painting.images.length > 6) {
      throw new ApiError(400, 'A painting must have between 1 and 6 images.');
    }

    await painting.save();
    res.status(200).json({ painting });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/seller/paintings/:id
 * Soft-deletes (status='removed') if the painting has any associated
 * orders, to preserve order history integrity (an order should always
 * be able to resolve its painting). Hard-deletes only if it has never
 * been ordered.
 */
async function deletePainting(req, res, next) {
  try {
    const painting = await Painting.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!painting) throw new ApiError(404, 'Painting not found.');

    const hasOrders = await Order.exists({ paintingId: painting._id });

    if (hasOrders) {
      painting.status = 'removed';
      await painting.save();
      return res.status(200).json({ message: 'Painting has order history and was archived (soft-deleted) instead of removed.' });
    }

    await painting.deleteOne();
    res.status(200).json({ message: 'Painting deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPaintings,
  getPainting,
  getArtistProfile,
  listMyPaintings,
  createPainting,
  updatePainting,
  deletePainting,
};

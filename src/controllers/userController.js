/** GET /api/users/me (any authenticated role) */
async function getMe(req, res, next) {
  try {
    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/users/me (any authenticated role) — name, mobile, default home address */
async function updateMe(req, res, next) {
  try {
    const { name, mobile, address } = req.body;

    if (name !== undefined) req.user.name = name;
    if (mobile !== undefined) req.user.mobile = mobile;
    if (address !== undefined) req.user.address = address;
    await req.user.save();

    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe };

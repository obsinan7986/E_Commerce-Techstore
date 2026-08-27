/**
 * Address Controller
 * Manages saved delivery addresses for authenticated users.
 * Addresses are stored inside the User document — no separate collection needed.
 *
 * Routes (all protected):
 *   GET    /api/auth/addresses           — list all
 *   POST   /api/auth/addresses           — add new
 *   PUT    /api/auth/addresses/:addrId   — update
 *   DELETE /api/auth/addresses/:addrId   — delete
 *   PATCH  /api/auth/addresses/:addrId/default — set as default
 */
import User from "../models/User.js";

// ── List addresses ───────────────────────────────────────────
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, addresses: user.addresses || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Add address ──────────────────────────────────────────────
export const addAddress = async (req, res) => {
  try {
    const { label, fullName, phone, address, city, subCity, isDefault } = req.body;
    if (!fullName?.trim() || !phone?.trim() || !address?.trim() || !city?.trim()) {
      return res.status(400).json({ success: false, message: "fullName, phone, address and city are required." });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // If new address is default, clear existing defaults
    if (isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    // First address is always default
    const makeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({
      label:     label?.trim()   || "Home",
      fullName:  fullName.trim(),
      phone:     phone.trim(),
      address:   address.trim(),
      city:      city.trim(),
      subCity:   subCity?.trim() || "",
      isDefault: makeDefault,
    });

    await user.save();
    res.status(201).json({ success: true, message: "Address added.", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update address ───────────────────────────────────────────
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const addr = user.addresses.id(req.params.addrId)
      || user.addresses.find(a => a._id?.toString() === req.params.addrId);
    if (!addr) return res.status(404).json({ success: false, message: "Address not found." });

    const { label, fullName, phone, address, city, subCity, isDefault } = req.body;

    if (label    !== undefined) addr.label    = label.trim();
    if (fullName !== undefined) addr.fullName = fullName.trim();
    if (phone    !== undefined) addr.phone    = phone.trim();
    if (address  !== undefined) addr.address  = address.trim();
    if (city     !== undefined) addr.city     = city.trim();
    if (subCity  !== undefined) addr.subCity  = subCity.trim();

    if (isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
      addr.isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, message: "Address updated.", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Delete address ───────────────────────────────────────────
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const before = user.addresses.length;
    user.addresses = user.addresses.filter(a => a._id?.toString() !== req.params.addrId);

    if (user.addresses.length === before) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    // If deleted was default, promote the first remaining address
    const hasDefault = user.addresses.some(a => a.isDefault);
    if (!hasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, message: "Address deleted.", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Set default address ──────────────────────────────────────
export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    let found = false;
    user.addresses.forEach(a => {
      const match = a._id?.toString() === req.params.addrId;
      a.isDefault = match;
      if (match) found = true;
    });

    if (!found) return res.status(404).json({ success: false, message: "Address not found." });

    await user.save();
    res.status(200).json({ success: true, message: "Default address updated.", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, ...profile } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await User.hashPassword(password);

    // Build user document with sanitized optional fields
    const userDoc = { name, email, passwordHash };
    if (profile.age !== undefined && profile.age !== '') {
      const ageNum = Number(profile.age);
      if (!Number.isNaN(ageNum)) userDoc.age = ageNum;
    }
    if (profile.gender && ['male', 'female', 'other'].includes(profile.gender)) {
      userDoc.gender = profile.gender;
    }
    if (profile.heightCm !== undefined && profile.heightCm !== '') {
      const heightNum = Number(profile.heightCm);
      if (!Number.isNaN(heightNum)) userDoc.heightCm = heightNum;
    }
    if (profile.weightKg !== undefined && profile.weightKg !== '') {
      const weightNum = Number(profile.weightKg);
      if (!Number.isNaN(weightNum)) userDoc.weightKg = weightNum;
    }

    const user = await User.create(userDoc);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfigured: missing JWT secret' });
    }
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('-passwordHash');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.put('/profile', auth, async (req, res) => {
  const updates = { ...req.body };
  delete updates.password; // not here
  delete updates.passwordHash;
  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-passwordHash');
  res.json(user);
});

module.exports = router;




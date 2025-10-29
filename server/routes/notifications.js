const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// List notifications (most recent first)
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(limit);
    res.json(notifications);
  } catch (err) {
    console.error('❌ Error listing notifications:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Unread count
router.get('/unread-count', async (_req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.json({ count });
  } catch (err) {
    console.error('❌ Error counting unread notifications:', err);
    res.status(500).json({ message: 'Failed to count unread' });
  }
});

// Mark one as read
router.patch('/:id/read', async (req, res) => {
  try {
    const doc = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    console.error('❌ Error marking notification read:', err);
    res.status(400).json({ message: 'Failed to update' });
  }
});

// Mark all as read
router.post('/mark-all-read', async (_req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true, readAt: new Date() });
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ Error marking all notifications read:', err);
    res.status(500).json({ message: 'Failed to update' });
  }
});

// Clear all
router.delete('/clear', async (_req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ Error clearing notifications:', err);
    res.status(500).json({ message: 'Failed to clear' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// VAPID keys for push notifications
// In production, generate with: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BNxN8YqJ8T9YqZlYJKJ3YqYqJ8T9YqZlYJKJ3YqYqJ8T9YqZlYJKJ3YqYqJ8T9YqZlYJKJ3YqYqJ8T9YqZlY',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
};

// Normalize and validate VAPID subject to avoid crashing on invalid env values
const DEFAULT_VAPID_SUBJECT = 'mailto:admin@barberbooking.com';
const normalizeSubject = (value) => {
  if (!value) return DEFAULT_VAPID_SUBJECT;
  const trimmed = String(value).trim().replace(/^['"]|['"]$/g, ''); // strip quotes
  const isHttp = /^https?:\/\//i.test(trimmed);
  const isMailto = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(trimmed);
  if (isHttp || isMailto) return trimmed;
  console.warn(`[push] Invalid VAPID_SUBJECT "${trimmed}". Falling back to ${DEFAULT_VAPID_SUBJECT}.`);
  return DEFAULT_VAPID_SUBJECT;
};

const vapidSubject = normalizeSubject(process.env.VAPID_SUBJECT);

try {
  webpush.setVapidDetails(
    vapidSubject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} catch (err) {
  console.error('[push] setVapidDetails failed with provided subject:', err?.message);
  // Last-resort fallback to default subject so app can still boot
  webpush.setVapidDetails(
    DEFAULT_VAPID_SUBJECT,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    
    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      endpoint: subscription.endpoint
    });

    if (existingSubscription) {
      return res.status(200).json({ message: 'Already subscribed' });
    }

    // Save new subscription
    const newSubscription = new PushSubscription({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      userAgent: req.headers['user-agent'],
      isAdmin: false // Set based on authentication if needed
    });

    await newSubscription.save();
    console.log('✅ New push subscription saved');

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Unsubscribe
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ endpoint });
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Send notification to all subscribers
router.post('/send', async (req, res) => {
  try {
    const { title, body, data, tag, requireInteraction } = req.body;

    const payload = JSON.stringify({
      title: title || 'Barber Booking',
      body: body || 'Nova notifikacija',
      tag: tag || 'notification',
      requireInteraction: requireInteraction || false,
      data: data || {},
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png'
    });

    const subscriptions = await PushSubscription.find({ active: true });
    console.log(`📤 Sending push to ${subscriptions.length} subscribers`);

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth
              }
            },
            payload
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error) {
          // If subscription is no longer valid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            await PushSubscription.updateOne(
              { _id: sub._id },
              { active: false }
            );
          }
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.value?.success).length;
    const failed = results.length - successful;

    res.json({
      message: 'Notifications sent',
      successful,
      failed,
      total: results.length
    });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Send notification to admin only
router.post('/send-admin', async (req, res) => {
  try {
    const { title, body, data } = req.body;

    const payload = JSON.stringify({
      title: title || 'Nova Narudžba',
      body,
      data: data || {},
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      requireInteraction: true,
      tag: 'admin-notification'
    });

    const adminSubscriptions = await PushSubscription.find({
      active: true,
      isAdmin: true
    });

    console.log(`📤 Sending admin push to ${adminSubscriptions.length} devices`);

    const results = await Promise.allSettled(
      adminSubscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
          },
          payload
        ).catch(async (error) => {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await PushSubscription.updateOne({ _id: sub._id }, { active: false });
          }
          throw error;
        })
      )
    );

    res.json({
      message: 'Admin notifications sent',
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    });
  } catch (error) {
    console.error('Error sending admin push:', error);
    res.status(500).json({ error: 'Failed to send admin notifications' });
  }
});

module.exports = router;

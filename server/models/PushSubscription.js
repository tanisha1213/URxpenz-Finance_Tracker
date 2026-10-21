import { SupabaseModelAdapter } from './adapter.js';

// In-memory fallback cache in case Supabase table is not yet migrated
const fallbackSubscriptions = new Map();

const PushSubscriptionAdapter = new SupabaseModelAdapter('push_subscriptions');

export const PushSubscriptionModel = {
  async saveSubscription(userId, subscription, userAgent = '') {
    const endpoint = subscription.endpoint;
    const subscriptionData = {
      userId,
      endpoint,
      keys: subscription.keys,
      userAgent,
      updatedAt: new Date().toISOString()
    };

    // Store in memory cache
    fallbackSubscriptions.set(endpoint, subscriptionData);

    try {
      // Try finding existing record by endpoint in Supabase
      const existing = await PushSubscriptionAdapter.findOne({ endpoint });
      if (existing) {
        existing.userId = userId;
        existing.keys = subscription.keys;
        existing.userAgent = userAgent;
        return await existing.save();
      } else {
        return await PushSubscriptionAdapter.create(subscriptionData);
      }
    } catch (err) {
      console.warn('[PushSubscriptionModel] Supabase storage notice (using fallback memory cache):', err.message);
      return subscriptionData;
    }
  },

  async getSubscriptionsByUser(userId) {
    try {
      const records = await PushSubscriptionAdapter.find({ userId });
      if (records && records.length > 0) {
        return records.map(r => ({
          endpoint: r.endpoint,
          keys: r.keys,
          userId: r.userId
        }));
      }
    } catch (err) {
      // Fallback to in-memory
    }

    const matched = [];
    for (const sub of fallbackSubscriptions.values()) {
      if (sub.userId === userId) {
        matched.push(sub);
      }
    }
    return matched;
  },

  async getAllSubscriptions() {
    try {
      const records = await PushSubscriptionAdapter.find({});
      if (records && records.length > 0) {
        return records.map(r => ({
          endpoint: r.endpoint,
          keys: r.keys,
          userId: r.userId
        }));
      }
    } catch (err) {
      // Fallback
    }

    return Array.from(fallbackSubscriptions.values());
  },

  async removeSubscription(endpoint) {
    fallbackSubscriptions.delete(endpoint);
    try {
      await PushSubscriptionAdapter.deleteOne({ endpoint });
    } catch (err) {
      // ignore
    }
  }
};

export default PushSubscriptionModel;

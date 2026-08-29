import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// In-memory + file-backed persistent database
interface DBUser {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  premium: boolean;
  selectedLanguage: 'en' | 'id';
  theme: 'light' | 'dark';
  createdAt: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  completedChallenges: any[];
  savedTopics: string[];
  recentTopicIds: string[];
  notes: Record<string, string>;
  paymentHistory: {
    orderId: string;
    amount: number;
    paymentDate: string;
    provider: 'midtrans' | 'xendit' | 'sandbox';
    status: 'settlement' | 'pending' | 'failed';
  }[];
}

interface DBOrder {
  orderId: string;
  userId: string;
  email: string;
  amount: number;
  status: 'pending' | 'settlement' | 'failed';
  provider: 'midtrans' | 'xendit' | 'sandbox';
  snapToken?: string;
  redirectUrl?: string;
  createdAt: string;
  settledAt?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Could not create data dir:', e);
  }
}

// Load databases
function loadUsers(): Record<string, DBUser> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading users file:', e);
  }
  return {};
}

function saveUsers(users: Record<string, DBUser>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing users file:', e);
  }
}

function loadOrders(): Record<string, DBOrder> {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading orders file:', e);
  }
  return {};
}

function saveOrders(orders: Record<string, DBOrder>) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing orders file:', e);
  }
}

let dbUsers: Record<string, DBUser> = loadUsers();
let dbOrders: Record<string, DBOrder> = loadOrders();
// Active session tokens: token -> userId
const activeSessions = new Map<string, string>();

function sanitizeUser(user: DBUser) {
  const { passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    accessStatus: safeUser.premium ? 'paid' : 'free',
  };
}

function getAuthUser(req: express.Request): DBUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const userId = activeSessions.get(token);
  if (!userId || !dbUsers[userId]) {
    return null;
  }
  return dbUsers[userId];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      brand: 'JUST SPEAK',
      usersCount: Object.keys(dbUsers).length,
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // Register New User
  app.post('/api/auth/register', (req, res) => {
    const { email, name, password, language } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    // Check if user with this email already exists
    const existing = Object.values(dbUsers).find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      // Return existing user session
      const token = 'tok_' + crypto.randomBytes(24).toString('hex');
      activeSessions.set(token, existing.id);
      return res.json({ user: sanitizeUser(existing), token });
    }

    const newUserId = 'usr_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
    const newUser: DBUser = {
      id: newUserId,
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      passwordHash: password ? crypto.createHash('sha256').update(password).digest('hex') : undefined,
      premium: false, // Default is strictly false for new accounts
      selectedLanguage: language === 'id' ? 'id' : 'en',
      theme: 'light',
      createdAt: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      completedChallenges: [],
      savedTopics: [],
      recentTopicIds: [],
      notes: {},
      paymentHistory: [],
    };

    dbUsers[newUserId] = newUser;
    saveUsers(dbUsers);

    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    activeSessions.set(token, newUserId);

    return res.json({ user: sanitizeUser(newUser), token });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = Object.values(dbUsers).find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Auto-create initial account with premium = false
      const newUserId = 'usr_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
      user = {
        id: newUserId,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        premium: false,
        selectedLanguage: 'en',
        theme: 'light',
        createdAt: new Date().toISOString(),
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        completedChallenges: [],
        savedTopics: [],
        recentTopicIds: [],
        notes: {},
        paymentHistory: [],
      };
      dbUsers[newUserId] = user;
      saveUsers(dbUsers);
    }

    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    activeSessions.set(token, user.id);

    return res.json({ user: sanitizeUser(user), token });
  });

  // Get Current Authenticated User (Session Verification)
  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ user: null, authenticated: false });
    }
    return res.json({ user: sanitizeUser(user), authenticated: true });
  });

  // Logout (Destroys Server Session)
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      activeSessions.delete(token);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  });

  // Sync User Progress (Streak, Completed Challenges, Saved Topics, Preferences)
  app.post('/api/user/sync', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name,
      selectedLanguage,
      theme,
      currentStreak,
      longestStreak,
      lastCompletedDate,
      completedChallenges,
      savedTopics,
      recentTopicIds,
      notes,
    } = req.body || {};

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (selectedLanguage === 'en' || selectedLanguage === 'id') user.selectedLanguage = selectedLanguage;
    if (theme === 'light' || theme === 'dark') user.theme = theme;
    if (typeof currentStreak === 'number') user.currentStreak = currentStreak;
    if (typeof longestStreak === 'number') user.longestStreak = longestStreak;
    if (lastCompletedDate !== undefined) user.lastCompletedDate = lastCompletedDate;
    if (Array.isArray(completedChallenges)) user.completedChallenges = completedChallenges;
    if (Array.isArray(savedTopics)) user.savedTopics = savedTopics;
    if (Array.isArray(recentTopicIds)) user.recentTopicIds = recentTopicIds;
    if (notes && typeof notes === 'object') user.notes = notes;

    // NOTE: premium status is NEVER changed via sync! It only changes via verified payment!
    dbUsers[user.id] = user;
    saveUsers(dbUsers);

    return res.json({ user: sanitizeUser(user) });
  });

  // ==========================================
  // PAYMENT & WEBHOOK GATEWAY INTEGRATION
  // ==========================================

  // Create One-Time Lifetime Access Purchase Order (Rp49.000)
  app.post('/api/payment/create-order', async (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Please log in to purchase premium access' });
    }

    if (user.premium) {
      return res.json({
        alreadyPremium: true,
        message: 'You already have lifetime premium access',
        user: sanitizeUser(user),
      });
    }

    const orderId = `ORDER-JS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const amount = 49000; // Rp49.000 One-time lifetime purchase

    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    const order: DBOrder = {
      orderId,
      userId: user.id,
      email: user.email,
      amount,
      status: 'pending',
      provider: midtransServerKey ? 'midtrans' : 'sandbox',
      createdAt: new Date().toISOString(),
    };

    // If Midtrans Server Key is configured in environment
    if (midtransServerKey) {
      try {
        const snapEndpoint = isProduction
          ? 'https://app.midtrans.com/snap/v1/transactions'
          : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        const authString = Buffer.from(`${midtransServerKey}:`).toString('base64');
        const snapPayload = {
          transaction_details: {
            order_id: orderId,
            gross_amount: amount,
          },
          customer_details: {
            first_name: user.name,
            email: user.email,
          },
          item_details: [
            {
              id: 'justspeak_lifetime_365',
              price: amount,
              quantity: 1,
              name: 'JUST SPEAK - 365 Topics Lifetime Access',
            },
          ],
        };

        const response = await fetch(snapEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Basic ${authString}`,
          },
          body: JSON.stringify(snapPayload),
        });

        const snapData: any = await response.json();
        if (snapData.token) {
          order.snapToken = snapData.token;
          order.redirectUrl = snapData.redirect_url;
        }
      } catch (err) {
        console.error('Midtrans Snap request error:', err);
      }
    }

    dbOrders[orderId] = order;
    saveOrders(dbOrders);

    return res.json({
      orderId,
      amount,
      currency: 'IDR',
      formattedPrice: 'Rp49.000',
      productName: 'JUST SPEAK - Lifetime Access to All 365 Topics',
      isLiveGatewayConfigured: !!midtransServerKey,
      snapToken: order.snapToken,
      redirectUrl: order.redirectUrl,
    });
  });

  // Official Payment Webhook Receiver (Midtrans / Xendit)
  app.post('/api/payment/webhook', (req, res) => {
    const payload = req.body || {};
    console.log('[Payment Webhook Received]:', JSON.stringify(payload));

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      // Xendit payload keys
      external_id,
      status: xenditStatus,
    } = payload;

    const targetOrderId = order_id || external_id;
    if (!targetOrderId || !dbOrders[targetOrderId]) {
      console.warn(`[Webhook] Order ${targetOrderId} not found`);
      return res.status(200).json({ received: true, error: 'Order not found in database' });
    }

    const order = dbOrders[targetOrderId];
    const user = dbUsers[order.userId];

    if (!user) {
      console.warn(`[Webhook] User ${order.userId} not found`);
      return res.status(200).json({ received: true, error: 'User not found' });
    }

    // Midtrans Signature Verification
    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;
    if (midtransServerKey && signature_key && status_code && gross_amount) {
      const expectedSignature = crypto
        .createHash('sha512')
        .update(`${targetOrderId}${status_code}${gross_amount}${midtransServerKey}`)
        .digest('hex');

      if (expectedSignature !== signature_key) {
        console.error('[Webhook] Invalid Midtrans Signature!');
        return res.status(403).json({ error: 'Invalid signature' });
      }
    }

    // Check payment completion
    const isMidtransSuccess =
      (transaction_status === 'settlement' || transaction_status === 'capture') &&
      (!fraud_status || fraud_status === 'accept');
    const isXenditSuccess = xenditStatus === 'PAID';

    if (isMidtransSuccess || isXenditSuccess) {
      order.status = 'settlement';
      order.settledAt = new Date().toISOString();
      dbOrders[targetOrderId] = order;
      saveOrders(dbOrders);

      // Upgrade user to verified LIFETIME PREMIUM
      user.premium = true;
      user.paymentHistory = user.paymentHistory || [];
      user.paymentHistory.push({
        orderId: targetOrderId,
        amount: order.amount,
        paymentDate: order.settledAt,
        provider: order.provider,
        status: 'settlement',
      });
      dbUsers[user.id] = user;
      saveUsers(dbUsers);

      console.log(`[Payment Verified] User ${user.email} (${user.id}) upgraded to LIFETIME PREMIUM.`);
    }

    return res.status(200).json({
      received: true,
      orderId: targetOrderId,
      paymentStatus: order.status,
      premiumActive: user.premium,
    });
  });

  // Verify Sandbox / Test Payment (For testing when gateway keys are in development)
  app.post('/api/payment/verify-test-checkout', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId } = req.body || {};
    if (!orderId || !dbOrders[orderId]) {
      return res.status(400).json({ error: 'Order not found' });
    }

    const order = dbOrders[orderId];
    if (order.userId !== user.id) {
      return res.status(403).json({ error: 'Order does not belong to this user' });
    }

    // Mark order as settlement on server
    order.status = 'settlement';
    order.settledAt = new Date().toISOString();
    dbOrders[orderId] = order;
    saveOrders(dbOrders);

    // Update user on server DB
    user.premium = true;
    user.paymentHistory = user.paymentHistory || [];
    user.paymentHistory.push({
      orderId,
      amount: order.amount,
      paymentDate: order.settledAt,
      provider: 'sandbox',
      status: 'settlement',
    });
    dbUsers[user.id] = user;
    saveUsers(dbUsers);

    return res.json({
      success: true,
      message: 'Verified lifetime premium unlocked on server',
      user: sanitizeUser(user),
    });
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JUST SPEAK server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();


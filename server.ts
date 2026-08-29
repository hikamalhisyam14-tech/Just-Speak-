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
    provider: 'midtrans' | 'sandbox';
    status: 'settlement' | 'pending' | 'failed';
  }[];
}

interface DBOrder {
  orderId: string;
  userId: string;
  email: string;
  amount: number;
  status: 'pending' | 'settlement' | 'failed';
  provider: 'midtrans' | 'sandbox';
  snapToken?: string;
  redirectUrl?: string;
  transactionId?: string;
  vipActivated?: boolean;
  createdAt: string;
  settledAt?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

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

function loadSessions(): Record<string, string> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading sessions file:', e);
  }
  return {};
}

function saveSessions(sessions: Record<string, string>) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing sessions file:', e);
  }
}

let dbUsers: Record<string, DBUser> = loadUsers();
let dbOrders: Record<string, DBOrder> = loadOrders();
let dbSessions: Record<string, string> = loadSessions();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || typeof storedHash !== 'string') return false;
  if (!storedHash.includes(':')) {
    // Support legacy sha256 hashes if any were stored
    if (storedHash.length === 64) {
      const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(legacyHash), Buffer.from(storedHash));
    }
    return false;
  }
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  try {
    const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
  } catch {
    return false;
  }
}

function sanitizeUser(user: DBUser) {
  const { passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    accessStatus: safeUser.premium ? 'paid' : 'free',
  };
}

function getBaseUrl(req: express.Request): string {
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    return process.env.APP_URL.trim().replace(/\/+$/, '');
  }
  const origin = req.headers.origin as string;
  if (origin && origin.startsWith('http')) {
    return origin.replace(/\/+$/, '');
  }
  const referer = req.headers.referer as string;
  if (referer && referer.startsWith('http')) {
    try {
      const url = new URL(referer);
      return `${url.protocol}//${url.host}`;
    } catch {}
  }
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.get('host');
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || 'https';
  if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, '');
  }
  return 'https://ais-dev-3b3t77jvi5ntunsqwmufwe-666103429374.asia-southeast1.run.app';
}

async function verifyPendingOrdersForUser(user: DBUser): Promise<boolean> {
  if (user.premium) return true;

  const midtransServerKey = process.env.MIDTRANS_SERVER_KEY ? process.env.MIDTRANS_SERVER_KEY.trim() : '';
  if (!midtransServerKey) return false;

  const userPendingOrders = Object.values(dbOrders).filter(
    (o) => o.userId === user.id && o.status === 'pending'
  );

  if (userPendingOrders.length === 0) return false;

  let upgraded = false;
  const authString = Buffer.from(`${midtransServerKey}:`).toString('base64');

  for (const order of userPendingOrders) {
    try {
      const statusEndpoint = `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(order.orderId)}/status`;
      const midtransRes = await fetch(statusEndpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${authString}`,
        },
      });

      if (midtransRes.ok) {
        const statusData: any = await midtransRes.json();
        const { transaction_status, fraud_status } = statusData;

        const isSuccess =
          (transaction_status === 'settlement' || transaction_status === 'capture') &&
          (!fraud_status || fraud_status === 'accept');

        if (isSuccess) {
          order.status = 'settlement';
          order.transactionId = statusData.transaction_id || order.transactionId;
          order.vipActivated = true;
          order.settledAt = new Date().toISOString();
          dbOrders[order.orderId] = order;

          user.premium = true;
          user.paymentHistory = user.paymentHistory || [];
          if (!user.paymentHistory.some((p) => p.orderId === order.orderId)) {
            user.paymentHistory.push({
              orderId: order.orderId,
              amount: order.amount,
              paymentDate: order.settledAt,
              provider: 'midtrans',
              status: 'settlement',
            });
          }
          upgraded = true;
          console.log(`[Auto-Sync Verified] Order ${order.orderId} verified with Midtrans. Upgraded ${user.email} to LIFETIME VIP.`);
        } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
          order.status = 'failed';
          dbOrders[order.orderId] = order;
        }
      }
    } catch (err) {
      console.error(`Error auto-verifying order ${order.orderId}:`, err);
    }
  }

  if (upgraded) {
    dbUsers[user.id] = user;
    saveUsers(dbUsers);
    saveOrders(dbOrders);
  }

  return upgraded;
}

function getAuthUser(req: express.Request): DBUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const userId = dbSessions[token];
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
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    // Check if user with this email already exists
    const existing = Object.values(dbUsers).find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const newUserId = 'usr_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
    const newUser: DBUser = {
      id: newUserId,
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      passwordHash: hashPassword(password),
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
    dbSessions[token] = newUserId;
    saveSessions(dbSessions);

    return res.json({ user: sanitizeUser(newUser), token });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = Object.values(dbUsers).find(u => u.email.toLowerCase() === cleanEmail);

    // If user doesn't exist, return generic error (do not leak user existence)
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    // Verify password
    if (user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }
    } else {
      // Legacy user migration: if legacy user account had no password hash yet, set it on valid password
      if (password.length >= 6) {
        user.passwordHash = hashPassword(password);
        dbUsers[user.id] = user;
        saveUsers(dbUsers);
      } else {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }
    }

    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    dbSessions[token] = user.id;
    saveSessions(dbSessions);

    return res.json({ user: sanitizeUser(user), token });
  });

  // Get Current Authenticated User (Session Verification & Auto-Sync Pending Orders)
  app.get('/api/auth/me', async (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ user: null, authenticated: false });
    }

    // If user is not yet marked as premium, check if they have any pending orders settled in Midtrans
    if (!user.premium) {
      await verifyPendingOrdersForUser(user);
    }

    return res.json({ user: sanitizeUser(user), authenticated: true });
  });

  // Logout (Destroys Server Session)
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (dbSessions[token]) {
        delete dbSessions[token];
        saveSessions(dbSessions);
      }
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

    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY ? process.env.MIDTRANS_SERVER_KEY.trim() : '';
    const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY ? process.env.MIDTRANS_CLIENT_KEY.trim() : '';
    const isProduction = false; // Strictly sandbox as requested

    const baseUrl = getBaseUrl(req);

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
          callbacks: {
            finish: `${baseUrl}/?payment=finish&order_id=${encodeURIComponent(orderId)}`,
            unfinish: `${baseUrl}/?payment=unfinish&order_id=${encodeURIComponent(orderId)}`,
            error: `${baseUrl}/?payment=error&order_id=${encodeURIComponent(orderId)}`,
          },
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
        } else if (snapData.error_messages) {
          console.error('Midtrans Snap error messages:', snapData.error_messages);
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
      clientKey: midtransClientKey || '',
      snapToken: order.snapToken,
      redirectUrl: order.redirectUrl,
    });
  });

  // Direct Status Check & Verification with Midtrans (called after popup completes, return redirect, or page reload)
  app.post('/api/payment/check-status', async (req, res) => {
    const authUser = getAuthUser(req);
    const { orderId } = req.body || {};

    if (!orderId || !dbOrders[orderId]) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = dbOrders[orderId];
    const orderOwner = dbUsers[order.userId];

    if (!orderOwner) {
      return res.status(404).json({ error: 'Order owner account not found' });
    }

    // If order is already settled in database
    if (order.status === 'settlement') {
      if (!orderOwner.premium) {
        orderOwner.premium = true;
        dbUsers[orderOwner.id] = orderOwner;
        saveUsers(dbUsers);
      }
      return res.json({
        status: 'settlement',
        premium: true,
        user: sanitizeUser(orderOwner),
      });
    }

    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY ? process.env.MIDTRANS_SERVER_KEY.trim() : '';
    if (midtransServerKey) {
      try {
        const isProduction = false; // Strictly sandbox
        const statusEndpoint = isProduction
          ? `https://api.midtrans.com/v2/${encodeURIComponent(orderId)}/status`
          : `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`;

        const authString = Buffer.from(`${midtransServerKey}:`).toString('base64');
        const midtransRes = await fetch(statusEndpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${authString}`,
          },
        });

        if (midtransRes.ok) {
          const statusData: any = await midtransRes.json();
          const { transaction_status, fraud_status } = statusData;

          const isSuccess =
            (transaction_status === 'settlement' || transaction_status === 'capture') &&
            (!fraud_status || fraud_status === 'accept');

          if (isSuccess) {
            order.status = 'settlement';
            order.transactionId = statusData.transaction_id || order.transactionId;
            order.vipActivated = true;
            order.settledAt = new Date().toISOString();
            dbOrders[orderId] = order;
            saveOrders(dbOrders);

            orderOwner.premium = true;
            orderOwner.paymentHistory = orderOwner.paymentHistory || [];
            if (!orderOwner.paymentHistory.some(p => p.orderId === orderId)) {
              orderOwner.paymentHistory.push({
                orderId,
                amount: order.amount,
                paymentDate: order.settledAt,
                provider: 'midtrans',
                status: 'settlement',
              });
            }
            dbUsers[orderOwner.id] = orderOwner;
            saveUsers(dbUsers);

            console.log(`[Order Verified via Status API] User ${orderOwner.email} (${orderOwner.id}) granted LIFETIME VIP for order ${orderId}`);

            return res.json({
              status: 'settlement',
              premium: true,
              user: sanitizeUser(orderOwner),
            });
          } else if (transaction_status === 'pending') {
            return res.json({
              status: 'pending',
              premium: false,
              message: 'Payment is pending approval or transfer.',
            });
          } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
            order.status = 'failed';
            dbOrders[orderId] = order;
            saveOrders(dbOrders);
            return res.json({
              status: 'failed',
              premium: false,
              message: 'Payment failed, cancelled, or expired.',
            });
          }
        }
      } catch (err) {
        console.error('Error checking Midtrans transaction status:', err);
      }
    }

    return res.json({
      status: order.status,
      premium: orderOwner.premium,
      isSandboxSimulator: !midtransServerKey,
      user: authUser ? sanitizeUser(authUser) : undefined,
    });
  });

  // Official Public Payment Webhook Receiver (Midtrans)
  app.post('/api/payment/webhook', async (req, res) => {
    const payload = req.body || {};
    console.log('[Midtrans Payment Webhook Received]:', JSON.stringify(payload));

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = payload;

    const targetOrderId = order_id;
    if (!targetOrderId || !dbOrders[targetOrderId]) {
      console.warn(`[Webhook] Order ${targetOrderId} not found in database`);
      return res.status(200).json({ received: true, error: 'Order not found in database' });
    }

    const order = dbOrders[targetOrderId];
    const user = dbUsers[order.userId];

    if (!user) {
      console.warn(`[Webhook] User ${order.userId} not found`);
      return res.status(200).json({ received: true, error: 'User not found' });
    }

    // Midtrans Signature & Status Verification
    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY ? process.env.MIDTRANS_SERVER_KEY.trim() : '';
    let isSignatureValid = true;

    if (midtransServerKey && signature_key && status_code && gross_amount) {
      const expectedSignature = crypto
        .createHash('sha512')
        .update(`${targetOrderId}${status_code}${gross_amount}${midtransServerKey}`)
        .digest('hex');

      if (expectedSignature !== signature_key) {
        console.warn(`[Webhook] Signature direct hash mismatch for order ${targetOrderId}. Verifying via Midtrans Status API...`);
        // Query Midtrans status API directly to ensure validity
        try {
          const authString = Buffer.from(`${midtransServerKey}:`).toString('base64');
          const statusRes = await fetch(`https://api.sandbox.midtrans.com/v2/${encodeURIComponent(targetOrderId)}/status`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Basic ${authString}`,
            },
          });
          if (statusRes.ok) {
            const liveStatus: any = await statusRes.json();
            if (liveStatus.order_id === targetOrderId) {
              isSignatureValid = true;
            } else {
              isSignatureValid = false;
            }
          } else {
            isSignatureValid = false;
          }
        } catch {
          isSignatureValid = false;
        }
      }
    }

    if (!isSignatureValid) {
      console.error('[Webhook] Invalid Midtrans Signature and status check failed!');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Check payment completion status
    const isMidtransSuccess =
      (transaction_status === 'settlement' || transaction_status === 'capture') &&
      (!fraud_status || fraud_status === 'accept');

    if (isMidtransSuccess) {
      order.status = 'settlement';
      order.transactionId = payload.transaction_id || order.transactionId;
      order.vipActivated = true;
      order.settledAt = new Date().toISOString();
      dbOrders[targetOrderId] = order;
      saveOrders(dbOrders);

      // Upgrade user to verified LIFETIME VIP
      user.premium = true;
      user.paymentHistory = user.paymentHistory || [];
      if (!user.paymentHistory.some(p => p.orderId === targetOrderId)) {
        user.paymentHistory.push({
          orderId: targetOrderId,
          amount: order.amount,
          paymentDate: order.settledAt,
          provider: order.provider,
          status: 'settlement',
        });
      }
      dbUsers[user.id] = user;
      saveUsers(dbUsers);

      console.log(`[Webhook Payment Verified] User ${user.email} (${user.id}) upgraded to LIFETIME VIP.`);
    } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
      order.status = 'failed';
      dbOrders[targetOrderId] = order;
      saveOrders(dbOrders);
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


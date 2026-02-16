import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { getConnection } from './db.js';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, userId: decoded.userId, isAdmin: decoded.isAdmin || false };
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error.message);
    return { valid: false, error: error.message };
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(`[AUTH] Path: ${req.path}, Header present: ${!!authHeader}`);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  console.log(`[AUTH] Token start: ${token.substring(0, 15)}..., Secret start: ${JWT_SECRET.substring(0, 5)}...`);
  const verification = verifyToken(token);

  if (!verification.valid) {
    console.error(`[AUTH] Verification failed for token ${token.substring(0, 15)}: ${verification.error}`);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  req.userId = verification.userId;
  req.isAdmin = verification.isAdmin;
  next();
}

export async function loginUser(email, password) {
  let db;
  try {
    db = await getConnection();
    const [users] = await db.query('SELECT id, password_hash, email_verified, is_admin, is_blocked FROM wp_users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return { success: false, error: 'Email non trovata' };
    }

    const user = users[0];

    if (user.is_blocked) {
      return { success: false, error: 'Account bloccato' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, error: 'Password errata' };
    }

    // Get GP Balance
    const [gp] = await db.query('SELECT balance FROM wp_user_gp_balance WHERE user_id = ?', [user.id]);
    
    let gpBalance;
    if (gp.length === 0) {
      gpBalance = 100;
      await db.query('INSERT INTO wp_user_gp_balance (user_id, balance) VALUES (?, 100)', [user.id]);
    } else {
      gpBalance = gp[0].balance;
    }

    // NEW: Get Advisor Balance
    const [adv] = await db.query('SELECT balance_euro FROM tp_advisor_wallets WHERE user_id = ?', [user.id]);
    const advisorBalance = adv.length > 0 ? adv[0].balance_euro : 0;

    const token = jwt.sign(
      { userId: user.id, email, isAdmin: Boolean(user.is_admin) }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email,
        email_verified: Boolean(user.email_verified),
        isAdmin: Boolean(user.is_admin),
        gpBalance: gpBalance,
        advisorBalance: advisorBalance
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  } finally {
    if (db) db.release();
  }
}

export async function getCurrentUser(userId) {
  let db;
  try {
    console.log(`[AUTH] Fetching user info for ID: ${userId}`);
    db = await getConnection();
    
    // Get user and GP balance in one go if possible
    const [users] = await db.query(`
      SELECT u.id, u.email, u.is_admin, u.email_verified, COALESCE(b.balance, 100) as gp_balance 
      FROM wp_users u 
      LEFT JOIN wp_user_gp_balance b ON u.id = b.user_id 
      WHERE u.id = ?
    `, [userId]);
    
    if (users.length === 0) {
      console.error(`[AUTH] User ID ${userId} not found in database`);
      return { success: false, error: 'Utente non trovato' };
    }

    const user = users[0];
    
    // Get current balance
    const [gp] = await db.query('SELECT balance FROM wp_user_gp_balance WHERE user_id = ?', [userId]);
    
    let finalBalance;
    if (gp.length === 0) {
      finalBalance = 100;
      await db.query('INSERT INTO wp_user_gp_balance (user_id, balance) VALUES (?, 100)', [userId]);
    } else {
      finalBalance = gp[0].balance;
    }

    // NEW: Get Advisor Balance
    const [adv] = await db.query('SELECT balance_euro FROM tp_advisor_wallets WHERE user_id = ?', [userId]);
    const advisorBalance = adv.length > 0 ? adv[0].balance_euro : 0;

    console.log(`[AUTH] User found: ${user.email}, balance: ${finalBalance}, advisorBalance: ${advisorBalance}`);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: Boolean(user.is_admin),
        email_verified: Boolean(user.email_verified),
        gpBalance: finalBalance,
        advisorBalance: advisorBalance
      }
    };
  } catch (error) {
    console.error(`[AUTH] DB Error in getCurrentUser: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    if (db) db.release();
  }
}

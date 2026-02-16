import express from 'express';
import { getConnection } from './db.js';
import { authMiddleware, adminMiddleware, loginUser, getCurrentUser, verifyToken } from './auth.js';

const router = express.Router();

// ============ TIMEZONE OFFSET - Subtract from all match times ============
// Set to 0 if DB values are already in Italian time (UTC+1)
// We remove 'Z' to prevent the browser from applying its own offset.
const TIMEZONE_DISPLAY_OFFSET_HOURS = 0;

/**
 * Helper: format DB date and apply timezone offset
 * Removes 'Z' to ensure browser treats it as local time
 */
function formatDateToItalyNoTZ(dateInput) {
  if (!dateInput) return null;
  let dateStr = String(dateInput);
  
  // If it's a Date object, convert to ISO first
  if (dateInput instanceof Date) {
    dateStr = dateInput.toISOString();
  }

  // If it's in ISO format with Z
  if (dateStr.includes('T') && dateStr.endsWith('Z')) {
    const date = new Date(dateStr);
    date.setHours(date.getHours() - TIMEZONE_DISPLAY_OFFSET_HOURS);
    return date.toISOString().replace('Z', ''); // Remove 'Z' so browser treats it as local time
  }
  
  // If it's DB format "YYYY-MM-DD HH:MM:SS"
  if (dateStr.includes(' ') && !dateStr.includes('T')) {
    const isoStr = dateStr.replace(' ', 'T') + 'Z';
    const date = new Date(isoStr);
    date.setHours(date.getHours() - TIMEZONE_DISPLAY_OFFSET_HOURS);
    return date.toISOString().replace('Z', ''); // Remove 'Z'
  }
  
  return dateStr;
}

/**
 * Normalize odds from raw market/selection format to frontend keys
 * Maps market/selection to: 1, X, 2, 1X, X2, 12, GG, NG, U, O
 */
function normalizeOdds(rawQuotes) {
  const ODDS_MAP = {
    'Match Winner': {
      'Home': '1',
      'Draw': 'X',
      'Away': '2',
    },
    'Double Chance': {
      'Home/Draw': '1X',
      'Draw/Away': 'X2',
      'Home/Away': '12',
      'Home or Draw': '1X',
      'Draw or Away': 'X2',
      'Home or Away': '12',
    },
    'Goals Over/Under': {
      'Over 2.5': 'O',
      'Under 2.5': 'U',
    },
    'Over/Under': {
      'Over 2.5': 'O',
      'Under 2.5': 'U',
    },
    'Both Teams Score': {
      'Yes': 'GG',
      'No': 'NG',
    },
  };

  const normalized = {
    '1': null, 'X': null, '2': null,
    '1X': null, 'X2': null, '12': null,
    'GG': null, 'NG': null, 'O': null, 'U': null
  };

  if (!rawQuotes || Object.keys(rawQuotes).length === 0) return normalized;

  for (const [market, selections] of Object.entries(ODDS_MAP)) {
    if (!rawQuotes[market]) continue;
    for (const [selection, frontendKey] of Object.entries(selections)) {
      if (rawQuotes[market][selection]) {
        const value = parseFloat(rawQuotes[market][selection]);
        if (!isNaN(value)) normalized[frontendKey] = value;
      }
    }
  }
  return normalized;
}

/**
 * AUTH ENDPOINTS
 */
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser(email, password);
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

router.get('/auth/me', authMiddleware, async (req, res) => {
  const result = await getCurrentUser(req.userId);
  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

/**
 * GET /api/matches
 * Gets all matches for today with their odds
 */
router.get('/matches', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // Query matches for today/future that are Not Started (NS) 
    // and HAVE at least one odd in wp_flfe_odds for bookmaker 8
    const [matches] = await conn.execute(`
      SELECT m.*, 
             COALESCE(l.priority, m.priority, 1000) as current_priority
      FROM wp_football_matches m
      LEFT JOIN wp_football_league_priority l ON m.league_id = l.league_id
      WHERE m.status = 'NS'
        AND DATE(m.fixture_date) >= CURDATE()
        AND EXISTS (
          SELECT 1 FROM wp_flfe_odds 
          WHERE match_id = m.fixture_id 
          AND bookmaker_id = 8
          AND odd > 0
        )
      ORDER BY current_priority ASC, m.fixture_date ASC
    `);

    // Fetch odds for these matches
    const matchIds = matches.map(m => m.fixture_id);
    const oddsMap = {};

    if (matchIds.length > 0) {
      const placeholders = matchIds.map(() => '?').join(',');
      const [odds] = await conn.query(`
        SELECT match_id, market, selection, odd 
        FROM wp_flfe_odds 
        WHERE match_id IN (${placeholders})
        AND bookmaker_id = 8
      `, matchIds);

      odds.forEach(o => {
        const mid = String(o.match_id);
        const market = (o.market || '').trim();
        const selection = (o.selection || '').trim();
        const oddValue = parseFloat(o.odd);
        
        if (!oddsMap[mid]) oddsMap[mid] = {};
        if (!oddsMap[mid][market]) oddsMap[mid][market] = {};
        if (!oddsMap[mid][market][selection]) {
          oddsMap[mid][market][selection] = oddValue;
        }
      });
    }

    // Map back to the expected format with normalized odds
    const data = matches.map(m => {
      const rawOdds = oddsMap[String(m.fixture_id)] || {};
      return {
        ...m,
        fixture_date: formatDateToItalyNoTZ(m.fixture_date),
        priority: m.current_priority,
        normalized_odds: normalizeOdds(rawOdds)
      };
    });

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/saved-bets
 * Get user's saved bets with current match results
 */
router.get('/saved-bets', authMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [bets] = await conn.execute(
      'SELECT * FROM tp_saved_bets WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );

    const betIds = bets.map(b => b.id);
    let selectionsMap = {};

    if (betIds.length > 0) {
      const [selections] = await conn.query(
        `SELECT s.*, 
                m.home_team, m.away_team, m.league_name,
                m.goals_home, m.goals_away, m.status, m.minute
         FROM tp_saved_bet_selections s
         JOIN wp_football_matches m ON s.match_id = m.fixture_id
         WHERE s.saved_bet_id IN (?)`,
        [betIds]
      );

      selections.forEach(s => {
        if (!selectionsMap[s.saved_bet_id]) selectionsMap[s.saved_bet_id] = [];
        
        // Logic to determine if selection is winning
        let isWinning = false;
        const gh = parseInt(s.goals_home);
        const ga = parseInt(s.goals_away);
        
        if (!isNaN(gh) && !isNaN(ga)) {
          if (s.market === 'Match Winner') {
            if (s.selection === 'Home' && gh > ga) isWinning = true;
            else if (s.selection === 'Draw' && gh === ga) isWinning = true;
            else if (s.selection === 'Away' && ga > gh) isWinning = true;
          } else if (s.market === 'Double Chance') {
            if (s.selection === 'Home/Draw' && gh >= ga) isWinning = true;
            else if (s.selection === 'Draw/Away' && ga >= gh) isWinning = true;
            else if (s.selection === 'Home/Away' && gh !== ga) isWinning = true;
            else if (s.selection === 'Home or Draw' && gh >= ga) isWinning = true;
            else if (s.selection === 'Draw or Away' && ga >= gh) isWinning = true;
            else if (s.selection === 'Home or Away' && gh !== ga) isWinning = true;
          } else if (s.market === 'Both Teams Score') {
            if (s.selection === 'Yes' && gh > 0 && ga > 0) isWinning = true;
            else if (s.selection === 'No' && (gh === 0 || ga === 0)) isWinning = true;
          } else if (s.market === 'Goals Over/Under' || s.market === 'Over/Under') {
            if (s.selection === 'Over 2.5' && (gh + ga) > 2.5) isWinning = true;
            else if (s.selection === 'Under 2.5' && (gh + ga) < 2.5) isWinning = true;
          }
        }

        selectionsMap[s.saved_bet_id].push({
          ...s,
          isWinning,
          currentResult: `${s.goals_home || 0} - ${s.goals_away || 0}`,
          matchStatus: s.status,
          matchMinute: s.minute
        });
      });
    }

    const data = await Promise.all(bets.map(async b => {
      const selections = selectionsMap[b.id] || [];
      const allFinished = selections.length > 0 && selections.every(s => s.matchStatus === 'FT');
      const allWinning = selections.length > 0 && selections.every(s => s.isWinning);
      
      const status = allFinished ? (allWinning ? 'WON' : 'LOST') : 'LIVE';

      // --- AUTO SETTLEMENT LOGIC ---
      // If the bet is WON and NOT YET SETTLED, pay the user and mark as settled
      if (status === 'WON' && b.is_settled === 0) {
        try {
          // Pay the user
          await conn.execute(
            'UPDATE wp_user_gp_balance SET balance = balance + ? WHERE user_id = ?',
            [b.potential_win, req.userId]
          );
          // Mark as settled
          await conn.execute(
            'UPDATE tp_saved_bets SET is_settled = 1 WHERE id = ?',
            [b.id]
          );
          // Update local object for response
          b.is_settled = 1;
        } catch (payError) {
          console.error(`Error settling bet ${b.id}:`, payError);
        }
      }

      return {
        ...b,
        selections,
        status
      };
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /api/saved-bets
 * Save a new bet slip and deduct balance
 */
router.post('/saved-bets', authMiddleware, async (req, res) => {
  const { 
    total_odds, totalOdds, 
    stake, 
    potential_win, potentialWin, 
    selections 
  } = req.body;

  // Normalize inputs (handle both snake_case and camelCase from frontend)
  const finalTotalOdds = total_odds || totalOdds;
  const finalPotentialWin = potential_win || potentialWin;
  const finalStake = parseFloat(stake) || 0;

  if (finalStake <= 0) {
    return res.status(400).json({ success: false, error: 'Puntata non valida' });
  }

  let conn;
  try {
    conn = await getConnection();
    await conn.beginTransaction();

    // 1. Check user balance
    const [balanceRows] = await conn.execute(
      'SELECT balance FROM wp_user_gp_balance WHERE user_id = ? FOR UPDATE',
      [req.userId]
    );

    let currentBalance = balanceRows.length > 0 ? parseFloat(balanceRows[0].balance) : 100;
    
    if (currentBalance < finalStake) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'GP Points insufficienti' });
    }

    // 2. Insert the bet
    const [result] = await conn.execute(
      'INSERT INTO tp_saved_bets (user_id, total_odds, stake, potential_win) VALUES (?, ?, ?, ?)',  
      [req.userId, finalTotalOdds, finalStake, finalPotentialWin]
    );

    const betId = result.insertId;

    // 3. Insert selections
    for (const sel of selections) {
      // Normalize matchId/match_id
      const mid = sel.match_id || sel.matchId;
      await conn.execute(
        'INSERT INTO tp_saved_bet_selections (saved_bet_id, match_id, market, selection, odd) VALUES (?, ?, ?, ?, ?)',
        [betId, mid, sel.market, sel.selection, sel.odd]
      );
    }

    // 4. Deduct balance
    await conn.execute(
      'UPDATE wp_user_gp_balance SET balance = balance - ? WHERE user_id = ?',
      [finalStake, req.userId]
    );

    await conn.commit();
    res.json({ success: true, id: betId, newBalance: currentBalance - finalStake });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Error saving bet:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/matches/date/:date
 */
router.get('/matches/date/:date', async (req, res) => {
  const { date } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const [matches] = await conn.execute(`
      SELECT m.*, 
             COALESCE(l.priority, m.priority, 1000) as current_priority
      FROM wp_football_matches m
      LEFT JOIN wp_football_league_priority l ON m.league_id = l.league_id
      WHERE DATE(m.fixture_date) = ?
        AND EXISTS (
          SELECT 1 FROM wp_flfe_odds 
          WHERE match_id = m.fixture_id 
          AND bookmaker_id = 8
          AND odd > 0
        )
      ORDER BY current_priority ASC, m.fixture_date ASC
    `, [date]);

    const matchIds = matches.map(m => m.fixture_id);
    const oddsMap = {};

    if (matchIds.length > 0) {
      const placeholders = matchIds.map(() => '?').join(',');
      const [odds] = await conn.query(`
        SELECT match_id, market, selection, odd 
        FROM wp_flfe_odds 
        WHERE match_id IN (${placeholders})
        AND bookmaker_id = 8
      `, matchIds);

      odds.forEach(o => {
        const mid = String(o.match_id);
        const market = (o.market || '').trim();
        const selection = (o.selection || '').trim();
        const oddValue = parseFloat(o.odd);
        
        if (!oddsMap[mid]) oddsMap[mid] = {};
        if (!oddsMap[mid][market]) oddsMap[mid][market] = {};
        if (!oddsMap[mid][market][selection]) {
          oddsMap[mid][market][selection] = oddValue;
        }
      });
    }

    const data = matches.map(m => {
      const rawOdds = oddsMap[String(m.fixture_id)] || {};
      return {
        ...m,
        fixture_date: formatDateToItalyNoTZ(m.fixture_date),
        priority: m.current_priority,
        normalized_odds: normalizeOdds(rawOdds)
      };
    });

    res.json({ success: true, date, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/data/teams - Get list of teams
 */
router.get('/data/teams', async (req, res) => {
  let db;
  try {
    db = await getConnection();

    // Try to get teams from adb_squadre first (if exists), or fallback to matches
    let teams = [];
    try {
      const [rows] = await db.query('SELECT id_team as id, team as name, \'\' as logo FROM adb_squadre ORDER BY team ASC');
      if (rows.length > 0) teams = rows;
    } catch (e) {
      console.warn('adb_squadre table not found or missing columns, falling back to distinct teams from matches');
      // Fallback
      const [rows] = await db.query(`
        SELECT DISTINCT home_team_id as id, home_team as name, home_logo as logo 
        FROM wp_football_matches 
        WHERE fixture_date >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        ORDER BY home_team ASC
    `);
      teams = rows;
    }

    res.json({ success: true, teams });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (db) {
       try { db.release(); } catch (e) {}
    }
  }
});

/**
 * GET /api/tipsters
 * Get all users who are active (GP balance or bets)
 */
router.get('/tipsters', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
          u.id, 
          u.display_name,
          u.email,
          COALESCE(b.balance, 0) as balance,
          (SELECT COUNT(*) FROM tp_saved_bets WHERE user_id = u.id) as total_bets
      FROM wp_users u
      LEFT JOIN wp_user_gp_balance b ON u.id = b.user_id
      WHERE (SELECT COUNT(*) FROM tp_saved_bets WHERE user_id = u.id) > 0
         OR COALESCE(b.balance, 0) >= 0
      ORDER BY balance DESC, total_bets DESC
      LIMIT 100
    `);

    const data = rows.map(r => {
      let name = 'Tipster';
      if (r.display_name && r.display_name.trim() !== '') {
        name = r.display_name;
      } else if (r.email) {
        name = r.email.split('@')[0];
      }
      
      return {
        id: r.id,
        displayName: name,
        balance: r.balance,
        total_bets: r.total_bets,
        isAdvisor: r.balance >= 10000
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/tipsters/:id/public-bets
 * Get all public bets for a specific tipster
 */
router.get('/tipsters/:id/public-bets', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const tipsterId = req.params.id;

    // Check if user is logged in to see if they unlocked bets
    let viewerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verification = verifyToken(token);
      if (verification.valid) viewerId = verification.userId;
    }

    // Get tipster info first
    const [tipsters] = await conn.execute(`
      SELECT u.id, u.email, COALESCE(b.balance, 0) as balance
      FROM wp_users u
      LEFT JOIN wp_user_gp_balance b ON u.id = b.user_id
      WHERE u.id = ?
    `, [tipsterId]);

    if (tipsters.length === 0) {
      return res.status(404).json({ success: false, error: 'Tipster non trovato' });
    }

    const tipster = tipsters[0];
    const isAdvisor = tipster.balance >= 10000;

    // Get bets with lock status
      const [betsRows] = await conn.execute(`
        SELECT b.*, 
          (SELECT COUNT(*) FROM tp_saved_bet_selections WHERE saved_bet_id = b.id) as match_count,
          EXISTS(SELECT 1 FROM tp_bet_locks WHERE user_id = ? AND bet_id = b.id) as is_unlocked
        FROM tp_saved_bets b
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `, [viewerId || 0, tipsterId]);

    const betsData = betsRows.map(b => {
      // Calculate price based on balance
      let euroPrice = 0;
      if (isAdvisor) {
        if (tipster.balance >= 10000 && tipster.balance < 15000) euroPrice = 2.90;
        else if (tipster.balance >= 15000 && tipster.balance < 18000) euroPrice = 3.50;
        else if (tipster.balance >= 18000) euroPrice = 4.00;
      }

      return {
        id: b.id,
        total_odds: b.total_odds,
        match_count: b.match_count,
        price: euroPrice.toFixed(2),
        created_at: b.created_at,
        potential_win: b.potential_win,
        stake: b.stake,
        is_unlocked: b.is_unlocked === 1,
        is_obscured: !b.is_unlocked
      };
    });

    res.json({ 
      success: true, 
      tipster: {
        id: tipster.id,
        displayName: tipster.email.split('@')[0],
        isAdvisor,
        balance: tipster.balance
      },
      data: betsData 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/advisor/wallet
 * Get wallet balance and transactions
 */
router.get('/advisor/wallet', authMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // Get wallet balance
    const [walletRows] = await conn.execute(
      'SELECT balance_euro FROM tp_advisor_wallets WHERE user_id = ?',
      [req.userId]
    );
    
    const balance = walletRows.length > 0 ? parseFloat(walletRows[0].balance_euro) : 0;
    
    // Get transactions
    const [transactions] = await conn.execute(
      'SELECT id, amount, type, status, payment_email, created_at FROM tp_transactions WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    
    res.json({ success: true, balance, transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /api/advisor/withdraw
 * Request a withdrawal
 */
router.post('/advisor/withdraw', authMiddleware, async (req, res) => {
  const { amount, email } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.beginTransaction();

    // 1. Check balance
    const [walletRows] = await conn.execute(
      'SELECT balance_euro FROM tp_advisor_wallets WHERE user_id = ? FOR UPDATE',
      [req.userId]
    );

    const currentBalance = walletRows.length > 0 ? parseFloat(walletRows[0].balance_euro) : 0;

    if (currentBalance < amount) {
      return res.status(400).json({ success: false, error: 'Saldo insufficiente' });
    }

    // 2. Deduct balance
    await conn.execute(
      'UPDATE tp_advisor_wallets SET balance_euro = balance_euro - ? WHERE user_id = ?',
      [amount, req.userId]
    );

    // 3. Record transaction
    await conn.execute(
      'INSERT INTO tp_transactions (user_id, amount, type, status, payment_email) VALUES (?, ?, "withdrawal", "pending", ?)',
      [req.userId, amount, email]
    );

    await conn.commit();
    res.json({ success: true, message: 'Richiesta di prelievo inviata con successo' });
  } catch (error) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/config/paypal-public - Get public PayPal configuration
 */
router.get('/config/paypal-public', async (req, res) => {
  let db;
  try {
    db = await getConnection();
    const [rows] = await db.query(
      'SELECT config_key, config_value FROM wp_admin_config WHERE config_key IN ("paypal_client_id", "paypal_mode")'
    );

    const config = {};
    if (rows && Array.isArray(rows)) {
      rows.forEach(row => {
        config[row.config_key] = row.config_value;
      });
    }

    res.json({
      success: true,
      paypal_client_id: (config.paypal_client_id || process.env.PAYPAL_CLIENT_ID || '').trim(),
      paypal_mode: (config.paypal_mode || process.env.PAYPAL_MODE || 'sandbox').trim()
    });
  } catch (error) {
    console.error('[PUBLIC] Get paypal config error:', error);
    res.status(500).json({ success: false, error: 'Failed to load paypal config' });
  } finally {
    if (db) {
      try { db.release(); } catch (e) { }
    }
  }
});

// PayPal Helpers
async function getPayPalAccessToken() {
  let db;
  try {
    db = await getConnection();
    const [rows] = await db.query('SELECT config_key, config_value FROM wp_admin_config WHERE config_key LIKE "paypal_%"');

    const config = {};
    if (rows && Array.isArray(rows)) {
      rows.forEach(row => {
        config[row.config_key] = row.config_value;
      });
    }

    const clientId = (config.paypal_client_id || process.env.PAYPAL_CLIENT_ID || '').trim();
    const clientSecret = (config.paypal_client_secret || process.env.PAYPAL_CLIENT_SECRET || '').trim();
    const mode = (config.paypal_mode || process.env.PAYPAL_MODE || 'sandbox').trim();

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured in Admin Panel');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    // Using global fetch (Node 18+)
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PayPal Auth Error: ${errorData.error_description || response.statusText}`);
    }

    const data = await response.json();
    return { token: data.access_token, baseUrl };
  } finally {
    if (db) {
      try { db.release(); } catch (e) { }
    }
  }
}

/**
 * POST /api/paypal/create-order
 */
router.post('/paypal/create-order', authMiddleware, async (req, res) => {
  try {
    const { betId, price } = req.body;

    if (!betId || !price) {
      return res.status(400).json({ success: false, error: 'Missing betId or price' });
    }

    console.log(`[PAYPAL] Creating order for bet #${betId} at ${price} EUR`);
    const { token, baseUrl } = await getPayPalAccessToken();

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: betId.toString(),
          amount: {
            currency_code: 'EUR',
            value: parseFloat(price).toFixed(2),
          },
          description: `Acquisto Schedina Tipsters Hub - #${betId}`,
        }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PayPal Create Order Error: ${JSON.stringify(errorData)}`);
    }

    const order = await response.json();
    res.json(order);
  } catch (error) {
    console.error('[PAYPAL] Create Order Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/paypal/capture-order
 */
router.post('/paypal/capture-order', authMiddleware, async (req, res) => {
  let conn;
  try {
    const { orderId } = req.body;
    const buyerId = req.userId;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Missing orderId' });
    }

    console.log(`[PAYPAL] Capturing order ${orderId}`);
    const { token, baseUrl } = await getPayPalAccessToken();

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PayPal Capture Error: ${JSON.stringify(errorData)}`);
    }

    const capture = await response.json();
    console.log('[PAYPAL] Capture response:', JSON.stringify(capture, null, 2));

    if (capture.status === 'COMPLETED') {
        // Try multiple locations for custom_id
        const betId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id || 
                      capture.purchase_units?.[0]?.custom_id;
        
        const paidAmount = parseFloat(capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || "0");
        const payerEmail = capture.payer?.email_address || 'N/D';

        if (!betId) {
            console.error('[PAYPAL] Missing custom_id (betId) in capture response');
            throw new Error('Impossibile identificare la bet pagata');
        }

        conn = await getConnection();
        await conn.beginTransaction();

        console.log(`[PAYPAL] Processing payout for bet #${betId}, amount: ${paidAmount}`);
        const [betRows] = await conn.execute(`
          SELECT b.* FROM tp_saved_bets b WHERE b.id = ?
        `, [betId]);

        if (betRows.length === 0) {
            throw new Error('Bet non trovata dopo il pagamento');
        }

        const bet = betRows[0];
        const advisorId = bet.user_id;
        
        // Calculate the 50% revenue for the advisor
        const revenueAmount = paidAmount * 0.50;

        // 2. Record lock
        await conn.execute(
          'INSERT INTO tp_bet_locks (user_id, bet_id, purchased_price) VALUES (?, ?, ?)',
          [buyerId, betId, paidAmount]
        );

        // 3. Increment Advisor wallet
        await conn.execute(`
          INSERT INTO tp_advisor_wallets (user_id, balance_euro) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE balance_euro = balance_euro + ?
        `, [advisorId, revenueAmount, revenueAmount]);

        // 4. Record transaction for advisor
        await conn.execute(
          'INSERT INTO tp_transactions (user_id, amount, type, status, payment_email) VALUES (?, ?, "sale", "completed", ?)',
          [advisorId, revenueAmount, payerEmail]
        );

        await conn.commit();
        res.json({ success: true, capture });
    } else {
        res.status(400).json({ success: false, error: 'Pagemento non completato', status: capture.status });
    }
  } catch (error) {
    console.error('[PAYPAL] Capture Order Error:', error);
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /api/bets/:id/unlock
 * Unlock a bet (Simulation of purchase)
 */
router.post('/bets/:id/unlock', authMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const betId = req.params.id;
    const buyerId = req.userId;

    // 1. Get bet info and advisor
    const [betRows] = await conn.execute(`
      SELECT b.*, COALESCE(ba.balance, 0) as advisor_balance
      FROM tp_saved_bets b
      LEFT JOIN wp_user_gp_balance ba ON b.user_id = ba.user_id
      WHERE b.id = ?
    `, [betId]);

    if (betRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bet non trovata' });
    }

    const bet = betRows[0];
    const advisorId = bet.user_id;

    // 2. Check if already unlocked
    const [lockRows] = await conn.execute(
      'SELECT 1 FROM tp_bet_locks WHERE user_id = ? AND bet_id = ?',
      [buyerId, betId]
    );

    if (lockRows.length > 0) {
      return res.json({ success: true, message: 'Già sbloccata' });
    }

    // 3. Calculate price
    let euroPrice = 0;
    const balance = bet.advisor_balance;
    if (balance >= 10000 && balance < 15000) euroPrice = 2.90;
    else if (balance >= 15000 && balance < 18000) euroPrice = 3.50;
    else if (balance >= 18000) euroPrice = 4.00;

    if (euroPrice === 0) {
        return res.status(400).json({ success: false, error: 'Questa bet non è in vendita' });
    }

    await conn.beginTransaction();

    // 4. Record lock
    await conn.execute(
      'INSERT INTO tp_bet_locks (user_id, bet_id, purchased_price) VALUES (?, ?, ?)',
      [buyerId, betId, euroPrice]
    );

    // 5. Increment Advisor wallet (50% revenue share)
    const revenueAmount = euroPrice * 0.50;
    
    // First ensure wallet exists
    await conn.execute(`
      INSERT INTO tp_advisor_wallets (user_id, balance_euro) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE balance_euro = balance_euro + ?
    `, [advisorId, revenueAmount, revenueAmount]);

    // 6. Record transaction for advisor
    await conn.execute(
      'INSERT INTO tp_transactions (user_id, amount, type, status) VALUES (?, ?, "sale", "completed")',
      [advisorId, revenueAmount]
    );

    await conn.commit();
    res.json({ success: true, message: 'Bet sbloccata con successo' });
  } catch (error) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/bets/:id/public-matches
 * Get matches for a public bet (obfuscated)
 */
router.get('/bets/:id/public-matches', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const betId = req.params.id;

    const [items] = await conn.execute(`
      SELECT 
        s.market, 
        s.selection, 
        s.odd,
        m.home_team,
        m.away_team,
        m.fixture_date,
          m.status,
          m.goals_home,
          m.goals_away,
          m.minute
        FROM tp_saved_bet_selections s
        JOIN wp_football_matches m ON s.match_id = m.fixture_id
        WHERE s.saved_bet_id = ?
      `, [betId]);

      const now = new Date();
      const data = items.map(item => {
        const matchDateStr = formatDateToItalyNoTZ(item.fixture_date);
        const matchDate = new Date(matchDateStr);
        const isExpired = matchDate < now || item.status !== 'NS';

        return {
          market: item.market,
          selection: item.selection,
          odd: item.odd,
          home_team: item.home_team,
          away_team: item.away_team,
          match_date: matchDateStr,
          status: item.status,
          goals_home: item.goals_home,
          goals_away: item.goals_away,
          minute: item.minute,
          isExpired
        };
      });

      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (conn) conn.release();
    }
});

/**
 * GET /api/share/tipster/:id
 * Serves a meta-tag enriched page for social sharing bots
 */
router.get('/share/tipster/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const tipsterId = req.params.id;

    const [rows] = await conn.execute(`
      SELECT u.id, u.email, u.display_name, COALESCE(b.balance, 0) as balance
      FROM wp_users u
      LEFT JOIN wp_user_gp_balance b ON u.id = b.user_id
      WHERE u.id = ?
    `, [tipsterId]);

    const tipster = rows[0];
    const name = tipster?.display_name && tipster.display_name.trim() !== '' 
      ? tipster.display_name 
      : (tipster?.email ? tipster.email.split('@')[0] : 'Tipster');
    
    const balance = tipster ? Math.floor(tipster.balance) : 0;
    const title = balance >= 10000 
      ? `🏆 Segui ${name}, Advisor Certificato` 
      : `⚽ Pronostici di ${name} - Tipsters Race`;
    const description = `Saldo attuale: GP ${balance.toLocaleString()} | Unisciti alla Tipsters Race e segui le migliori schedine!`;
    const redirectUrl = tipster 
      ? `https://getprono.online/tipster/${tipsterId}`
      : `https://getprono.online/tipsters`;
    
    // Immagine di share dedicata (stabile in public)
    const imageUrl = "https://getprono.online/stadium-share.jpg";

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:url" content="https://getprono.online/api/share/tipster/${tipsterId}" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Tipsters Race" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:image:secure_url" content="${imageUrl}" />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${imageUrl}" />
          <meta http-equiv="refresh" content="2; url=${redirectUrl}" />
        </head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
          <div style="text-align: center;">
            <div style="margin-bottom: 20px;">
              <img src="https://getprono.online/favicon.png" width="80" height="80" style="border-radius: 20px;" />
            </div>
            <h1 style="color: #fbbf24; font-size: 24px; margin-bottom: 10px;">Reindirizzamento a Tipsters Race...</h1>
            <p style="color: #94a3b8;">Ti stiamo portando al profilo di <strong>${name}</strong></p>
            <p style="font-size: 14px; margin-top: 20px;">Se non vieni reindirizzato, <a href="${redirectUrl}" style="color: #fbbf24; text-decoration: none; font-weight: bold;">clicca qui</a>.</p>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = "${redirectUrl}";
            }, 1000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[SHARE] Error:', error);
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:title" content="Tipsters Race" />
          <meta property="og:image" content="https://getprono.online/stadium-share.jpg" />
          <meta http-equiv="refresh" content="0; url=https://getprono.online" />
        </head>
        <body>Redirecting...</body>
      </html>
    `);
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/admin/financial-stats
 * Returns financial overview for admin panel
 */
router.get('/admin/financial-stats', adminMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    // 1. Global Totals
    const [totals] = await conn.execute(`
      SELECT 
        (SELECT COALESCE(SUM(purchased_price), 0) FROM tp_bet_locks) as total_gross,
        (SELECT COALESCE(SUM(balance_euro), 0) FROM tp_advisor_wallets) as total_advisor_balance,
        (SELECT COALESCE(SUM(amount), 0) FROM tp_transactions WHERE type = 'sale' AND status = 'completed') as total_advisor_earned,
        (SELECT COALESCE(SUM(amount), 0) FROM tp_transactions WHERE type = 'withdrawal' AND status = 'completed') as total_withdrawn
    `);

    // 2. Advisors stats (Grouping locks by the advisor who created the bet)
    const [advisorStats] = await conn.execute(`
      SELECT 
        u.id as advisor_id,
        u.email as advisor_email,
        u.email as display_name,
        COUNT(l.id) as total_sales_count,
        COALESCE(SUM(l.purchased_price), 0) as gross_revenue,
        COALESCE(SUM(l.purchased_price) * 0.5, 0) as expected_advisor_share,
        COALESCE(w.balance_euro, 0) as current_wallet_balance
      FROM wp_users u
      JOIN tp_saved_bets b ON u.id = b.user_id
      JOIN tp_bet_locks l ON b.id = l.bet_id
      LEFT JOIN tp_advisor_wallets w ON u.id = w.user_id
      GROUP BY u.id
    `);

    // 3. Recent Transactions with details
    // We need to show: buyer email, amount (50%), advisor, etc.
    const [transactions] = await conn.execute(`
      SELECT 
        t.id,
        t.amount as advisor_amount,
        t.type,
        t.status,
        t.payment_email as buyer_email,
        t.created_at,
        u.email as advisor_email
      FROM tp_transactions t
      LEFT JOIN wp_users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      summary: totals[0],
      advisors: advisorStats,
      transactions: transactions
    });
  } catch (error) {
    console.error('[ADMIN STATS] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;

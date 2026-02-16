import express from 'express';
import { getConnection } from './db.js';
import { authMiddleware, loginUser, getCurrentUser, verifyToken } from './auth.js';

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
          u.email as display_name,
          COALESCE(b.balance, 0) as balance,
          (SELECT COUNT(*) FROM tp_saved_bets WHERE user_id = u.id) as total_bets
      FROM wp_users u
      LEFT JOIN wp_user_gp_balance b ON u.id = b.user_id
      WHERE (SELECT COUNT(*) FROM tp_saved_bets WHERE user_id = u.id) > 0
         OR COALESCE(b.balance, 0) >= 0
      ORDER BY balance DESC, total_bets DESC
    `);

    const data = rows.map(r => ({
      ...r,
      isAdvisor: r.balance >= 10000,
      displayName: r.display_name ? r.display_name.split('@')[0] : 'Tipster Anonimo'
    }));

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
    console.log(`[DEBUG] Fetching public bets for tipster ${tipsterId}, viewer ${viewerId}`);
    const [betsRows] = await conn.execute(`
      SELECT b.*, 
        (SELECT COUNT(*) FROM tp_saved_bet_selections WHERE saved_bet_id = b.id) as match_count,
        EXISTS(SELECT 1 FROM tp_bet_locks WHERE user_id = ? AND bet_id = b.id) as is_unlocked
      FROM tp_saved_bets b
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [viewerId || 0, tipsterId]);

    console.log(`[DEBUG] Found ${betsRows.length} bets for tipster ${tipsterId}`);

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

    // 5. Increment Advisor wallet
    // First ensure wallet exists
    await conn.execute(`
      INSERT INTO tp_advisor_wallets (user_id, balance_euro) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE balance_euro = balance_euro + ?
    `, [advisorId, euroPrice, euroPrice]);

    // 6. Record transaction for advisor
    await conn.execute(
      'INSERT INTO tp_transactions (user_id, amount, type, status) VALUES (?, ?, "sale", "completed")',
      [advisorId, euroPrice]
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
        m.status
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
      SELECT u.id, u.email as display_name, COALESCE(b.balance, 0) as balance
      FROM wp_users u
      LEFT JOIN wp_user_gp_balance b ON u.id = b.user_id
      WHERE u.id = ?
    `, [tipsterId]);

    if (rows.length === 0) {
      return res.redirect('https://getprono.online/tipsters');
    }

    const tipster = rows[0];
    const name = tipster.display_name ? tipster.display_name.split('@')[0] : 'Tipster';
    const balance = Math.floor(tipster.balance);
    const title = balance >= 10000 
      ? `🏆 Segui ${name}, Advisor Certificato` 
      : `⚽ Pronostici di ${name} - Tipsters Race`;
    const description = `Saldo attuale: GP ${balance.toLocaleString()} | Unisciti alla Tipsters Race e segui le migliori schedine!`;
    const redirectUrl = `https://getprono.online/tipsters/${tipsterId}`;
    
    // Proviamo con il LOGO che è più leggero e viene letto meglio da Facebook inizialmente
    const imageUrl = "https://getprono.online/images/logo-CvVUroNE.png";

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:url" content="https://getprono.online/api/share/tipster/${tipsterId}" />
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content="Tipsters Race" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:image:secure_url" content="${imageUrl}" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:image:width" content="600" />
          <meta property="og:image:height" content="600" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${imageUrl}" />
          <meta http-equiv="refresh" content="2; url=${redirectUrl}" />
        </head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
          <div style="text-align: center;">
            <h1 style="color: #3b82f6;">Redirecting to Tipsters Race...</h1>
            <p>Se non vieni reindirizzato entro pochi secondi, <a href="${redirectUrl}" style="color: #60a5fa;">clicca qui</a>.</p>
          </div>
          <script>window.location.href = "${redirectUrl}";</script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[SHARE] Error:', error);
    res.redirect('https://getprono.online');
  } finally {
    if (conn) conn.release();
  }
});

export default router;

import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json({ limit: '50kb' }));

// Ensure data folder exists (use /tmp on Vercel Serverless where project root is read-only)
const dataDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uangkas-data')
  : path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'uangkas.db');
const bundledDbPath = path.join(__dirname, 'data', 'uangkas.db');
if (process.env.VERCEL && !fs.existsSync(dbPath) && fs.existsSync(bundledDbPath)) {
  try {
    fs.copyFileSync(bundledDbPath, dbPath);
  } catch (e) {}
}
const db = new DatabaseSync(dbPath);

// Enable WAL mode for better performance (skip WAL on serverless /tmp if unsupported)
try {
  db.exec('PRAGMA journal_mode = WAL;');
} catch (e) {}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contributions (
    id TEXT PRIMARY KEY,
    member_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    week INTEGER NOT NULL,
    amount INTEGER NOT NULL DEFAULT 5000,
    is_paid INTEGER NOT NULL DEFAULT 0,
    paid_at TEXT,
    notes TEXT,
    FOREIGN KEY(member_id) REFERENCES members(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    week INTEGER NOT NULL,
    date TEXT NOT NULL,
    day_name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount INTEGER NOT NULL,
    pic TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS security_alerts (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add verification columns to contributions if they don't exist
try {
  db.exec("ALTER TABLE contributions ADD COLUMN pending_verification INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE contributions ADD COLUMN status TEXT DEFAULT 'unpaid';");
} catch (e) {}
try {
  db.exec("ALTER TABLE contributions ADD COLUMN payer_note TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE contributions ADD COLUMN claimed_at TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE contributions ADD COLUMN verified_at TEXT;");
} catch (e) {}

// Add verification columns to expenses if they don't exist
try {
  db.exec("ALTER TABLE expenses ADD COLUMN pending_verification INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE expenses ADD COLUMN is_verified INTEGER DEFAULT 1;");
} catch (e) {}
try {
  db.exec("ALTER TABLE expenses ADD COLUMN verified_at TEXT;");
} catch (e) {}

// Seed default settings
const getSetting = (key, defaultVal) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : defaultVal;
};

const setSetting = (key, value) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
};

if (!getSetting('weekly_fee', null)) {
  setSetting('weekly_fee', '5000');
}
if (!getSetting('martabak_target', null)) {
  setSetting('martabak_target', '50000');
}
const currentSavedPin = getSetting('admin_pin', null);
if (!currentSavedPin || currentSavedPin === '1234' || currentSavedPin === '151515') {
  setSetting('admin_pin', '101010');
}
if (!getSetting('admin_name', null) || getSetting('admin_name', null) === 'Javier') {
  setSetting('admin_name', 'Vier');
}

// Seed default members: Bayu, Apip, Ian, Ray, Dola, Vier (Admin)
const defaultMembers = ['Bayu', 'Apip', 'Ian', 'Ray', 'Dola', 'Vier'];
const countMembers = db.prepare('SELECT COUNT(*) as count FROM members').get().count;

// Migrate old names to new names:
// Mazyan -> Ian, Dholla -> Dola, Javier -> Vier, Rayyan -> Ray
try {
  db.exec("UPDATE members SET name = 'Ian' WHERE name = 'Mazyan';");
  db.exec("UPDATE members SET name = 'Dola' WHERE name = 'Dholla';");
  db.exec("UPDATE members SET name = 'Vier' WHERE name = 'Javier';");
  db.exec("UPDATE members SET name = 'Ray' WHERE name = 'Rayyan';");
  db.exec("UPDATE expenses SET pic = 'Ian' WHERE pic = 'Mazyan';");
  db.exec("UPDATE expenses SET pic = 'Dola' WHERE pic = 'Dholla';");
  db.exec("UPDATE expenses SET pic = 'Vier' WHERE pic = 'Javier';");
  db.exec("UPDATE expenses SET pic = 'Ray' WHERE pic = 'Rayyan';");
  db.exec("UPDATE expenses SET category = 'Gas Masak' WHERE category = 'Gas';");
} catch (e) {}

if (countMembers === 0) {
  const insertMember = db.prepare('INSERT INTO members (name, is_active) VALUES (?, 1)');
  for (const name of defaultMembers) {
    insertMember.run(name);
  }
  console.log('✅ Inisialisasi 6 anggota kontrakan awal berhasil (Admin: Vier)!');

  // Seed sample initial expenses (e.g. Isi Ulang Galon on Monday & Wednesday)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // Insert a sample water refill (Rp 5.000)
  const insertExp = db.prepare(`
    INSERT INTO expenses (id, year, month, week, date, day_name, category, amount, pic, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Format current ISO date
  const isoDate = today.toISOString().split('T')[0];
  insertExp.run(
    `exp_${Date.now()}_1`,
    year,
    month,
    1,
    isoDate,
    'Senin',
    'Isi Ulang Air',
    5000,
    'Apip',
    'Isi ulang air galon rutin hari Senin'
  );
}

// Ensure any existing entries are updated to Rp 5.000 and 'Isi Ulang Air'
try {
  db.exec(`
    UPDATE expenses 
    SET amount = 5000, category = 'Isi Ulang Air' 
    WHERE category LIKE '%Galon%' OR amount = 15000;
  `);
} catch (e) {
  // Ignore
}

// Realtime SSE (Server-Sent Events) clients
let sseClients = [];

const broadcastChange = (type, payload = {}) => {
  const data = JSON.stringify({ type, payload, timestamp: Date.now() });
  sseClients.forEach((client) => {
    client.res.write(`data: ${data}\n\n`);
  });
};

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (process.env.VERCEL) {
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);
    return res.end();
  }

  const clientId = Date.now() + Math.random();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Helper to get local network IP
const getLocalNetworkIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// API: System Info & Network details
app.get('/api/info', (req, res) => {
  const ip = getLocalNetworkIp();
  res.json({
    appName: 'Uang Kas Kontrakan',
    localIp: ip,
    port: PORT,
    laptopUrl: `http://localhost:${PORT}`,
    mobileUrl: `http://${ip}:${PORT}`,
    connectedClients: sseClients.length,
    defaultMembers,
    weeklyFee: Number(getSetting('weekly_fee', 5000)),
    martabakTarget: Number(getSetting('martabak_target', 50000)),
    adminName: getSetting('admin_name', 'Vier'),
  });
});

// Security: Per-IP Rate Limiting for Admin PIN brute-force protection
const loginRateLimit = new Map();

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  const rawIp = req.socket?.remoteAddress || '127.0.0.1';
  return rawIp.replace(/^::ffff:/, '');
};

const getDeviceName = (req) => {
  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iPhone / iOS';
  if (ua.includes('android')) return 'HP Android';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Laptop Mac';
  if (ua.includes('windows')) return 'Laptop Windows';
  return 'Perangkat Lain';
};

const recordSecurityAlert = (req, actionText) => {
  try {
    const id = `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const ip = getClientIp(req);
    const device = getDeviceName(req);
    const createdAt = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    db.prepare(`
      INSERT INTO security_alerts (id, action, device_info, ip_address, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(id, String(actionText).slice(0, 120), device, ip, createdAt);

    // Keep maximum 50 alerts
    db.exec(`
      DELETE FROM security_alerts
      WHERE id NOT IN (SELECT id FROM security_alerts ORDER BY rowid DESC LIMIT 50)
    `);

    const alertObj = {
      id,
      action: String(actionText).slice(0, 120),
      device_info: device,
      ip_address: ip,
      is_read: 0,
      created_at: createdAt,
    };

    broadcastChange('security_alert', { alert: alertObj });
  } catch (err) {
    console.error('Failed to record security alert:', err);
  }
};

const getTokenSecret = () => {
  const currentPin = String(process.env.ADMIN_PIN || getSetting('admin_pin', '101010')).trim();
  return crypto.createHash('sha256').update(`uangkas-cikarang-secret-${currentPin}`).digest('hex');
};

const createStatelessAdminToken = (expiresAt) => {
  const payload = `admin:${expiresAt}`;
  const sig = crypto.createHmac('sha256', getTokenSecret()).update(payload).digest('hex');
  return `${expiresAt}.${sig}`;
};

const isStatelessTokenValid = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [expiresStr, sig] = token.split('.');
  const expiresAt = Number(expiresStr);
  if (!expiresAt || Date.now() > expiresAt) return false;
  const expectedSig = crypto.createHmac('sha256', getTokenSecret()).update(`admin:${expiresAt}`).digest('hex');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
};

// Helper to check if a request carries a valid Admin token
const isAdminRequest = (req) => {
  const token = req.headers['x-admin-token'];
  if (!token) return false;
  if (isStatelessTokenValid(token)) return true;
  const activeToken = getSetting('active_admin_token', null);
  const tokenExpires = Number(getSetting('admin_token_expires', 0));
  const now = Date.now();
  return Boolean(activeToken && token === activeToken && (tokenExpires === 0 || now < tokenExpires));
};

// API: Admin Authentication (Vier) with Per-IP Brute-Force & Timing Attack Protection
app.post('/api/admin/verify', (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const rateData = loginRateLimit.get(ip) || { attempts: 0, lockUntil: 0 };

  if (now < rateData.lockUntil) {
    const waitSec = Math.ceil((rateData.lockUntil - now) / 1000);
    return res.status(429).json({ 
      error: `PIN dikunci sementara karena salah 5x. Coba lagi dalam ${waitSec} detik.` 
    });
  }

  const rawPin = req.body?.pin;
  const pin = String(rawPin !== undefined && rawPin !== null ? rawPin : '').trim();
  if (!pin) {
    return res.status(400).json({ error: 'PIN tidak boleh kosong' });
  }

  const currentPin = String(process.env.ADMIN_PIN || getSetting('admin_pin', '101010')).trim();
  
  // Timing-safe comparison to prevent side-channel timing attacks
  const pinBuffer = Buffer.from(pin, 'utf8');
  const currentPinBuffer = Buffer.from(currentPin, 'utf8');
  const isMatch = pinBuffer.length === currentPinBuffer.length && crypto.timingSafeEqual(pinBuffer, currentPinBuffer);

  if (isMatch) {
    loginRateLimit.delete(ip);
    const expiresAt = now + 14 * 24 * 60 * 60 * 1000; // Valid for 14 days
    const token = createStatelessAdminToken(expiresAt);
    
    setSetting('active_admin_token', token);
    setSetting('admin_token_expires', String(expiresAt));

    return res.json({ 
      success: true, 
      adminName: getSetting('admin_name', 'Vier'),
      token 
    });
  }

  rateData.attempts += 1;
  recordSecurityAlert(req, `Gagal masuk Admin (PIN salah ke-${rateData.attempts})`);

  if (rateData.attempts >= 5) {
    rateData.lockUntil = now + 30 * 1000; // Lock for 30 seconds
    rateData.attempts = 0;
    loginRateLimit.set(ip, rateData);
    return res.status(429).json({ 
      error: 'PIN salah 5x berturut-turut. Akses admin dikunci selama 30 detik.' 
    });
  }

  loginRateLimit.set(ip, rateData);
  const remaining = 5 - rateData.attempts;
  return res.status(401).json({ 
    error: `PIN Admin salah! Sisa percobaan: ${remaining}x.` 
  });
});

// Middleware: Strictly Require Active Admin Token (with expiration check)
const requireAdmin = (req, res, next) => {
  if (isAdminRequest(req)) {
    return next();
  }

  if (req.method !== 'GET') {
    recordSecurityAlert(req, `Mencoba ubah data via API tanpa izin (${req.method} ${req.path})`);
  }

  return res.status(403).json({ 
    error: 'Akses Ditolak: Hanya Vier (Admin) yang memiliki izin untuk mengubah data kas!' 
  });
};

// API: Report Unauthorized UI Modification Attempt (Non-Admin trying to change data)
app.post('/api/security/report-attempt', (req, res) => {
  const action = String(req.body?.action || 'Mencoba mengubah data kas tanpa akses Admin').trim();
  recordSecurityAlert(req, action);
  res.json({ reported: true });
});

// API: Get Security Alerts for Admin Vier
app.get('/api/security/alerts', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM security_alerts ORDER BY rowid DESC LIMIT 30').all();
  res.json(rows);
});

// API: Clear / Mark Read Security Alerts for Admin Vier
app.post('/api/security/alerts/clear', requireAdmin, (req, res) => {
  db.exec('DELETE FROM security_alerts');
  broadcastChange('security_cleared');
  res.json({ success: true });
});

// API: Verify Admin Token Validity (Session Check on Page Load)
app.get('/api/admin/check-auth', (req, res) => {
  if (isAdminRequest(req)) {
    return res.json({ authenticated: true, adminName: getSetting('admin_name', 'Vier') });
  }
  return res.json({ authenticated: false });
});

// API: Admin Logout
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  setSetting('active_admin_token', '');
  setSetting('admin_token_expires', '0');
  res.json({ success: true });
});

app.post('/api/admin/change-pin', requireAdmin, (req, res) => {
  const { currentPin, newPin } = req.body;
  const savedPin = String(getSetting('admin_pin', '101010'));
  if (currentPin !== savedPin) {
    return res.status(401).json({ error: 'PIN lama salah' });
  }
  if (!newPin || String(newPin).length < 4) {
    return res.status(400).json({ error: 'PIN baru minimal 4 angka' });
  }
  setSetting('admin_pin', String(newPin));
  return res.json({ success: true });
});

// API: Members
app.get('/api/members', (req, res) => {
  const rows = db.prepare('SELECT * FROM members ORDER BY id ASC').all();
  res.json(rows);
});

app.post('/api/members', requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama anggota wajib diisi' });
  }
  try {
    const result = db.prepare('INSERT INTO members (name, is_active) VALUES (?, 1)').run(name.trim());
    broadcastChange('members_updated');
    res.json({ id: result.lastInsertRowid, name: name.trim(), is_active: 1 });
  } catch (err) {
    res.status(400).json({ error: 'Nama anggota sudah terdaftar' });
  }
});

app.delete('/api/members/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM contributions WHERE member_id = ?').run(id);
  db.prepare('DELETE FROM members WHERE id = ?').run(id);
  broadcastChange('members_updated');
  res.json({ success: true });
});

// API: Contributions (Weekly Matrix)
app.get('/api/contributions', (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || (new Date().getMonth() + 1);

  const members = db.prepare('SELECT * FROM members WHERE is_active = 1 ORDER BY id ASC').all();
  const contributions = db.prepare('SELECT * FROM contributions WHERE year = ? AND month = ?').all(year, month);

  // Group by member_id and week (Strictly 4 weeks per month)
  const matrix = members.map((m) => {
    const memberContribs = {};
    for (let w = 1; w <= 4; w++) {
      const match = contributions.find((c) => c.member_id === m.id && c.week === w);
      memberContribs[w] = match || {
        id: `${m.id}_${year}_${month}_${w}`,
        member_id: m.id,
        year,
        month,
        week: w,
        amount: Number(getSetting('weekly_fee', 5000)),
        is_paid: 0,
        paid_at: null,
        notes: '',
        pending_verification: 0,
        status: 'unpaid',
        payer_note: '',
        claimed_at: null,
        verified_at: null
      };
    }
    return {
      member: m,
      weeks: memberContribs
    };
  });

  res.json({
    year,
    month,
    matrix
  });
});

// API: Friend/Roommate reports payment (Claim - Pending Vier's Verification)
app.post('/api/contributions/claim', (req, res) => {
  const { member_id, year, month, week, weeks, payer_note } = req.body;
  const numMemberId = Number(member_id);
  const numYear = Number(year);
  const numMonth = Number(month);

  if (!numMemberId || !numYear || !numMonth || numMonth < 1 || numMonth > 12 || numYear < 2020 || numYear > 2100) {
    return res.status(400).json({ error: 'Data pembayaran tidak lengkap atau tanggal tidak valid' });
  }

  // Validate member existence
  const memberExists = db.prepare('SELECT id FROM members WHERE id = ? AND is_active = 1').get(numMemberId);
  if (!memberExists) {
    return res.status(404).json({ error: 'Anggota kontrakan tidak valid' });
  }

  const amount = Number(getSetting('weekly_fee', 5000));
  const claimed_at = new Date().toISOString();

  // Strictly enforce valid weeks [1, 2, 3, 4]
  const rawWeeks = weeks && Array.isArray(weeks) && weeks.length > 0 ? weeks : (week ? [Number(week)] : [1, 2, 3, 4]);
  const weeksToClaim = rawWeeks.map(Number).filter(w => [1, 2, 3, 4].includes(w));
  if (weeksToClaim.length === 0) {
    return res.status(400).json({ error: 'Minggu yang dipilih tidak valid' });
  }

  // Sanitize payer note (strip dangerous characters, max 100 chars)
  const cleanNote = String(payer_note || 'Cash')
    .replace(/[<>'"]/g, '')
    .trim()
    .slice(0, 100);

  const insertOrUpdate = db.prepare(`
    INSERT INTO contributions (id, member_id, year, month, week, amount, is_paid, pending_verification, status, payer_note, claimed_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, 1, 'pending', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      pending_verification = 1,
      status = 'pending',
      payer_note = excluded.payer_note,
      claimed_at = excluded.claimed_at
    WHERE contributions.is_paid = 0
  `);

  for (const w of weeksToClaim) {
    const id = `${numMemberId}_${numYear}_${numMonth}_${w}`;
    insertOrUpdate.run(id, numMemberId, numYear, numMonth, w, amount, cleanNote, claimed_at);
  }

  broadcastChange('contributions_updated');
  res.json({ success: true, count: weeksToClaim.length });
});

// API: Vier verifies or rejects a claimed payment
app.post('/api/contributions/verify', requireAdmin, (req, res) => {
  const { id, approve } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID iuran wajib diisi' });
  }

  const now = new Date().toISOString();
  if (approve) {
    db.prepare(`
      UPDATE contributions 
      SET is_paid = 1, pending_verification = 0, status = 'verified', paid_at = ?, verified_at = ?
      WHERE id = ?
    `).run(now, now, id);
  } else {
    db.prepare(`
      UPDATE contributions 
      SET is_paid = 0, pending_verification = 0, status = 'unpaid', payer_note = NULL, claimed_at = NULL
      WHERE id = ?
    `).run(id);
  }

  broadcastChange('contributions_updated');
  res.json({ success: true, id, approved: !!approve });
});

// API: Vier verifies all pending payments & pending expenses at once
app.post('/api/contributions/verify-all', requireAdmin, (req, res) => {
  const { year, month } = req.body;
  const now = new Date().toISOString();

  let query = `
    UPDATE contributions 
    SET is_paid = 1, pending_verification = 0, status = 'verified', paid_at = ?, verified_at = ?
    WHERE pending_verification = 1
  `;
  let expQuery = `
    UPDATE expenses
    SET is_verified = 1, pending_verification = 0, verified_at = ?
    WHERE pending_verification = 1
  `;
  const params = [now, now];
  const expParams = [now];
  if (year && month) {
    query += ' AND year = ? AND month = ?';
    params.push(year, month);
    expQuery += ' AND year = ? AND month = ?';
    expParams.push(year, month);
  }

  const result = db.prepare(query).run(...params);
  const expResult = db.prepare(expQuery).run(...expParams);
  broadcastChange('contributions_updated');
  broadcastChange('expenses_updated');
  res.json({ success: true, verifiedCount: result.changes + expResult.changes });
});

// API: Get pending payment claims for Vier to review
app.get('/api/contributions/pending', (req, res) => {
  const year = req.query.year ? Number(req.query.year) : null;
  const month = req.query.month ? Number(req.query.month) : null;

  let query = `
    SELECT c.*, m.name as member_name 
    FROM contributions c
    JOIN members m ON c.member_id = m.id
    WHERE c.pending_verification = 1
  `;
  const params = [];
  if (year && month) {
    query += ' AND c.year = ? AND c.month = ?';
    params.push(year, month);
  }
  query += ' ORDER BY c.claimed_at DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// API: Toggle Contribution payment (Admin only)
app.post('/api/contributions/toggle', requireAdmin, (req, res) => {
  const { member_id, year, month, week, is_paid, notes } = req.body;
  const id = `${member_id}_${year}_${month}_${week}`;
  const amount = Number(getSetting('weekly_fee', 5000));
  const now = new Date().toISOString();
  const paid_at = is_paid ? now : null;
  const status = is_paid ? 'verified' : 'unpaid';
  const verified_at = is_paid ? now : null;

  db.prepare(`
    INSERT INTO contributions (id, member_id, year, month, week, amount, is_paid, paid_at, notes, pending_verification, status, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      is_paid = excluded.is_paid,
      paid_at = excluded.paid_at,
      notes = excluded.notes,
      pending_verification = 0,
      status = excluded.status,
      verified_at = excluded.verified_at
  `).run(id, member_id, year, month, week, amount, is_paid ? 1 : 0, paid_at, notes || '', status, verified_at);

  broadcastChange('contributions_updated');
  res.json({ success: true, id, is_paid, paid_at });
});

// API: Batch Pay for whole month (Admin only)
app.post('/api/contributions/batch-pay', requireAdmin, (req, res) => {
  const { member_id, year, month, weeksToPay } = req.body;
  const amount = Number(getSetting('weekly_fee', 5000));
  const now = new Date().toISOString();

  const insertOrUpdate = db.prepare(`
    INSERT INTO contributions (id, member_id, year, month, week, amount, is_paid, paid_at, notes, pending_verification, status, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, 'Bayar 1 Bulan Penuh', 0, 'verified', ?)
    ON CONFLICT(id) DO UPDATE SET
      is_paid = 1,
      paid_at = excluded.paid_at,
      notes = excluded.notes,
      pending_verification = 0,
      status = 'verified',
      verified_at = excluded.verified_at
  `);

  const weeks = weeksToPay || [1, 2, 3, 4];
  for (const w of weeks) {
    const id = `${member_id}_${year}_${month}_${w}`;
    insertOrUpdate.run(id, member_id, year, month, w, amount, now, now);
  }

  broadcastChange('contributions_updated');
  res.json({ success: true });
});

// API: Expenses
app.get('/api/expenses', (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || (new Date().getMonth() + 1);

  const rows = db.prepare(`
    SELECT * FROM expenses 
    WHERE year = ? AND month = ? 
    ORDER BY pending_verification DESC, date DESC, created_at DESC
  `).all(year, month);

  res.json(rows);
});

// API: Get pending expenses for Vier to review
app.get('/api/expenses/pending', (req, res) => {
  const year = req.query.year ? Number(req.query.year) : null;
  const month = req.query.month ? Number(req.query.month) : null;

  let query = `SELECT * FROM expenses WHERE pending_verification = 1`;
  const params = [];
  if (year && month) {
    query += ' AND year = ? AND month = ?';
    params.push(year, month);
  }
  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// API: Create Expense (Open to Roommates & Admin! Roommate submissions enter pending_verification = 1)
app.post('/api/expenses', (req, res) => {
  const { date, day_name, category, amount, pic, notes, week } = req.body;
  const numAmount = Math.round(Number(amount));
  
  if (!date || !numAmount || numAmount <= 0 || numAmount > 10000000 || !category) {
    return res.status(400).json({ error: 'Tanggal, nominal valid (1 - 10.000.000), dan kategori wajib diisi' });
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return res.status(400).json({ error: 'Format tanggal tidak valid' });
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const dayOfMonth = d.getDate();
  const weekNum = week ? Math.min(Math.max(Number(week), 1), 4) : Math.min(Math.ceil(dayOfMonth / 7), 4);

  const indoDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const calculatedDay = day_name || indoDays[d.getDay()];

  const cleanCategory = String(category).replace(/[<>'"]/g, '').trim().slice(0, 50);
  const cleanPic = String(pic || '').replace(/[<>'"]/g, '').trim().slice(0, 50);
  const cleanNotes = String(notes || '').replace(/[<>'"]/g, '').trim().slice(0, 200);

  const id = `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const isByAdmin = isAdminRequest(req);
  const isVerified = isByAdmin ? 1 : 0;
  const pendingVerif = isByAdmin ? 0 : 1;
  const verifiedAt = isByAdmin ? new Date().toISOString() : null;

  db.prepare(`
    INSERT INTO expenses (id, year, month, week, date, day_name, category, amount, pic, notes, is_verified, pending_verification, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, year, month, weekNum, date, calculatedDay, cleanCategory, numAmount, cleanPic, cleanNotes, isVerified, pendingVerif, verifiedAt);

  broadcastChange('expenses_updated', { pendingExpense: !isByAdmin });
  res.json({ success: true, id, pending_verification: pendingVerif, is_verified: isVerified });
});

// API: Admin Vier verifies or rejects a pending expense
app.post('/api/expenses/verify', requireAdmin, (req, res) => {
  const { id, approve } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID pengeluaran wajib diisi' });
  }

  const now = new Date().toISOString();
  if (approve) {
    db.prepare(`
      UPDATE expenses
      SET is_verified = 1, pending_verification = 0, verified_at = ?
      WHERE id = ?
    `).run(now, id);
  } else {
    db.prepare(`DELETE FROM expenses WHERE id = ?`).run(id);
  }

  broadcastChange('expenses_updated');
  res.json({ success: true, id, approved: !!approve });
});

app.put('/api/expenses/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { date, day_name, category, amount, pic, notes, week } = req.body;
  const numAmount = Math.round(Number(amount));

  if (!date || !numAmount || numAmount <= 0 || numAmount > 10000000 || !category) {
    return res.status(400).json({ error: 'Tanggal, nominal valid, dan kategori wajib diisi' });
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return res.status(400).json({ error: 'Format tanggal tidak valid' });
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const dayOfMonth = d.getDate();
  const weekNum = week ? Math.min(Math.max(Number(week), 1), 4) : Math.min(Math.ceil(dayOfMonth / 7), 4);
  const indoDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const calculatedDay = day_name || indoDays[d.getDay()];

  const cleanCategory = String(category).replace(/[<>'"]/g, '').trim().slice(0, 50);
  const cleanPic = String(pic || '').replace(/[<>'"]/g, '').trim().slice(0, 50);
  const cleanNotes = String(notes || '').replace(/[<>'"]/g, '').trim().slice(0, 200);

  db.prepare(`
    UPDATE expenses 
    SET date = ?, day_name = ?, category = ?, amount = ?, pic = ?, notes = ?, year = ?, month = ?, week = ?
    WHERE id = ?
  `).run(date, calculatedDay, cleanCategory, numAmount, cleanPic, cleanNotes, year, month, weekNum, id);

  broadcastChange('expenses_updated');
  res.json({ success: true });
});

app.delete('/api/expenses/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  broadcastChange('expenses_updated');
  res.json({ success: true });
});

// API: Aggregated Summary & Martabak Target
app.get('/api/summary', (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || (new Date().getMonth() + 1);

  // Total collected income in this month
  const incomeRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM contributions 
    WHERE year = ? AND month = ? AND is_paid = 1
  `).get(year, month);
  const monthlyIncome = incomeRow ? incomeRow.total : 0;

  // Total verified expense in this month
  const expenseRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM expenses 
    WHERE year = ? AND month = ? AND pending_verification = 0
  `).get(year, month);
  const monthlyExpense = expenseRow ? expenseRow.total : 0;

  // All-time balance (cumulative verified income - verified expenses)
  const allIncomeRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM contributions 
    WHERE is_paid = 1
  `).get();
  const allExpenseRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM expenses
    WHERE pending_verification = 0
  `).get();
  
  const allTimeIncome = allIncomeRow ? allIncomeRow.total : 0;
  const allTimeExpense = allExpenseRow ? allExpenseRow.total : 0;
  const currentBalance = allTimeIncome - allTimeExpense;

  // Calculate unpaid contributions for this month
  const activeMembersCount = db.prepare('SELECT COUNT(*) as count FROM members WHERE is_active = 1').get().count;
  const weeklyFee = Number(getSetting('weekly_fee', 5000));
  const expectedMonthlyTotal = activeMembersCount * 4 * weeklyFee;

  const martabakTarget = Number(getSetting('martabak_target', 50000));
  const martabakProgress = Math.min(Math.round((currentBalance / martabakTarget) * 100), 100);
  const martabakReady = currentBalance >= martabakTarget;
  const martabakPortions = Math.max(0, Math.floor(currentBalance / martabakTarget));

  const pendingContribRow = db.prepare(`
    SELECT COUNT(*) as count 
    FROM contributions 
    WHERE pending_verification = 1 AND year = ? AND month = ?
  `).get(year, month);
  const pendingExpRow = db.prepare(`
    SELECT COUNT(*) as count 
    FROM expenses 
    WHERE pending_verification = 1 AND year = ? AND month = ?
  `).get(year, month);
  const pendingVerificationsCount = (pendingContribRow ? pendingContribRow.count : 0) + (pendingExpRow ? pendingExpRow.count : 0);

  const secCountRow = db.prepare('SELECT COUNT(*) as count FROM security_alerts WHERE is_read = 0').get();
  const securityAlertsCount = secCountRow ? secCountRow.count : 0;

  res.json({
    year,
    month,
    monthlyIncome,
    monthlyExpense,
    monthlyNet: monthlyIncome - monthlyExpense,
    currentBalance,
    allTimeIncome,
    allTimeExpense,
    activeMembersCount,
    expectedMonthlyTotal,
    unpaidAmount: Math.max(0, expectedMonthlyTotal - monthlyIncome),
    pendingVerificationsCount,
    securityAlertsCount,
    martabak: {
      target: martabakTarget,
      currentBalance,
      progress: martabakProgress,
      isReady: martabakReady,
      portions: martabakPortions,
      remainingToTarget: Math.max(0, martabakTarget - currentBalance)
    }
  });
});

// Serve frontend dist build if present
const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalNetworkIp();
    console.log('\n======================================================');
    console.log('🏠  UANG KAS KONTRAKAN BERHASIL DIJALANKAN!');
    console.log(`💻  Akses Laptop  : http://localhost:${PORT}`);
    console.log(`📱  Akses Android : http://${ip}:${PORT}`);
    console.log('======================================================\n');
  });
}

export default app;

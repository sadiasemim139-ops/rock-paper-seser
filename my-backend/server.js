/**
 * server.js
 * Unified Node.js backend — handles both /signup and /login.
 * Run with: node server.js
 * Listens on: http://localhost:3000
 *
 * No external dependencies — uses built-in Node.js modules only.
 */

const http = require('http');

const PORT = 3000;
const HOST = 'localhost';

// ──────────────────────────────────────────────────────────────
// In-memory user store (replace with a real DB in production)
// ──────────────────────────────────────────────────────────────
const users = [
    // Pre-seeded demo user from login.html
    { id: 1, username: 'alice', password: 'password123' },
];
let nextId = 2;

// ──────────────────────────────────────────────────────────────
// Helper: read and parse JSON body
// ──────────────────────────────────────────────────────────────
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(raw || '{}')); }
            catch { reject(new Error('Invalid JSON in request body.')); }
        });
        req.on('error', reject);
    });
}

// ──────────────────────────────────────────────────────────────
// Helper: send JSON response with CORS headers
// ──────────────────────────────────────────────────────────────
function sendJSON(res, statusCode, data) {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type':                'application/json',
        'Content-Length':              Buffer.byteLength(body),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods':'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type',
    });
    res.end(body);
}

// ──────────────────────────────────────────────────────────────
// Route handlers
// ──────────────────────────────────────────────────────────────

/**
 * POST /signup
 * Body: { username: string, mobile: string, password: string }
 * Returns 201 on success, 400/409 on error.
 */
async function handleSignup(req, res) {
    const { username, mobile, password } = await parseBody(req);

    // Validate username
    if (!username || typeof username !== 'string' || username.trim() === '') {
        return sendJSON(res, 400, { message: 'Username is required.' });
    }

    // Validate mobile number (7–15 digits, optional leading +)
    if (!mobile || typeof mobile !== 'string') {
        return sendJSON(res, 400, { message: 'Mobile number is required.' });
    }
    if (!/^[+\d]{7,15}$/.test(mobile.trim())) {
        return sendJSON(res, 400, { message: 'Mobile number must be 7–15 digits (e.g. +1234567890).' });
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 6) {
        return sendJSON(res, 400, { message: 'Password must be at least 6 characters.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanMobile   = mobile.trim();

    // Check if username already exists
    if (users.find(u => u.username === cleanUsername)) {
        return sendJSON(res, 409, { message: `Username "${cleanUsername}" is already taken.` });
    }

    // Create and store the new user (including mobile)
    const newUser = { id: nextId++, username: cleanUsername, mobile: cleanMobile, password };
    users.push(newUser);

    console.log(`[SIGNUP] ✔ New user registered: ${newUser.username} | mobile: ${newUser.mobile} (id=${newUser.id})`);

    // Respond — never return the password
    const { password: _, ...safeUser } = newUser;
    return sendJSON(res, 201, {
        message: 'Account created successfully.',
        user: safeUser,
    });
}

/**
 * POST /login
 * Body: { username: string, password: string }
 * Returns 200 on success, 400/401 on error.
 */
async function handleLogin(req, res) {
    const { username, password } = await parseBody(req);

    if (!username || !password) {
        return sendJSON(res, 400, { message: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = users.find(
        u => u.username === cleanUsername && u.password === password
    );

    if (!user) {
        return sendJSON(res, 401, { message: 'Invalid username or password.' });
    }

    console.log(`[LOGIN]  ✔ User authenticated: ${user.username}`);

    const { password: _, ...safeUser } = user;
    return sendJSON(res, 200, {
        message: 'Login successful.',
        user: safeUser,
    });
}

/**
 * GET /users  (development helper — remove in production)
 * Lists all registered usernames (no passwords).
 */
function handleListUsers(req, res) {
    const safeList = users.map(({ password: _, ...u }) => u);
    return sendJSON(res, 200, { count: safeList.length, users: safeList });
}

// ──────────────────────────────────────────────────────────────
// Main request router
// ──────────────────────────────────────────────────────────────
async function router(req, res) {
    const { method, url } = req;

    // CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin':  '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        return res.end();
    }

    try {
        if (method === 'POST' && url === '/signup') return await handleSignup(req, res);
        if (method === 'POST' && url === '/login')  return await handleLogin(req, res);
        if (method === 'GET'  && url === '/users')  return handleListUsers(req, res);
        if (method === 'GET'  && url === '/')       return sendJSON(res, 200, { status: 'ok', message: 'Server is running.' });

        return sendJSON(res, 404, { message: `Route ${method} ${url} not found.` });

    } catch (err) {
        console.error('[ERROR]', err.message);
        return sendJSON(res, 400, { message: err.message });
    }
}

// ──────────────────────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────────────────────
const server = http.createServer(router);

server.listen(PORT, HOST, () => {
    console.log(`\n🚀 Server running at http://${HOST}:${PORT}`);
    console.log('');
    console.log('   Available routes:');
    console.log(`   POST http://${HOST}:${PORT}/signup  ← Create account`);
    console.log(`   POST http://${HOST}:${PORT}/login   ← Sign in`);
    console.log(`   GET  http://${HOST}:${PORT}/users   ← List users (dev only)`);
    console.log('');
    console.log('Press Ctrl+C to stop.\n');
});

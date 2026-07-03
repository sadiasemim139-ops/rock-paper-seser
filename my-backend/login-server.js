/**
 * login-server.js
 * A simple Node.js backend for handling login requests.
 * Run with: node login-server.js
 * Listens on: http://localhost:3000
 *
 * No external dependencies — uses built-in Node.js modules only.
 */

const http = require('http');

const PORT = 3000;
const HOST = 'localhost';

// ──────────────────────────────────────────────
// Mock user database (replace with real DB later)
// ──────────────────────────────────────────────
const USERS = [
    { id: 1, name: 'Alice', email: 'alice@example.com', password: 'password123' },
    { id: 2, name: 'Bob',   email: 'bob@example.com',   password: 'securepass'  },
];

// ──────────────────────────────────────────────
// Helper: parse JSON body from request
// ──────────────────────────────────────────────
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch { reject(new Error('Invalid JSON')); }
        });
        req.on('error', reject);
    });
}

// ──────────────────────────────────────────────
// Helper: send JSON response
// ──────────────────────────────────────────────
function sendJSON(res, statusCode, data) {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        // Allow requests from the frontend (CORS)
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(body);
}

// ──────────────────────────────────────────────
// Request handler
// ──────────────────────────────────────────────
async function requestHandler(req, res) {
    const { method, url } = req;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        return res.end();
    }

    // POST /login
    if (method === 'POST' && url === '/login') {
        try {
            const { email, password } = await parseBody(req);

            // Basic validation
            if (!email || !password) {
                return sendJSON(res, 400, { message: 'Email and password are required.' });
            }

            // Find user
            const user = USERS.find(
                u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
            );

            if (!user) {
                return sendJSON(res, 401, { message: 'Invalid email or password.' });
            }

            // Success — return user info (never return the password)
            const { password: _, ...safeUser } = user;
            console.log(`[LOGIN] ✔ User logged in: ${safeUser.email}`);
            return sendJSON(res, 200, {
                message: 'Login successful.',
                user: safeUser,
            });

        } catch (err) {
            console.error('[ERROR]', err.message);
            return sendJSON(res, 400, { message: 'Bad request: ' + err.message });
        }
    }

    // Health check: GET /
    if (method === 'GET' && url === '/') {
        return sendJSON(res, 200, { status: 'ok', message: 'Login server is running.' });
    }

    // 404 for anything else
    return sendJSON(res, 404, { message: 'Route not found.' });
}

// ──────────────────────────────────────────────
// Start the server
// ──────────────────────────────────────────────
const server = http.createServer(requestHandler);

server.listen(PORT, HOST, () => {
    console.log(`\n🚀 Login server running at http://${HOST}:${PORT}`);
    console.log(`   POST http://${HOST}:${PORT}/login`);
    console.log('\n📋 Demo credentials:');
    USERS.forEach(u => console.log(`   Email: ${u.email}  |  Password: ${u.password}`));
    console.log('\nPress Ctrl+C to stop.\n');
});

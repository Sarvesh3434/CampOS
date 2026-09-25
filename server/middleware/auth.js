// auth middleware — the JWT guard for every protected route.
//
// How login works (the part judges love to ask about):
//   1) Client POSTs email + password to /api/auth/login
//   2) Server checks the bcrypt hash, then signs a JWT containing
//      { id, role, name } with a secret only the server knows
//   3) Client stores the token in localStorage and sends it back on every
//      request as:  Authorization: Bearer <token>
//   4) THIS middleware verifies the signature + expiry, and attaches the
//      decoded payload to req.user for the route handlers to use
//
// Why JWT? The server never needs a session store — the token itself carries
// the user's identity, and tampering with it would break the signature.
const jwt = require('jsonwebtoken');

// Demo default keeps the project runnable out of the box, but an env var
// always wins if set:  JWT_SECRET=whatever node server/index.js
const JWT_SECRET = process.env.JWT_SECRET || 'campos-demo-secret-change-me';

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token. Please log in.' });

  try {
    req.user = jwt.verify(token, JWT_SECRET); // { id, role, name }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Usage inside a route: router.get('/x', auth, requireRole('admin'), handler)
// Why a string check and nothing fancier: the role was signed into the token
// at login, so the client can't forge it — comparing strings is genuinely safe.
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Only ${role}s can do this.` });
    }
    next();
  };
}

// Same idea, but allows several roles: requireAnyRole('admin', 'faculty')
function requireAnyRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Only ${roles.join(' or ')} can do this.` });
    }
    next();
  };
}

module.exports = { auth, requireRole, requireAnyRole, JWT_SECRET };

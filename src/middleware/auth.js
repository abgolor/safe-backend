// src/middleware/auth.js
const { auth } = require("../config/firebase");

/**
 * Middleware to verify Firebase ID token
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No token provided",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid token",
    });
  }
}

module.exports = { verifyToken };

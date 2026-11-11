const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

// Protects a route: requires "Authorization: Bearer <token>" and sets req.userId
function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        res.status(401).json({ message: "Login required" });
        return;
    }

    try {
        req.userId = jwt.verify(token, jwtSecret).sub;
        next();
    } catch {
        res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }
}

module.exports = { requireAuth };

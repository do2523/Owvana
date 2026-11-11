const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const User = require("../../backend/database/models/User");
const { jwtSecret } = require("../../backend/config/env");

// Verify password using the same method as registration
function verifyPassword(password, storedHash) {
    return new Promise((resolve, reject) => {
        // Check that the stored hash has the expected format
        if (typeof storedHash !== "string") {
            resolve(false);
            return;
        }

        const parts = storedHash.split(":");

        if (
            parts.length !== 2 ||
            !/^[0-9a-f]{32}$/i.test(parts[0]) ||
            !/^[0-9a-f]{128}$/i.test(parts[1])
        ) {
            resolve(false);
            return;
        }

        const salt = Buffer.from(parts[0], "hex");
        const originalHash = Buffer.from(parts[1], "hex");

        // Hash the submitted password with the stored salt
        crypto.scrypt(password, salt, originalHash.length, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            // Safely compare both hashes
            resolve(crypto.timingSafeEqual(originalHash, derivedKey));
        });
    });
}

// Create login endpoint
async function login(req, res) {
    try {
        // Retrieve email and password from request body
        const { email, password } = req.body || {};

        // Check if email and password are provided
        if (
            typeof email !== "string" ||
            email.trim() === "" ||
            typeof password !== "string" ||
            password === ""
        ) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        // Normalize email the same way as registration
        const normalizedEmail = email.trim().toLowerCase();

        // Search MongoDB for user with provided email
        const user = await User.findOne({ email: normalizedEmail });

        // If no user is found, return error
        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Check if submitted password matches stored hash
        const passwordMatches = await verifyPassword(
            password,
            user.password_hash
        );

        // If password does not match, return error
        if (!passwordMatches) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Block accounts that haven't verified their email yet
        if (!user.email_verified) {
            return res.status(403).json({
                error: "Please verify your email before logging in"
            });
        }

        if (!jwtSecret) {
            console.error("JWT_SECRET is not set");
            return res.status(500).json({ error: "Internal server error" });
        }

        // Signed token the client sends back as "Authorization: Bearer <token>"
        const token = jwt.sign({ sub: String(user._id) }, jwtSecret, {
            expiresIn: "7d"
        });

        return res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        // Handle unexpected errors
        console.error("Login error:", error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

module.exports = { login };
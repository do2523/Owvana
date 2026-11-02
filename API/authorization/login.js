const crypto = require("node:crypto");
const User = require("../../backend/database/models/User");

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

        // TEMPORARY LOCAL TEST ONLY
        // JWT and email verification are disabled for testing.
        // This does not create an authenticated session.
        return res.status(200).json({
            message: "Login credentials verified successfully"
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
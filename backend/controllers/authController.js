const crypto = require("node:crypto");
const User = require("../database/models/User");

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16);

        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(`${salt.toString("hex")}:${derivedKey.toString("hex")}`);
        });
    });
}

async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
        ) {
            res.status(400).json({
                message: "Name, email, and a password of at least 8 characters are required.",
            });
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            res.status(409).json({ message: "An account with that email already exists." });
            return;
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password_hash: await hashPassword(password),
        });

        res.status(201).json({
            message: "Account created successfully.",
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { register };
const crypto = require("node:crypto");
const User = require("../database/models/User");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/mailer");

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

// Checks a password against a "salt:hash" string produced by hashPassword
function verifyPassword(password, storedHash) {
    return new Promise((resolve, reject) => {
        if (typeof storedHash !== "string") {
            resolve(false);
            return;
        }

        const [saltHex, hashHex] = storedHash.split(":");

        if (!saltHex || !hashHex) {
            resolve(false);
            return;
        }

        const originalHash = Buffer.from(hashHex, "hex");

        crypto.scrypt(password, Buffer.from(saltHex, "hex"), originalHash.length, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(crypto.timingSafeEqual(originalHash, derivedKey));
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

        const token = crypto.randomBytes(32).toString('hex');
        const verify_token_hash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password_hash: await hashPassword(password),
            verify_token_hash,
            verify_expires_at: Date.now() + 24 * 60 * 60* 1000
        });

        try {
            await sendVerificationEmail(normalizedEmail, token);
        } catch (mailError) {
            // Account exists; don't fail signup because the email didn't go out
            console.error("Failed to send verification email:", mailError);
        }

        res.status(201).json({
            message: "Account created successfully.",
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (error) {
        next(error);
    }
}

async function verifyEmail(req, res)
    {
        try
        {
            const {token} = req.query;

            if(!token)
                {
                    return res.status(400).json({message: "Missing token"});
                }
            
            const verify_token_hash = crypto.createHash('sha256').update(token).digest('hex');

            const user = await User.findOne({verify_token_hash, verify_expires_at: {$gt: Date.now()}});

            if(!user)
                {
                    return res.status(400).json({message: "Invalid or expired token"});
                }
            
            user.email_verified = true;
            user.verify_token_hash = undefined;
            user.verify_expires_at = undefined;
            await user.save();
            
            res.status(200).json({message: "Email verified"})
        }
        catch(err)
        {
            console.error(err);
            res.status(500).json({message: "Server error"});
        }
}


async function resendVerification(req, res)
{
    try
    {
        const {email} = req.body || {};

        if(typeof email !== "string" || !email.trim())
            {
                return res.status(400).json({message: "Missing fields"});
            }

        const user = await User.findOne({email: email.trim().toLowerCase()});

        // Same response whether or not the account exists, so emails can't be probed
        if(user && !user.email_verified)
            {
                const token = crypto.randomBytes(32).toString('hex');
                user.verify_token_hash = crypto.createHash('sha256').update(token).digest('hex');
                user.verify_expires_at = Date.now() + 24 * 60 * 60 * 1000;
                await user.save();

                try {
                    await sendVerificationEmail(user.email, token);
                } catch (mailError) {
                    console.error("Failed to send verification email:", mailError);
                }
            }

        res.status(200).json({message: "If that account needs verification, a new link was sent"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function forgotPassword(req, res)
{
    try
    {
        const{email} = req.body;

        if(!email)
            {
               return res.status(400).json({message: "Missing fields"});
            }
        
        const user = await User.findOne({email: String(email).trim().toLowerCase()});

        if(user)
            {
                const token = crypto.randomBytes(32).toString('hex');
                user.reset_token_hash = crypto.createHash('sha256').update(token).digest('hex');
                user.reset_expires_at = Date.now() + 24 * 60 * 60* 1000;
                await user.save();

                try {
                    await sendPasswordResetEmail(user.email, token);
                } catch (mailError) {
                    console.error("Failed to send reset email:", mailError);
                }
            }
        
        res.status(200).json({message: "Reset link was sent"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function resetPassword(req, res)
{
    try
    {
        const {token, password, password_confirmation} = req.body;

        if(!token || !password || !password_confirmation)
            {
                return res.status(400).json({message: "Missing fields"});
            }
        
        if(typeof password !== 'string' || password.length < 8)
                {
                    return res.status(400).json({message: "New password must be at least 8 characters long"});
                }

        if(!/[A-Za-z]/.test(password) || !/\d/.test(password))
            {
                return res.status(400).json({message: "New password must have at least 1 letter and number"});
            }

        if(password !== password_confirmation)
            {
                return res.status(400).json({message: "Password must match"});
            }
        
        const reset_token_hash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({reset_token_hash, reset_expires_at: {$gt: Date.now()}});

        if(!user)
            {
                return res.status(400).json({message: "Invalid or expired token"});
            }
        
        const passwordMatches = await verifyPassword(password, user.password_hash);

        if(passwordMatches)
            {
                return res.status(400).json({message: "New password cannot be the same as your old password"});
            }
        
        user.password_hash = await hashPassword(password);
        user.reset_token_hash = undefined;
        user.reset_expires_at = undefined;
        await user.save();

        res.status(200).json({message: "Password updated"});
    }
    catch(err)
    {
        console.error(err);
         res.status(500).json({message: "Server error"});
    }
}

module.exports = { register, verifyEmail, resendVerification, forgotPassword, resetPassword };

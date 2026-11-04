import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../../backend/database/models/User.js';

export async function forgotPassword(req, res)
{
    try
    {
        const{email} = req.body;

        if(!email)
            {
               return res.status(400).json({message: "Missing fields"});
            }
        
        const user = await User.findOne({email});

        if(user)
            {
                const token = crypto.randomBytes(32).toString('hex');
                user.reset_token_hash = crypto.createHash('sha256').update(token).digest('hex');
                user.reset_expires_at = Date.now() + 24 * 60 * 60* 1000;
                await user.save();

                console.log(`http://localhost:5000/API/authorization/reset-password?token=${token}`)
            }
        
        res.status(200).json({message: "Reset link was sent"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

export async function resetPassword(req, res)
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
        
        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if(passwordMatches)
            {
                return res.status(400).json({message: "New password cannot be the same as your old password"});
            }
        
        user.password = password;
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
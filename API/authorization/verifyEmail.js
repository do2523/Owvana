import crypto from 'crypto';
import User from '../../backend/database/models/User.js'

export async function verifyEmail(req, res)
    {
        try
        {
            const {token} = req.query;

            if(!token)
                {
                    return res.status(400).json({message: "Missing token"});
                }
            
            
            const user = await User.findOne({token, verify_expires_at: {$gt: Date.now()}});

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

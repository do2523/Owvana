import express from 'express';
import crypto from 'crypto';
import User from '../../database/models/User.js'

const router = express.Router();

router.post('/register', async(req, res) => 
    {
        const{name, email, password, password_confirmation} = req.body;

        try
        {
            if(!name || !email || !password || !password_confirmation)
                {
                    return res.status(400).json({message: "Missing fields"});
                }
            
            if(typeof password !== 'string' || password.length < 8)
                {
                    return res.status(400).json({message: "Password must be at least 8 characters long"});
                }

            if(!/[A-Za-z]/.test(password) || !/\d/.test(password))
                {
                    return res.status(400).json({message: "Password must have at least 1 letter and number"});
                }

            if(password !== password_confirmation)
                {
                    return res.status(400).json({message: "Password must match"});
                }

            const userExists = await User.findOne({email});
            if(userExists)
                {
                    return res.status(409).json({message: "User already exists"});
                }
            
            const token = crypto.randomBytes(32).toString('hex');
            const verify_token_hash = crypto.createHash('sha256').update(token).digest('hex');

            const user = await User.create({name, email, password, verify_token_hash, verify_expires_at: Date.now() + 24 * 60 * 60* 1000});

            console.log(`http://localhost:3000/API/auth/verifyEmail?token=${token}`);

            res.status(201).json({id: user._id, name: user.name, email: user.email})
        }
        catch(err)
        {
            console.error(err);
            res.status(500).json({message: "Server error"})
        }
});

export default router;
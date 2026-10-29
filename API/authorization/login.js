//import express & create router
const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../backend/database/models/User.js");

//create login endpoint
router.post("/login", async (req, res) => {

    try{
        // retrieve email and password from request body
        const email = req.body.email;
        const password = req.body.password;

        // if email and password are  not provided, return error
        if (!email || !password) {
            return res.status(400).json({error: "Email and password are required" });
        }

        // Check if email contains only spaces
        if (email.trim() === "") {
            return res.status(400).json({error: "Email cannot be empty"});

        }

        // search MongoDB for user with provided email
        const user = await User.findOne({email});

        // if no user is found, return error
        if(!user) {
            return res.status(401).json({error: "Invalid email or password" });
        }

        // check if a submitted password matches the stored password has
        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        // if password does not match, return error
        if(!passwordMatches) {
            return res.status(401).json({error: "Invalid email or password" });
        }

        // if email is not verified, return error
        if(!user.email_verified){
            return res.status(403).json({error: "Email not verified" });
        }

        // creates payload for JWT token
        const payload = {
            userID: user._id.toString()
        };

        //JWT token is created with payload and secret key, and set to expire in 1 hour
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1h"});

        return res.status(200).json({token});
        }catch (error) {
            //handles unexpected errors and returns a 500 status code with an error message
            console.error("Login error:", error);
            return res.status(500).json({error: "Internal server error"});
        }

});

//export router
module.exports = rouer;

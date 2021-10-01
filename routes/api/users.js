const express = require("express");
const { model } = require("mongoose");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const router = express.Router();

const config = require('config');
const User = require("../models/User");

/*
@route  POST api/users 
@desc   Register User
@access Public
*/
router.post("/", [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a passwowrd with 6 or more characters').isLength({ min: 6 })
    ],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return (res.status(400).json({ errors: errors.array() }));
        }
        //destructure request.body
        const { name, email, password } = req.body

        try {
            //See if user exists
            let user = await User.findOne({ email });

            if (user) {
                return (res.status(400).json({ msg: 'User already exists' }));
            }
            //Get users gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });

            user = new User({
                name,
                email,
                avatar,
                password
            });

            //Encrypt password
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            await user.save();
            //Return jwt
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(payload,
                config.get('jwtSecret'), { expiresIn: 3600 },
                (err, token) => {
                    if (err) {
                        throw err;
                    } else {
                        res.json({ token });
                    }
                })

        } catch (err) {
            console.log(err.message);
            return res.status(500).send("Server Error")
        }



    });

module.exports = router;
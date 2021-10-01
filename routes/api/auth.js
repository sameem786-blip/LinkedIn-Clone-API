const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User')
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const config = require("config");


/*
   @route  GET api/auth
   @desc   Test
   @access Public
*/
router.get("/", auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
@route  POST api/auth
@desc   Authenticate user & get token
@access Public
*/
router.post("/", [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        //destructure request.body
        const { email, password } = req.body

        try {
            //See if user exists
            let user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const isMatched = await bcrypt.compare(password, user.password);

            if (!isMatched) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }
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
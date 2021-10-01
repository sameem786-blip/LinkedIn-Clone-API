const express = require("express");
const request = require('request');
const router = express.Router();
const { check, validationResult } = require("express-validator");

const auth = require('../middleware/auth')
const Profile = require('../models/Profile');
const User = require('../models/User');

const config = require('config');

/*
@route  GET api/Profile/Me
@desc   Get current users profile
@access Private
*/
router.get("/me", auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'No profile for this user' });
        } else {
            res.json(profile);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
@route  GET api/Profile
@desc   Create or Update user profile
@access Private
*/
router.post('/', [auth, [
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'skills is required').not().isEmpty()
    ]],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        //build profile object
        const profileFields = {};

        profileFields.user = req.user.id;
        company ? profileFields.company = company : profileFields.company = null;
        website ? profileFields.website = website : profileFields.website = null;
        location ? profileFields.location = location : profileFields.location = null;
        bio ? profileFields.bio = bio : profileFields.bio = null;
        status ? profileFields.status = status : profileFields.status = null;
        githubusername ? profileFields.githubusername = githubusername : profileFields.githubusername = null;
        skills ? profileFields.skills = skills.split(',').map(skill => skill.trim()) : profileFields.skills = null;

        //build social object
        profileFields.social = {};
        youtube ? profileFields.social.youtube = youtube : profileFields.social.youtube = null;
        twitter ? profileFields.social.twitter = twitter : profileFields.social.twitter = null;
        facebook ? profileFields.social.facebook = facebook : profileFields.social.facebook = null;
        linkedin ? profileFields.social.linkedin = linkedin : profileFields.social.linkedin = null;
        instagram ? profileFields.social.instagram = instagram : profileFields.social.instagram = null;


        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                //update
                profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
                return res.json(profile);
            } else {
                //create
                profile = new Profile(profileFields);
                await profile.save();
                res.json(profile);
            }
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }
    });

/*
    @route  GET api/Profile/
    @desc   Get all profiles
    @access Private
*/

router.get('/', async(req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/*
    @route  GET api/Profile/user/:user_id
    @desc   Get profile by user ID
    @access Private
*/

router.get('/user/:user_id', async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: "No Profile found" })
        } else {
            res.json(profile);
        }

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Profile Not Found' });
        }
        res.status(500).send('Server Error');
    }
})

/*
    @route  DELETE api/Profile
    @desc   delete profile, user & posts
    @access Private
*/

router.delete('/', auth, async(req, res) => {
    try {
        //Remove user posts

        //Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });

        //Remove user
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
    @route  PUT api/Profile
    @desc   add profile experience
    @access Private
*/

router.put('/experience', [auth, [
        check('title', 'Title is required').not().isEmpty(),
        check('company', 'Company is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()
    ]],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.experience.unshift(newExp);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.log('123');
            console.error(err.message);
            res.status(500).send('Server Error')
        }
    });

/*
    @route  DELETE api/Profile/experience/:exp_id
    @desc   delete experience from profile
    @access Private
*/

router.delete('/experience/:exp_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {

    }
})

/*
    @route  PUT api/Profile
    @desc   add profile experience
    @access Private
*/

router.put('/education', [auth, [
        check('school', 'School is required').not().isEmpty(),
        check('degree', 'Degree is required').not().isEmpty(),
        check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
        check('from', 'from date is required').not().isEmpty()
    ]],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            decription
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            decription
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.education.unshift(newEdu);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.log('123');
            console.error(err.message);
            res.status(500).send('Server Error')
        }
    });

/*
@route  DELETE api/Profile/education/:edu_id
@desc   delete education from profile
@access Private
*/

router.delete('/education/:edu_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.log('123');
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

/*
@route  GET api/Profile/github/:username
@desc   Get user repos from Github
@access Private
*/

router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };

        request(options, (error, response, body) => {
            if (error) {
                console.error(error);
            }
            if (response.statusCode != 200) {
                return (res.status(404).json({ msg: 'No Github profile found' }));
            }

            res.json(JSON.parse(body));

        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;
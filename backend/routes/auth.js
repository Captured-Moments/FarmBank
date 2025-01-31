const mongoose = require('mongoose'); //mongoose
const express = require('express'); //express


const router = express.Router(); //router
const bcrypt = require('bcryptjs'); //bcryptjs (encryption)

const Room = require('../models/rooms'); //models
const User = require('../models/user'); //models

const { body, validationResult } = require('express-validator'); //validation 


const jwt = require('jsonwebtoken'); //jwt
const JWT_SECRET_KEY = "heytherethisisasecretkey"

const app = express(); //express


const fetchuser = require('../middleware/fetchuser'); //middleware


//route 1 : create user using post "/api/auth/createuser" . No login required

router.post('/createuser', [
    body('password', 'Password Should Be atleast Length Of 5').isLength({ min: 5 }),
    body('phone', 'Enter Valid Phone Number').isLength({ min: 10 }),
]
    , async (req, res) => {

        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() }); //validation 
            }

            let user = await User.findOne({ phone: req.body.phone }); //check if user exists
            if (user) {
                return res.status(400).json({ error: "User already exists , Signup using another phone number" });
            }
            else {

                const salt = await bcrypt.genSalt(10); //encrypt password
                const securedPassword = await bcrypt.hash(req.body.password, salt);

                let user = await User.create({

                    password: securedPassword,
                    phone: req.body.phone,
                });

                const data = {
                    user: {
                        id: user.id
                    }
                }

                var authToken = jwt.sign(data, JWT_SECRET_KEY); //create jwt token

                res.json(authToken);
            }

        }
        catch (error) {
            console.error(error.message);
            res.status(500).send("Internal Server Error while creating user");
        }


    });


//route  2: Enter details of users using post "/api/auth/enterdetails" .


router.post('/createuser/details', fetchuser, async (req, res) => {

    try {

        const { name, phone, state, district, village, pincode, email, profilepic, type } = req.body;
        const updatedUser = {};
        if (name) { updatedUser.name = name };
        if (phone) { updatedUser.phone = phone };
        if (state) { updatedUser.state = state };
        if (district) { updatedUser.district = district };
        if (village) { updatedUser.village = village };
        if (pincode) { updatedUser.pincode = pincode };
        if (email) { updatedUser.email = email };
        if (profilepic) { updatedUser.profilepic = profilepic };
        if (type) { updatedUser.type = type };
        if (req.user.id) { updatedUser.user = req.user.id };

        //find user and update it 
        var userId = req.user.id;
        let user = await User.findById(userId);
        if (!user) { return res.status(404).send("User Not Found") }


        user = await User.findByIdAndUpdate(userId, { $set: updatedUser }, { new: true });
        res.json(user);

    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error while creating user");
    }

});


//Route 3:Login a User using: POST "/api/auth/login".  login required


router.post('/login', [

    body('phone', 'Enter Valid PhoneNumber').isLength({ min: 10 }),
    body('password', 'Password should not be NULL').exists()
], async (req, res) => {
    const errors = validationResult(req);
        if (!errors.isEmpty()) {
            success = false;
            return res.status(400).json({ success: success, errors: errors.array() });

        }


    try {

        
        const { phone, password } = req.body;

        const user = await User.findOne({ phone: phone });

        if (!user) {
           return  res.status(400).json({ error: "Invalid credentials" });
        }
        else {

            const passwordCompare = await bcrypt.compare(password, user.password);

            if (!passwordCompare) {
                return res.status(400).json({ error: "Invalid credentials" });
            }

            const data = {
                user: {
                    id: user.id
                }
            }

            const authToken =  jwt.sign(data, JWT_SECRET_KEY);

            res.json({ authToken });
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error while Login user");
    }



});





//ROUTE 4: Get Loggedin User Details using: POST "/api/auth/getUser". Login required

router.post('/getuser', fetchuser, async (req, res) => {

    try {

        var userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send("Internal Error Occured while fetching user");
    }
});









module.exports = router;





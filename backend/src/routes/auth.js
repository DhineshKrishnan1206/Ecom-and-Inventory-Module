const express = require('express');
const router = express.Router();
const { register, login, logout, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword } = require("../controllers/auth");
const userAuth = require("../middlewares/userAuth");


router.post('/register',register);
router.post('/login',login);
router.post('/logout',logout);
router.post('/send-verify-otp', userAuth, sendVerifyOtp);
router.post('/verify-email', userAuth, verifyEmail);
router.get('/is-auth',userAuth,isAuthenticated);
router.post('/send-reset-otp',sendResetOtp);
router.post('/resetPassword',resetPassword);


module.exports = router;

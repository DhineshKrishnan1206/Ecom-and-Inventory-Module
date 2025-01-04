const { transporter } = require("../config/nodeMailer.js");
const { hashPassword, comparePassword } = require("../helpers/helper.js");
const userModel = require("../models/userModel.js");
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ success: false, message: "Missing details" });
    }
    try {

        const exsistingUser = await userModel.findOne({ email });

        if (exsistingUser) {
            return res.json({ success: false, message: "User already exsists" });
        }

        const hashedPassword = await hashPassword(password);

        const user = new userModel({ name, email, password: hashedPassword });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // sending welcome email

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Welcome to Ecom Website",
            text: `Welcome to Ecom website. Your account has been created with email ${email}`
        }

        try {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully");
        } catch (error) {
            console.error("Error sending email:", error);
        }
        return res.json({ success: true })

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: "Email and Password are required" });
    }

    try {

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Invalid email" });
        }

        let isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({ success: true })

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({ success: true, message: "Logged out" })
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

const sendVerifyOtp = async (req, res) => {

    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId);
        if (user.isAccountVerified) {
            res.json({ success: false, message: "Account Already verified" })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification Otp",
            text: `Your OTP is ${otp} Verify your account using OTP.`
        }

        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: "Verification Message sent on mail."})
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const verifyEmail = async (req, res) => {
    const {userId, otp} = req.body;

    if(!userId || !otp){
        return res.json({success: false, message: "Missing Details"});
    }

    try {
        const user = await userModel.findById(userId);

        if(!user){
            return res.json({success: false, message: "User not found"});
        }

        if(user.verifyOtp === '' || user.verifyOtp != otp){
            return res.json({success: false, message: "Invalid Otp"})
        }

        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success: false, message: "OTP Expired"})
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.json({success:true , message: "Email verified Successfully"});

    } catch (error) {
        return res.json({success:false , message: error.message})
    }
}

const isAuthenticated  = async(req,res) => {
    try {

        return res.json({ success: true })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

const sendResetOtp = async(req, res) => {
    const { email } = req.body;

    if(!email){
        return res.json({ success: false, message: "Provide Email Id" });
    }

    try {
        const user = await userModel.findOne({email});

        if(!user){
            return res.json({ success: false, message: "User not Found" });
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password Reset OTP",
            text: `Your OTP for resetting the password is ${otp}.
            Use this OTP to proceed with resetting your password.`
        }

        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: "OTP sent to your mail"});
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

const resetPassword = async(req, res) => {
    const {email, otp, newPassword} = req.body;

    if(!email || !otp || !newPassword){
        return res.json({ success: false, message: "Email, OTP and new password are required" });
    }

    try {
        const user = await userModel.findOne({email});

        if(!user){
            return res.json({ success: false, message: "User not Found" });
        }

        if(user.resetOtp === "" || user.resetOtp!== otp){
            return res.json({ success: false, message: "Invalid OTP" })
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.json({ success: false, message: "OTP Expired" })
        }

        const hashedPassword = await hashPassword(newPassword);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: "Password has been reset sucessfully" })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}
module.exports = { register, login, logout, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword };

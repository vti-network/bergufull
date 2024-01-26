// login.js
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const router = express();
const getDateTimeNow = require('./component/datetime');
const nodemailer = require('nodemailer');

const dbFilePath = './api/db/users.json';
let data = [];

try {
    const fileContent = fs.readFileSync(dbFilePath, 'utf8');
    data = JSON.parse(fileContent);
} catch (error) {}

router.get('/login/:email/:pin/:otp', (req, res) => {
    const { email, pin , otp} = req.params;
    const user = data.find(entry => entry.email === email && entry.pin === pin && entry.otp === otp);


    if (user) {
        const loginTime = getDateTimeNow();
        const token = generateToken(email, loginTime);

        user.token = token;

        res.cookie('token', token, { maxAge: 86400000, httpOnly: true });

        res.json({
            success: true,
            message: 'Authentication successful',
            alamat: user.alamat,
			secretKey: user.secretKey,		
            loginTime,
            token,
        });

        const updatedData = data.map(entry => (entry.email === email ? { ...entry, token } : entry));
        fs.writeFileSync(dbFilePath, JSON.stringify(updatedData, null, 2), 'utf8');
    } else {
        res.status(401).json({
            success: false,
            message: 'Authentication failed. Invalid email or pin.',
        });
    }
    console.log(user);
});

router.post('/login', async (req, res) => {
    const { email, pin } = req.body;
    
    const user = data.find(entry => entry.email === email && entry.pin === pin);
    
    if (user) {
        const loginTime = getDateTimeNow();
        const otp = Gotp();
        user.otp = otp;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'azpwkk@gmail.com',
                pass: 'ujwh sttm gfrq saln'
            }
        });

        try {
            const mailOptions = {
                from: 'azpwkk@gmail.com',
                to: email,
                subject: 'kode otp anda',
                text: `${loginTime}\npermintaan kode\nOTP: ${otp}\n`    
            };

            await transporter.sendMail(mailOptions);
            
            const updatedData = data.map(entry => (entry.email === email ? { ...entry, otp } : entry));
            fs.writeFileSync(dbFilePath, JSON.stringify(updatedData, null, 2), 'utf8');

            return res.json({
                success: true,
                message: 'otp dikirim via email',
                user: {
                    email: user.email,
                    otp: user.otp,
                },
                loginTime,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error sending OTP email',
            });
            console.log(user);
        }
    } else {
        return res.status(401).json({
            success: false,
            message: 'Authentication failed. Invalid email or pin.',
        });
        console.log(user);
    }
    console.log(user);
});

function Gotp() {
    const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    return randomNumber.toString(); 
}

function generateToken(email, loginTime) {
    const payload = {
        email,
        loginTime,
    };

    const secretKey = 'berguauthloginkey';
    const expiresIn = 86400;

    const token = jwt.sign(payload, secretKey, { expiresIn });
    return token;
}

module.exports = router;

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const router = express();
const getDateTimeNow = require('./component/datetime');
const sendEMAIL = require('./component/email');

const generatedHashes = {};
const dbusersPath = './api/db/users.json';
let datausers = [];
try {
    const fileContent = fs.readFileSync(dbusersPath, 'utf8');
    datausers = JSON.parse(fileContent);
} catch (error) {}

// /api/r
router.post('/', (req, res) => {
    const { email, pin } = req.body;

    if (!email || !pin) {
        res.status(400).json(
            { 
                success: false,
                message: 'Missing required parameters' 
            }
            );
        //console.log(res);
        return;
    }

    // Pengecekan apakah email sudah pernah di-generate
    const existingHashEntry = datausers.find(entry => entry.email === email);
    if (existingHashEntry) {
        const existingHash = existingHashEntry.alamat;
        //res.redirect('/register');
        res.status(302).json({
            success: false, 
            message: `${email} registered by ${existingHash}`
        });
        console.log(existingHashEntry);
        return;
    }

    const secretKey = crypto.randomBytes(32).toString('hex');
    const combinedString = `${email}:${pin}:${secretKey}`;
    const hash = crypto.createHash('sha256').update(combinedString).digest('hex');

    // Menyimpan hash yang sudah di-generate
    generatedHashes[`${email}:${pin}`] = hash;

    const toaddress = email;
    const otp = [`email: ${email}\npin: ${pin}\nalamat: ${hash}\nsecretkey: ${secretKey}`];
    sendEMAIL(toaddress, otp);

    //history
    const history = {
        created: getDateTimeNow(),
        transactions: [],
    };
    //txhash
    const txhash = [];

    // Menyimpan data ke dalam array
    const newDataUsers = {
        email,
        pin,
        alamat: 'x062' + hash,
        secretKey,
        balance: [
            {
                IDR: '0',
                BERGU: '0',
            },
        ],
        profile: [
            {
                name: '',
                handphone: '',
            },
        ],
        history: history,
        txhash: txhash,
        token: '',
        otp: '',
    };

    datausers.push(newDataUsers);
    fs.writeFileSync(dbusersPath, JSON.stringify(datausers, null, 2), 'utf8');

    //kirim respone json ke client
    res.json({
        success: true,
        message: 'Register successful',
        info: {
            email: email,
            pin: pin,
            alamat: `x062${hash}`,
            secretKey: secretKey,
        },
    });

    // cek by server
    console.log(newDataUsers);
});

module.exports = router;

//send.js
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const router = express();
const getDateTimeNow = require('./component/datetime');

const dbFilePath = './api/db/users.json';

router.get('/:alamat/:secretKey/:currency/:value/:alamatTujuan', (req, res) => {
    const { alamat, secretKey, currency, value, alamatTujuan } = req.params;
    const otp = Gotp();
    const txhash = crypto.createHash('sha256').update(`${alamat}:${currency}:${value}:${alamatTujuan}:${otp}`).digest('hex');
    let data = [];
    try {
        const fileContent = fs.readFileSync(dbFilePath, 'utf8');
        data = JSON.parse(fileContent);
    } catch (error) {
        res.status(500).send('Internal Server Error');
        return;
    }

    const senderIndex = data.findIndex(entry => entry.alamat === alamat && entry.secretKey === secretKey);

    if (senderIndex !== -1) {
        const fee = 500;
        const totalValue = parseInt(value);

        if (totalValue < 1000) {
            res.status(400).send('Minimum transaction 1000');
            return;
        }

        if (parseInt(data[senderIndex].balance[0][currency]) < totalValue + fee) {
            res.status(400).send(`Insufficient balance in ${currency}`);
            return;
        }

        const receiverIndex = data.findIndex(entry => entry.alamat === alamatTujuan);

        if (receiverIndex !== -1) {
            data[senderIndex].balance[0][currency] = (parseInt(data[senderIndex].balance[0][currency]) - (totalValue + fee)).toString();
            data[receiverIndex].balance[0][currency] = (parseInt(data[receiverIndex].balance[0][currency]) + totalValue).toString();
            
            // const validasihash = [
            //     'x062' + txhash,
            // ]

            //pengirim
            const hsSender = {
                date_time: getDateTimeNow(),
                opt: 'kirim',
                currency,
                value: totalValue.toString(), 
                //value: (totalValue + fee).toString(), 
                pengirim: alamat,
                penerima: alamatTujuan
            };

            if (!data[senderIndex].history) {
                data[senderIndex].history = { transactions: [] };
            }

            data[senderIndex].history.transactions.push(hsSender);
            //data[senderIndex].txhash.txhash.push(validasihash);

            //penerima
            const hsReceiver = {
                date_time: getDateTimeNow(),
                opt: 'terima',
                currency,
                value: totalValue.toString(),
                penerima: alamatTujuan,
                pengirim: alamat
            };

            if (!data[receiverIndex].history) {
                data[receiverIndex].history = { transactions: [] };
            }

            data[receiverIndex].history.transactions.push(hsReceiver);
            data[receiverIndex].txhash.push(txhash);

            fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
            res.json({
                success: true,
                message: 'send successful with fee 500',
            });
            // res.json(data[senderIndex].history.transactions);
            // res.json(data[receiverIndex].history.transactions);

            console.log(data[senderIndex].history.transactions);
            console.log(data[receiverIndex].history.transactions);
        } else {
            res.status(404).send('Receiver data not found');
        }
    } else {
        res.status(404).send('Sender data not found');
    }
});

function Gotp() {
    const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    return randomNumber.toString(); 
}
module.exports = router;
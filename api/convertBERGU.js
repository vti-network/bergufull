// convertbergu.js
const express = require('express');
const router = express();
const fs = require('fs');
const getDateTimeNow = require('./component/datetime');

const dbFilePath = './api/db/users.json';

// Middleware untuk membaca data dari file
const bacaDataDariFile = () => {
    try {
        const kontenFile = fs.readFileSync(dbFilePath, 'utf8');
        return JSON.parse(kontenFile);
    } catch (error) {
        console.error(error);
        return [];
    }
};

// Rute untuk mengonversi BERGU ke IDR
router.get('/:alamat/:secretKey/BERGU/:berguAmount/IDR', (req, res) => {
    const {alamat, secretKey, berguAmount } = req.params;

    // Validasi berguAmount
    const berguAmountTerparse = parseInt(berguAmount);
    if (isNaN(berguAmountTerparse) || berguAmountTerparse <= 0) {
        res.status(400).send('Jumlah bergu tidak valid');
        return;
    }

    // Baca data dari file menggunakan middleware
    let data = bacaDataDariFile();

    // Temukan data berdasarkan secretKey
    const indeksDataDitemukan = data.findIndex(entry => entry.alamat === alamat && entry.secretKey === secretKey);

    if (indeksDataDitemukan !== -1) {
        // Jika data ditemukan, konversi bergu ke IDR dengan biaya
        const biayaGas = 500; // Biaya gas untuk konversi
        const jumlahTerkonversi = berguAmountTerparse - biayaGas;

        // Periksa apakah pengguna memiliki saldo cukup di bergu
        if (parseInt(data[indeksDataDitemukan].balance[0].BERGU) < berguAmountTerparse) {
            //res.status(400).send('Saldo bergu tidak mencukupi');
            res.status(400).json({
                success: false,
                message: 'Saldo BERGU tidak mencukupi',
            });
            return;
        }

        // Perbarui saldo
        data[indeksDataDitemukan].balance[0].BERGU = (parseInt(data[indeksDataDitemukan].balance[0].BERGU) - berguAmountTerparse).toString();
        data[indeksDataDitemukan].balance[0].IDR = (parseInt(data[indeksDataDitemukan].balance[0].IDR) + jumlahTerkonversi).toString();

        // Buat entri histori
        const hs = {
            date_time: getDateTimeNow(),
            opt: 'convert',
            value: berguAmountTerparse,
            currency: 'bergu > idr',
            pengirim: alamat,
            penerima: alamat
        };

        if (!data[indeksDataDitemukan].history) {
            data[indeksDataDitemukan].history = { transactions: [] };
        }

        data[indeksDataDitemukan].history.transactions.push(hs);

        // Perbarui file dengan data yang telah dimodifikasi
        try {
            fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
            // Respon dengan data yang diperbarui
            //res.json(data[indeksDataDitemukan].history.transactions);
            res.json({
                success: true,
                message: 'convert bergu to idr successful',
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error saat memperbarui data');
        }
    } else {
        // Jika data tidak ditemukan, kirim respons 404
        res.status(404).send('Data tidak ditemukan');
    }
});

module.exports = router;

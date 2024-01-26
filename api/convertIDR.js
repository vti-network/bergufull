// convertIDR.js
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

// Middleware untuk validasi jumlah IDR
const validasiJumlahIDR = (req, res, next) => {
    const { idrAmount } = req.params;
    const idrAmountTerparse = parseInt(idrAmount);

    if (isNaN(idrAmountTerparse) || idrAmountTerparse <= 0) {
        res.status(400).send('Jumlah IDR tidak valid');
        return;
    }

    next();
};

// Rute untuk mengonversi IDR ke BERGU
router.get('/:alamat/:secretKey/IDR/:idrAmount/BERGU', validasiJumlahIDR, (req, res) => {
    const { alamat, secretKey, idrAmount } = req.params;

    // Baca data dari file menggunakan middleware
    let data = bacaDataDariFile();

    // Temukan data berdasarkan secretKey
    const indeksDataDitemukan = data.findIndex(entry => entry.alamat === alamat && entry.secretKey === secretKey);

    if (indeksDataDitemukan !== -1) {
        // Jika data ditemukan, konversi IDR ke BERGU dengan biaya
        const biayaGas = 500; // Biaya gas untuk konversi
        const jumlahTerkonversi = parseInt(idrAmount) - biayaGas;

        // Periksa apakah pengguna memiliki saldo cukup di IDR
        if (parseInt(data[indeksDataDitemukan].balance[0].IDR) < parseInt(idrAmount)) {
            //res.status(400).send('Saldo IDR tidak mencukupi');
            res.status(400).json({
                success: false,
                message: 'Saldo IDR tidak mencukupi',
            });
            return;
        }

        // Perbarui saldo
        data[indeksDataDitemukan].balance[0].IDR = (parseInt(data[indeksDataDitemukan].balance[0].IDR) - parseInt(idrAmount)).toString();
        data[indeksDataDitemukan].balance[0].BERGU = (parseInt(data[indeksDataDitemukan].balance[0].BERGU) + jumlahTerkonversi).toString();

        // Buat entri histori
        const hs = {
            date_time: getDateTimeNow(),
            opt: 'convert',
            value: parseInt(idrAmount),
            currency: 'idr > bergu',
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
                //kirim respone json ke client
                res.json({
                    success: true,
                    message: 'convert idr to bergu successful',
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


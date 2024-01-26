//jwt.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

function jwt(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      token += characters.charAt(randomIndex);
    }
    return token;
}


module.exports = jwt;

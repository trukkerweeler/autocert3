const express = require('express');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const router = express.Router();

router.get('/parse-file', (req, res) => {
    const filePath = path.join(__dirname, '../data/sample.xml');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file');
        }
        const parser = new xml2js.Parser();
        parser.parseString(data, (parseErr, result) => {
            if (parseErr) {
                return res.status(500).send('Error parsing XML file');
            }
            res.json(result);
        });
    });
});

module.exports = router;
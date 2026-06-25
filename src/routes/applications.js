const express = require('express');
const router = express.Router();

let applications = [];

router.get('/', (req, res) => {
    res.json({ success: true, data: applications });
});

router.post('/', (req, res) => {
    const newApp = {
        _id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    applications.push(newApp);
    res.status(201).json({ success: true, data: newApp });
});

module.exports = router;

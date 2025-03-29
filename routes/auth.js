const express = require('express');
const router = express.Router();

// Existing routes
router.get('/listings', (req, res) => {
    // Your existing code for listings
});

// New route for Recycling Initiative
router.get('/recycling', (req, res) => {
    res.render('recycling', { user: null }); // Render the recycling view with a mock user object
});

// Other existing routes
router.get('/signup', (req, res) => {
    // Your existing code for signup
});

router.get('/login', (req, res) => {
    // Your existing code for login
});

module.exports = router;

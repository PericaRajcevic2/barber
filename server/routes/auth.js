const express = require('express');
const router = express.Router();

// Početna autentifikacija - kasnije ćemo dodati pravi login sistem
router.post('/login', (req, res) => {
  // Za sada hardcode admin login
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { name: 'Admin', role: 'admin' }
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials' 
    });
  }
});

module.exports = router;
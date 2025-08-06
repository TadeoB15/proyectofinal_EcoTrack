// ==========================================
// routes/auth.js
// ==========================================
const express = require('express');
const DatabaseService = require('../services/DatabaseService');
const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await DatabaseService.authenticateUser(email, password);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

// MIDDLEWARE AUTH
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    req.user = await DatabaseService.verifyToken(token);
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// ==========================================
// routes/operations.js  
// ==========================================

// GET ASSIGNMENTS (Recolectores)
router.get('/assignments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const assignments = await DatabaseService.getUserAssignments(req.user.userId);
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET INCIDENTS (Empleados)
router.get('/incidents', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Obtener company_mongo_id del usuario
    const userQuery = `
      SELECT c.mongo_company_id 
      FROM users u 
      JOIN companies c ON u.company_id = c.company_id 
      WHERE u.user_id = $1
    `;
    const result = await DatabaseService.pgPool.query(userQuery, [req.user.userId]);
    const companyMongoId = result.rows[0]?.mongo_company_id;
    
    const incidents = await DatabaseService.getCompanyIncidents(companyMongoId);
    res.json({ success: true, incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE INCIDENT
router.post('/incidents', authenticateToken, async (req, res) => {
  try {
    const incident = await DatabaseService.createIncident(req.user.userId, req.body);
    res.json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const DatabaseService = require('./services/DatabaseService');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb'); // Agregar importación de MongoDB

const app = express();
const PORT = process.env.PORT || 3000;

// Variables globales para las conexiones
let mongoDb = null;

// ==========================================
// CONFIGURACIÓN DE MONGODB
// ==========================================
async function connectToMongoDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    await client.connect();
    mongoDb = client.db('ecotrack_data');
    
    console.log('✅ Connected to MongoDB');
    
    // Hacer que la DB esté disponible para las rutas
    app.set('mongoDb', mongoDb);
    
    return mongoDb;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// ==========================================
// INICIALIZACIÓN DE LA APP
// ==========================================
async function initializeApp() {
  try {
    await connectToMongoDB();
    console.log('🎯 App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

// Middleware básico
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para convertir a CNT a CTN
app.use('/containers/:containerId/*', (req, res, next) => {
  if (req.params.containerId.startsWith('CNT-')) {
    const originalId = req.params.containerId;
    req.params.containerId = originalId.replace('CNT-', 'CTN-');
    console.log(`🔄 Auto-converted container ID: ${originalId} → ${req.params.containerId}`);
  }
  next();
});

// También para rutas directas de contenedor
app.use('/containers/:containerId', (req, res, next) => {
  if (req.params.containerId.startsWith('CNT-')) {
    const originalId = req.params.containerId;
    req.params.containerId = originalId.replace('CNT-', 'CTN-');
    console.log(`🔄 Auto-converted container ID: ${originalId} → ${req.params.containerId}`);
  }
  next();
});

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN (DECLARAR PRIMERO)
// ==========================================
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = await DatabaseService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ==========================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ==========================================

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'EcoTrack API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Test de conexiones
app.get('/test-db', async (req, res) => {
  try {
    const connected = await DatabaseService.testConnections();
    res.json({
      success: connected,
      message: connected ? 'All databases connected' : 'Connection issues',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message
    });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    const result = await DatabaseService.authenticateUser(username, password);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

// ==========================================
// RUTAS PROTEGIDAS (CON AUTENTICACIÓN)
// ==========================================

// Logout
app.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User Profile
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await DatabaseService.getUserProfile(req.user.userId);
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ENDPOINTS PARA COLLECTORS
// ==========================================

// 1. GET Assignments
app.get('/assignments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const assignments = await DatabaseService.getUserAssignments(req.user.userId);
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET Available Containers
app.get('/available-containers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const containers = await DatabaseService.getAvailableContainers(req.user.userId);
    res.json({ success: true, containers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST Create Route - MEJORADO con limpieza automática
app.post('/routes', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const { container_ids, estimated_duration } = req.body;
    
    if (!container_ids || !Array.isArray(container_ids) || container_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Container IDs array is required' 
      });
    }

    console.log(`🔄 Creating new route for user ${req.user.userId}`);
    console.log(`📦 Selected containers:`, container_ids);
    
    const route = await DatabaseService.createRoute(req.user.userId, {
      container_ids,
      estimated_duration
    });

    const response = {
      success: true,
      route,
      message: `Route created successfully${route.cleaned_previous > 0 ? ` (cleaned ${route.cleaned_previous} previous routes)` : ''}`
    };

    console.log(`✅ Route creation response:`, response);
    
    res.status(201).json(response);
  } catch (error) {
    console.error('❌ Error in route creation endpoint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// 4. PUT Start Route - SIMPLIFICADO
app.put('/routes/:routeId/start', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const { routeId } = req.params;
    const route = await DatabaseService.startRoute(routeId, req.user.userId);
    
    res.status(200).json({
      success: true,
      message: 'Route started successfully',
      route
    });
    
  } catch (error) {
    console.error('Error starting route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. PUT Pause Route
app.put('/routes/:routeId/pause', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const { routeId } = req.params;
    const route = await DatabaseService.pauseRoute(routeId, req.user.userId);
    
    res.json({ success: true, route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. PUT Resume Route
app.put('/routes/:routeId/resume', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const { routeId } = req.params;
    const route = await DatabaseService.resumeRoute(routeId, req.user.userId);
    
    res.json({ success: true, route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. PUT Finish Route - SIMPLIFICADO
app.put('/routes/:routeId/finish', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const { routeId } = req.params;
    const route = await DatabaseService.finishRoute(routeId, req.user.userId);
    
    res.status(200).json({
      success: true,
      message: 'Route finished successfully',
      route
    });

  } catch (error) {
    console.error(`❌ Error finishing route:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 8. POST Mark Container as Collected - MEJORADO
app.post('/containers/:containerId/collect', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const { containerId } = req.params;
    const { route_id, notes, fill_level_before } = req.body;
    
    console.log(`🔄 Processing collection for container ${containerId}`);
    
    // Usar el método actualizado que hace el "trigger"
    const collection = await DatabaseService.markContainerCollected(containerId, {
      collector_id: req.user.userId,
      route_id,
      notes: notes || 'Collected by collector',
      fill_level_before: fill_level_before || 0
    });
    
    console.log(`✅ Collection processed successfully:`, collection);
    
    res.json({ 
      success: true, 
      collection,
      message: `Container ${containerId} collected and sensor updated to 0%`
    });
  } catch (error) {
    console.error('❌ Error in collect endpoint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// 9. GET Collection History - MEJORADO
app.get('/collection-history', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const { page = 1, limit = 20, date_from, date_to, company } = req.query;
    
    console.log(`📋 Getting collection history - Page: ${page}, Limit: ${limit}`);
    
    const result = await DatabaseService.getCollectionHistory(req.user.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      date_from,
      date_to,
      company
    });
    
    res.json({ 
      success: true, 
      ...result,
      message: `Found ${result.history.length} collection records`
    });
  } catch (error) {
    console.error('❌ Error getting collection history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. GET Assignment Incidents
app.get('/assignment-incidents', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const incidents = await DatabaseService.getAssignmentIncidents(req.user.userId);
    res.json({ success: true, incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



// 11. GET Current Route
app.get('/current-route', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ success: false, message: 'Access denied - Collectors only' });
    }
    
    const route = await DatabaseService.getCurrentRoute(req.user.userId);
    res.json({ success: true, route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// 12. GET Container Details - Obtener detalles específicos de un contenedor
app.get('/containers/:containerId/details', authenticateToken, async (req, res) => {
  try {
    const { containerId } = req.params;
    
    const containerDetails = await DatabaseService.getContainerDetails(containerId);
    
    res.json({ 
      success: true, 
      container: containerDetails,
      message: `Container ${containerId} details retrieved successfully`
    });
  } catch (error) {
    console.error(`Error getting container ${req.params.containerId} details:`, error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 13. GET Company Containers - Obtener contenedores de una empresa específica
//  ENDPOINT CORREGIDO PARA COLLECTORS
app.get('/companies/:companyId/containers', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log(`📦 [ENDPOINT] Getting containers for company: ${companyId}`);
    console.log(`👤 User role: ${req.user.role}, User ID: ${req.user.userId}`);
    
    //  LLAMAR AL MÉTODO CORRECTO PARA COLLECTORS
    const containers = await DatabaseService.getCompanyContainers(companyId);
    
    res.json({ 
      success: true, 
      containers: containers,
      message: `${containers.length} containers found for company ${companyId}`
    });
  } catch (error) {
    console.error(`❌ Error getting containers for company ${req.params.companyId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// DEBUG: Endpoint para verificar datos de contenedores
// DEBUG: Endpoint para verificar estructura de datos
app.get('/debug/company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log(`🔍 Debug request for company: ${companyId}`);
    
    const debugData = await DatabaseService.debugContainerData(companyId);
    
    res.json({
      success: true,
      companyId,
      debugData
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 DEBUG: Test específico para una empresa
app.get('/debug/test-company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log(`🔍 Testing company: ${companyId}`);
    
    if (!DatabaseService.mongoDB) {
      await DatabaseService.connectMongo();
    }

    // Consulta directa simple
    const directQuery = await DatabaseService.mongoDB.collection('containers').find({
      company_id: companyId,
      status: 'active'
    }).toArray();

    console.log(`🔍 Direct query results for ${companyId}:`, directQuery.length);

    // Usar el método getCompanyContainers
    const methodResult = await DatabaseService.getCompanyContainers(companyId);

    res.json({
      success: true,
      companyId,
      directQuery: {
        count: directQuery.length,
        containers: directQuery.map(c => ({
          container_id: c.container_id,
          type: c.type,
          device_id: c.device_id,
          status: c.status
        }))
      },
      methodResult: {
        count: methodResult.length,
        containers: methodResult.map(c => ({
          container_id: c.container_id,
          type: c.type,
          percentage: c.percentage,
          device_id: c.device_id
        }))
      }
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});


// ==========================================
// ENDPOINTS PARA EMPLOYEES
// ==========================================

// GET Incidents for employees
app.get('/incidents', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied - Employees only' });
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
    
    if (!companyMongoId) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    const incidents = await DatabaseService.getCompanyIncidents(companyMongoId);
    res.json({ success: true, incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE Incident
app.post('/incidents', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied - Employees only' });
    }
    
    const incident = await DatabaseService.createIncident(req.user.userId, req.body);
    res.status(201).json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Company containers for employees
app.get('/company-containers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied - Employees only' });
    }
    
    console.log(`📦 [EMPLOYEE ENDPOINT] Getting containers for user ${req.user.userId}`);
    
    // LLAMAR AL MÉTODO CORRECTO PARA EMPLOYEES
    const containers = await DatabaseService.getEmployeeCompanyContainers(req.user.userId);
    res.json({ success: true, containers });
  } catch (error) {
    console.error('❌ Error getting employee company containers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
// MANEJO DE ERRORES Y SERVIDOR
// ==========================================

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /test-db',
      'POST /login',
      'POST /logout',
      'GET /profile',
      'GET /assignments',
      'GET /available-containers',
      'POST /routes',
      'PUT /routes/:id/start',
      'PUT /routes/:id/pause',
      'PUT /routes/:id/resume',
      'PUT /routes/:id/finish',
      'POST /containers/:id/collect',
      'GET /collection-history',
      'GET /assignment-incidents',
      'GET /current-route',
      'GET /incidents',
      'POST /incidents',
      'GET /company-containers'
    ]
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
async function startServer() {
  try {
    await initializeApp();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 EcoTrack API Server running on:`);
      console.log(`   Local:    http://localhost:${PORT}`);
      console.log(`   Network:  http://192.168.1.71:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 Available endpoints: ${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
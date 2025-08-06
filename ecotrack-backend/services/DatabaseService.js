const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');

class DatabaseService {
  constructor() {
    // Conexión PostgreSQL
    this.pgPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'ecotrack_users',
      password: process.env.DB_PASSWORD || '123',
      port: process.env.DB_PORT || 5432,
    });
    
    // Conexión MongoDB
    this.mongoClient = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');
    this.mongoDB = null;

    // Conectar a MongoDB al inicializar
    this.connectMongo();
  }

  async connectMongo() {
    try {
      await this.mongoClient.connect();
      this.mongoDB = this.mongoClient.db('ecotrack_operations'); // Tu nombre de BD
      console.log('✅ Connected to MongoDB (ecotrack_operations)');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
    }
  }

  // ==========================================
  // TEST DE CONEXIONES
  // ==========================================
  async testConnections() {
    try {
      // Test PostgreSQL
      const pgResult = await this.pgPool.query('SELECT NOW()');
      console.log('✅ PostgreSQL connected:', pgResult.rows[0].now);
      
      // Test MongoDB
      if (this.mongoDB) {
        await this.mongoDB.admin().ping();
        console.log('✅ MongoDB connected');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database connection error:', error);
      return false;
    }
  }

  // ==========================================
  // AUTENTICACIÓN Y JWT
  // ==========================================
  async authenticateUser(username, password) {
    try {
      // 1. Buscar usuario en PostgreSQL
      const query = `
        SELECT u.*, c.mongo_company_id 
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.company_id 
        WHERE u.username = $1 AND u.active = true
      `;
      
      const result = await this.pgPool.query(query, [username]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      
      // 2. Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.contrasena_hash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }
      
      // 3. Generar JWT
      const token = jwt.sign(
        { 
          userId: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          companyId: user.company_id
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // 4. Actualizar último login
      await this.pgPool.query(
        'UPDATE users SET last_login = NOW() WHERE user_id = $1',
        [user.user_id]
      );
      
      return {
        token,
        user: {
          id: user.user_id,
          username: user.username,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          role: user.role,
          companyId: user.company_id,
          mongoCompanyId: user.mongo_company_id,
          photo: user.photo,
          lastLogin: user.last_login
        }
      };
      
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar que el usuario sigue activo
      const query = 'SELECT user_id, active FROM users WHERE user_id = $1';
      const result = await this.pgPool.query(query, [decoded.userId]);
      
      if (result.rows.length === 0 || !result.rows[0].active) {
        throw new Error('User not found or inactive');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserProfile(userId) {
    try {
      const query = `
        SELECT 
          u.user_id,
          u.username,
          u.nombre,
          u.apellido,
          u.email,
          u.role,
          u.telefono,
          u.created_at,
          c.name as company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.company_id
        WHERE u.user_id = $1
      `;
      
      const result = await this.pgPool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting user profile: ${error.message}`);
    }
  }

  // ==========================================
  // MÉTODOS PARA COLLECTORS - CORREGIDOS
  // ==========================================
  async getUserAssignments(userId) {
    try {
      if (!this.mongoDB) await this.connectMongo();
      
      return await this.mongoDB.collection('assignments').find({
        collector_id: userId.toString(),
        status: 'active'
      }).toArray();
    } catch (error) {
      throw new Error(`Error getting user assignments: ${error.message}`);
    }
  }

  async getAvailableContainers(userId) {
    try {
      if (!this.mongoDB) await this.connectMongo();
      
      console.log(`Getting available containers for user ${userId}`);
      
      // Obtener asignaciones
      const assignments = await this.mongoDB.collection('assignments').find({
        collector_id: userId.toString(),
        status: 'active'
      }).toArray();
      
      if (assignments.length === 0) {
        console.log('No active assignments found');
        return [];
      }
      
      const assignedCompanies = assignments.flatMap(a => a.companies);
      console.log('📋 Assigned companies:', assignedCompanies);
      
      // ✅ VERIFICAR QUE BUSQUE CTN
      const containers = await this.mongoDB.collection('containers').aggregate([
        {
          $match: {
            company_id: { $in: assignedCompanies },
            status: 'active',
            container_id: { $regex: "^CTN-" } // 
          }
        },
        {
          $lookup: {
            from: 'sensor_data',
            localField: 'device_id',
            foreignField: 'device_id',
            as: 'latest_data',
            pipeline: [
              { $sort: { timestamp: -1 } },
              { $limit: 1 }
            ]
          }
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'company_id',
            foreignField: 'company_id',
            as: 'company_info'
          }
        },
        {
          $match: {
            $expr: {
              $or: [
                // Contenedores normales >= 70%
                {
                  $and: [
                    { $eq: ['$type', 'normal'] },
                    { $gte: [{ $arrayElemAt: ['$latest_data.readings.fill_level', 0] }, 70] }
                  ]
                },
                // Contenedores biohazard >= 50%
                {
                  $and: [
                    { $eq: ['$type', 'biohazard'] },
                    { $gte: [{ $arrayElemAt: ['$latest_data.readings.fill_level', 0] }, 50] }
                  ]
                }
              ]
            }
          }
        },
        {
          $project: {
            id: '$container_id', // ✅ DEVOLVER CTN-XXX
            company_id: 1,
            company_name: { $arrayElemAt: ['$company_info.name', 0] },
            type: 1,
            fill_level: { 
              $ifNull: [
                { $arrayElemAt: ['$latest_data.readings.fill_level', 0] }, 
                0
              ]
            },
            location: {
              latitude: { $arrayElemAt: ['$location.coordinates', 1] },
              longitude: { $arrayElemAt: ['$location.coordinates', 0] }
            },
            priority: {
              $switch: {
                branches: [
                  { case: { $and: [{ $eq: ['$type', 'biohazard'] }, { $gte: [{ $arrayElemAt: ['$latest_data.readings.fill_level', 0] }, 90] }] }, then: 'critical' },
                  { case: { $and: [{ $eq: ['$type', 'biohazard'] }, { $gte: [{ $arrayElemAt: ['$latest_data.readings.fill_level', 0] }, 75] }] }, then: 'high' },
                  { case: { $eq: ['$type', 'biohazard'] }, then: 'medium' },
                  { case: { $gte: [{ $arrayElemAt: ['$latest_data.readings.fill_level', 0] }, 90] }, then: 'high' },
                  { case: { $gte: [{ $arrayElemAt: ['$latest_data.readings.fill_level', 0] }, 80] }, then: 'medium' }
                ],
                default: 'low'
              }
            },
            estimated_time: {
              $cond: {
                if: { $eq: ['$type', 'biohazard'] },
                then: 15,
                else: 10
              }
            }
          }
        },
        {
          $sort: {
            type: 1, // biohazard primero
            fill_level: -1 // nivel más alto primero
          }
        }
      ]).toArray();
      
      console.log(`✅ Found ${containers.length} containers ready for collection`);
      console.log('📦 Container IDs:', containers.map(c => c.id));
      
      return containers;
    } catch (error) {
      console.error('❌ Error getting available containers:', error);
      throw new Error(`Error getting available containers: ${error.message}`);
    }
  }


  //Limpiar rutas activas antes de crear una nueva
async finishActiveRoutes(userId) {
  try {
    console.log(`🧹 Cleaning active routes for user ${userId}`);

    // Asegurar conexión MongoDB
    if (!this.mongoDB) await this.connectMongo();
    
    const routesCollection = this.mongoDB.collection('routes');

    // Encontrar todas las rutas activas del usuario
    const activeRoutes = await routesCollection.find({
      collector_id: userId.toString(),
      status: { $in: ['planned', 'in_progress', 'paused'] }
    }).toArray();

    if (activeRoutes.length === 0) {
      console.log('ℹ️ No active routes found to clean');
      return { cleaned: 0 };
    }

    console.log(`🔄 Found ${activeRoutes.length} active route(s) to clean`);

    // Finalizar todas las rutas activas
    const updateResult = await routesCollection.updateMany(
      {
        collector_id: userId.toString(),
        status: { $in: ['planned', 'in_progress', 'paused'] }
      },
      {
        $set: {
          status: 'completed',
          completed_at: new Date(),
          updated_at: new Date(),
          auto_completed: true // ✅ Marcar como completada automáticamente
        }
      }
    );

    console.log(`✅ Cleaned ${updateResult.modifiedCount} active routes`);

    return {
      cleaned: updateResult.modifiedCount,
      routes: activeRoutes.map(r => r.route_id)
    };

  } catch (error) {
    console.error('❌ Error cleaning active routes:', error);
    throw new Error(`Error cleaning active routes: ${error.message}`);
  }
}


// Crear rutas
async createRoute(userId, routeData) {
  try {
    const { container_ids, estimated_duration } = routeData;
    
    console.log(`📝 Creating route for user ${userId} with containers:`, container_ids);

    // 🎯 PASO 1: Limpiar rutas activas primero
    const cleanResult = await this.finishActiveRoutes(userId);
    if (cleanResult.cleaned > 0) {
      console.log(`🧹 Cleaned ${cleanResult.cleaned} previous active routes:`, cleanResult.routes);
    }

    // Generar ID único para la ruta
    const routeId = `ROUTE-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-${Date.now()}`;

    // Asegurar conexión MongoDB
    if (!this.mongoDB) await this.connectMongo();
    
    // 🎯 OBTENER DATOS COMPLETOS DE LOS CONTENEDORES CON NIVELES DE LLENADO ACTUALES
    const containersWithData = await this.mongoDB.collection('containers').aggregate([
      {
        $match: { container_id: { $in: container_ids } }
      },
      {
        $lookup: {
          from: 'sensor_data',
          localField: 'device_id',
          foreignField: 'device_id',
          as: 'latest_sensor_data',
          pipeline: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ]
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company_id',
          foreignField: 'company_id',
          as: 'company_info'
        }
      },
      {
        $project: {
          container_id: 1,
          company_id: 1,
          type: 1,
          status: 1,
          location: 1,
          device_id: 1,
          company_name: { $arrayElemAt: ['$company_info.name', 0] },
          current_fill_level: { $arrayElemAt: ['$latest_sensor_data.readings.fill_level', 0] },
          current_temperature: { $arrayElemAt: ['$latest_sensor_data.readings.temperature', 0] },
          current_humidity: { $arrayElemAt: ['$latest_sensor_data.readings.humidity', 0] },
          current_co2: { $arrayElemAt: ['$latest_sensor_data.readings.co2', 0] },
          current_methane: { $arrayElemAt: ['$latest_sensor_data.readings.methane', 0] },
          current_battery: { $arrayElemAt: ['$latest_sensor_data.readings.battery_level', 0] },
          sensor_timestamp: { $arrayElemAt: ['$latest_sensor_data.timestamp', 0] }
        }
      }
    ]).toArray();

    // Crear contenedores planeados con datos reales
    const planned_containers = containersWithData.map(container => ({
      container_id: container.container_id,
      company_id: container.company_id,
      company_name: container.company_name,
      type: container.type,
      status: container.status,
      fill_level_at_planning: container.current_fill_level || 0, // ✅ NIVEL REAL
      temperature_at_planning: container.current_temperature || 25.0,
      humidity_at_planning: container.current_humidity || 50.0,
      co2_at_planning: container.current_co2 || 400,
      methane_at_planning: container.current_methane || 80,
      battery_at_planning: container.current_battery || 100,
      sensor_timestamp: container.sensor_timestamp || new Date(),
      location: {
        latitude: container.location?.coordinates[1] || 0,
        longitude: container.location?.coordinates[0] || 0
      },
      completed_at: null,
      collection_method: null,
      estimated_time: container.type === 'biohazard' ? 15 : 10
    }));

    // Estadísticas del contenedor
    const container_summary = {
      total_containers: planned_containers.length,
      total_normal: planned_containers.filter(c => c.type === 'normal').length,
      total_biohazard: planned_containers.filter(c => c.type === 'biohazard').length,
      avg_fill_level: Math.round(planned_containers.reduce((sum, c) => sum + c.fill_level_at_planning, 0) / planned_containers.length),
      critical_containers: planned_containers.filter(c => 
        (c.type === 'biohazard' && c.fill_level_at_planning >= 90) ||
        (c.type === 'normal' && c.fill_level_at_planning >= 90)
      ).length
    };

    // Crear objeto de ruta para MongoDB
    const routeDocument = {
      route_id: routeId,
      assignment_id: `ASSIGN-${userId === '2' ? '001' : '002'}`, // Asignación correspondiente
      collector_id: userId.toString(),
      date: new Date(),
      planned_containers: planned_containers, // ✅ DATOS COMPLETOS
      containers: planned_containers, // Para compatibilidad con frontend
      container_summary: container_summary,
      status: 'planned', // ✅ SIEMPRE EMPEZAR EN 'planned'
      completed_containers: 0,
      estimated_duration: estimated_duration || 60,
      created_at: new Date(),
      started_at: null,
      completed_at: null,
      paused_at: null,
      resumed_at: null,
      updated_at: new Date(),
      previous_routes_cleaned: cleanResult.routes // ✅ Log de rutas limpiadas
    };

    // Insertar en MongoDB
    const insertResult = await this.mongoDB.collection('routes').insertOne(routeDocument);

    if (!insertResult.acknowledged) {
      throw new Error('Failed to create route in MongoDB');
    }

    console.log(`✅ Route ${routeId} created successfully with real container data`);

    return {
      route_id: routeId,
      collector_id: userId,
      container_count: planned_containers.length,
      status: 'planned',
      created_at: routeDocument.created_at,
      containers: planned_containers, // ✅ Devolver datos completos
      cleaned_previous: cleanResult.cleaned
    };

  } catch (error) {
    console.error('❌ Error creating route:', error);
    throw new Error(`Error creating route: ${error.message}`);
  }
}


  // INICIAR RUTA - CORREGIDO (método de instancia)
  async startRoute(routeId, userId) {
    try {
      console.log(`🚀 Starting route ${routeId} for user ${userId}`);

      // Asegurar conexión MongoDB
      if (!this.mongoDB) await this.connectMongo();
      
      const routesCollection = this.mongoDB.collection('routes');

      // Verificar que la ruta existe y está en estado 'planned'
      const route = await routesCollection.findOne({
        route_id: routeId,
        collector_id: userId.toString()
      });

      if (!route) {
        throw new Error('Route not found');
      }

      if (route.status !== 'planned') {
        throw new Error(`Route cannot be started. Current status: ${route.status}`);
      }

      // Actualizar estado a 'in_progress'
      const updateResult = await routesCollection.updateOne(
        { 
          route_id: routeId,
          collector_id: userId.toString()
        },
        {
          $set: {
            status: 'in_progress',
            started_at: new Date(),
            updated_at: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        throw new Error('Failed to start route');
      }

      // Obtener ruta actualizada
      const updatedRoute = await routesCollection.findOne({
        route_id: routeId,
        collector_id: userId.toString()
      });

      console.log(`✅ Route ${routeId} started successfully`);

      return {
        route_id: updatedRoute.route_id,
        status: updatedRoute.status,
        started_at: updatedRoute.started_at,
        collector_id: updatedRoute.collector_id
      };

    } catch (error) {
      console.error('❌ Error starting route:', error);
      throw new Error(`Error starting route: ${error.message}`);
    }
  }

  async pauseRoute(routeId, userId) {
    try {
      if (!this.mongoDB) await this.connectMongo();
      
      const result = await this.mongoDB.collection('routes').updateOne(
        { 
          route_id: routeId, 
          collector_id: userId.toString(), 
          status: 'in_progress' 
        },
        {
          $set: {
            status: 'paused',
            paused_at: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Route not found or cannot be paused');
      }
      
      const route = await this.mongoDB.collection('routes').findOne({ route_id: routeId });
      return route;
    } catch (error) {
      throw new Error(`Error pausing route: ${error.message}`);
    }
  }

  async resumeRoute(routeId, userId) {
    try {
      if (!this.mongoDB) await this.connectMongo();
      
      const result = await this.mongoDB.collection('routes').updateOne(
        { 
          route_id: routeId, 
          collector_id: userId.toString(), 
          status: 'paused' 
        },
        {
          $set: {
            status: 'in_progress',
            resumed_at: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Route not found or cannot be resumed');
      }
      
      const route = await this.mongoDB.collection('routes').findOne({ route_id: routeId });
      return route;
    } catch (error) {
      throw new Error(`Error resuming route: ${error.message}`);
    }
  }

  // FINALIZAR RUTA - CORREGIDO (método de instancia)
  async finishRoute(routeId, userId) {
    try {
      console.log(`🏁 Attempting to finish route ${routeId} for user ${userId}`);

      // Asegurar conexión MongoDB
      if (!this.mongoDB) await this.connectMongo();
      
      const routesCollection = this.mongoDB.collection('routes');

      // 1. Verificar que la ruta existe en MongoDB y pertenece al usuario
      const route = await routesCollection.findOne({
        route_id: routeId,
        collector_id: userId.toString()
      });

      if (!route) {
        console.log(`❌ Route ${routeId} not found for user ${userId}`);
        throw new Error(`Route ${routeId} not found or access denied`);
      }

      console.log(`📊 Current route status: ${route.status}`);

      // 2. Verificar que esté en estado válido para finalizar
      const validStatuses = ['planned', 'in_progress', 'paused'];
      if (!validStatuses.includes(route.status)) {
        throw new Error(`Route ${routeId} cannot be finished. Current status: ${route.status}`);
      }

      // 3. Actualizar el estado de la ruta en MongoDB
      const updateResult = await routesCollection.updateOne(
        { 
          route_id: routeId,
          collector_id: userId.toString()
        },
        {
          $set: {
            status: 'completed',
            completed_at: new Date(),
            updated_at: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        throw new Error('Failed to update route status');
      }

      // 4. Obtener la ruta actualizada
      const updatedRoute = await routesCollection.findOne({
        route_id: routeId,
        collector_id: userId.toString()
      });

      console.log(`✅ Route ${routeId} finished successfully`);

      return {
        route_id: updatedRoute.route_id,
        status: updatedRoute.status,
        completed_at: updatedRoute.completed_at,
        collector_id: updatedRoute.collector_id
      };

    } catch (error) {
      console.error(`❌ Error finishing route:`, error);
      throw new Error(`Error finishing route: ${error.message}`);
    }
  }

  // MARCAR CONTENEDOR COMO RECOLECTADO - MEJORADO CON TRIGGER-LIKE
async markContainerCollected(containerId, data) {
  try {
    const { collector_id, route_id, notes, fill_level_before } = data;
    
    console.log(`📦 Marking container ${containerId} as collected for route ${route_id}`);

    // Asegurar conexión MongoDB
    if (!this.mongoDB) await this.connectMongo();
    
    const collectionsCollection = this.mongoDB.collection('collections');
    const sensorDataCollection = this.mongoDB.collection('sensor_data');
    const containersCollection = this.mongoDB.collection('containers');

    // 1. Obtener información del contenedor
    const container = await containersCollection.findOne({
      container_id: containerId
    });

    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    // 2. Crear registro de recolección
    const collectionDocument = {
      collection_id: `COLL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      container_id: containerId,
      route_id: route_id,
      collector_id: collector_id.toString(),
      collected_at: new Date(),
      notes: notes || 'Collected by collector',
      fill_level_before: fill_level_before || 0,
      fill_level_after: 0, // ✅ SIEMPRE 0% después de recolectar
      container_type: container.type,
      company_id: container.company_id,
      status: 'completed'
    };

    // 3. Insertar registro de recolección
    const insertResult = await collectionsCollection.insertOne(collectionDocument);

    if (!insertResult.acknowledged) {
      throw new Error('Failed to record collection in MongoDB');
    }

    // 4. 🎯 TRIGGER-LIKE: Actualizar sensor_data con fill_level al 0%
    const sensorUpdateResult = await sensorDataCollection.insertOne({
      device_id: container.device_id,
      timestamp: new Date(),
      readings: {
        temperature: 25.0, // Valores por defecto post-recolección
        humidity: 50,
        methane: 0,
        co2: 350,
        fill_level: 0, // ✅ 0% después de vaciar
        battery_level: 100
      },
      location: container.location,
      alerts: [],
      collection_event: true, // ✅ Marcar como evento de recolección
      collection_id: collectionDocument.collection_id
    });

    // 5. Actualizar last_collection en container
    await containersCollection.updateOne(
      { container_id: containerId },
      { 
        $set: { 
          last_collection: new Date(),
          updated_at: new Date()
        } 
      }
    );

    console.log(`✅ Container ${containerId} marked as collected and sensor updated to 0%`);

    return {
      collection_id: collectionDocument.collection_id,
      collected_at: collectionDocument.collected_at,
      container_id: containerId,
      route_id: route_id,
      fill_level_before: fill_level_before,
      fill_level_after: 0
    };

  } catch (error) {
    console.error('❌ Error marking container as collected:', error);
    throw new Error(`Error marking container as collected: ${error.message}`);
  }
}

  async getCollectionHistory(userId, filters = {}) {
  try {
    if (!this.mongoDB) await this.connectMongo();
    
    console.log(`📋 Getting collection history for user ${userId}`);
    
    // Buscar directamente en la colección 'collections'
    const matchStage = {
      collector_id: userId.toString(),
      status: 'completed'
    };
    
    // Filtros de fecha
    if (filters.date_from || filters.date_to) {
      matchStage.collected_at = {};
      if (filters.date_from) matchStage.collected_at.$gte = new Date(filters.date_from);
      if (filters.date_to) matchStage.collected_at.$lte = new Date(filters.date_to);
    }

    // Pipeline para enriquecer con información de empresas
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'containers',
          localField: 'container_id',
          foreignField: 'container_id',
          as: 'container_info'
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company_id',
          foreignField: 'company_id',
          as: 'company_info'
        }
      },
      {
        $project: {
          collection_id: 1,
          container_id: 1,
          collected_at: 1,
          fill_level_before: 1,
          fill_level_after: 1,
          notes: 1,
          route_id: 1,
          container_type: 1,
          company_name: { $arrayElemAt: ['$company_info.name', 0] },
          container_location: { $arrayElemAt: ['$container_info.location', 0] }
        }
      },
      { $sort: { collected_at: -1 } } // Más recientes primero
    ];
    
    // Paginación
    if (filters.limit) {
      if (filters.page && filters.page > 1) {
        pipeline.push({ $skip: (filters.page - 1) * filters.limit });
      }
      pipeline.push({ $limit: parseInt(filters.limit) });
    }
    
    const history = await this.mongoDB.collection('collections').aggregate(pipeline).toArray();
    
    // Contar total de registros
    const totalPipeline = [
      { $match: matchStage },
      { $count: "total" }
    ];
    
    const totalResult = await this.mongoDB.collection('collections').aggregate(totalPipeline).toArray();
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    
    console.log(`✅ Found ${history.length} collection records out of ${total} total`);
    
    return {
      history,
      total,
      page: filters.page || 1,
      limit: filters.limit || history.length
    };
  } catch (error) {
    console.error('❌ Error getting collection history:', error);
    throw new Error(`Error getting collection history: ${error.message}`);
  }
}

  // ✅ MÉTODO PARA COLLECTORS (solo MongoDB)
async getCompanyContainers(companyId) {
  try {
    if (!this.mongoDB) {
      await this.connectMongo();
    }
    
    console.log(`📦 [COLLECTORS] Getting containers for company ${companyId}`);

    const companyIdStr = String(companyId);
    
    const containers = await this.mongoDB.collection('containers').find({
      company_id: companyIdStr,
      status: 'active'
    }).toArray();

    console.log(`📦 Found ${containers.length} raw containers for company ${companyIdStr}`);

    // Procesar cada contenedor manualmente
    const processedContainers = await Promise.all(
      containers.map(async (container) => {
        try {
          // Buscar último dato del sensor
          const latestSensorData = await this.mongoDB.collection('sensor_data')
            .findOne(
              { device_id: container.device_id },
              { sort: { timestamp: -1 } }
            );

          const fillLevel = latestSensorData?.readings?.fill_level || Math.floor(Math.random() * (90 - 60) + 60);

          return {
            id: container.container_id,
            container_id: container.container_id,
            company_id: container.company_id,
            type: container.type || 'normal',
            capacity: container.capacity || 240,
            status: container.status,
            device_id: container.device_id,
            location: {
              latitude: container.location?.coordinates?.[1] || container.location?.latitude || 32.465000,
              longitude: container.location?.coordinates?.[0] || container.location?.longitude || -116.820000,
              address: container.location?.address || 'Address not available'
            },
            percentage: Math.round(fillLevel),
            last_collection: container.last_collection,
            created_at: container.created_at
          };
        } catch (sensorError) {
          console.warn(`⚠️ Error getting sensor data for ${container.container_id}:`, sensorError.message);
          
          return {
            id: container.container_id,
            container_id: container.container_id,
            company_id: container.company_id,
            type: container.type || 'normal',
            capacity: container.capacity || 240,
            status: container.status,
            device_id: container.device_id,
            location: {
              latitude: container.location?.latitude || 32.465000,
              longitude: container.location?.longitude || -116.820000,
              address: container.location?.address || 'Address not available'
            },
            percentage: Math.floor(Math.random() * (90 - 60) + 60),
            last_collection: container.last_collection,
            created_at: container.created_at
          };
        }
      })
    );

    console.log(`✅ Processed ${processedContainers.length} containers for company ${companyId}`);
    
    processedContainers.forEach(container => {
      console.log(`  - ${container.container_id}: ${container.percentage}% (${container.type})`);
    });
    
    return processedContainers;
    
  } catch (error) {
    console.error('❌ Error getting company containers:', error);
    throw new Error(`Error getting company containers: ${error.message}`);
  }
}

// ✅ MÉTODO PARA EMPLOYEES (renombrado)
async getEmployeeCompanyContainers(userId) {
  try {
    // Obtener company_mongo_id del usuario (SQL)
    const userQuery = `
      SELECT c.mongo_company_id 
      FROM users u 
      JOIN companies c ON u.company_id = c.company_id 
      WHERE u.user_id = $1
    `;
    const result = await this.pgPool.query(userQuery, [userId]);
    const companyMongoId = result.rows[0]?.mongo_company_id;
    
    if (!companyMongoId) {
      throw new Error('Company not found');
    }
    
    console.log(`📦 [EMPLOYEES] Getting containers for company ${companyMongoId} (user ${userId})`);
    
    // Obtener contenedores de la empresa desde MongoDB
    if (!this.mongoDB) await this.connectMongo();
    
    const containers = await this.mongoDB.collection('containers').aggregate([
      {
        $match: {
          company_id: companyMongoId,
          status: 'active'
        }
      },
      {
        $lookup: {
          from: 'sensor_data',
          localField: 'device_id',
          foreignField: 'device_id',
          as: 'latest_data',
          pipeline: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ]
        }
      },
      {
        $project: {
          container_id: 1,
          latitude: { $arrayElemAt: ['$location.coordinates', 1] },
          longitude: { $arrayElemAt: ['$location.coordinates', 0] },
          percentage: { $arrayElemAt: ['$latest_data.readings.fill_level', 0] },
          status: 1,
          type: 1,
          company_id: 1
        }
      }
    ]).toArray();
    
    return containers;
  } catch (error) {
    console.error('❌ Error getting employee company containers:', error);
    throw new Error(`Error getting employee company containers: ${error.message}`);
  }
}

  // OBTENER DETALLES DE CONTENEDOR - MEJORADO
  async getContainerDetails(containerId) {
  try {
    if (!this.mongoDB) {
      await this.connectMongo();
    }
    
    console.log(`📦 Getting details for container ${containerId}`);

    const containerDetails = await this.mongoDB.collection('containers').aggregate([
      {
        $match: { container_id: containerId }
      },
      {
        $lookup: {
          from: 'sensor_data',
          localField: 'device_id',
          foreignField: 'device_id',
          as: 'sensor_data',
          pipeline: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ]
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company_id',
          foreignField: 'company_id',
          as: 'company_info'
        }
      },
      {
        $project: {
          container_id: 1,
          company_id: 1,
          company_name: { $arrayElemAt: ['$company_info.name', 0] },
          type: 1,
          capacity: 1,
          status: 1,
          device_id: 1,
          last_collection: 1,
          created_at: 1,
          // ✅ ESTRUCTURAR CORRECTAMENTE LOS DATOS DEL SENSOR
          latest_sensor_data: {
            $cond: {
              if: { $gt: [{ $size: '$sensor_data' }, 0] },
              then: {
                device_id: { $arrayElemAt: ['$sensor_data.device_id', 0] },
                timestamp: { $arrayElemAt: ['$sensor_data.timestamp', 0] },
                temperature: { $arrayElemAt: ['$sensor_data.readings.temperature', 0] },
                humidity: { $arrayElemAt: ['$sensor_data.readings.humidity', 0] },
                methane: { $arrayElemAt: ['$sensor_data.readings.methane', 0] },
                co2: { $arrayElemAt: ['$sensor_data.readings.co2', 0] },
                fill_level: { $arrayElemAt: ['$sensor_data.readings.fill_level', 0] },
                battery_level: { $arrayElemAt: ['$sensor_data.readings.battery_level', 0] },
                alerts: { $arrayElemAt: ['$sensor_data.alerts', 0] }
              },
              else: {
                device_id: '$device_id',
                timestamp: null,
                temperature: null,
                humidity: null,
                methane: null,
                co2: null,
                fill_level: 0,
                battery_level: null,
                alerts: []
              }
            }
          },
          location: {
            // ✅ ASEGURAR QUE LA UBICACIÓN ESTÉ BIEN FORMATEADA
            latitude: { 
              $cond: {
                if: { $eq: [{ $type: '$location' }, 'object'] },
                then: { 
                  $cond: {
                    if: { $isArray: '$location.coordinates' },
                    then: { $arrayElemAt: ['$location.coordinates', 1] },
                    else: '$location.latitude'
                  }
                },
                else: 0
              }
            },
            longitude: { 
              $cond: {
                if: { $eq: [{ $type: '$location' }, 'object'] },
                then: { 
                  $cond: {
                    if: { $isArray: '$location.coordinates' },
                    then: { $arrayElemAt: ['$location.coordinates', 0] },
                    else: '$location.longitude'
                  }
                },
                else: 0
              }
            },
            address: '$location.address'
          }
        }
      }
    ]).toArray();

    if (containerDetails.length === 0) {
      throw new Error(`Container ${containerId} not found`);
    }

    const container = containerDetails[0];
    
    // ✅ LOG DETALLADO PARA DEBUG
    console.log(`✅ Container details retrieved for ${containerId}:`, {
      container_id: container.container_id,
      device_id: container.device_id,
      sensor_data: container.latest_sensor_data,
      fill_level: container.latest_sensor_data.fill_level,
      company: container.company_name
    });
    
    return container;
    
  } catch (error) {
    console.error('❌ Error getting container details:', error);
    throw new Error(`Error getting container details: ${error.message}`);
  }
}

  
  async getCurrentRoute(userId) {
    try {
      if (!this.mongoDB) await this.connectMongo();
      
      const route = await this.mongoDB.collection('routes').findOne({
        collector_id: userId.toString(),
        status: { $in: ['planned', 'in_progress', 'paused'] }
      }, { sort: { created_at: -1 } });
      
      if (!route) {
        return null;
      }
      
      // Enriquecer con información de contenedores
      const containerIds = route.planned_containers.map(c => c.container_id);
      const containers = await this.mongoDB.collection('containers').find({
        container_id: { $in: containerIds }
      }).toArray();
      
      route.containers = route.planned_containers.map(planned => {
        const container = containers.find(c => c.container_id === planned.container_id);
        return {
          ...planned,
          latitude: container?.location?.coordinates[1] || 0,
          longitude: container?.location?.coordinates[0] || 0
        };
      });
      
      return route;
    } catch (error) {
      throw new Error(`Error getting current route: ${error.message}`);
    }
  }

  async getAssignmentIncidents(userId) {
    try {
      if (!this.mongoDB) await this.connectMongo();
      
      // Obtener las asignaciones del collector
      const assignments = await this.mongoDB.collection('assignments').find({
        collector_id: userId.toString(),
        status: 'active'
      }).toArray();
      
      if (assignments.length === 0) {
        return [];
      }
      
      const assignedCompanies = assignments.flatMap(a => a.companies);
      
      // Obtener incidencias de las empresas asignadas (SOLO CONSULTA)
      const incidents = await this.mongoDB.collection('incidents').find({
        company_id: { $in: assignedCompanies },
        status: { $in: ['pending', 'in_progress'] }
      }).sort({ created_at: -1 }).toArray();
      
      return incidents;
    } catch (error) {
      throw new Error(`Error getting assignment incidents: ${error.message}`);
    }
  }

  // ==========================================
  // MÉTODOS PARA EMPLOYEES
  // ==========================================
  async getCompanyIncidents(companyMongoId) {
    try {
      if (!this.mongoDB) await this.connectMongo();
      
      return await this.mongoDB.collection('incidents').find({
        company_id: companyMongoId,
        status: { $ne: 'resolved' }
      }).sort({ created_at: -1 }).toArray();
    } catch (error) {
      throw new Error(`Error getting company incidents: ${error.message}`);
    }
  }

  async createIncident(userId, incidentData) {
    try {
      // 1. Obtener info del usuario desde SQL
      const userQuery = `
        SELECT u.user_id, u.nombre, u.apellido, u.email, u.role, c.mongo_company_id
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.company_id
        WHERE u.user_id = $1
      `;
      
      const userResult = await this.pgPool.query(userQuery, [userId]);
      const user = userResult.rows[0];
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // 2. Crear incidencia en MongoDB
      if (!this.mongoDB) await this.connectMongo();
      
      const incident = {
        incident_id: `INC-${Date.now()}`,
        container_id: incidentData.containerId,
        company_id: user.mongo_company_id,
        reported_by: userId.toString(),
        qr_verified: incidentData.qr_verified || false,
        qr_scan_id: incidentData.qr_scan_id || null,
        reporter_info: {
          name: `${user.nombre} ${user.apellido}`,
          email: user.email,
          role: user.role,
          company_id: user.mongo_company_id
        },
        title: incidentData.title,
        description: incidentData.description,
        type: incidentData.type || 'complaint',
        priority: incidentData.priority || 'medium',
        status: 'pending',
        images: incidentData.images || [],
        location: incidentData.location || {
          type: "Point",
          coordinates: [0, 0]
        },
        created_at: new Date(),
        resolved_at: null,
        resolution_notes: null
      };
      
      const result = await this.mongoDB.collection('incidents').insertOne(incident);
      return { ...incident, _id: result.insertedId };
    } catch (error) {
      throw new Error(`Error creating incident: ${error.message}`);
    }
  }

}

module.exports = new DatabaseService();
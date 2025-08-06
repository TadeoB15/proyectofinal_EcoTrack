// ==========================================
// COLECCIÓN: COMPANIES (Empresas)
// ==========================================
db.companies.createIndex({ company_id: 1 });
db.companies.createIndex({ "location.coordinates": "2dsphere" });

db.companies.insertOne({
  company_id: "COMP-001",
  name: "Empresa de Recolección S.A.",
  location: {
    type: "Point",
    coordinates: [-99.123, 19.456] // [longitude, latitude]
  },
  contact: {
    email: "contacto@empresa.com",
    phone: "+52-555-1234567",
    address: "Av. Principal 123, Col. Centro"
  },
  active: true,
  created_at: ISODate("2025-01-15T08:00:00Z"),
  updated_at: ISODate("2025-01-15T08:00:00Z")
});

// ==========================================
// COLECCIÓN: USER_SYNC (Sincronización)
// ==========================================
db.user_sync.createIndex({ sql_user_id: 1 }, { unique: true });
db.user_sync.createIndex({ email: 1 });

// Insertar referencias de usuarios
db.user_sync.insertMany([
  {
    sql_user_id: 1, 
    email: "admin@ecotrack.com",
    role: "admin",
    company_mongo_id: "COMP-001",
    active: true,
    last_sync: ISODate("2025-01-15T08:00:00Z")
  },
  {
    sql_user_id: 2,
    email: "larry@collector.com", 
    role: "collector",
    company_mongo_id: "COMP-001",
    certifications: {
      basic_collection: true,
      toxic_waste: false
    },
    active: true,
    last_sync: ISODate("2025-01-15T08:00:00Z")
  },
  {
    sql_user_id: 3,
    email: "juan@empresa.com",
    role: "employee", 
    company_mongo_id: "COMP-001",
    active: true,
    last_sync: ISODate("2025-01-15T08:00:00Z")
  }
]);


// ==========================================
// COLECCIÓN: CONTAINERS (Contenedores)
// ==========================================
db.containers.createIndex({ container_id: 1 });
db.containers.createIndex({ company_id: 1 });
db.containers.createIndex({ "location.coordinates": "2dsphere" });
db.containers.createIndex({ status: 1 });

db.containers.insertOne({
  container_id: "CTN-001",
  company_id: "COMP-001",
  qr_code: "QR-CTN-001-ABCD1234", // Código QR único
  location: {
    type: "Point",
    coordinates: [-99.123, 19.456]
  },
  type: "normal", // "normal", "biohazard"
  capacity: 240, // litros
  status: "active", // "active", "inactive", "maintenance"
  device_id: "MWAB-001", // Sensor asociado
  last_collection: ISODate("2025-06-20T09:00:00Z"),
  created_at: ISODate("2025-01-15T08:00:00Z")
});

// ==========================================
// COLECCIÓN: SENSOR_DATA (Datos de sensores)
// ==========================================
db.sensor_data.createIndex({ device_id: 1, timestamp: -1 });
db.sensor_data.createIndex({ container_id: 1, timestamp: -1 });

db.sensor_data.insertOne({
  device_id: "MWAB-001",
  timestamp: ISODate("2025-06-22T10:30:00Z"),
  readings: {
    temperature: 28.5, // °C
    humidity: 60, // %
    methane: 120, // ppm
    co2: 450, // ppm
    fill_level: 75, // %
    battery_level: 85 // %
  },
  location: {
    type: "Point",
    coordinates: [-99.123, 19.456]
  },
  alerts: [] // ["high_temperature", "full_container", "gas_leak"]
});

// ==========================================
// COLECCIÓN: ASSIGNMENTS (Asignaciones)
// ==========================================
db.assignments.createIndex({ assignment_id: 1 });
db.assignments.createIndex({ collector_id: 1, status: 1 });
db.assignments.createIndex({ created_at: -1 });

db.assignments.insertOne({
  assignment_id: "ASSIGN-001",
  collector_id: "2", // Referencia al usuario en SQL
  admin_id: "1", // Quien asignó
  companies: ["COMP-001", "COMP-002"],
  status: "active", // Siempre activa hasta que ocurra algo como un despido xd
  assigned_at: ISODate("2025-06-22T08:00:00Z"),
  notes: "Ruta matutina - Zona Centro",
});

// ==========================================
// COLECCIÓN: ROUTES (Rutas creadas por recolectores)
// ==========================================
db.routes.createIndex({ route_id: 1 });
db.routes.createIndex({ assignment_id: 1 });
db.routes.createIndex({ collector_id: 1, status: 1 });

db.routes.insertOne({
  route_id: "ROUTE-2025-06-22-LARRY",
  assignment_id: "ASSIGN-001",
  collector_id: "2",
  date: ISODate("2025-06-22T00:00:00Z"),
  planned_containers: [ //Contenedores planeados por tipo
    {
      container_id: "CTN-001",
      company_id: "COMP-001",
      type: "normal",
      fill_level_at_planning: 85, // Umbral normal
      completed_at: null,
      collection_method: null // "app_button" cuando se complete
    },
    {
      container_id: "CTN-007",
      company_id: "COMP-002",
      type: "biohazard",
      fill_level_at_planning: 55, // Menor umbral que normal
      completed_at: null,
      collection_method: null
    } 
  ],
  container_summary: { //metricas por tipo
    total_normal: 1,
    total_biohazard: 1,
    total_containers: 2
  },
  status: "in_progress", // "in_progress", "completed", "paused"
  completed_containers: 0,
  started_at: null,
  completed_at: null,
});




// ==========================================
// COLECCIÓN: INCIDENTS (Incidencias)
// ==========================================
db.incidents.createIndex({ incident_id: 1 });
db.incidents.createIndex({ container_id: 1, created_at: -1 });
db.incidents.createIndex({ reported_by: 1 });
db.incidents.createIndex({ status: 1, priority: 1 });

db.incidents.insertOne({
  incident_id: "INC-001",
  container_id: "CTN-001",
  company_id: "COMP-001",
  reported_by: "3", // ID del empleado de empresa
  qr_verified: true, // QR fue escaneado correctamente
  qr_scan_id: "SCAN-001",
  reporter_info: { //Datos de prueba
    name: "Juan Pérez",
    email: "juan.perez@empresa.com",
    role: "employee",
    company_id: "COMP-001"
  },
  title: "Contenedor desbordado",
  description: "El contenedor está lleno y hay basura alrededor",
  type: "external_trash", // "complaint, external_trash, damage"
  priority: "high", // "low", "medium", "high", "critical"
  status: "pending", // "pending", "in_progress", "resolved"
  images: [
    {
      url: "https://storage.url/incident_001_1.jpg",
      uploaded_at: ISODate("2025-06-22T10:30:00Z")
    }
  ],
  location: { //pruebas
    type: "Point",
    coordinates: [-99.123, 19.456]
  },
  created_at: ISODate("2025-06-22T10:30:00Z"),
  resolved_at: null,
  resolution_notes: null
});

// ==========================================
// COLECCIÓN: QR_SCANS (Escaneos de QR)
// ==========================================
db.qr_scans.createIndex({ scan_id: 1 });
db.qr_scans.createIndex({ container_id: 1, scanned_at: -1 });
db.qr_scans.createIndex({ scanned_by: 1 });

db.qr_scans.insertOne({
  scan_id: "SCAN-001",
  container_id: "CNT-003",
  qr_code: "QR-CTN-001-ABCD1234",
  scanned_by: "3", //juan_employee
  action_type: "report_incident", 
  result: "success", // "success", "invalid_qr", "container_not_found"
  location: {
    type: "Point",
    coordinates: [-99.123, 19.456]
  },
  scanned_at: ISODate("2025-06-22T10:30:00Z"),
  incident_created: "INC-001", // Referencia a la incidencia creada
  metadata: {
    app_version: "1.0.0",
    device_info: "iPhone 12"
  }
});
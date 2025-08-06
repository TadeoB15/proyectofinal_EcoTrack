// ==========================================
// REGISTROS ADICIONALES PARA PRUEBAS - SIMPLIFICADO
// ==========================================

// ==========================================
// COMPANIES - Agregar más empresas
// ==========================================
db.companies.insertMany([
  {
    company_id: "COMP-002",
    name: "Tech Solutions Inc",
    location: {
      type: "Point",
      coordinates: [-99.135, 19.465] 
    },
    contact: {
      email: "info@techsolutions.com",
      phone: "+52-555-2345678",
      address: "Blvd. Tecnológico 456, Col. Norte"
    },
    active: true,
    created_at: ISODate("2025-01-15T08:00:00Z"),
    updated_at: ISODate("2025-01-15T08:00:00Z")
  },
  {
    company_id: "COMP-003",
    name: "Green Industries",
    location: {
      type: "Point",
      coordinates: [-99.110, 19.440]
    },
    contact: {
      email: "contact@greenind.com",
      phone: "+52-555-3456789",
      address: "Calle Verde 789, Col. Sur"
    },
    active: true,
    created_at: ISODate("2025-01-15T08:00:00Z"),
    updated_at: ISODate("2025-01-15T08:00:00Z")
  }
]);

// ==========================================
// USER_SYNC - Más usuarios
// ==========================================
db.user_sync.insertMany([
  {
    sql_user_id: 4,
    email: "maria@collector.com",
    role: "collector",
    company_mongo_id: "COMP-002", // Diferente empresa base
    active: true,
    last_sync: ISODate("2025-01-15T08:00:00Z")
  },
  {
    sql_user_id: 5,
    email: "carlos@empresa2.com",
    role: "employee",
    company_mongo_id: "COMP-002",
    active: true,
    last_sync: ISODate("2025-01-15T08:00:00Z")
  },
  {
    sql_user_id: 6,
    email: "ana@empresa3.com",
    role: "employee",
    company_mongo_id: "COMP-003",
    active: true,
    last_sync: ISODate("2025-01-15T08:00:00Z")
  }
]);

// ==========================================
// CONTAINERS - Más contenedores distribuidos
// ==========================================
db.containers.insertMany([
  // Contenedores COMP-001 (adicionales)
  {
    container_id: "CTN-002",
    company_id: "COMP-001",
    qr_code: "QR-CTN-002-EFGH5678",
    location: {
      type: "Point",
      coordinates: [-99.124, 19.457]
    },
    type: "biohazard",
    capacity: 240,
    status: "active",
    device_id: "MWAB-002",
    last_collection: ISODate("2025-06-19T14:30:00Z"),
    created_at: ISODate("2025-01-15T08:00:00Z")
  },
  {
    container_id: "CTN-003",
    company_id: "COMP-001",
    qr_code: "QR-CTN-003-IJKL9012",
    location: {
      type: "Point",
      coordinates: [-99.122, 19.455]
    },
    type: "normal",
    capacity: 240,
    status: "active",
    device_id: "MWAB-003",
    last_collection: ISODate("2025-06-21T10:15:00Z"),
    created_at: ISODate("2025-01-15T08:00:00Z")
  },

  // Contenedores COMP-002
  {
    container_id: "CTN-004",
    company_id: "COMP-002",
    qr_code: "QR-CTN-004-MNOP3456",
    location: {
      type: "Point",
      coordinates: [-99.136, 19.466]
    },
    type: "normal",
    capacity: 240,
    status: "active",
    device_id: "MWAB-004",
    last_collection: ISODate("2025-06-20T11:00:00Z"),
    created_at: ISODate("2025-01-15T08:00:00Z")
  },
  {
    container_id: "CTN-005",
    company_id: "COMP-002",
    qr_code: "QR-CTN-005-QRST7890",
    location: {
      type: "Point",
      coordinates: [-99.134, 19.464]
    },
    type: "biohazard",
    capacity: 240,
    status: "active",
    device_id: "MWAB-005",
    last_collection: ISODate("2025-06-19T16:45:00Z"),
    created_at: ISODate("2025-01-15T08:00:00Z")
  },
  {
    container_id: "CTN-006",
    company_id: "COMP-002",
    qr_code: "QR-CTN-006-UVWX1234",
    location: {
      type: "Point",
      coordinates: [-99.137, 19.467]
    },
    type: "normal",
    capacity: 240,
    status: "active",
    device_id: "MWAB-006",
    last_collection: ISODate("2025-06-20T08:20:00Z"),
    created_at: ISODate("2025-01-15T08:00:00Z")
  },

  // Contenedores COMP-003
  {
    container_id: "CTN-007",
    company_id: "COMP-003",
    qr_code: "QR-CTN-007-YZAB5678",
    location: {
      type: "Point",
      coordinates: [-99.111, 19.441]
    },
    type: "biohazard",
    capacity: 240,
    status: "active",
    device_id: "MWAB-007",
    last_collection: ISODate("2025-06-18T13:10:00Z"),
    created_at: ISODate("2025-01-15T08:00:00Z")
  },
  {
    container_id: "CTN-008",
    company_id: "COMP-003",
    qr_code: "QR-CTN-008-CDEF9012",
    location: {
      type: "Point",
      coordinates: [-99.109, 19.439]
    },
    type: "normal",
    capacity: 240,
    status: "active",
    device_id: "MWAB-008",
    last_collection: ISODate("2025-06-21T15:30:00Z"),
    created_at: ISODate("2025-01-15T08:00:00Z")
  },
  {
    container_id: "CTN-009",
    company_id: "COMP-003",
    qr_code: "QR-CTN-009-GHIJ3456",
    location: {
      type: "Point",
      coordinates: [-99.112, 19.442]
    },
    type: "normal",
    capacity: 240,
    status: "active",
    device_id: "MWAB-009",
    last_collection: ISODate("2025-06-20T12:45:00Z"),
    created_at: ISODate("2025-01-15T08:00:00Z")
  }
]);

// ==========================================
// SENSOR_DATA - Datos variados con umbrales diferenciados
// ==========================================
db.sensor_data.insertMany([
  // CTN-002 (biohazard) - Necesita recolección (>50%)
  {
    device_id: "MWAB-002",
    timestamp: ISODate("2025-06-22T10:30:00Z"),
    readings: {
      temperature: 30.2,
      humidity: 65,
      methane: 150,
      co2: 480,
      fill_level: 65, // Biohazard necesita recolección
      battery_level: 92
    },
    location: {
      type: "Point",
      coordinates: [-99.124, 19.457]
    },
    alerts: ["biohazard_threshold_reached"] // Simple alert
  },

  // CTN-003 (normal) - OK
  {
    device_id: "MWAB-003", 
    timestamp: ISODate("2025-06-22T10:30:00Z"),
    readings: {
      temperature: 26.8,
      humidity: 58,
      methane: 80,
      co2: 400,
      fill_level: 45, // Normal OK
      battery_level: 88
    },
    location: {
      type: "Point",
      coordinates: [-99.122, 19.455]
    },
    alerts: []
  },

  // CTN-004 (normal) - Necesita recolección (>70%)
  {
    device_id: "MWAB-004",
    timestamp: ISODate("2025-06-22T10:30:00Z"),
    readings: {
      temperature: 28.1,
      humidity: 62,
      methane: 95,
      co2: 430,
      fill_level: 85, // Normal necesita recolección
      battery_level: 90
    },
    location: {
      type: "Point",
      coordinates: [-99.136, 19.466]
    },
    alerts: ["high_fill_level"]
  },

  // CTN-005 (biohazard) - Crítico (>50%)
  {
    device_id: "MWAB-005",
    timestamp: ISODate("2025-06-22T10:30:00Z"),
    readings: {
      temperature: 31.5,
      humidity: 70,
      methane: 180,
      co2: 520,
      fill_level: 78, // Biohazard crítico
      battery_level: 85
    },
    location: {
      type: "Point",
      coordinates: [-99.134, 19.464]
    },
    alerts: ["critical_biohazard_level"]
  },

  // CTN-006 (normal) - OK
  {
    device_id: "MWAB-006",
    timestamp: ISODate("2025-06-22T10:30:00Z"),
    readings: {
      temperature: 25.9,
      humidity: 55,
      methane: 70,
      co2: 380,
      fill_level: 35, // Normal OK
      battery_level: 93
    },
    location: {
      type: "Point",
      coordinates: [-99.137, 19.467]
    },
    alerts: []
  },

  // CTN-007 (biohazard) - Extremo (>50%)
  {
    device_id: "MWAB-007",
    timestamp: ISODate("2025-06-22T10:30:00Z"),
    readings: {
      temperature: 32.1,
      humidity: 75,
      methane: 200,
      co2: 550,
      fill_level: 92, // Biohazard extremo
      battery_level: 78
    },
    location: {
      type: "Point",
      coordinates: [-99.111, 19.441]
    },
    alerts: ["extreme_biohazard_level"]
  },

  // CTN-008 (normal) - Necesita recolección pronto
  {
    device_id: "MWAB-008",
    timestamp: ISODate("2025-06-22T10:30:00Z"),
    readings: {
      temperature: 27.5,
      humidity: 60,
      methane: 85,
      co2: 410,
      fill_level: 74, // Normal necesita recolección
      battery_level: 87
    },
    location: {
      type: "Point",
      coordinates: [-99.109, 19.439]
    },
    alerts: ["approaching_full"]
  },

  // CTN-009 (normal) - OK
  {
    device_id: "MWAB-009",
    timestamp: ISODate("2025-06-22T10:30:00Z"),
    readings: {
      temperature: 26.2,
      humidity: 52,
      methane: 75,
      co2: 390,
      fill_level: 28, // Normal OK
      battery_level: 91
    },
    location: {
      type: "Point",
      coordinates: [-99.112, 19.442]
    },
    alerts: []
  }
]);

// ==========================================
// ASSIGNMENTS - Más asignaciones simples
// ==========================================
db.assignments.insertMany([
  // Asignación para María
  {
    assignment_id: "ASSIGN-002",
    collector_id: "4", // maria@collector.com
    admin_id: "1",
    companies: ["COMP-002", "COMP-003"], // Diferentes empresas
    status: "active",
    assigned_at: ISODate("2025-01-16T08:00:00Z"),
    notes: "Zona Norte y Sur"
  }
]);

// ==========================================
// ROUTES - Rutas simplificadas
// ==========================================
db.routes.insertMany([
  // Ruta completada de ayer (Larry)
  {
    route_id: "ROUTE-2025-06-21-LARRY",
    assignment_id: "ASSIGN-001",
    collector_id: "2",
    date: ISODate("2025-06-21T00:00:00Z"),
    planned_containers: [
      {
        container_id: "CTN-003",
        company_id: "COMP-001",
        type: "normal",
        fill_level_at_planning: 78,
        completed_at: ISODate("2025-06-21T09:30:00Z"), // ✅ Completado
        collection_method: "app_button"
      }
    ],
    container_summary: {
      total_normal: 1,
      total_biohazard: 0,
      total_containers: 1
    },
    status: "completed", // ✅ Ruta completada
    completed_containers: 1,
    started_at: ISODate("2025-06-21T08:00:00Z"),
    completed_at: ISODate("2025-06-21T10:00:00Z")
  },

  // Ruta activa de María (hoy)
  {
    route_id: "ROUTE-2025-06-22-MARIA",
    assignment_id: "ASSIGN-002",
    collector_id: "4",
    date: ISODate("2025-06-22T00:00:00Z"),
    planned_containers: [
      {
        container_id: "CTN-005",
        company_id: "COMP-002",
        type: "biohazard",
        fill_level_at_planning: 78, // Prioridad por ser biohazard
        completed_at: null,
        collection_method: null
      },
      {
        container_id: "CTN-007",
        company_id: "COMP-003",
        type: "biohazard",
        fill_level_at_planning: 92, // Extremo
        completed_at: null,
        collection_method: null
      },
      {
        container_id: "CTN-004",
        company_id: "COMP-002",
        type: "normal",
        fill_level_at_planning: 85, // Alto normal
        completed_at: null,
        collection_method: null
      }
    ],
    container_summary: {
      total_normal: 1,
      total_biohazard: 2, // Prioridad automática
      total_containers: 3
    },
    status: "in_progress", // 🔄 En progreso
    completed_containers: 0,
    started_at: ISODate("2025-06-22T07:30:00Z"),
    completed_at: null
  }
]);

// ==========================================
// INCIDENTS - Más incidencias
// ==========================================
db.incidents.insertMany([
  // Incidencia de Carlos (COMP-002)
  {
    incident_id: "INC-002",
    container_id: "CTN-004",
    company_id: "COMP-002",
    reported_by: "5", // carlos@empresa2.com
    qr_verified: true,
    qr_scan_id: "SCAN-002",
    reporter_info: {
      name: "Carlos Rodríguez",
      email: "carlos@empresa2.com",
      role: "employee",
      company_id: "COMP-002"
    },
    title: "Olor extraño en contenedor",
    description: "El contenedor emite un olor muy fuerte y desagradable",
    type: "complaint",
    priority: "medium",
    status: "pending",
    images: [
      {
        url: "incidents/INC-002/odor_001.jpg",
        uploaded_at: ISODate("2025-06-22T11:15:00Z")
      }
    ],
    location: {
      type: "Point",
      coordinates: [-99.136, 19.466]
    },
    created_at: ISODate("2025-06-22T11:15:00Z"),
    resolved_at: null,
    resolution_notes: null
  },

  // Incidencia resuelta
  {
    incident_id: "INC-003",
    container_id: "CTN-008",
    company_id: "COMP-003",
    reported_by: "6", // ana@empresa3.com
    qr_verified: true,
    qr_scan_id: "SCAN-003",
    reporter_info: {
      name: "Ana López",
      email: "ana@empresa3.com",
      role: "employee",
      company_id: "COMP-003"
    },
    title: "Contenedor dañado - tapa rota",
    description: "La tapa del contenedor está rota, permite entrada de lluvia",
    type: "damage",
    priority: "high",
    status: "resolved", // ✅ Resuelta
    images: [
      {
        url: "incidents/INC-003/broken_lid_001.jpg",
        uploaded_at: ISODate("2025-06-21T14:20:00Z")
      }
    ],
    location: {
      type: "Point",
      coordinates: [-99.109, 19.439]
    },
    created_at: ISODate("2025-06-21T14:20:00Z"),
    resolved_at: ISODate("2025-06-21T16:45:00Z"),
    resolution_notes: "Tapa reemplazada por equipo de mantenimiento"
  }
]);

// ==========================================
// QR_SCANS - Más escaneos
// ==========================================
db.qr_scans.insertMany([
  {
    scan_id: "SCAN-002",
    container_id: "CTN-004",
    qr_code: "QR-CTN-004-MNOP3456",
    scanned_by: "5", // carlos@empresa2.com
    action_type: "report_incident",
    result: "success",
    location: {
      type: "Point",
      coordinates: [-99.136, 19.466]
    },
    scanned_at: ISODate("2025-06-22T11:15:00Z"),
    incident_created: "INC-002",
    metadata: {
      app_version: "1.0.0",
      device_info: "Samsung Galaxy S21"
    }
  },
  {
    scan_id: "SCAN-003",
    container_id: "CTN-008",
    qr_code: "QR-CTN-008-CDEF9012",
    scanned_by: "6", // ana@empresa3.com
    action_type: "report_incident",
    result: "success",
    location: {
      type: "Point",
      coordinates: [-99.109, 19.439]
    },
    scanned_at: ISODate("2025-06-21T14:20:00Z"),
    incident_created: "INC-003",
    metadata: {
      app_version: "1.0.0",
      device_info: "iPhone 13"
    }
  }
]);

// ==========================================
// VERIFICACIÓN FINAL
// ==========================================
print("=== REGISTROS ADICIONALES INSERTADOS (SIMPLIFICADO) ===");
print("Companies total:", db.companies.countDocuments());
print("User Sync total:", db.user_sync.countDocuments());
print("Containers total:", db.containers.countDocuments());
print("Sensor Data total:", db.sensor_data.countDocuments());
print("Assignments total:", db.assignments.countDocuments());
print("Routes total:", db.routes.countDocuments());
print("Incidents total:", db.incidents.countDocuments());
print("QR Scans total:", db.qr_scans.countDocuments());

// Estadísticas para pruebas - UMBRALES DIFERENCIADOS
print("\n=== ESTADÍSTICAS PARA PRUEBAS ===");
print("Contenedores normales que necesitan recolección (≥70%):", 
  db.sensor_data.countDocuments({
    "readings.fill_level": {$gte: 70},
    "alerts": {$nin: ["biohazard_threshold_reached", "critical_biohazard_level", "extreme_biohazard_level"]}
  })
);
print("Contenedores biohazard que necesitan recolección (≥50%):", 
  db.sensor_data.countDocuments({
    "alerts": {$in: ["biohazard_threshold_reached", "critical_biohazard_level", "extreme_biohazard_level"]}
  })
);
print("Incidencias pendientes:", 
  db.incidents.countDocuments({"status": "pending"})
);
print("Rutas activas:", 
  db.routes.countDocuments({"status": "in_progress"})
);
print("=== BASE DE DATOS SIMPLIFICADA LISTA ===");



// ==========================================
// DATOS ESPECÍFICOS PARA LARRY COLLECTOR
// ==========================================

// 1. Verificar y corregir asignación de Larry
db.assignments.updateOne(
  { assignment_id: "ASSIGN-001", collector_id: "2" },
  {
    $set: {
      assignment_id: "ASSIGN-001",
      collector_id: "2", // Larry
      admin_id: "1",
      companies: ["COMP-001", "COMP-002", "COMP-003"],
      status: "active",
      assigned_at: new Date("2025-01-26T08:00:00Z"),
      notes: "Ruta matutina - Zona Centro",
      created_at: new Date("2025-01-26T08:00:00Z")
    }
  },
  { upsert: true }
);


// 3. Datos de sensores con NIVELES QUE REQUIEREN RECOLECCIÓN
db.sensor_data.insertMany([
  // CTN-LARRY-001 (biohazard) - NECESITA RECOLECCIÓN (≥50%)
  {
    device_id: "MWAB-LARRY-001",
    timestamp: new Date(), // Ahora
    readings: {
      temperature: 30.2,
      humidity: 65,
      methane: 150,
      co2: 480,
      fill_level: 85, // ✅ Biohazard >50% - NECESITA RECOLECCIÓN
      battery_level: 92
    },
    location: {
      type: "Point",
      coordinates: [-116.820100, 32.465100]
    },
    alerts: ["biohazard_threshold_reached"]
  },

  // CTN-LARRY-002 (normal) - NECESITA RECOLECCIÓN (≥70%)
  {
    device_id: "MWAB-LARRY-002",
    timestamp: new Date(),
    readings: {
      temperature: 26.8,
      humidity: 58,
      methane: 80,
      co2: 400,
      fill_level: 78, // ✅ Normal >70% - NECESITA RECOLECCIÓN
      battery_level: 88
    },
    location: {
      type: "Point",
      coordinates: [-116.820200, 32.465200]
    },
    alerts: ["high_fill_level"]
  },

  // CTN-LARRY-003 (normal) - NO necesita (está OK)
  {
    device_id: "MWAB-LARRY-003", 
    timestamp: new Date(),
    readings: {
      temperature: 25.1,
      humidity: 52,
      methane: 65,
      co2: 370,
      fill_level: 45, // ❌ Normal <70% - NO necesita
      battery_level: 90
    },
    location: {
      type: "Point",
      coordinates: [-116.820300, 32.465300]
    },
    alerts: []
  },

  // CTN-LARRY-004 (biohazard) - CRÍTICO (≥50%)
  {
    device_id: "MWAB-LARRY-004",
    timestamp: new Date(),
    readings: {
      temperature: 31.5,
      humidity: 70,
      methane: 180,
      co2: 520,
      fill_level: 92, // ✅ Biohazard >50% - CRÍTICO
      battery_level: 85
    },
    location: {
      type: "Point", 
      coordinates: [-116.835100, 32.455100]
    },
    alerts: ["critical_biohazard_level"]
  },

  // CTN-LARRY-005 (normal) - NECESITA RECOLECCIÓN (≥70%)
  {
    device_id: "MWAB-LARRY-005",
    timestamp: new Date(),
    readings: {
      temperature: 28.1,
      humidity: 62,
      methane: 95,
      co2: 430,
      fill_level: 73, // ✅ Normal >70% - NECESITA RECOLECCIÓN
      battery_level: 91
    },
    location: {
      type: "Point",
      coordinates: [-116.835200, 32.455200]
    },
    alerts: ["approaching_full"]
  },

  // CTN-LARRY-006 (biohazard) - EXTREMO (≥50%)
  {
    device_id: "MWAB-LARRY-006",
    timestamp: new Date(),
    readings: {
      temperature: 32.8,
      humidity: 75,
      methane: 210,
      co2: 580,
      fill_level: 95, // ✅ Biohazard >50% - EXTREMO
      battery_level: 78
    },
    location: {
      type: "Point",
      coordinates: [-116.810100, 32.448100]
    },
    alerts: ["extreme_biohazard_level"]
  }
]);

// 4. Eliminar rutas activas conflictivas de Larry
db.routes.deleteMany({
  collector_id: "2",
  status: { $in: ["planned", "in_progress", "paused"] }
});

// 5. Asegurar que las empresas existen
db.companies.insertMany([
  {
    company_id: "COMP-001",
    name: "Empresa Principal Tijuana",
    location: {
      type: "Point",
      coordinates: [-116.820000, 32.465000]
    },
    contact: {
      email: "info@empresa1.com",
      phone: "+52-664-1234567",
      address: "Av. Revolución 123, Tijuana"
    },
    active: true,
    created_at: new Date("2025-01-15T08:00:00Z"),
    updated_at: new Date("2025-01-15T08:00:00Z")
  },
  {
    company_id: "COMP-002", 
    name: "Corporativo Norte",
    location: {
      type: "Point",
      coordinates: [-116.835000, 32.455000]
    },
    contact: {
      email: "info@corp-norte.com",
      phone: "+52-664-2345678", 
      address: "Blvd. Díaz Ordaz 456, Tijuana"
    },
    active: true,
    created_at: new Date("2025-01-15T08:00:00Z"),
    updated_at: new Date("2025-01-15T08:00:00Z")
  },
  {
    company_id: "COMP-003",
    name: "Industrias del Pacífico",
    location: {
      type: "Point", 
      coordinates: [-116.810000, 32.448000]
    },
    contact: {
      email: "info@pacifico.com",
      phone: "+52-664-3456789",
      address: "Zona Río 789, Tijuana"
    },
    active: true,
    created_at: new Date("2025-01-15T08:00:00Z"),
    updated_at: new Date("2025-01-15T08:00:00Z")
  }
]);

// ==========================================
// VERIFICACIÓN FINAL
// ==========================================
print("=== REGISTROS PARA LARRY COLLECTOR INSERTADOS ===");
print("Contenedores de Larry:", db.containers.countDocuments({
  container_id: { $regex: /CTN-LARRY/ }
}));

print("Contenedores que NECESITAN recolección para Larry:");

// Biohazard ≥50%
print("- Biohazard (≥50%):", db.sensor_data.countDocuments({
  device_id: { $regex: /MWAB-LARRY/ },
  "readings.fill_level": { $gte: 50 },
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) },
  alerts: { $in: ["biohazard_threshold_reached", "critical_biohazard_level", "extreme_biohazard_level"] }
}));

// Normal ≥70%  
print("- Normal (≥70%):", db.sensor_data.countDocuments({
  device_id: { $regex: /MWAB-LARRY/ },
  "readings.fill_level": { $gte: 70 },
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) },
  alerts: { $nin: ["biohazard_threshold_reached", "critical_biohazard_level", "extreme_biohazard_level"] }
}));

print("Asignación de Larry:", db.assignments.findOne({
  assignment_id: "ASSIGN-001",
  collector_id: "2"
}));

print("=== LARRY DEBERÍA VER 5 CONTENEDORES DISPONIBLES ===");
print("CTN-LARRY-001 (biohazard 85%) ✅");
print("CTN-LARRY-002 (normal 78%) ✅"); 
print("CTN-LARRY-004 (biohazard 92%) ✅");
print("CTN-LARRY-005 (normal 73%) ✅");
print("CTN-LARRY-006 (biohazard 95%) ✅");
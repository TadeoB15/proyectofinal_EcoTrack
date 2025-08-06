-- Conectar a la base específica
\c ecotrack_users

-- EMPRESAS (Tabla principal)
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    mongo_company_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USUARIOS
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'collector', 'employee')),
    telefono VARCHAR(15),
    company_id INT REFERENCES companies(company_id),
    photo VARCHAR(255),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SESIONES
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    device_info TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES
CREATE INDEX idx_users_email ON users(username);
CREATE INDEX idx_users_role_company ON users(role, company_id);
CREATE INDEX idx_sessions_user_active ON user_sessions(user_id) WHERE expires_at > NOW();

-- DATOS DE PRUEBA
INSERT INTO companies (mongo_company_id, name, email, phone, address) VALUES
('COMP-001', 'Empresa de Recolección S.A.', 'contacto@empresa.com', '+52-555-1234567', 'Av. Principal 123');

-- Passwords hasheadas con bcrypt (123456)
INSERT INTO users (nombre, apellido, email, contrasena_hash, role, telefono, company_id) VALUES
('Admin', 'Sistema', 'admin@ecotrack.com', '$2b$10$rOiCGjnVOeE7h2KJSMPLKuBiCDJTD8YPgNsK8QjGhg.QyGJLgJZAK', 'admin', '+52-555-1111111', 1),
('Larry', 'Davis', 'larry@collector.com', '$2b$10$rOiCGjnVOeE7h2KJSMPLKuBiCDJTD8YPgNsK8QjGhg.QyGJLgJZAK', 'collector', '+52-555-2222222', 1),
('Juan', 'Pérez', 'juan@empresa.com', '$2b$10$rOiCGjnVOeE7h2KJSMPLKuBiCDJTD8YPgNsK8QjGhg.QyGJLgJZAK', 'employee', '+52-555-3333333', 1);
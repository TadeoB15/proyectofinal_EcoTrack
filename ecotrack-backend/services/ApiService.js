import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = 'http://192.168.1.71:3000';
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================
  async apiCall(endpoint, method = 'GET', body = null, requiresAuth = true) {
    try {
      console.log(`🔗 API Call: ${method} ${this.baseURL}${endpoint}`);
      
      const headers = {
        'Content-Type': 'application/json',
      };

      // Agregar token si es requerido
      if (requiresAuth) {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const config = {
        method,
        headers,
      };

      // Agregar body para POST/PUT
      if (body && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(body);
      }

      console.log('📤 Request config:', {
        url: `${this.baseURL}${endpoint}`,
        method,
        headers: config.headers,
        body: config.body
      });

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Call Error [${method} ${endpoint}]:`, errorText);
        throw new Error(errorText || `HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Response data:', result);
      
      return result;
    } catch (error) {
      console.error(`❌ API Call Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // ==========================================
  // AUTENTICACIÓN
  // ==========================================
  async login(username, password) {
    try {
      const response = await this.apiCall('/login', 'POST', { username, password }, false);
      
      if (response.success) {
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(response.user));
        
        console.log('✅ Login successful:', response.user);
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.apiCall('/logout', 'POST');
      await AsyncStorage.multiRemove(['authToken', 'userInfo']);
      
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      await AsyncStorage.multiRemove(['authToken', 'userInfo']);
      console.error('❌ Logout error:', error);
      return { success: true };
    }
  }

  async getStoredUser() {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // ==========================================
  // MÉTODOS PARA COLLECTORS - CORREGIDOS
  // ==========================================
  
  async getAssignments() {
    try {
      return await this.apiCall('/assignments');
    } catch (error) {
      console.error('Error getting assignments:', error);
      // Fallback a datos mock
      return {
        success: true,
        assignments: [
          {
            assignment_id: "ASSIGN-001",
            collector_id: "2",
            companies: ["COMP-001", "COMP-002", "COMP-003"],
            status: "active",
            assigned_at: new Date().toISOString(),
            notes: "Ruta matutina - Zona Centro"
          }
        ]
      };
    }
  }

    async getAvailableContainers() {
    try {
      return await this.apiCall('/available-containers');
    } catch (error) {
      console.error('Error getting available containers:', error);
      // ✅ CORREGIR LOS IDs DE CNT A CTN
      return {
        success: true,
        containers: [
          {
            id: 'CTN-001', 
            company_id: 'COMP-001',
            company_name: 'Empresa de Recolección S.A.',
            type: 'biohazard',
            fill_level: 85,
            location: { latitude: 32.465100, longitude: -116.820100 },
            priority: 'high',
            estimated_time: 15
          },
          {
            id: 'CTN-002', // 
            company_id: 'COMP-001',
            company_name: 'Empresa de Recolección S.A.',
            type: 'normal',
            fill_level: 78,
            location: { latitude: 32.465200, longitude: -116.820200 },
            priority: 'medium',
            estimated_time: 10
          }
        ]
      };
    }
  }

  // MÉTODOS DE RUTA - CORREGIDOS (métodos de instancia)
  async createRoute(containerIds, estimatedDuration) {
    try {
      return await this.apiCall('/routes', 'POST', {
        container_ids: containerIds,
        estimated_duration: estimatedDuration
      });
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  }

  async startRoute(routeId) {
    try {
      return await this.apiCall(`/routes/${routeId}/start`, 'PUT');
    } catch (error) {
      console.error('Error starting route:', error);
      throw error;
    }
  }

  async finishRoute(routeId) {
    try {
      return await this.apiCall(`/routes/${routeId}/finish`, 'PUT');
    } catch (error) {
      console.error('Error finishing route:', error);
      throw error;
    }
  }

  async markContainerCollected(containerId, routeId, notes = '', fillLevelBefore = 0) {
    try {
      return await this.apiCall(`/containers/${containerId}/collect`, 'POST', {
        route_id: routeId,
        notes,
        fill_level_before: fillLevelBefore
      });
    } catch (error) {
      console.error('Error marking container as collected:', error);
      throw error;
    }
  }

  async pauseRoute(routeId) {
    return await this.apiCall(`/routes/${routeId}/pause`, 'PUT');
  }

  async resumeRoute(routeId) {
    return await this.apiCall(`/routes/${routeId}/resume`, 'PUT');
  }

  async getCurrentRoute() {
    return await this.apiCall('/current-route');
  }

  async getCollectionHistory(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.date_from) queryParams.append('date_from', filters.date_from);
    if (filters.date_to) queryParams.append('date_to', filters.date_to);
    if (filters.company) queryParams.append('company', filters.company);

    const endpoint = `/collection-history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.apiCall(endpoint);
  }

  async getAssignmentIncidents() {
    return await this.apiCall('/assignment-incidents');
  }

  // ==========================================
  // MÉTODOS PARA EMPLOYEES
  // ==========================================
  
  async getIncidents() {
    return await this.apiCall('/incidents');
  }

  async createIncident(incidentData) {
    return await this.apiCall('/incidents', 'POST', incidentData);
  }

  async getCompanyContainers() {
    return await this.apiCall('/company-containers');
  }

   async getContainerDetails(containerId) {
    try {
      return await this.apiCall(`/containers/${containerId}/details`);
    } catch (error) {
      console.error('Error fetching container data:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS COMPARTIDOS
  // ==========================================
  
  async getUserProfile() {
    return await this.apiCall('/profile');
  }

  async testConnection() {
    try {
      const response = await this.apiCall('/test-db', 'GET', null, false);
      return response;
    } catch (error) {
      console.error('Connection test failed:', error);
      return { success: false, message: error.message };
    }
  }

  // ==========================================
  // MÉTODOS DE UTILIDAD
  // ==========================================
  
  async isCollector() {
    try {
      const user = await this.getStoredUser();
      return user?.role === 'collector';
    } catch (error) {
      return false;
    }
  }

  async isEmployee() {
    try {
      const user = await this.getStoredUser();
      return user?.role === 'employee';
    } catch (error) {
      return false;
    }
  }

  async getCurrentUserInfo() {
    try {
      const user = await this.getStoredUser();
      if (!user) {
        throw new Error('No user information found');
      }
      return user;
    } catch (error) {
      console.error('Error getting current user info:', error);
      throw error;
    }
  }

  formatContainerData(containers) {
    return containers.map(container => ({
      id: container.id || container.container_id,
      company: container.company_name,
      type: container.type,
      fillLevel: container.fill_level || container.percentage,
      priority: container.priority || 'low',
      estimatedTime: container.estimated_time || 10,
      location: container.location || {
        latitude: container.latitude || 0,
        longitude: container.longitude || 0
      }
    }));
  }

  formatIncidentData(incidents) {
    return incidents.map(incident => ({
      id: incident.incident_id,
      containerId: incident.container_id,
      type: incident.type,
      title: incident.title,
      description: incident.description,
      status: incident.status,
      priority: incident.priority,
      createdAt: incident.created_at,
      images: incident.images || []
    }));
  }

  async checkConnectivity() {
    try {
      const response = await fetch(`${this.baseURL}/test-db`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();
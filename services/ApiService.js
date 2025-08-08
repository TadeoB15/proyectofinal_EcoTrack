import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    // ✅ CORRECTO: Puerto 3001 y IP actual
    this.baseURL = 'http://192.168.43.87:3001'; 
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================
  async apiCall(endpoint, method = 'GET', body = null, requiresAuth = true) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`🔗 API Call: ${method} ${url}`);
      
      const headers = {
        'Content-Type': 'application/json',
      };

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

      if (body && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(body);
      }

      console.log(`📤 Request config:`, { url, method, headers, body });

      const response = await fetch(url, config);
      console.log(`📥 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status}` }));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Response data:`, result);
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
      console.log(`🔐 Attempting login for: ${username}`);
      
      const response = await this.apiCall('/login', 'POST', { 
        username, 
        password 
      }, false);
      
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


  // ✅ FUNCIÓN FALTANTE - AGREGAR AQUÍ
  async loadStoredToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.token = token;
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error loading stored token:', error);
      return null;
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

  async verifyStoredToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return false;

      const response = await this.apiCall('/profile');
      return response.success;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  // ==========================================
  // MÉTODOS PARA COLLECTORS
  // ==========================================
  
  async getAssignments() {
    try {
      return await this.apiCall('/assignments');
    } catch (error) {
      console.error('Error getting assignments:', error);
      // Fallback con datos mock para testing
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

  // ✅ MÉTODO PARA OBTENER CONTENEDORES POR EMPRESA
  async getCompanyContainers(companyId) {
    try {
      console.log(`📦 Fetching containers for company: ${companyId}`);
      return await this.apiCall(`/companies/${companyId}/containers`);
    } catch (error) {
      console.error('❌ Error fetching company containers:', error);
      // Fallback con datos mock
      return {
        success: true,
        containers: [
          {
            id: 'CTN-001',
            container_id: 'CTN-001',
            type: 'biohazard',
            location: { latitude: 32.465100, longitude: -116.820100 },
            percentage: 85,
            latest_sensor_data: { fill_level: 85 }
          },
          {
            id: 'CTN-002',
            container_id: 'CTN-002',
            type: 'normal',
            location: { latitude: 32.465200, longitude: -116.820200 },
            percentage: 78,
            latest_sensor_data: { fill_level: 78 }
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
      // Fallback con datos mock
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
            id: 'CTN-002',
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

  async getContainerDetails(containerId) {
    try {
      return await this.apiCall(`/containers/${containerId}/details`);
    } catch (error) {
      console.error('Error getting container details:', error);
      throw error;
    }
  }

  // MÉTODOS DE RUTA
  async createRoute(containerIds, estimatedDuration = 60) {
    try {
      return await this.apiCall('/routes', 'POST', {
        container_ids: containerIds,
        estimated_duration: estimatedDuration
      });
    } catch (error) {
      console.error('Error creating route:', error);
      return {
        success: true,
        route: {
          route_id: `ROUTE-${Date.now()}`,
          status: 'planned',
          created_at: new Date().toISOString(),
          container_count: containerIds.length
        }
      };
    }
  }

  async startRoute(routeId) {
    try {
      return await this.apiCall(`/routes/${routeId}/start`, 'PUT');
    } catch (error) {
      console.error('Error starting route:', error);
      return {
        success: true,
        route: {
          route_id: routeId,
          status: 'in_progress',
          started_at: new Date().toISOString()
        }
      };
    }
  }

  async pauseRoute(routeId) {
    return await this.apiCall(`/routes/${routeId}/pause`, 'PUT');
  }

  async resumeRoute(routeId) {
    return await this.apiCall(`/routes/${routeId}/resume`, 'PUT');
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
      return {
        success: true,
        collection: {
          collection_id: `COLL-${Date.now()}`,
          collected_at: new Date().toISOString(),
          container_id: containerId
        }
      };
    }
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

  async getCurrentRoute() {
    try {
      return await this.apiCall('/current-route');
    } catch (error) {
      console.error('Error getting current route:', error);
      return { success: true, route: null };
    }
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

  async getEmployeeCompanyContainers() {
    try {
      return await this.apiCall('/company-containers');
    } catch (error) {
      console.error('Error getting employee company containers:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS COMPARTIDOS
  // ==========================================
  
  async getUserProfile() {
    try {
      return await this.apiCall('/profile');
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      console.log('🔍 Testing connection...');
      const response = await this.apiCall('/test-db', 'GET', null, false);
      console.log('✅ Connection test result:', response);
      return response;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
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

  async debugConnection() {
    try {
      console.log(`🔍 Testing connection to: ${this.baseURL}`);
      
      const response = await fetch(`${this.baseURL}/test-db`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`📡 Response status: ${response.status}`);
      console.log(`📡 Response ok: ${response.ok}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📡 Response data:`, data);
        return { success: true, data };
      } else {
        console.log(`❌ Response not ok: ${response.status}`);
        return { success: false, status: response.status };
      }
    } catch (error) {
      console.error(`❌ Connection error:`, error);
      return { success: false, error: error.message };
    }
  }
}

export default new ApiService();
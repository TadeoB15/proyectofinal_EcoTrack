import axios from 'axios';
import { MAP_CONFIG } from '../config/MapConfig';
import { getDistance, getCenter, isPointWithinRadius } from 'geolib';

class OpenRouteService {
  constructor() {
    this.apiKey = MAP_CONFIG.OPENROUTE_API_KEY;
    this.baseURL = MAP_CONFIG.OPENROUTE_BASE_URL;
    
    // Configurar axios con headers por defecto
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 segundos timeout
    });
  }

  // ==========================================
  // MÉTODOS DE CÁLCULO DE RUTAS
  // ==========================================

  /**
   * Calcular ruta optimizada entre múltiples puntos
   * @param {Object} start - Coordenadas de inicio {latitude, longitude}
   * @param {Array} destinations - Array de destinos con coordenadas
   * @param {Object} options - Opciones de ruta
   */
  async calculateOptimizedRoute(start, destinations, options = {}) {
    try {
      console.log(`🗺️ Calculating optimized route from [${start.latitude}, ${start.longitude}] to ${destinations.length} destinations`);

      // Preparar coordenadas en formato OpenRouteService [longitude, latitude]
      const coordinates = [
        [start.longitude, start.latitude], // Punto de inicio
        ...destinations.map(dest => [dest.longitude, dest.latitude])
      ];

      const requestBody = {
        coordinates,
        profile: options.profile || 'driving-car', // driving-car, foot-walking, cycling-regular
        optimize: true, // Optimizar la ruta
        instructions: true, // Incluir instrucciones
        geometry: true,
        elevation: false,
        extra_info: ['steepness', 'surface', 'waycategory'],
        options: {
          avoid_features: options.avoidFeatures || [], // ['highways', 'tollways', 'ferries']
          vehicle_type: 'car',
        }
      };

      const response = await this.client.post('/v2/directions/driving-car/geojson', requestBody);

      if (response.data && response.data.features && response.data.features.length > 0) {
        const route = this.parseRouteResponse(response.data);
        console.log(`✅ Route calculated successfully: ${route.distance}km, ${route.duration} minutes`);
        return route;
      } else {
        throw new Error('No route found');
      }

    } catch (error) {
      console.error('❌ Error calculating route:', error);
      throw new Error(`Route calculation failed: ${error.message}`);
    }
  }

  /**
   * Calcular ruta simple entre dos puntos
   */
  async calculateSimpleRoute(start, end, options = {}) {
    try {
      console.log(`🗺️ Calculating simple route`);

      const coordinates = [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude]
      ];

      const requestBody = {
        coordinates,
        profile: options.profile || 'driving-car',
        instructions: true,
        geometry: true,
        elevation: false,
      };

      const response = await this.client.post('/v2/directions/driving-car/geojson', requestBody);

      if (response.data && response.data.features && response.data.features.length > 0) {
        return this.parseRouteResponse(response.data);
      } else {
        throw new Error('No route found');
      }

    } catch (error) {
      console.error('❌ Error calculating simple route:', error);
      throw error;
    }
  }

  /**
   * Recalcular ruta cuando el usuario se desvía
   */
  async recalculateRoute(currentPosition, remainingDestinations, originalRoute) {
    try {
      console.log(`🔄 Recalculating route from current position`);

      // Verificar si el usuario está cerca de la ruta original
      const isOnRoute = this.isUserOnRoute(currentPosition, originalRoute);
      
      if (!isOnRoute) {
        console.log(`🚨 User deviated from route, recalculating...`);
        
        // Calcular nueva ruta desde la posición actual
        const newRoute = await this.calculateOptimizedRoute(
          currentPosition, 
          remainingDestinations,
          { recalculation: true }
        );

        return {
          needsRecalculation: true,
          newRoute,
          message: 'Route recalculated due to deviation'
        };
      } else {
        console.log(`✅ User is on route, no recalculation needed`);
        return {
          needsRecalculation: false,
          newRoute: null,
          message: 'User is on route'
        };
      }

    } catch (error) {
      console.error('❌ Error recalculating route:', error);
      return {
        needsRecalculation: false,
        error: error.message
      };
    }
  }

  // ==========================================
  // MÉTODOS DE UTILIDAD
  // ==========================================

  /**
   * Verificar si el usuario está en la ruta
   */
  isUserOnRoute(userPosition, route, thresholdMeters = 50) {
    if (!route || !route.coordinates || route.coordinates.length === 0) {
      return false;
    }

    // Buscar el punto más cercano en la ruta
    let minDistance = Infinity;
    
    for (let i = 0; i < route.coordinates.length; i++) {
      const routePoint = {
        latitude: route.coordinates[i][1],
        longitude: route.coordinates[i][0]
      };
      
      const distance = getDistance(userPosition, routePoint);
      
      if (distance < minDistance) {
        minDistance = distance;
      }
      
      // Si está dentro del threshold, está en la ruta
      if (distance <= thresholdMeters) {
        return true;
      }
    }

    console.log(`📍 User distance from route: ${minDistance}m (threshold: ${thresholdMeters}m)`);
    return false;
  }

  /**
   * Parsear respuesta de OpenRouteService
   */
  parseRouteResponse(responseData) {
    const feature = responseData.features[0];
    const properties = feature.properties;
    const geometry = feature.geometry;

    // Convertir coordenadas de [lng, lat] a [{latitude, longitude}]
    const coordinates = geometry.coordinates.map(coord => ({
      latitude: coord[1],
      longitude: coord[0]
    }));

    return {
      coordinates,
      distance: (properties.segments?.[0]?.distance || 0) / 1000, // km
      duration: Math.round((properties.segments?.[0]?.duration || 0) / 60), // minutos
      instructions: this.parseInstructions(properties.segments?.[0]?.steps || []),
      summary: {
        totalDistance: (properties.segments?.[0]?.distance || 0) / 1000,
        totalTime: Math.round((properties.segments?.[0]?.duration || 0) / 60),
      },
      rawData: responseData
    };
  }

  /**
   * Parsear instrucciones de navegación
   */
  parseInstructions(steps) {
    return steps.map((step, index) => ({
      id: index,
      instruction: step.instruction || 'Continue',
      distance: step.distance || 0,
      duration: step.duration || 0,
      type: step.type || 0,
      maneuver: this.getManeuverType(step.type)
    }));
  }

  /**
   * Obtener tipo de maniobra
   */
  getManeuverType(type) {
    const maneuvers = {
      0: 'straight',
      1: 'turn-right',
      2: 'turn-left',
      3: 'sharp-right',
      4: 'sharp-left',
      5: 'slight-right',
      6: 'slight-left',
      7: 'continue',
      8: 'roundabout',
      9: 'u-turn',
      10: 'arrive'
    };
    return maneuvers[type] || 'continue';
  }

  // ==========================================
  // MÉTODOS DE GEOCODIFICACIÓN
  // ==========================================

  /**
   * Buscar direcciones (Geocoding)
   */
  async searchAddress(query, location = null) {
    try {
      let url = `/geocode/search?api_key=${this.apiKey}&text=${encodeURIComponent(query)}`;
      
      if (location) {
        url += `&focus.point.lat=${location.latitude}&focus.point.lon=${location.longitude}`;
      }

      const response = await this.client.get(url);
      
      return response.data.features.map(feature => ({
        id: feature.properties.id,
        label: feature.properties.label,
        coordinates: {
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0]
        },
        confidence: feature.properties.confidence
      }));

    } catch (error) {
      console.error('❌ Error searching address:', error);
      throw error;
    }
  }

  /**
   * Geocodificación inversa (coordenadas a dirección)
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const response = await this.client.get(
        `/geocode/reverse?api_key=${this.apiKey}&point.lat=${latitude}&point.lon=${longitude}`
      );

      if (response.data.features.length > 0) {
        return {
          address: response.data.features[0].properties.label,
          components: response.data.features[0].properties
        };
      } else {
        return { address: 'Unknown location', components: {} };
      }

    } catch (error) {
      console.error('❌ Error reverse geocoding:', error);
      return { address: 'Unknown location', components: {} };
    }
  }

  // ==========================================
  // MÉTODOS DE TESTING
  // ==========================================

  /**
   * Test de conectividad con OpenRouteService
   */
  async testConnection() {
    try {
      console.log('🔍 Testing OpenRouteService connection...');
      
      const testRoute = await this.calculateSimpleRoute(
        { latitude: 32.465, longitude: -116.82 },
        { latitude: 32.47, longitude: -116.83 }
      );

      console.log('✅ OpenRouteService connection successful');
      return { success: true, route: testRoute };

    } catch (error) {
      console.error('❌ OpenRouteService connection failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OpenRouteService();
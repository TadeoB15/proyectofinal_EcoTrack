import AsyncStorage from '@react-native-async-storage/async-storage';

class RouteService {
  constructor() {
    this.apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImI1ZWQxNjc3NzQxOTQyMjNhNDI4MGZjNTlmOWZjZDE0IiwiaCI6Im11cm11cjY0In0='; //API KEY
    this.baseURL = 'https://api.openrouteservice.org/v2';
    this.currentRoute = null;
    this.isTracking = false;
  }

  // OBTENER RUTA OPTIMIZADA ENTRE MÚLTIPLES PUNTOS
  async getOptimizedRoute(startPoint, waypoints, profile = 'driving-car') {
    try {
      console.log(`🚗 Calculating optimized route with ${waypoints.length} waypoints...`);

      
      const allCoordinates = [
        [startPoint.longitude, startPoint.latitude], // Punto de inicio
        ...waypoints.map(point => [point.longitude, point.latitude])
      ];

      const requestBody = {
        coordinates: allCoordinates,
        profile: profile, 
        optimize: true, 
        instructions: true,
        geometry: true,
        elevation: false,
        extra_info: ['waytype', 'steepness'],
        options: {
          avoid_features: ['highways'], 
          round_trip: false
        }
      };

      const response = await fetch(`${this.baseURL}/directions/${profile}/geojson`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouteService Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Route calculated successfully - Distance: ${Math.round(data.features[0].properties.summary.distance/1000)}km`);

      return this.processRouteData(data);

    } catch (error) {
      console.error('❌ Error calculating route:', error);
      throw error;
    }
  }

  // 🔄 RECALCULAR RUTA EN TIEMPO REAL
  async recalculateRoute(currentPosition, remainingWaypoints) {
    try {
      if (remainingWaypoints.length === 0) {
        console.log('✅ Route completed - no more waypoints');
        return null;
      }

      console.log(`🔄 Recalculating route from current position to ${remainingWaypoints.length} remaining points...`);

      // Verificar si el usuario se ha desviado significativamente
      const deviationThreshold = 50; // metros
      const isOffRoute = await this.checkRouteDeviation(currentPosition, deviationThreshold);

      if (isOffRoute) {
        console.log('🚨 User is off route - recalculating...');
        
        // Recalcular ruta completa
        const newRoute = await this.getOptimizedRoute(currentPosition, remainingWaypoints);
        this.currentRoute = newRoute;
        
        return {
          ...newRoute,
          recalculated: true,
          reason: 'deviation'
        };
      }

      return {
        recalculated: false,
        currentRoute: this.currentRoute
      };

    } catch (error) {
      console.error('❌ Error recalculating route:', error);
      return null;
    }
  }

  // 📍 VERIFICAR DESVIACIÓN DE RUTA
  async checkRouteDeviation(currentPosition, thresholdMeters = 50) {
    if (!this.currentRoute || !this.currentRoute.coordinates) {
      return false;
    }

    // Encontrar el punto más cercano en la ruta
    let minDistance = Infinity;
    
    for (const coordinate of this.currentRoute.coordinates) {
      const distance = this.calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        coordinate[1], // lat
        coordinate[0]  // lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance > thresholdMeters;
  }

  // 📏 CALCULAR DISTANCIA ENTRE DOS PUNTOS (Haversine)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en metros
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // 🛠️ PROCESAR DATOS DE RUTA DE ORS
  processRouteData(orsData) {
    const feature = orsData.features[0];
    const geometry = feature.geometry;
    const properties = feature.properties;

    return {
      coordinates: geometry.coordinates, // [lng, lat] format
      distance: Math.round(properties.summary.distance), // metros
      duration: Math.round(properties.summary.duration), // segundos
      instructions: properties.segments[0]?.steps || [],
      waypoints: properties.waypoints || [],
      
      // ✅ CONVERTIR A FORMATO REACT-NATIVE-MAPS
      polylineCoordinates: geometry.coordinates.map(coord => ({
        latitude: coord[1],
        longitude: coord[0]
      })),
      
      // Información adicional
      summary: {
        totalDistance: `${(properties.summary.distance / 1000).toFixed(1)} km`,
        estimatedTime: `${Math.round(properties.summary.duration / 60)} min`,
        totalWaypoints: geometry.coordinates.length
      }
    };
  }

  // 🎯 OBTENER SIGUIENTE WAYPOINT
  getNextWaypoint(currentPosition, route) {
    if (!route || !route.waypoints) return null;

    // Encontrar el waypoint más cercano que no ha sido visitado
    const unvisitedWaypoints = route.waypoints.filter(wp => !wp.visited);
    
    if (unvisitedWaypoints.length === 0) return null;

    let closestWaypoint = null;
    let minDistance = Infinity;

    unvisitedWaypoints.forEach(waypoint => {
      const distance = this.calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        waypoint.location[1], // lat
        waypoint.location[0]  // lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestWaypoint = waypoint;
      }
    });

    return {
      ...closestWaypoint,
      distanceToWaypoint: Math.round(minDistance)
    };
  }

  // 📊 TRACKING DE UBICACIÓN EN TIEMPO REAL
  startLocationTracking(callback, recalculateCallback) {
    this.isTracking = true;
    
    // Configurar tracking cada 5 segundos
    this.trackingInterval = setInterval(async () => {
      if (!this.isTracking) return;

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const currentPosition = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: Date.now()
        };

        // Callback con la posición actual
        callback(currentPosition);

        // Verificar si necesita recalcular la ruta
        if (this.currentRoute) {
          const recalculation = await this.recalculateRoute(
            currentPosition,
            this.currentRoute.remainingWaypoints || []
          );

          if (recalculation && recalculation.recalculated) {
            recalculateCallback(recalculation);
          }
        }

      } catch (error) {
        console.error('❌ Error in location tracking:', error);
      }
    }, 5000); // Cada 5 segundos
  }

  stopLocationTracking() {
    this.isTracking = false;
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
  }

  // 💾 GUARDAR RUTA EN STORAGE
  async saveRoute(route) {
    try {
      await AsyncStorage.setItem('currentRoute', JSON.stringify(route));
      this.currentRoute = route;
    } catch (error) {
      console.error('❌ Error saving route:', error);
    }
  }

  // 📱 CARGAR RUTA GUARDADA
  async loadSavedRoute() {
    try {
      const savedRoute = await AsyncStorage.getItem('currentRoute');
      if (savedRoute) {
        this.currentRoute = JSON.parse(savedRoute);
        return this.currentRoute;
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading saved route:', error);
      return null;
    }
  }
}

export default new RouteService();
import * as Location from 'expo-location';
import { MAP_CONFIG } from '../config/MapConfig.js';
import OpenRouteService from './OpenRouteService.js';
import { getDistance, getBearing } from 'geolib';

class NavigationService {
  constructor() {
    this.isNavigating = false;
    this.currentRoute = null;
    this.currentDestinations = [];
    this.locationSubscription = null;
    this.navigationCallbacks = {};
    this.userPosition = null;
    this.lastRecalculationTime = 0;
  }

  // ==========================================
  // CONTROL DE NAVEGACIÓN
  // ==========================================

  /**
   * Iniciar navegación con ruta optimizada
   */
  async startNavigation(destinations, callbacks = {}) {
    try {
      console.log(`🧭 Starting navigation to ${destinations.length} destinations`);

      // Verificar permisos de ubicación
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permissions required for navigation');
      }

      // Obtener posición inicial
      const currentPosition = await this.getCurrentPosition();
      console.log(`📍 Current position: [${currentPosition.latitude}, ${currentPosition.longitude}]`);

      // Calcular ruta optimizada
      const route = await OpenRouteService.calculateOptimizedRoute(
        currentPosition, 
        destinations
      );

      // Configurar navegación
      this.currentRoute = route;
      this.currentDestinations = [...destinations];
      this.userPosition = currentPosition;
      this.isNavigating = true;
      this.navigationCallbacks = callbacks;

      // Iniciar seguimiento de ubicación
      await this.startLocationTracking();

      // Notificar inicio de navegación
      if (callbacks.onNavigationStart) {
        callbacks.onNavigationStart({
          route,
          destinations,
          initialPosition: currentPosition
        });
      }

      console.log(`✅ Navigation started successfully`);
      return { success: true, route, initialPosition: currentPosition };

    } catch (error) {
      console.error('❌ Error starting navigation:', error);
      throw error;
    }
  }

  /**
   * Detener navegación
   */
  async stopNavigation() {
    console.log('🛑 Stopping navigation');
    
    this.isNavigating = false;
    this.currentRoute = null;
    this.currentDestinations = [];
    
    // Detener seguimiento de ubicación
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    // Notificar detención
    if (this.navigationCallbacks.onNavigationStop) {
      this.navigationCallbacks.onNavigationStop();
    }

    this.navigationCallbacks = {};
    console.log('✅ Navigation stopped');
  }

  /**
   * Pausar/Reanudar navegación
   */
  pauseNavigation() {
    this.isNavigating = false;
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    console.log('⏸️ Navigation paused');
  }

  async resumeNavigation() {
    if (this.currentRoute && this.currentDestinations.length > 0) {
      this.isNavigating = true;
      await this.startLocationTracking();
      console.log('▶️ Navigation resumed');
    }
  }

  // ==========================================
  // SEGUIMIENTO DE UBICACIÓN
  // ==========================================

  /**
   * Iniciar seguimiento de ubicación en tiempo real
   */
  async startLocationTracking() {
    try {
      console.log('📡 Starting location tracking...');

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: MAP_CONFIG.LOCATION_UPDATE_INTERVAL,
          distanceInterval: 10, // Actualizar cada 10 metros
        },
        (location) => {
          if (this.isNavigating) {
            this.handleLocationUpdate(location);
          }
        }
      );

      console.log('✅ Location tracking started');

    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      throw error;
    }
  }

  /**
   * Manejar actualización de ubicación
   */
  async handleLocationUpdate(location) {
    const newPosition = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: location.coords.heading,
      speed: location.coords.speed,
      accuracy: location.coords.accuracy,
    };

    console.log(`📍 Location update: [${newPosition.latitude}, ${newPosition.longitude}]`);

    // Calcular distancia desde la última posición
    let distanceMoved = 0;
    if (this.userPosition) {
      distanceMoved = getDistance(this.userPosition, newPosition);
    }

    // Actualizar posición del usuario
    const previousPosition = this.userPosition;
    this.userPosition = newPosition;

    // Notificar cambio de posición
    if (this.navigationCallbacks.onLocationUpdate) {
      this.navigationCallbacks.onLocationUpdate({
        position: newPosition,
        previousPosition,
        distanceMoved,
        speed: location.coords.speed,
        heading: location.coords.heading
      });
    }

    // Verificar si necesita recalcular ruta
    await this.checkRouteRecalculation(newPosition, distanceMoved);

    // Verificar si llegó a algún destino
    await this.checkDestinationArrival(newPosition);
  }

  // ==========================================
  // RECÁLCULO DE RUTA
  // ==========================================

  /**
   * Verificar si necesita recalcular la ruta
   */
  async checkRouteRecalculation(currentPosition, distanceMoved) {
    try {
      // Evitar recalcular muy frecuentemente
      const now = Date.now();
      if (now - this.lastRecalculationTime < 30000) { // 30 segundos mínimo
        return;
      }

      // Solo recalcular si se movió una distancia significativa
      if (distanceMoved < MAP_CONFIG.ROUTE_RECALC_DISTANCE_THRESHOLD) {
        return;
      }

      console.log(`🔄 Checking if route recalculation is needed...`);

      // Verificar si está fuera de la ruta
      const recalcResult = await OpenRouteService.recalculateRoute(
        currentPosition,
        this.currentDestinations,
        this.currentRoute
      );

      if (recalcResult.needsRecalculation && recalcResult.newRoute) {
        console.log(`🔄 Route recalculated due to deviation`);
        
        this.currentRoute = recalcResult.newRoute;
        this.lastRecalculationTime = now;

        // Notificar nueva ruta
        if (this.navigationCallbacks.onRouteRecalculated) {
          this.navigationCallbacks.onRouteRecalculated({
            newRoute: recalcResult.newRoute,
            reason: recalcResult.message,
            currentPosition
          });
        }
      }

    } catch (error) {
      console.error('❌ Error checking route recalculation:', error);
    }
  }

  /**
   * Verificar llegada a destino
   */
  async checkDestinationArrival(currentPosition) {
    if (!this.currentDestinations || this.currentDestinations.length === 0) {
      return;
    }

    const nextDestination = this.currentDestinations[0];
    const distanceToDestination = getDistance(currentPosition, nextDestination);

    console.log(`📍 Distance to next destination: ${distanceToDestination}m`);

    // Si está a menos de 30 metros del destino
    if (distanceToDestination <= 30) {
      console.log(`🎯 Arrived at destination: ${nextDestination.id || 'Unknown'}`);

      // Remover destino alcanzado
      this.currentDestinations.shift();

      // Notificar llegada
      if (this.navigationCallbacks.onDestinationReached) {
        this.navigationCallbacks.onDestinationReached({
          destination: nextDestination,
          remainingDestinations: this.currentDestinations.length,
          currentPosition
        });
      }

      // Si quedan más destinos, recalcular ruta
      if (this.currentDestinations.length > 0) {
        console.log(`🔄 Recalculating route to remaining ${this.currentDestinations.length} destinations`);
        
        try {
          const newRoute = await OpenRouteService.calculateOptimizedRoute(
            currentPosition,
            this.currentDestinations
          );

          this.currentRoute = newRoute;

          if (this.navigationCallbacks.onRouteUpdated) {
            this.navigationCallbacks.onRouteUpdated({
              newRoute,
              remainingDestinations: this.currentDestinations
            });
          }

        } catch (error) {
          console.error('❌ Error recalculating route after destination reached:', error);
        }
      } else {
        // Todas las ubicaciones completadas
        console.log('🏁 All destinations reached! Navigation completed.');
        
        if (this.navigationCallbacks.onNavigationComplete) {
          this.navigationCallbacks.onNavigationComplete({
            finalPosition: currentPosition
          });
        }
        
        await this.stopNavigation();
      }
    }
  }

  // ==========================================
  // MÉTODOS DE UTILIDAD
  // ==========================================

  /**
   * Solicitar permisos de ubicación
   */
  async requestLocationPermissions() {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('❌ Foreground location permission denied');
        return false;
      }

      // Para navegación, también solicitar permisos de background
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('⚠️ Background location permission denied, navigation may be limited');
      }

      return true;
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Obtener posición actual
   */
  async getCurrentPosition() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 10000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        accuracy: location.coords.accuracy,
      };

    } catch (error) {
      console.error('❌ Error getting current position:', error);
      
      // Fallback a la región por defecto
      return {
        latitude: MAP_CONFIG.DEFAULT_REGION.latitude,
        longitude: MAP_CONFIG.DEFAULT_REGION.longitude,
        heading: 0,
        speed: 0,
        accuracy: 999,
      };
    }
  }

  /**
   * Obtener información de navegación actual
   */
  getNavigationInfo() {
    return {
      isNavigating: this.isNavigating,
      currentRoute: this.currentRoute,
      remainingDestinations: this.currentDestinations.length,
      userPosition: this.userPosition,
      estimatedTimeRemaining: this.currentRoute?.duration || 0,
      distanceRemaining: this.currentRoute?.distance || 0,
    };
  }
}

export default new NavigationService();
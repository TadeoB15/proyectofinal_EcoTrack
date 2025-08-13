class Environment {
  static isDevelopment() {
    return __DEV__;
  }

  static getApiUrl() {
    if (this.isDevelopment()) {
      // Cambia esta IP por la IP de tu computadora en la red local
      return 'http:10.248.138.20//:3001';
    }
    
  }

  static shouldUseMockData() {
    // Cambiar a false cuando el backend esté funcionando
    return false;
  }
}

export default Environment;
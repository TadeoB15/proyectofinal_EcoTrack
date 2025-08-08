class Environment {
  static isDevelopment() {
    return __DEV__;
  }

  static getApiUrl() {
    if (this.isDevelopment()) {
      // Cambia esta IP por la IP de tu computadora en la red local
      return 'http://192.168.43.87:3001';
    }
    return 'https://tu-servidor-produccion.com';
  }

  static shouldUseMockData() {
    // Cambiar a false cuando el backend esté funcionando
    return false;
  }
}

export default Environment;
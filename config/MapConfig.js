export const MAP_CONFIG = {
  // ✅ OpenRouteService API
  OPENROUTE_API_KEY: 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImI1ZWQxNjc3NzQxOTQyMjNhNDI4MGZjNTlmOWZjZDE0IiwiaCI6Im11cm11cjY0In0=', // Reemplaza con tu API key real
  OPENROUTE_BASE_URL: 'https://api.openrouteservice.org',
  
  // ✅ Configuración de tiles de OpenStreetMap
  OSM_TILE_URL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  
  // ✅ Configuración de navegación
  LOCATION_UPDATE_INTERVAL: 5000, // 5 segundos
  ROUTE_RECALC_DISTANCE_THRESHOLD: 50, // 50 metros
  
  // ✅ Configuración del mapa
  DEFAULT_REGION: {
    latitude: 32.46112324200113,
    longitude: -116.82542748158332,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};
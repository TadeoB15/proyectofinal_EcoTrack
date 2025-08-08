import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import MapView, { Marker, Polyline, Circle, UrlTile } from 'react-native-maps';
import { MAP_CONFIG } from '../config/MapConfig';



const OSMMapView = forwardRef(({ 
  children, 
  onRegionChange, 
  onUserLocationChange,
  showsUserLocation = true,
  followsUserLocation = false,
  style,
  initialRegion = MAP_CONFIG.DEFAULT_REGION,
  ...props 
}, ref) => {
  const mapRef = useRef(null);

  // Exponer métodos del mapa al componente padre
  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 1000) => {
      mapRef.current?.animateToRegion(region, duration);
    },
    
    animateToCoordinate: (coordinate, duration = 1000) => {
      mapRef.current?.animateToCoordinate(coordinate, duration);
    },
    
    fitToCoordinates: (coordinates, options = {}) => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
        ...options
      });
    },
    
    getMapBoundaries: async () => {
      return await mapRef.current?.getMapBoundaries();
    }
  }));

  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={initialRegion}
      onRegionChange={onRegionChange}
      onUserLocationChange={onUserLocationChange}
      showsUserLocation={showsUserLocation}
      followsUserLocation={followsUserLocation}
      showsMyLocationButton={false}
      showsCompass={false}
      showsScale={false}
      showsBuildings={true}
      showsTraffic={false}
      showsIndoors={false}
      {...props}
    >
      {/* ✅ Usar tiles de OpenStreetMap */}
      <UrlTile
        urlTemplate={MAP_CONFIG.OSM_TILE_URL}
        maximumZ={19}
        flipY={false}
        shouldReplaceMapContent={true}
        zIndex={-1}
      />
      
      {children}
    </MapView>
  );
});

OSMMapView.Marker = Marker;
OSMMapView.Polyline = Polyline;
OSMMapView.Circle = Circle;
export default OSMMapView;
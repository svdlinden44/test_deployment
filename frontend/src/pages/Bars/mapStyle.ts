export const darkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f0a06' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a6e30' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#080503' }] },

  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#221508' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#7a6a56' }] },

  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0f0a06' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#18100a' }] },
  { featureType: 'landscape.natural', elementType: 'geometry.fill', stylers: [{ color: '#120d07' }] },

  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a1208' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7a6a56' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#161008' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b5d3e' }] },

  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#221508' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#18100a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a6e30' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a1a0a' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#3a2510' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#c4b49a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#261a0c' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#1e1409' }] },

  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a1208' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#8a6e30' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#080503' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a2510' }] },
]

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import s from './Bars.module.scss'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 } // NYC fallback
const DEFAULT_ZOOM = 13
const SEARCH_RADIUS = 3000

interface BarResult {
  id: string
  name: string
  address: string
  rating: number | null
  userRatingCount: number | null
  location: google.maps.LatLngLiteral
  priceLevel: string | null
  isOpen: boolean | null
  photoUri: string | null
}

export function Bars() {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => {
        setGeoError('Location access denied. Showing default area.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const center = userLocation ?? DEFAULT_CENTER

  return (
    <div className={s.page}>
      <APIProvider apiKey={API_KEY}>
        <div className={s.header}>
          <span className={s.label}>Bar Finder</span>
          <h2 className={s.title}>
            Nearby Cocktail Bars
          </h2>
          {loading && <p className={s.status}>Detecting your location…</p>}
          {geoError && <p className={s.status}>{geoError}</p>}
        </div>

        <div className={s.mapContainer}>
          <Map
            defaultCenter={center}
            center={loading ? undefined : center}
            defaultZoom={DEFAULT_ZOOM}
            mapId="distillist-dark-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            className={s.map}
          >
            {!loading && (
              <NearbyBarsLayer center={center} />
            )}
          </Map>
        </div>
      </APIProvider>
    </div>
  )
}

function NearbyBarsLayer({ center }: { center: google.maps.LatLngLiteral }) {
  const map = useMap()
  const placesLib = useMapsLibrary('places')
  const [bars, setBars] = useState<BarResult[]>([])
  const [selectedBar, setSelectedBar] = useState<BarResult | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searched = useRef(false)

  useEffect(() => {
    if (!placesLib || !map || searched.current) return
    searched.current = true

    async function search() {
      try {
        const { Place } = placesLib!
        const request = {
          fields: [
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'priceLevel',
            'regularOpeningHours',
            'photos',
          ],
          locationRestriction: {
            center,
            radius: SEARCH_RADIUS,
          },
          includedPrimaryTypes: ['bar', 'night_club'],
          maxResultCount: 20,
          rankPreference: google.maps.places.SearchNearbyRankPreference.DISTANCE,
        } as google.maps.places.SearchNearbyRequest

        const { places } = await Place.searchNearby(request)

        const results: BarResult[] = (places ?? []).map((place) => {
          const loc = place.location
          return {
            id: place.id ?? crypto.randomUUID(),
            name: place.displayName ?? 'Unknown Bar',
            address: place.formattedAddress ?? '',
            rating: place.rating ?? null,
            userRatingCount: place.userRatingCount ?? null,
            location: { lat: loc?.lat() ?? 0, lng: loc?.lng() ?? 0 },
            priceLevel: place.priceLevel != null ? priceLevelLabel(place.priceLevel) : null,
            isOpen: place.regularOpeningHours?.periods ? isCurrentlyOpen(place.regularOpeningHours) : null,
            photoUri: place.photos?.[0]?.getURI({ maxWidth: 400 }) ?? null,
          }
        })

        setBars(results)
      } catch {
        setSearchError('Could not load nearby bars. Check your API key and enabled APIs.')
      }
    }

    search()
  }, [placesLib, map, center])

  const handleMarkerClick = useCallback((bar: BarResult) => {
    setSelectedBar((prev) => (prev?.id === bar.id ? null : bar))
  }, [])

  return (
    <>
      {searchError && (
        <div className={s.mapOverlayError}>{searchError}</div>
      )}

      {bars.map((bar) => (
        <AdvancedMarker
          key={bar.id}
          position={bar.location}
          title={bar.name}
          onClick={() => handleMarkerClick(bar)}
        >
          <div className={s.marker}>
            <span className={s.markerIcon}>🍸</span>
          </div>
        </AdvancedMarker>
      ))}

      {selectedBar && (
        <InfoWindow
          position={selectedBar.location}
          onCloseClick={() => setSelectedBar(null)}
          pixelOffset={[0, -40]}
        >
          <div className={s.infoWindow}>
            {selectedBar.photoUri && (
              <img
                src={selectedBar.photoUri}
                alt={selectedBar.name}
                className={s.infoPhoto}
              />
            )}
            <h3 className={s.infoName}>{selectedBar.name}</h3>
            <p className={s.infoAddress}>{selectedBar.address}</p>
            <div className={s.infoMeta}>
              {selectedBar.rating != null && (
                <span className={s.infoRating}>★ {selectedBar.rating.toFixed(1)}</span>
              )}
              {selectedBar.userRatingCount != null && (
                <span className={s.infoReviews}>({selectedBar.userRatingCount})</span>
              )}
              {selectedBar.priceLevel && (
                <span className={s.infoPrice}>{selectedBar.priceLevel}</span>
              )}
              {selectedBar.isOpen != null && (
                <span className={selectedBar.isOpen ? s.infoOpen : s.infoClosed}>
                  {selectedBar.isOpen ? 'Open' : 'Closed'}
                </span>
              )}
            </div>
          </div>
        </InfoWindow>
      )}

      <SidebarPanel bars={bars} onSelect={handleMarkerClick} selectedId={selectedBar?.id ?? null} />
    </>
  )
}

function SidebarPanel({
  bars,
  onSelect,
  selectedId,
}: {
  bars: BarResult[]
  onSelect: (bar: BarResult) => void
  selectedId: string | null
}) {
  const map = useMap()

  const handleClick = useCallback(
    (bar: BarResult) => {
      onSelect(bar)
      map?.panTo(bar.location)
      map?.setZoom(16)
    },
    [onSelect, map]
  )

  if (bars.length === 0) return null

  return (
    <div className={s.sidebar}>
      <h3 className={s.sidebarTitle}>
        <span className={s.sidebarCount}>{bars.length}</span> bars found nearby
      </h3>
      <ul className={s.sidebarList}>
        {bars.map((bar) => (
          <li
            key={bar.id}
            className={`${s.sidebarItem} ${selectedId === bar.id ? s.sidebarItemActive : ''}`}
            onClick={() => handleClick(bar)}
          >
            {bar.photoUri && (
              <img src={bar.photoUri} alt={bar.name} className={s.sidebarThumb} />
            )}
            <div className={s.sidebarInfo}>
              <strong className={s.sidebarName}>{bar.name}</strong>
              <span className={s.sidebarAddr}>{bar.address}</span>
              <div className={s.sidebarMeta}>
                {bar.rating != null && (
                  <span className={s.sidebarRating}>★ {bar.rating.toFixed(1)}</span>
                )}
                {bar.isOpen != null && (
                  <span className={bar.isOpen ? s.sidebarOpen : s.sidebarClosed}>
                    {bar.isOpen ? 'Open' : 'Closed'}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function priceLevelLabel(level: google.maps.places.PriceLevel): string {
  const map: Record<string, string> = {
    FREE: 'Free',
    INEXPENSIVE: '$',
    MODERATE: '$$',
    EXPENSIVE: '$$$',
    VERY_EXPENSIVE: '$$$$',
  }
  return map[level] ?? ''
}

function isCurrentlyOpen(hours: google.maps.places.OpeningHours): boolean {
  try {
    const now = new Date()
    const day = now.getDay()
    const time = now.getHours() * 100 + now.getMinutes()

    for (const period of hours.periods ?? []) {
      const open = period.open
      const close = period.close
      if (!open || open.day !== day) continue

      const openTime = (open.hour ?? 0) * 100 + (open.minute ?? 0)
      const closeTime = close ? (close.hour ?? 0) * 100 + (close.minute ?? 0) : 2400

      if (closeTime < openTime) {
        if (time >= openTime || time < closeTime) return true
      } else {
        if (time >= openTime && time < closeTime) return true
      }
    }
    return false
  } catch {
    return false
  }
}

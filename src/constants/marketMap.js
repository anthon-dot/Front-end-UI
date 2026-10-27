/**
 * Shared Leaflet map settings for the Manticao Public Market.
 *
 * Every map in the app (Landing page, Business Application stall picker,
 * Market Supervisor GPS Map, Admin Stall Map) imports from here so the
 * market location, zoom levels and basemap tiles can never drift apart.
 */

// Manticao Public Market, Manticao, Misamis Oriental (GPS center)
export const MARKET_CENTER = Object.freeze({ lat: 8.399991, lng: 124.291353 })

// Zoom levels
export const MARKET_DEFAULT_ZOOM = 18
export const MARKET_MIN_ZOOM = 15
export const MARKET_MAX_ZOOM = 20

// Max distance (in degrees, ~1 km) a stall pin may be from the market center
// before its coordinates are considered invalid (e.g. old/bad data out at sea).
export const MARKET_MAX_COORD_OFFSET = 0.01

// Clean Google basemap tiles (POIs / labels for businesses hidden)
const GOOGLE_TILE_STYLE = 'apistyle=s.t:33|p.v:off,s.t:37|p.v:off,s.e:l.i|p.v:off'
const GOOGLE_SUBDOMAINS = ['mt0', 'mt1', 'mt2', 'mt3']

export const BASEMAP_TILES = Object.freeze({
  roadmap: {
    url: `https://{s}.google.com/vt/lyrs=m&${GOOGLE_TILE_STYLE}&x={x}&y={y}&z={z}`,
    options: {
      maxZoom: MARKET_MAX_ZOOM,
      subdomains: GOOGLE_SUBDOMAINS,
      attribution: '&copy; Google Maps'
    }
  },
  satellite: {
    url: `https://{s}.google.com/vt/lyrs=y&${GOOGLE_TILE_STYLE}&x={x}&y={y}&z={z}`,
    options: {
      maxZoom: MARKET_MAX_ZOOM,
      subdomains: GOOGLE_SUBDOMAINS,
      attribution: '&copy; Google Maps Satellite'
    }
  }
})

/**
 * Returns true when the given coordinates are valid numbers located
 * within MARKET_MAX_COORD_OFFSET of the market center.
 */
export function isNearMarket(lat, lng) {
  const la = Number(lat)
  const ln = Number(lng)
  if (!la || !ln || Number.isNaN(la) || Number.isNaN(ln)) return false
  return (
    Math.abs(la - MARKET_CENTER.lat) <= MARKET_MAX_COORD_OFFSET &&
    Math.abs(ln - MARKET_CENTER.lng) <= MARKET_MAX_COORD_OFFSET
  )
}

/**
 * Returns a { lat, lng } offset from the market center (offsets in degrees).
 * Useful for placing demo/fallback stall pins on the market building.
 */
export function offsetFromMarket(dLat, dLng) {
  return {
    lat: Number((MARKET_CENTER.lat + dLat).toFixed(6)),
    lng: Number((MARKET_CENTER.lng + dLng).toFixed(6))
  }
}

<script setup lang="ts">
const props = defineProps<{
  lat: number | null
  lng: number | null
  address: string
  cityLabel: string
  areaM2: number
}>()

const emit = defineEmits<{
  locationChange: [payload: { lat: number; lng: number; address: string; cityLabel: string }]
  areaChange: [areaM2: number]
}>()

const config = useRuntimeConfig()
const apiKey = config.public.googleMapsApiKey as string

const mapRef = ref<HTMLDivElement | null>(null)
const autocompleteHost = ref<HTMLDivElement | null>(null)
const ready = ref(false)
const errorMessage = ref('')
const pointCount = ref(0)

let map: any = null
let polygon: any = null
let locationMarker: any = null
let polygonListeners: any[] = []
let clickListener: any = null
const pathPoints = ref<{ lat: number; lng: number }[]>([])
const vertexMarkers: any[] = []

const TURKEY_CENTER = { lat: 39.0, lng: 35.0 }

/** Load Google Maps via vanilla script tag with callback */
const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
      resolve()
      return
    }

    const callbackName = '__gmapsCallback_' + Date.now()
    ;(window as any)[callbackName] = () => {
      delete (window as any)[callbackName]
      resolve()
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
    if (existing) {
      // Script already in DOM — poll until google.maps is ready
      const check = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
          clearInterval(check)
          resolve()
        }
      }, 50)
      setTimeout(() => { clearInterval(check); reject(new Error('Google Maps timeout')) }, 10000)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly&language=tr&region=TR&callback=${callbackName}`
    script.async = true
    script.onerror = () => {
      delete (window as any)[callbackName]
      reject(new Error('Google Maps script yuklenemedi'))
    }
    document.head.appendChild(script)
  })
}

const updateArea = () => {
  if (!polygon) {
    emit('areaChange', 0)
    return
  }

  const area = google.maps.geometry.spherical.computeArea(polygon.getPath())
  emit('areaChange', Math.round(area))
}

const clearVertexMarkers = () => {
  vertexMarkers.forEach((m) => m.setMap(null))
  vertexMarkers.length = 0
}

const addVertexMarker = (position: { lat: number; lng: number }, index: number) => {
  if (!map) return
  const m = new google.maps.Marker({
    map,
    position,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: '#18A957',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
    },
    label: {
      text: String(index + 1),
      color: '#fff',
      fontSize: '10px',
      fontWeight: 'bold',
    },
    zIndex: 10,
  })
  vertexMarkers.push(m)
}

const syncVertexMarkers = () => {
  clearVertexMarkers()
  pathPoints.value.forEach((point, i) => addVertexMarker(point, i))
}

const clearPolygon = () => {
  polygonListeners.forEach((listener) => listener.remove())
  polygonListeners = []
  polygon?.setMap(null)
  polygon = null
  pathPoints.value = []
  pointCount.value = 0
  clearVertexMarkers()
  emit('areaChange', 0)
}

const ensurePolygon = async () => {
  if (!map || pathPoints.value.length < 3) {
    syncVertexMarkers()
    return
  }

  polygon?.setMap(null)
  polygon = new google.maps.Polygon({
    paths: pathPoints.value,
    editable: true,
    draggable: false,
    strokeColor: '#18A957',
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: '#18A957',
    fillOpacity: 0.18,
    map,
  })

  const path = polygon.getPath()
  polygonListeners.forEach((listener) => listener.remove())
  polygonListeners = [
    path.addListener('set_at', updateArea),
    path.addListener('insert_at', updateArea),
    path.addListener('remove_at', updateArea),
  ]

  syncVertexMarkers()
  await updateArea()
}

const addPoint = async (latLng: any) => {
  pathPoints.value = [...pathPoints.value, { lat: latLng.lat(), lng: latLng.lng() }]
  pointCount.value = pathPoints.value.length
  await ensurePolygon()
}

const undoLastPoint = async () => {
  if (pathPoints.value.length === 0) return
  pathPoints.value = pathPoints.value.slice(0, -1)
  pointCount.value = pathPoints.value.length

  if (pathPoints.value.length < 3) {
    polygonListeners.forEach((l) => l.remove())
    polygonListeners = []
    polygon?.setMap(null)
    polygon = null
    emit('areaChange', 0)
    syncVertexMarkers()
  } else {
    await ensurePolygon()
  }
}

const resetToLocation = () => {
  if (!map) return
  if (props.lat !== null && props.lng !== null) {
    map.panTo({ lat: props.lat, lng: props.lng })
    map.setZoom(20)
  } else {
    map.panTo(TURKEY_CENTER)
    map.setZoom(6)
  }
}

const syncLocationMarker = (position: { lat: number; lng: number }) => {
  if (!map) return
  if (!locationMarker) {
    locationMarker = new google.maps.Marker({ map, position })
    return
  }
  locationMarker.setPosition(position)
}

const mountAutocomplete = () => {
  if (!autocompleteHost.value) return

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = 'Sehir, ilce veya adres ara'
  input.className = 'autocomplete-input'
  autocompleteHost.value.innerHTML = ''
  autocompleteHost.value.appendChild(input)

  const autocomplete = new google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: 'tr' },
    fields: ['formatted_address', 'geometry', 'address_components', 'name'],
  })

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (!place.geometry?.location || !map) return

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()

    const cityComponent = place.address_components?.find((c) =>
      c.types.includes('administrative_area_level_2') ||
      c.types.includes('administrative_area_level_1') ||
      c.types.includes('locality'),
    )
    const cityLabel = cityComponent?.long_name ?? place.name ?? place.formatted_address ?? 'Secili konum'

    emit('locationChange', { lat, lng, address: place.formatted_address ?? `${lat}, ${lng}`, cityLabel })

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport)
    }
    map.setZoom(20)
    syncLocationMarker({ lat, lng })
    clearPolygon()
  })
}

onMounted(async () => {
  if (!apiKey) {
    errorMessage.value = 'Google Maps API key tanimli degil. `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` eklenmeli.'
    return
  }

  if (!mapRef.value) return

  try {
    await loadGoogleMaps()

    const hasInitialLocation = props.lat !== null && props.lng !== null
    const initialCenter = hasInitialLocation ? { lat: props.lat!, lng: props.lng! } : TURKEY_CENTER
    const initialZoom = hasInitialLocation ? 20 : 6

    map = new google.maps.Map(mapRef.value, {
      center: initialCenter,
      zoom: initialZoom,
      mapTypeId: 'satellite',
      tilt: 0,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    if (hasInitialLocation) {
      syncLocationMarker(initialCenter)
    }

    clickListener = map.addListener('click', async (event: any) => {
      if (!event.latLng) return
      await addPoint(event.latLng)
    })

    await mountAutocomplete()
    ready.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Google Maps yuklenemedi.'
  }
})

watch(
  () => [props.lat, props.lng] as const,
  ([lat, lng]) => {
    if (!map || lat === null || lng === null) return
    const position = { lat, lng }
    map.panTo(position)
    syncLocationMarker(position)
  },
)

onBeforeUnmount(() => {
  clickListener?.remove()
  polygonListeners.forEach((listener) => listener.remove())
  polygon?.setMap(null)
  locationMarker?.setMap(null)
  clearVertexMarkers()
})
</script>

<template>
  <div class="map-selector google-map-selector">
    <div class="map-search">
      <div ref="autocompleteHost" class="autocomplete-shell" />
      <p v-if="errorMessage" class="map-error">
        {{ errorMessage }}
      </p>
    </div>

    <div class="map-meta">
      <div>
        <span>Secilen konum</span>
        <strong>{{ cityLabel || address || 'Konum secilmedi' }}</strong>
      </div>
      <div>
        <span>Koordinat</span>
        <strong>{{ lat !== null ? `${lat.toFixed(4)}, ${lng?.toFixed(4)}` : '-' }}</strong>
      </div>
      <div>
        <span>Alan</span>
        <strong>{{ areaM2.toLocaleString('tr-TR') }} m2</strong>
      </div>
    </div>

    <div ref="mapRef" class="solar-map" />

    <div class="map-toolbar">
      <div class="toolbar-copy">
        <strong>Polygon alan secimi</strong>
        <span>Haritada panel kurulacak alani klikleyerek cizin. En az 3 nokta gerekir.</span>
      </div>

      <div class="toolbar-actions">
        <button class="secondary-btn" type="button" :disabled="pointCount === 0" @click="undoLastPoint">
          Geri Al
        </button>
        <button class="secondary-btn" type="button" @click="resetToLocation">
          Konuma Don
        </button>
        <button class="secondary-btn" type="button" :disabled="pointCount === 0" @click="clearPolygon">
          Cizimi Temizle
        </button>
      </div>
    </div>

    <p class="map-hint">
      {{ ready ? `${pointCount} nokta eklendi. Polygon tamamlandiginda alan otomatik hesaplanir.` : 'Harita yukleniyor...' }}
    </p>
  </div>
</template>

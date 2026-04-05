interface LocationState {
  address: string
  cityLabel: string
  lat: number | null
  lng: number | null
  drawnAreaM2: number
}

const defaultLocation = (): LocationState => ({
  address: '',
  cityLabel: '',
  lat: null,
  lng: null,
  drawnAreaM2: 0,
})

export const useLocationState = () => {
  const state = useState<LocationState>('location', defaultLocation)

  const setLocation = (payload: { lat: number; lng: number; address: string; cityLabel: string }) => {
    state.value.lat = payload.lat
    state.value.lng = payload.lng
    state.value.address = payload.address
    state.value.cityLabel = payload.cityLabel
  }

  const setArea = (areaM2: number) => {
    state.value.drawnAreaM2 = areaM2
  }

  const hasValidLocation = computed(
    () => !!state.value.address && state.value.lat !== null && state.value.lng !== null && state.value.drawnAreaM2 > 0,
  )

  const reset = () => {
    Object.assign(state.value, defaultLocation())
  }

  return {
    location: state,
    setLocation,
    setArea,
    hasValidLocation,
    reset,
  }
}

const defaultLocation = () => ({
  address: '',
  cityLabel: '',
  lat: null,
  lng: null,
  drawnAreaM2: 0,
})

export const useLocationState = () => {
  const state = useState('location', defaultLocation)

  const setLocation = (payload) => {
    state.value.lat = payload.lat
    state.value.lng = payload.lng
    state.value.address = payload.address
    state.value.cityLabel = payload.cityLabel
  }

  const setArea = (areaM2) => {
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

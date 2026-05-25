import { useEffect, useRef, useState } from 'react'

const TYPE_KO = {
  meal: '식사',
  activity: '액티비티',
  cafe: '카페',
  dinner: '저녁',
}

function initKakaoMap(mapRef, validSlots) {
  const kakao = window.kakao
  const center = new kakao.maps.LatLng(validSlots[0].lat, validSlots[0].lng)
  const map = new kakao.maps.Map(mapRef.current, { center, level: 4 })

  const bounds = new kakao.maps.LatLngBounds()

  validSlots.forEach((slot) => {
    const position = new kakao.maps.LatLng(slot.lat, slot.lng)
    bounds.extend(position)

    const marker = new kakao.maps.Marker({ position, map })

    const typeLabel = TYPE_KO[slot.type] ?? slot.type
    const infoContent = [
      '<div style="padding:6px 10px;font-size:12px;',
      'font-family:Pretendard,sans-serif;min-width:90px;line-height:1.5;">',
      `<b>${typeLabel}</b><br/>${slot.name}`,
      '</div>',
    ].join('')

    const infoWindow = new kakao.maps.InfoWindow({ content: infoContent })
    infoWindow.open(map, marker)
  })

  if (validSlots.length > 1) map.setBounds(bounds)

  const path = validSlots.map((s) => new kakao.maps.LatLng(s.lat, s.lng))
  new kakao.maps.Polyline({
    map,
    path,
    strokeWeight: 3,
    strokeColor: '#D95F2B',
    strokeOpacity: 0.7,
    strokeStyle: 'solid',
  })
}

export default function MapView({ slots }) {
  const mapRef = useRef(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'no-coords' | 'ready'

  useEffect(() => {
    const validSlots = slots.filter((s) => s.lat && s.lng)

    if (validSlots.length === 0) {
      setStatus('no-coords')
      return
    }

    // SDK 이미 로드된 경우 바로 초기화
    if (window.kakao?.maps) {
      setStatus('ready')
      return
    }

    // SDK 로드 완료까지 폴링 (최대 10초)
    let attempts = 0
    const timer = setInterval(() => {
      attempts++
      if (window.kakao?.maps) {
        clearInterval(timer)
        setStatus('ready')
      } else if (attempts >= 100) {
        clearInterval(timer)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [slots])

  // status가 'ready'로 바뀌면 지도 초기화
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return
    const validSlots = slots.filter((s) => s.lat && s.lng)
    if (validSlots.length === 0) return
    initKakaoMap(mapRef, validSlots)
  }, [status, slots])

  if (status === 'loading') {
    return (
      <div className="w-full h-72 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-2xl animate-pulse">🗺️</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">지도를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (status === 'no-coords') {
    return (
      <div className="w-full h-72 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-2xl">📍</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">장소 좌표 정보가 없습니다</p>
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-72 rounded-2xl overflow-hidden" />
}

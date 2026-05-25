import { useState, useRef } from 'react'

const MAX_WALK_OPTIONS = [
  { label: '~5분', value: 5 },
  { label: '~15분', value: 15 },
  { label: '~30분', value: 30 },
  { label: '상관없음', value: 0 },
]

const COURSE_SIZE_OPTIONS = [
  { label: '2곳', value: 2 },
  { label: '3곳', value: 3 },
  { label: '4곳', value: 4 },
  { label: '5곳', value: 5 },
]

const BUDGET_OPTIONS = [
  { label: '절약', value: 'economy' },
  { label: '보통', value: 'normal' },
  { label: '여유롭게', value: 'luxury' },
]

const COMPANION_OPTIONS = [
  { label: '혼자', value: 'solo' },
  { label: '커플', value: 'couple' },
  { label: '친구들', value: 'friends' },
]

const CATEGORY_GROUPS = [
  {
    label: '음식',
    items: [
      { label: '🍚 밥집', value: '밥집' },
      { label: '🍺 술집/바', value: '술집/바' },
      { label: '🍜 분식/면류', value: '분식/면류' },
      { label: '🥩 고기집', value: '고기집' },
      { label: '🍣 일식', value: '일식' },
      { label: '🌮 양식', value: '양식' },
      { label: '🥘 중식', value: '중식' },
      { label: '🍕 패스트푸드', value: '패스트푸드' },
    ],
  },
  {
    label: '액티비티',
    items: [
      { label: '🎮 보드게임카페', value: '보드게임카페' },
      { label: '🔐 방탈출', value: '방탈출' },
      { label: '🎳 볼링', value: '볼링' },
      { label: '🎨 전시/갤러리', value: '전시/갤러리' },
      { label: '📚 서점', value: '서점' },
      { label: '🎬 영화관', value: '영화관' },
      { label: '🎤 노래방', value: '노래방' },
      { label: '🎯 다트바', value: '다트바' },
    ],
  },
  {
    label: '여유',
    items: [
      { label: '☕ 카페', value: '카페' },
      { label: '🧁 디저트', value: '디저트' },
      { label: '🛍️ 쇼핑', value: '쇼핑' },
      { label: '🌳 공원/산책', value: '공원/산책' },
    ],
  },
]

const MAX_CATEGORIES = 5
const DEFAULT_CATEGORIES = ['밥집', '카페']

const COLS_CLASS = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }

function ButtonGroup({ options, value, onChange, cols = 3 }) {
  return (
    <div className={`grid ${COLS_CLASS[cols] ?? 'grid-cols-3'} gap-2`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`py-3 rounded-xl font-medium text-sm transition-all ${
            value === opt.value
              ? 'bg-[#D95F2B] text-white shadow-sm'
              : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#D95F2B] hover:text-[#D95F2B]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function HistoryCard({ entry, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 hover:border-[#D95F2B] transition-colors active:scale-95"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 dark:text-gray-500">{entry.date}</span>
        <span className="text-xs text-[#D95F2B] font-medium">불러오기</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{entry.slots.join(' → ')}</p>
    </button>
  )
}

export default function InputForm({ onSubmit }) {
  const [location, setLocation] = useState('')
  const [gpsCoords, setGpsCoords] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [maxWalk, setMaxWalk] = useState(30)
  const [courseSize, setCourseSize] = useState(4)
  const [budget, setBudget] = useState('normal')
  const [companion, setCompanion] = useState('couple')
  const [selectedCategories, setSelectedCategories] = useState(DEFAULT_CATEGORIES)
  const [toast, setToast] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const toastTimerRef = useRef(null)

  const history = JSON.parse(localStorage.getItem('dopa_history') || '[]')

  const isLocationSet = location.trim() !== '' || gpsCoords !== null
  const canSubmit = isLocationSet && selectedCategories.length >= 1

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 기능을 지원하지 않습니다.')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocation('현재 위치 📍')
        setGpsLoading(false)
      },
      (err) => {
        setGpsLoading(false)
        if (err.code === 1) {
          alert('위치 권한을 허용해주세요.')
        } else {
          alert('위치 정보를 가져올 수 없습니다.')
        }
      }
    )
  }

  const handleLocationChange = (e) => {
    setLocation(e.target.value)
    setGpsCoords(null)
  }

  const handleCategoryToggle = (value) => {
    if (selectedCategories.includes(value)) {
      setSelectedCategories((prev) => prev.filter((v) => v !== value))
    } else {
      if (selectedCategories.length >= MAX_CATEGORIES) {
        setToast('최대 5개까지 선택 가능해요')
        clearTimeout(toastTimerRef.current)
        toastTimerRef.current = setTimeout(() => setToast(null), 2000)
        return
      }
      setSelectedCategories((prev) => [...prev, value])
    }
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      location: gpsCoords ? null : location.trim(),
      lat: gpsCoords?.lat ?? null,
      lng: gpsCoords?.lng ?? null,
      maxWalk,
      courseSize,
      budget,
      companion,
      selectedCategories,
    })
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="text-center pt-4 pb-2">
        <h2 className="text-2xl font-bold text-[#1A3A5C] dark:text-gray-100">오늘 어디서 뭐 할까? 🗺️</h2>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">위치와 조건을 알려주세요</p>
      </div>

      {/* 위치 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          위치 <span className="font-normal text-gray-400 dark:text-gray-500">(선택 · 비워두면 GPS 사용)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="지역명 입력 (예: 홍대, 강남...)"
            value={location}
            onChange={handleLocationChange}
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3A5C] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            type="button"
            onClick={handleGetGps}
            disabled={gpsLoading}
            className="px-4 py-3 bg-[#0F7B6C] text-white rounded-xl font-medium whitespace-nowrap disabled:opacity-60 hover:bg-[#0a6358] transition-colors"
          >
            {gpsLoading ? '📡...' : '📍 GPS'}
          </button>
        </div>
      </div>

      {/* ② 코스 규모 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          몇 곳을 돌까요?
        </label>
        <ButtonGroup options={COURSE_SIZE_OPTIONS} value={courseSize} onChange={setCourseSize} cols={4} />
      </div>

      {/* ③ 최대 이동 시간 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          장소까지 얼마나 걸어도 될까요?
        </label>
        <ButtonGroup options={MAX_WALK_OPTIONS} value={maxWalk} onChange={setMaxWalk} cols={4} />
      </div>

      {/* ④ 예산 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">예산</label>
        <ButtonGroup options={BUDGET_OPTIONS} value={budget} onChange={setBudget} cols={3} />
      </div>

      {/* ⑤ 동행자 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">동행자</label>
        <ButtonGroup options={COMPANION_OPTIONS} value={companion} onChange={setCompanion} cols={3} />
      </div>

      {/* ⑥ 코스 카테고리 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            어떤 코스를 원하세요?
          </label>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {selectedCategories.length}/{MAX_CATEGORIES}개 선택
          </span>
        </div>

        <div className="space-y-3">
          {CATEGORY_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const isSelected = selectedCategories.includes(item.value)
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleCategoryToggle(item.value)}
                      className={`rounded-full px-3 py-1.5 text-sm border transition-all ${
                        isSelected
                          ? 'border-[#D95F2B] bg-[#FDF0E8] text-[#D95F2B] dark:bg-orange-900/30 dark:border-orange-400 dark:text-orange-300'
                          : 'border-gray-300 bg-white text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:border-[#D95F2B] hover:text-[#D95F2B] dark:hover:border-orange-400 dark:hover:text-orange-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedCategories.length === 0 && (
          <p className="text-xs text-red-400 mt-2">최소 1개 이상 선택해주세요</p>
        )}
      </div>

      {/* 제출 버튼 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          canSubmit
            ? 'bg-[#D95F2B] text-white hover:bg-[#c05020] active:scale-95 shadow-md'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        코스 뽑기 🎲
      </button>

      {/* 이전 코스 히스토리 */}
      {history.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="w-full py-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
          >
            <span>{showHistory ? '▲' : '▼'}</span>
            이전 코스 보기 ({history.length})
          </button>

          {showHistory && (
            <div className="space-y-2 mt-2">
              {history.map((entry) => (
                <HistoryCard
                  key={entry.course_id}
                  entry={entry}
                  onSelect={() => {
                    window.location.href = `/?course=${entry.course_id}`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 토스트 메시지 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-sm px-4 py-2.5 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}

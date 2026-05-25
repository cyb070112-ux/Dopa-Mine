// 음식 계열 → orange, 액티비티 → blue, 여유 → green, 기타 → gray
const FOOD_STYLE   = { badge: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400', border: 'border-orange-400' }
const ACT_STYLE    = { badge: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',         border: 'border-blue-400'   }
const LEISURE_STYLE = { badge: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',   border: 'border-green-400'  }
const DEFAULT_STYLE = { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',           border: 'border-gray-400'   }

const TYPE_CONFIG = {
  '밥집':        FOOD_STYLE,
  '술집/바':     FOOD_STYLE,
  '분식/면류':   FOOD_STYLE,
  '고기집':      FOOD_STYLE,
  '일식':        FOOD_STYLE,
  '양식':        FOOD_STYLE,
  '중식':        FOOD_STYLE,
  '패스트푸드':  FOOD_STYLE,
  '보드게임카페': ACT_STYLE,
  '방탈출':      ACT_STYLE,
  '볼링':        ACT_STYLE,
  '전시/갤러리': ACT_STYLE,
  '서점':        ACT_STYLE,
  '영화관':      ACT_STYLE,
  '노래방':      ACT_STYLE,
  '다트바':      ACT_STYLE,
  '카페':        LEISURE_STYLE,
  '디저트':      LEISURE_STYLE,
  '쇼핑':        LEISURE_STYLE,
  '공원/산책':   LEISURE_STYLE,
}

// "음식점 > 한식 > 냉면" → "한식 · 냉면"
function formatCategory(raw) {
  if (!raw) return ''
  const parts = raw.split(' > ').map((s) => s.trim()).filter(Boolean)
  return parts.slice(-2).join(' · ')
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function SlotCard({ slot, slotIndex, slotNumber, onReroll, isRerolling, rerollFailed }) {
  const config = TYPE_CONFIG[slot.type] ?? DEFAULT_STYLE
  const categoryLabel = formatCategory(slot.kakao_category)
  const hasLink = Boolean(slot.place_url)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border-l-4 ${config.border}${isRerolling ? ' slot-rerolling' : ''}`}>

      {/* 상단: 번호 + 슬롯 타입 뱃지 + 카카오 카테고리 태그 */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="w-5 h-5 rounded-full bg-[#1A3A5C] dark:bg-gray-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
          {slotNumber}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.badge}`}>
          {slot.type}
        </span>
        {categoryLabel && (
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {categoryLabel}
          </span>
        )}
      </div>

      {/* 중단: 장소명 → 📍 거리 · 🚶 이동시간 → 주소 → 전화번호 */}
      <div className="mb-3">
        {hasLink ? (
          <a
            href={slot.place_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1"
          >
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight group-hover:text-[#D95F2B] transition-colors underline-offset-2 group-hover:underline">
              {slot.name}
            </span>
            <svg
              className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-[#D95F2B] transition-colors shrink-0 mt-0.5"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">{slot.name}</p>
        )}

        {/* 📍 거리 · 🚶 이동시간 */}
        {(slot.distance_m > 0 || slot.walk_time_range) && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {slot.distance_m > 0 && `📍 ${slot.distance_m.toLocaleString()}m`}
            {slot.distance_m > 0 && slot.walk_time_range && ' · '}
            {slot.walk_time_range && `🚶 ${slot.walk_time_range}`}
          </p>
        )}

        {slot.address && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{slot.address}</p>
        )}

        {slot.phone && (
          <a
            href={`tel:${slot.phone}`}
            className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1 hover:text-[#0F7B6C] dark:hover:text-teal-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
            </svg>
            {slot.phone}
          </a>
        )}
      </div>

      {/* 하단: 약 N분 체류 ←→ 카카오맵 버튼 + 재추첨 버튼 */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-400 dark:text-gray-500">
          약 {slot.duration_min}분 체류
        </span>

        <div className="flex items-center gap-2">
          {hasLink && (
            <a
              href={slot.place_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              카카오맵
            </a>
          )}

          {rerollFailed ? (
            <button
              type="button"
              onClick={() => onReroll(slotIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 active:scale-95 transition-all"
            >
              ↩️ 재시도
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReroll(slotIndex)}
              disabled={isRerolling}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isRerolling
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-[#1A3A5C]/10 dark:bg-gray-700 text-[#1A3A5C] dark:text-gray-300 hover:bg-[#1A3A5C]/20 dark:hover:bg-gray-600 active:scale-95'
              }`}
            >
              {isRerolling ? <Spinner /> : <span>🎰</span>}
              재추첨
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

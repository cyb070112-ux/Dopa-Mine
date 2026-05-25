import MapView from './MapView'

const TYPE_EMOJI = {
  meal: '🍽️',
  activity: '🎯',
  cafe: '☕',
  dinner: '🌙',
}

export default function ConfirmModal({ courseData, onConfirm, onClose }) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?course=${courseData.id}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('링크가 복사되었습니다! 🔗')
    } catch {
      const shareText = courseData.slots.map((s, i) => `${i + 1}. ${s.name}`).join('\n')
      alert(`공유 링크: ${shareUrl}\n\n🎰 Dopa-Mine 오늘의 코스\n${shareText}`)
    }
  }

  const handleKakaoShare = () => {
    if (!window.Kakao?.Share) {
      alert('카카오 SDK가 아직 로드되지 않았습니다.')
      return
    }
    const text = '오늘의 Dopa-Mine 코스: ' + courseData.slots.map((s) => s.name).join(' → ')
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text,
      link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* 지도 */}
        <div className="p-4 pb-0">
          <MapView slots={courseData.slots} />
        </div>

        <div className="p-6 pt-4">
          {/* 헤더 */}
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-[#1A3A5C] dark:text-white">이 코스로 확정할까요?</h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">수정은 이전 화면에서 가능해요</p>
          </div>

          {/* 장소 요약 */}
          <div className="bg-[#F8F9FA] dark:bg-gray-700 rounded-xl p-4 mb-5 space-y-2">
            {courseData.slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#1A3A5C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm">{TYPE_EMOJI[slot.type] ?? '📍'}</span>
                <div className="min-w-0">
                  {slot.place_url ? (
                    <a
                      href={slot.place_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 max-w-full"
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-[#D95F2B] group-hover:underline underline-offset-2 transition-colors">
                        {slot.name}
                      </span>
                      <svg
                        className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-[#D95F2B] transition-colors shrink-0"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{slot.name}</p>
                  )}
                  {slot.arrival_time && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{slot.arrival_time}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-3 rounded-xl border-2 border-[#0F7B6C] text-[#0F7B6C] font-semibold text-sm hover:bg-[#0F7B6C]/5 transition-colors active:scale-95"
            >
              링크 복사 🔗
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="py-3 rounded-xl bg-[#D95F2B] text-white font-semibold text-sm hover:bg-[#c05020] transition-colors active:scale-95 shadow-md"
            >
              확정! ✅
            </button>
          </div>
          <button
            type="button"
            onClick={handleKakaoShare}
            className="w-full py-3 rounded-xl mb-3 font-semibold text-sm active:scale-95 transition-all"
            style={{ backgroundColor: '#FEE500', color: '#000000' }}
          >
            카카오톡 공유 💬
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-gray-400 dark:text-gray-500 text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

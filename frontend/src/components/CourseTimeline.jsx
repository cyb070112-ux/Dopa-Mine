import SlotCard from './SlotCard'

export default function CourseTimeline({
  courseData,
  onReroll,
  rerollCount,
  rerollingIndex,
  failedSlots,
  onConfirm,
  onReset,
}) {
  const isAnyRerolling = rerollingIndex !== null

  const rerollDisplay = rerollCount === 0
    ? null
    : rerollCount > 10
      ? '🎰×10+'
      : '🎰'.repeat(rerollCount)

  return (
    <div className="space-y-4 pb-8">
      {/* 헤더 */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-[#1A3A5C] dark:text-gray-100">✨ 오늘의 코스</h2>
        {rerollDisplay && (
          <p className="text-sm mt-1 tracking-wide text-gray-500 dark:text-gray-400">{rerollDisplay}</p>
        )}
      </div>

      {/* 슬롯 목록 */}
      <div className="space-y-3">
        {courseData.slots.map((slot, i) => (
          <SlotCard
            key={i}
            slot={slot}
            slotIndex={i}
            slotNumber={i + 1}
            onReroll={onReroll}
            isRerolling={rerollingIndex === i}
            rerollFailed={failedSlots?.has(i) ?? false}
          />
        ))}
      </div>

      {/* 총 이동 거리 */}
      {(() => {
        const totalM = courseData.slots.reduce((sum, s) => sum + (s.distance_m ?? 0), 0)
        if (totalM === 0) return null
        const display = totalM >= 1000
          ? `약 ${(totalM / 1000).toFixed(1)}km`
          : `약 ${totalM.toLocaleString()}m`
        return (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-2">
            총 이동 거리: {display}
          </p>
        )
      })()}

      {/* 하단 버튼 */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          disabled={isAnyRerolling}
          className="py-3 rounded-xl border-2 border-[#1A3A5C] dark:border-gray-600 text-[#1A3A5C] dark:text-gray-300 font-semibold text-sm transition-all disabled:opacity-40 hover:bg-[#1A3A5C]/5 dark:hover:bg-gray-700 active:scale-95"
        >
          전체 다시 뽑기
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isAnyRerolling}
          className="py-3 rounded-xl bg-[#D95F2B] text-white font-semibold text-sm transition-all disabled:opacity-40 hover:bg-[#c05020] active:scale-95 shadow-md"
        >
          이 코스로 결정! ✅
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'

const MESSAGES = [
  '위치 확인 중...',
  '주변 맛집 탐색 중...',
  '코스 조합 중...',
  '완성!',
]

export default function LoadingRoulette() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (phase >= MESSAGES.length - 1) return
    const timer = setTimeout(() => {
      setPhase((prev) => prev + 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [phase])

  return (
    <div className="fixed inset-0 bg-[#1A3A5C] flex flex-col items-center justify-center gap-8 z-50">
      <div className="text-8xl animate-bounce select-none">🎰</div>

      <div key={phase} className="animate-fadeIn text-center">
        <p className="text-white text-2xl font-bold">{MESSAGES[phase]}</p>
      </div>

      <div className="flex gap-2">
        {MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
              i <= phase ? 'bg-[#D95F2B] scale-110' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      <p className="text-white/40 text-sm">잠시만 기다려주세요</p>
    </div>
  )
}

import { useState, useEffect } from 'react'
import InputForm from './components/InputForm'
import LoadingRoulette from './components/LoadingRoulette'
import CourseTimeline from './components/CourseTimeline'
import MapView from './components/MapView'
import ConfirmModal from './components/ConfirmModal'
import { generateCourse, rerollSlot, getCourse } from './api/course'

export default function App() {
  const [step, setStep] = useState('input')
  const [courseData, setCourseData] = useState(null)
  const [rerollCount, setRerollCount] = useState(0)
  const [rerollingIndex, setRerollingIndex] = useState(null)
  const [failedSlots, setFailedSlots] = useState(new Set())
  const [showModal, setShowModal] = useState(false)
  const [confirmedCourse, setConfirmedCourse] = useState(null)
  const [error, setError] = useState(null)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('dopa-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // 다크모드 클래스 토글 + localStorage 저장
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('dopa-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Kakao SDK 초기화
  useEffect(() => {
    const timer = setInterval(() => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY)
        clearInterval(timer)
      } else if (window.Kakao?.isInitialized()) {
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // URL에 course ID가 있으면 해당 코스를 로드
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const courseId = params.get('course')
    if (courseId) {
      getCourse(courseId)
        .then((data) => {
          setConfirmedCourse(data)
          setStep('confirmed')
        })
        .catch(() => {
          window.history.replaceState({}, '', window.location.pathname)
        })
    }
  }, [])

  const handleGenerate = async (formData) => {
    setError(null)
    setStep('loading')
    try {
      const data = await generateCourse(formData)
      setCourseData(data)
      setRerollCount(0)
      setFailedSlots(new Set())
      setStep('timeline')
    } catch (err) {
      alert('코스 생성에 실패했습니다. 다시 시도해주세요.')
      setError(err.message || '코스 생성에 실패했습니다.')
      setStep('input')
    }
  }

  const handleReroll = async (slotIndex) => {
    if (rerollingIndex !== null || !courseData) return
    setRerollingIndex(slotIndex)
    setFailedSlots((prev) => {
      const next = new Set(prev)
      next.delete(slotIndex)
      return next
    })
    try {
      const newSlot = await rerollSlot(courseData.id, slotIndex)
      setCourseData((prev) => ({
        ...prev,
        slots: prev.slots.map((slot, i) => (i === slotIndex ? newSlot : slot)),
      }))
      setRerollCount((prev) => prev + 1)
    } catch {
      setFailedSlots((prev) => new Set([...prev, slotIndex]))
    } finally {
      setRerollingIndex(null)
    }
  }

  const handleConfirmClick = () => setShowModal(true)

  const saveHistory = (data) => {
    const entry = {
      course_id: data.id,
      slots: data.slots.map((s) => s.name),
      date: new Date().toLocaleDateString('ko-KR'),
    }
    const prev = JSON.parse(localStorage.getItem('dopa_history') || '[]')
    const next = [entry, ...prev.filter((h) => h.course_id !== entry.course_id)].slice(0, 5)
    localStorage.setItem('dopa_history', JSON.stringify(next))
  }

  const handleModalConfirm = () => {
    saveHistory(courseData)
    setConfirmedCourse(courseData)
    setShowModal(false)
    setStep('confirmed')
    window.history.pushState({}, '', `?course=${courseData.id}`)
  }

  const handleCopyLink = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      alert('링크가 복사되었습니다! 🔗')
    } catch {
      alert(`공유 링크:\n${url}`)
    }
  }

  const handleKakaoShare = () => {
    if (!window.Kakao?.Share) {
      alert('카카오 SDK가 아직 로드되지 않았습니다.')
      return
    }
    const url = window.location.href
    const text = '오늘의 Dopa-Mine 코스: ' + (confirmedCourse?.slots ?? courseData?.slots ?? []).map((s) => s.name).join(' → ')
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text,
      link: { mobileWebUrl: url, webUrl: url },
    })
  }

  const handleReset = () => {
    setCourseData(null)
    setConfirmedCourse(null)
    setRerollCount(0)
    setRerollingIndex(null)
    setFailedSlots(new Set())
    setShowModal(false)
    setError(null)
    setStep('input')
    window.history.replaceState({}, '', window.location.pathname)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 transition-colors duration-300">
      {/* 다크모드 토글 버튼 */}
      <button
        type="button"
        onClick={() => setIsDark((v) => !v)}
        className={`fixed top-4 right-4 z-50 rounded-full px-3 py-1.5 text-sm font-medium shadow-md transition-all ${
          isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {isDark ? '☀️ 라이트' : '🌙 다크'}
      </button>

      {/* 헤더 */}
      <header className="bg-[#1A3A5C] text-white py-4 px-6 flex items-center gap-3 sticky top-0 z-40 shadow-md">
        <span className="text-2xl select-none">🎰</span>
        <div>
          <h1 className="text-lg font-bold leading-tight m-0 p-0">Dopa-Mine</h1>
          <p className="text-blue-200 text-xs leading-none mt-0.5">오늘 뭐 할지 모르겠다면?</p>
        </div>
        {(step === 'timeline' || step === 'confirmed') && (
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto text-blue-200 text-sm hover:text-white transition-colors"
          >
            처음으로
          </button>
        )}
      </header>

      {/* 오류 배너 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 px-4 py-3 text-red-700 dark:text-red-400 text-sm mx-4 mt-4 rounded-r-xl">
          {error}
        </div>
      )}

      {step === 'input' && <InputForm onSubmit={handleGenerate} />}
      {step === 'loading' && <LoadingRoulette />}

      {step === 'timeline' && courseData && (
        <div className="max-w-lg mx-auto px-4 pt-2">
          <CourseTimeline
            courseData={courseData}
            onReroll={handleReroll}
            rerollCount={rerollCount}
            rerollingIndex={rerollingIndex}
            failedSlots={failedSlots}
            onConfirm={handleConfirmClick}
            onReset={handleReset}
          />
        </div>
      )}

      {step === 'confirmed' && confirmedCourse && (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="text-center">
            <p className="text-4xl mb-2">🎉</p>
            <h2 className="text-2xl font-bold text-[#1A3A5C] dark:text-gray-100">코스 확정 완료!</h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">즐거운 하루 되세요 😊</p>
          </div>
          <MapView slots={confirmedCourse.slots} />

          {/* 확정 코스 장소 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-3">
            {confirmedCourse.slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#1A3A5C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {slot.place_url ? (
                    <a
                      href={slot.place_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 max-w-full"
                    >
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-[#D95F2B] group-hover:underline underline-offset-2 transition-colors">
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
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{slot.name}</p>
                  )}
                  {slot.arrival_time && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{slot.arrival_time} 도착</p>
                  )}
                  {(slot.distance_m > 0 || slot.walk_time_range) && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {slot.distance_m > 0 && `📍 ${slot.distance_m.toLocaleString()}m`}
                      {slot.distance_m > 0 && slot.walk_time_range && ' · '}
                      {slot.walk_time_range && `🚶 ${slot.walk_time_range}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {(() => {
              const totalM = confirmedCourse.slots.reduce((sum, s) => sum + (s.distance_m ?? 0), 0)
              if (totalM === 0) return null
              const display = totalM >= 1000
                ? `약 ${(totalM / 1000).toFixed(1)}km`
                : `약 ${totalM.toLocaleString()}m`
              return (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center pt-1">
                  총 이동 거리: {display}
                </p>
              )
            })()}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-3 rounded-xl border-2 border-[#0F7B6C] text-[#0F7B6C] font-semibold hover:bg-[#0F7B6C]/5 transition-colors"
            >
              링크 복사 🔗
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-3 rounded-xl border-2 border-[#1A3A5C] dark:border-gray-500 text-[#1A3A5C] dark:text-gray-300 font-semibold hover:bg-[#1A3A5C]/5 dark:hover:bg-gray-700 transition-colors"
            >
              새 코스 뽑기 🎲
            </button>
          </div>
          <button
            type="button"
            onClick={handleKakaoShare}
            className="w-full py-3 rounded-xl font-semibold text-sm active:scale-95 transition-all"
            style={{ backgroundColor: '#FEE500', color: '#000000' }}
          >
            카카오톡 공유 💬
          </button>
        </div>
      )}

      {showModal && courseData && (
        <ConfirmModal
          courseData={courseData}
          onConfirm={handleModalConfirm}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const BUDGET_MAP = { economy: 'low', normal: 'mid', luxury: 'high' }

function transformSlot(backendSlot) {
  return {
    type: backendSlot.category,
    name: backendSlot.place?.place_name ?? '(장소 없음)',
    address: backendSlot.place?.address ?? '',
    arrival_time: backendSlot.arrival_time,
    duration_min: backendSlot.duration_min,
    lat: backendSlot.place?.lat ?? null,
    lng: backendSlot.place?.lng ?? null,
    place_id: backendSlot.place?.place_id ?? null,
    place_url: backendSlot.place?.place_url ?? '',
    kakao_category: backendSlot.place?.category ?? '',
    phone: backendSlot.place?.phone ?? '',
    distance_m: backendSlot.place?.distance_m ?? 0,
    walk_time_range: backendSlot.walk_time_range ?? '',
  }
}

function transformCourse(backendResponse) {
  return {
    id: backendResponse.course_id,
    slots: backendResponse.slots.map(transformSlot),
  }
}

export async function generateCourse(formData) {
  const body = {
    lat: formData.lat ?? null,
    lng: formData.lng ?? null,
    location: formData.location || null,
    n_slots: formData.courseSize ?? 4,
    budget: BUDGET_MAP[formData.budget] ?? 'mid',
    companion: formData.companion,
    selected_categories: formData.selectedCategories ?? [],
    max_walk_min: formData.maxWalk ?? 30,
  }

  const response = await fetch(`${BASE_URL}/api/course/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || '코스 생성에 실패했습니다.')
  }
  return transformCourse(await response.json())
}

export async function rerollSlot(courseId, slotIndex) {
  const response = await fetch(`${BASE_URL}/api/course/reroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: courseId, slot_index: slotIndex }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || '재추첨에 실패했습니다.')
  }
  const data = transformCourse(await response.json())
  return data.slots[slotIndex]
}

export async function getCourse(courseId) {
  const response = await fetch(`${BASE_URL}/api/course/${courseId}`)
  if (!response.ok) throw new Error('코스를 찾을 수 없습니다.')
  return transformCourse(await response.json())
}

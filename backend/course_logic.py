import math
import random
import asyncio
from datetime import datetime, timedelta

from .kakao import search_places

# Full mapping from user-facing category name to Kakao search keywords
FULL_CATEGORY_MAP: dict[str, list[str]] = {
    "밥집":        ["음식점", "한식", "밥집"],
    "술집/바":     ["술집", "바", "포차", "이자카야"],
    "분식/면류":   ["분식", "라멘", "우동", "냉면"],
    "고기집":      ["고기집", "삼겹살", "소고기", "갈비"],
    "일식":        ["일식", "스시", "초밥", "돈가스"],
    "양식":        ["양식", "파스타", "스테이크", "브런치"],
    "중식":        ["중식", "중국집", "짜장면", "마라탕"],
    "패스트푸드":  ["버거", "패스트푸드", "치킨"],
    "보드게임카페": ["보드게임카페", "보드카페"],
    "방탈출":      ["방탈출", "escape room"],
    "볼링":        ["볼링장"],
    "전시/갤러리": ["전시회", "갤러리", "미술관"],
    "서점":        ["서점", "책방"],
    "영화관":      ["영화관", "CGV", "롯데시네마"],
    "노래방":      ["노래방", "코인노래방"],
    "다트바":      ["다트바", "다트"],
    "카페":        ["카페", "커피"],
    "디저트":      ["디저트", "케이크", "베이커리"],
    "쇼핑":        ["쇼핑몰", "백화점", "편집샵"],
    "공원/산책":   ["공원", "산책로", "한강"],
}

# Typical time spent per category (minutes)
CATEGORY_DURATION: dict[str, int] = {
    "밥집": 60, "술집/바": 90, "분식/면류": 45, "고기집": 90, "일식": 60,
    "양식": 60, "중식": 60, "패스트푸드": 30,
    "보드게임카페": 90, "방탈출": 70, "볼링": 60, "전시/갤러리": 60,
    "서점": 45, "영화관": 120, "노래방": 90, "다트바": 60,
    "카페": 50, "디저트": 40, "쇼핑": 60, "공원/산책": 60,
}
DEFAULT_DURATION = 60

# Fallback categories when none selected
DEFAULT_CATEGORIES = ["밥집", "카페", "방탈출", "고기집", "카페"]


def distribute_slots(categories: list[str], n: int) -> list[str]:
    """Round-robin N slots across selected categories."""
    if not categories:
        return DEFAULT_CATEGORIES[:n]
    return [categories[i % len(categories)] for i in range(n)]


def distance_to_walk_range(distance_m: int) -> str:
    if distance_m == 0:
        return "위치 확인 중"
    minutes = distance_m / 67
    if minutes <= 3:
        return "도보 1~3분"
    elif minutes <= 5:
        return "도보 3~5분"
    elif minutes <= 7:
        return "도보 5~7분"
    elif minutes <= 10:
        return "도보 7~10분"
    elif minutes <= 15:
        return "도보 10~15분"
    elif minutes <= 20:
        return "도보 15~20분"
    elif minutes <= 30:
        return "도보 20~30분"
    elif minutes <= 40:
        return "도보 30~40분"
    elif minutes <= 60:
        return "도보 40~60분"
    else:
        km = round(distance_m / 1000, 1)
        return f"약 {km}km"


def walk_min_to_radius(max_walk_min: int) -> int:
    if max_walk_min <= 0:
        return 5000
    return max(300, min(int(max_walk_min * 67), 5000))


def _distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dlat = (lat2 - lat1) * 111_000
    dlng = (lng2 - lng1) * 111_000 * math.cos(math.radians(lat1))
    return math.sqrt(dlat**2 + dlng**2)


def score_place(
    place: dict,
    current_lat: float,
    current_lng: float,
    budget: str,
) -> float:
    score = 80.0
    dist = _distance_m(current_lat, current_lng, place["lat"], place["lng"])

    if dist <= 500:
        score += 20
    elif dist >= 2000:
        score -= 20
    else:
        score += 20 - 40 * (dist - 500) / 1500

    if budget == "low" and any(w in place["place_name"] for w in ["호텔", "파인"]):
        score -= 30

    return score


def weighted_random_pick(candidates: list[dict], top_n: int = 8) -> dict:
    pool = sorted(candidates, key=lambda x: x["score"], reverse=True)[:top_n]
    weights = [max(c["score"], 1) for c in pool]
    return random.choices(pool, weights=weights, k=1)[0]


async def _fetch_category_places(
    category: str,
    lat: float,
    lng: float,
    keywords: list[str] | None = None,
    radius: int = 2000,
) -> list[dict]:
    kws = keywords if keywords is not None else FULL_CATEGORY_MAP.get(category, [category])

    async def _search_all(r: int) -> list[dict]:
        results = await asyncio.gather(
            *[search_places(kw, lat, lng, radius=r) for kw in kws],
            return_exceptions=True,
        )
        places: list[dict] = []
        seen: set[str] = set()
        for res in results:
            if isinstance(res, Exception):
                continue
            for p in res:
                if p["place_id"] not in seen:
                    seen.add(p["place_id"])
                    places.append(p)
        return places

    places = await _search_all(radius)
    # 결과 없으면 반경 5000m로 재시도
    if not places and radius < 5000:
        places = await _search_all(5000)
    return places


def _next_hour(now: datetime) -> datetime:
    if now.minute == 0 and now.second == 0:
        return now.replace(second=0, microsecond=0)
    return (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)


async def build_course(
    lat: float,
    lng: float,
    n_slots: int,
    budget: str,
    companion: str,
    exclude_ids: set[str] | None = None,
    selected_categories: list[str] | None = None,
    radius: int = 2000,
) -> list[dict]:
    slot_categories = distribute_slots(selected_categories or [], n_slots)
    current_time = _next_hour(datetime.now())
    current_lat, current_lng = lat, lng
    exclude_ids = exclude_ids or set()
    course: list[dict] = []

    for i, category in enumerate(slot_categories):
        keywords = FULL_CATEGORY_MAP.get(category, [category])
        duration_min = CATEGORY_DURATION.get(category, DEFAULT_DURATION)
        places = await _fetch_category_places(category, current_lat, current_lng, keywords=keywords, radius=radius)
        candidates = [
            {**p, "score": score_place(p, current_lat, current_lng, budget)}
            for p in places
            if p["place_id"] not in exclude_ids
        ]

        if not candidates:
            course.append({
                "slot_index": i,
                "category": category,
                "duration_min": duration_min,
                "arrival_time": current_time.strftime("%H:%M"),
                "place": None,
                "walk_time_range": "",
            })
        else:
            selected = weighted_random_pick(candidates)
            exclude_ids.add(selected["place_id"])
            course.append({
                "slot_index": i,
                "category": category,
                "duration_min": duration_min,
                "arrival_time": current_time.strftime("%H:%M"),
                "place": {
                    "place_id": selected["place_id"],
                    "place_name": selected["place_name"],
                    "category": selected["category"],
                    "lat": selected["lat"],
                    "lng": selected["lng"],
                    "address": selected["address"],
                    "place_url": selected.get("place_url", ""),
                    "phone": selected.get("phone", ""),
                    "distance_m": selected.get("distance_m", 0),
                },
                "walk_time_range": distance_to_walk_range(selected.get("distance_m", 0)),
            })
            current_lat = selected["lat"]
            current_lng = selected["lng"]

        current_time += timedelta(minutes=duration_min)

    return course

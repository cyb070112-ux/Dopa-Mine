import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .course_logic import build_course, _fetch_category_places, score_place, weighted_random_pick, distance_to_walk_range, walk_min_to_radius, FULL_CATEGORY_MAP
from .kakao import geocode_location

router = APIRouter(prefix="/api/course", tags=["course"])

course_store: dict[str, dict] = {}


# ---------- schemas ----------

class PlaceItem(BaseModel):
    place_id: str
    place_name: str
    category: str
    lat: float
    lng: float
    address: str
    place_url: str = ""
    phone: str = ""
    distance_m: int = 0


class SlotItem(BaseModel):
    slot_index: int
    category: str
    duration_min: int
    arrival_time: str
    place: Optional[PlaceItem]
    walk_time_range: str = ""


class CourseResponse(BaseModel):
    course_id: str
    slots: list[SlotItem]


class CourseRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    location: Optional[str] = None
    n_slots: int = 4
    budget: str
    companion: str
    selected_categories: list[str] = []
    max_walk_min: int = 30


class ReRollRequest(BaseModel):
    course_id: str
    slot_index: int
    exclude_place_ids: list[str] = []


# ---------- helpers ----------

def _to_response(course_id: str, slots: list[dict]) -> CourseResponse:
    return CourseResponse(
        course_id=course_id,
        slots=[SlotItem(**s) for s in slots],
    )


# ---------- endpoints ----------

@router.post("/generate", response_model=CourseResponse)
async def generate_course(req: CourseRequest):
    lat, lng = req.lat, req.lng

    if lat is None or lng is None:
        if not req.location:
            raise HTTPException(status_code=400, detail="lat/lng 또는 location 중 하나가 필요합니다.")
        coords = await geocode_location(req.location)
        if coords is None:
            raise HTTPException(status_code=400, detail=f"'{req.location}'의 위치를 찾을 수 없습니다.")
        lat, lng = coords

    radius = walk_min_to_radius(req.max_walk_min)
    slots = await build_course(
        lat=lat,
        lng=lng,
        n_slots=req.n_slots,
        budget=req.budget,
        companion=req.companion,
        selected_categories=req.selected_categories,
        radius=radius,
    )
    course_id = str(uuid.uuid4())
    course_store[course_id] = {
        "slots": slots,
        "selected_categories": req.selected_categories,
        "origin_lat": lat,
        "origin_lng": lng,
        "max_walk_min": req.max_walk_min,
    }
    return _to_response(course_id, slots)


@router.post("/reroll", response_model=CourseResponse)
async def reroll_slot(req: ReRollRequest):
    data = course_store.get(req.course_id)
    if data is None:
        raise HTTPException(status_code=404, detail="코스를 찾을 수 없습니다.")

    slots = data["slots"]

    if req.slot_index < 0 or req.slot_index >= len(slots):
        raise HTTPException(status_code=400, detail="유효하지 않은 slot_index입니다.")

    target = slots[req.slot_index]
    category = target["category"]

    if req.slot_index > 0 and slots[req.slot_index - 1]["place"]:
        prev = slots[req.slot_index - 1]["place"]
        ref_lat, ref_lng = prev["lat"], prev["lng"]
    else:
        first_place = next((s["place"] for s in slots if s["place"]), None)
        if first_place is not None:
            ref_lat, ref_lng = first_place["lat"], first_place["lng"]
        elif target["place"] is not None:
            ref_lat, ref_lng = target["place"]["lat"], target["place"]["lng"]
        else:
            ref_lat = data.get("origin_lat")
            ref_lng = data.get("origin_lng")
            if ref_lat is None or ref_lng is None:
                raise HTTPException(status_code=400, detail="기준 위치를 찾을 수 없습니다.")

    exclude_ids = set(req.exclude_place_ids)
    if target["place"]:
        exclude_ids.add(target["place"]["place_id"])

    max_walk_min = data.get("max_walk_min", 30)
    radius = walk_min_to_radius(max_walk_min)
    keywords = FULL_CATEGORY_MAP.get(category, [category])
    places = await _fetch_category_places(category, ref_lat, ref_lng, keywords=keywords, radius=radius)
    candidates = [
        {**p, "score": score_place(p, ref_lat, ref_lng, budget="mid")}
        for p in places
        if p["place_id"] not in exclude_ids
    ]

    if not candidates:
        raise HTTPException(status_code=404, detail="대체할 장소가 없습니다.")

    selected = weighted_random_pick(candidates)
    slots[req.slot_index] = {
        **target,
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
    }
    course_store[req.course_id]["slots"] = slots
    return _to_response(req.course_id, slots)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    data = course_store.get(course_id)
    if data is None:
        raise HTTPException(status_code=404, detail="코스를 찾을 수 없습니다.")
    return _to_response(course_id, data["slots"])

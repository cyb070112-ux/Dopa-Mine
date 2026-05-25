import os
import httpx

KAKAO_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"


def _get_api_key() -> str:
    key = os.getenv("KAKAO_REST_API_KEY", "")
    if not key:
        raise RuntimeError("KAKAO_REST_API_KEY가 설정되지 않았습니다.")
    return key


async def geocode_location(query: str) -> tuple[float, float] | None:
    """지역명을 (lat, lng)으로 변환. 결과 없으면 None 반환."""
    headers = {"Authorization": f"KakaoAK {_get_api_key()}"}
    params = {"query": query, "size": 1}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(KAKAO_SEARCH_URL, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()
    docs = data.get("documents", [])
    if not docs:
        return None
    return float(docs[0]["y"]), float(docs[0]["x"])


async def search_places(
    keyword: str,
    lat: float,
    lng: float,
    radius: int = 2000,
    size: int = 15,
) -> list[dict]:
    headers = {"Authorization": f"KakaoAK {_get_api_key()}"}
    params = {
        "query": keyword,
        "y": lat,
        "x": lng,
        "radius": radius,
        "size": size,
        "sort": "distance",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(KAKAO_SEARCH_URL, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()

    places = []
    for doc in data.get("documents", []):
        places.append(
            {
                "place_id": doc["id"],
                "place_name": doc["place_name"],
                "category": doc.get("category_name", ""),
                "lat": float(doc["y"]),
                "lng": float(doc["x"]),
                "address": doc.get("road_address_name") or doc.get("address_name", ""),
                "place_url": doc.get("place_url") or f"https://place.map.kakao.com/{doc['id']}",
                "phone": doc.get("phone", ""),
                "distance_m": int(doc.get("distance", 0) or 0),
            }
        )
    return places

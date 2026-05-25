import asyncio
import sys
sys.path.insert(0, ".")
from dotenv import load_dotenv
load_dotenv("backend/.env")
from backend.kakao import search_places

async def test():
    results = await search_places("카페", 37.5172, 127.0473)
    print(f"결과 {len(results)}건")
    if results:
        p = results[0]
        print(f"  이름: {p['place_name']}")
        print(f"  주소: {p['address']}")
        print(f"  좌표: ({p['lat']}, {p['lng']})")

asyncio.run(test())

# Dopa-Mine 🎰

풀스택 웹 서비스 프로젝트입니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18, Vite, Tailwind CSS v3 |
| 백엔드 | Python FastAPI, uvicorn |

## 프로젝트 구조

```
dopa-mine/
├── frontend/      # React + Vite + Tailwind CSS
└── backend/       # Python FastAPI
```

## 실행 방법

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

개발 서버: http://localhost:5173

### 백엔드

```bash
cd backend

# 가상환경 생성 (선택)
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 KAKAO_REST_API_KEY 값을 입력하세요

# 서버 실행
uvicorn main:app --reload
```

API 서버: http://localhost:8000  
API 문서(Swagger): http://localhost:8000/docs

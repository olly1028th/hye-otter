# 혜달이의 상태 (Hye-Otter)

> 귀여운 해달 캐릭터 '혜달이'로 나의 현재 상태를 연인/가족에게 공유하는 다마고치 웹앱

## 컨셉

혜달이는 단순한 상태 알림이 아닙니다.
**다마고치**처럼 함께 키우고, 사랑하는 사람에게 **지금 나의 상태**를 귀엽게 보여주는 앱입니다.

---

## 구현 완료된 기능

### 1. 혜달이 캐릭터 시스템
- **실사 해달 사진** 기반 캐릭터 (원형 프레임)
- 상태별 **이모지/이펙트 오버레이** (사진 위에 표시)
  - 13가지 상태: 기본, 행복, 집중, 피곤, 슬픔, 신남, 스트레스, 사랑, 배고픔, 먹는중, 놀기, 잠자기, 심심, 레벨업
  - 볼터치, 스파클, 비구름, ZZZ, 하트, 골든 오라 등 다양한 이펙트
- **스탯 기반 비주얼 오버레이**: 포만감/청결도/행복도 수치에 따라 자동 시각 변화
  - 최고 상태: 골든 오라 펄스
  - 위급 상태: 빨간 경고 점멸
  - 더러움: 얼룩 표시 / 배고픔: 꼬르륵 물결
- 스탯 수치에 따른 **표정/대사 자동 변화** (복합 상태 판정 시스템)
- CSS 애니메이션: 둥실둥실 떠다니기, 바운스, 물결

### 2. 다마고치 육성 시스템
- 3가지 스탯: **포만감**, **행복도**, **청결도** (glassmorphism 게이지 바)
- 돌보기 액션: **조개 주기**(먹이), **쓰다듬기**(놀기), **비누칠하기**(씻기)
- 하단 독(dock) 스타일 원형 액션 버튼
- 시간이 지나면 스탯 자연 감소
- 스탯 임계치 기반 상태 판정 (위험/낮음/보통/좋음/매우좋음/최고)
- **레벨 시스템**: 돌보기 액션으로 경험치 획득 → 레벨업 축하 이펙트
- 액션 쿨다운 (3초) 으로 스팸 방지
- 파티클 애니메이션 (돌보기 시 이펙트)

### 3. 기분/감정 상태
- 8가지 감정 선택: 행복, 집중, 피곤, 힘들어, 신나, 심심, 사랑해, 배고파
- 선택한 감정에 따라 혜달이 표정 변화 + 대사 말풍선
- 기분 기록 (최근 20개 로그, localStorage 저장)

### 4. 할 일 목록
- 할 일 추가 / 완료 체크 / 삭제
- 최대 20개 항목
- localStorage 저장

### 5. 상태 공유
- 현재 상태를 **URL 파라미터로 인코딩** (기분, 스탯, 할 일 등)
- 공유 모달에서 링크 복사
- **share.html**: 공유 링크를 열면 읽기 전용 뷰로 혜달이 상태 확인
- OG 메타 태그로 카카오톡 등 미리보기 지원

### 6. 백엔드 서버 (Python)
- **SQLite** 기반 상태 저장/공유
- REST API: `GET /api/stats`, `POST /api/action/{feed|wash|pet}`, `GET /api/health`
- IP 기반 **레이트 리밋** (분당 60회), 액션 쿨다운 (2초)
- 허용된 액션만 처리 (화이트리스트)
- 정적 파일 서빙 포함
- **Supabase** 연동 옵션 (영구 클라우드 데이터 저장)

### 7. PWA (Progressive Web App)
- **Service Worker**: 오프라인 캐시 (Cache First 전략)
- **manifest.json**: 홈 화면 설치, standalone 모드
- 오프라인 시 로컬 모드 자동 전환 + 상태 배너

---

## UI/UX 디자인

- **Stitch 디자인 시스템** 적용 (Google Material + Glassmorphism)
- Spline Sans 폰트 + Material Symbols 아이콘
- 모바일 우선 **반응형 디자인** (360px ~ 768px+)
- 오션 그라디언트 배경 + 파도 CSS 애니메이션
- 탭 네비게이션 (기분 / 할 일)
- 서버 연결 상태 배너 (온라인/오프라인)
- 웰니스 레벨에 따른 컨테이너 시각 효과

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | 순수 HTML/CSS/JS (프레임워크 없음) |
| 캐릭터 | 실사 해달 사진 + SVG 이펙트 오버레이 |
| 알림음 | Web Audio API (합성 물소리) |
| 데이터 저장 | localStorage (클라이언트) + SQLite (서버) |
| 클라우드 DB | Supabase (옵션) |
| 상태 공유 | URL 파라미터 인코딩 |
| PWA | Service Worker + Web App Manifest |
| 백엔드 | Python http.server + SQLite |
| 배포 | Vercel (서버리스) / Render (클라우드) |

---

## 폴더 구조

```
hye-otter/
├── index.html              # 메인 페이지 (Stitch 디자인)
├── share.html              # 공유 링크용 읽기 전용 페이지
├── manifest.json           # PWA 매니페스트
├── sw.js                   # Service Worker (오프라인 캐시)
├── css/
│   └── style.css           # 전체 스타일 (반응형 + 애니메이션)
├── js/
│   ├── app.js              # 메인 앱 로직 (스탯 반응형 시스템)
│   ├── otter-svg.js        # 실사 해달 캐릭터 + 이펙트 오버레이
│   ├── tamagotchi.js       # 다마고치 육성 시스템
│   ├── mood.js             # 기분/감정 상태
│   ├── todo.js             # 할 일 목록
│   ├── share.js            # 상태 공유/인코딩
│   ├── notification.js     # 알림 (물소리 + 브라우저 알림)
│   └── api.js              # API 통신 (서버 폴링 + 오프라인 처리)
├── assets/
│   └── otter.svg           # 기본 SVG 아이콘
├── server.py               # Python 백엔드 서버
├── api/                    # Vercel 서버리스 함수
│   ├── _db.py              # DB 유틸리티
│   ├── stats.py            # 스탯 조회 API
│   ├── health.py           # 헬스체크 API
│   └── action/
│       └── [action].py     # 돌보기 액션 API
├── hyeotter.db             # SQLite 데이터베이스
├── supabase_init.sql       # Supabase 테이블 초기화 SQL
├── vercel.json             # Vercel 배포 설정
├── render.yaml             # Render 배포 설정
└── requirements.txt        # Python 의존성 (supabase)
```

---

## 시작하기

### 로컬 실행

```bash
# 서버 실행
python server.py

# 브라우저에서 열기
# http://localhost:10000
```

### 배포

- **Vercel**: `vercel.json` 설정으로 프론트엔드 + 서버리스 API 배포
- **Render**: `render.yaml` 설정으로 Python 서버 클라우드 배포
- **Supabase**: `supabase_init.sql`로 테이블 생성 후 환경변수 설정

---

## 라이선스

MIT

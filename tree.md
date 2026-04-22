# 📻 Korea Radio Add-on Project Tree (v2.0.0)

```text
z:/korea_radio_addon-main/
├── README.md               # 프로젝트 매뉴얼 및 가이드
├── changelog.jsonl         # 버전별 변경 이력 (릴리즈 노트)
├── licence                 # 라이선스 정보
├── repository.json         # HA 애드온 저장소 메타데이터
├── tree.md                 # 현재 파일 구조 (v1.2.0)
└── radioha/                # 애드온 주 로직 폴더
    ├── Dockerfile          # 컨테이너 빌드 설정
    ├── config.json         # 애드온 설정 및 버전 (v1.2.0)
    ├── index.html          # 플레이어 프론트엔드 (localStorage, 3단 음질)
    ├── index.js            # 스트리밍 백엔드 (WAV/MP3 고속 엔진)
    ├── run.sh              # 애드온 실행 스크립트
    ├── radio-list.json     # 방송국 채널 정보 및 주소
    └── package.json        # Node.js 의존성 관리
```

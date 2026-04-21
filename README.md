# 📻 Korea Radio for Home Assistant

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)](https://www.home-assistant.io/)

Home Assistant 내에서 대한민국 주요 라디오 방송을 실시간으로 청취할 수 있는 애드온입니다. 별도의 외부 플레이어 없이 HA 대시보드와 앱 내에서 간편하게 라디오를 즐기세요.

---

## ✨ 주요 특징

* 📻 **다양한 방송 채널 지원**: KBS(1/2/Kong), MBC, SBS(Power/Love) 등 지상파 및 교통/종교방송 지원.
* ⚡ **초고속 WAV/MP3 엔진**: 기존 ADTS 방식을 탈피하여 1~2초 내외의 즉각적인 재생 반응 속도를 실현했습니다.
* 🔄 **자가 치유 안정성**: 서버(FFmpeg)와 클라이언트(JS)의 2중 재연결 로직으로 끊김 없는 감상을 보장합니다.
* 🏠 **HA 완벽 통합**: Ingress 지원을 통해 모든 브라우저와 모바일 앱에서 독립 앱처럼 편리하게 사용 가능합니다.

---

## 🔌 API 사용법 (External Player)

본 애드온은 외부 플레이어(VLC, 미디어 자동화 등)에서 직접 호출할 수 있는 API를 제공합니다.

### 엔드포인트 구조
`http://<HA_IP>:3005/radio?keys=<CHANNEL_KEY>&token=<MY_TOKEN>&atype=<TYPE>`

예제
`http://<HA_IP>:3005/radio?keys=ytn&token=homeassistant&atype=0`

### 사용 가능한 파라미터
- **keys** (필수): 재생할 채널의 고유 키값 (예: kbs_cool, sbs_power, tbs 등)
- **token** (필수): 애드온 설정에서 지정한 보안 토큰 (기본값: homeassistant)
- **atype** (선택): 스트리밍 모드 및 음질 선택 (기본값: 0)

### atype (Audio Type) 상세 가이드
- **192 (High)**: 192kbps MP3 트랜스코딩. 가장 깨끗한 고음질을 제공합니다.
- **128 (Normal)**: 128kbps MP3 트랜스코딩. **가장 권장되는 기본 설정**입니다.
- **96 (Low)**: 96kbps MP3 트랜스코딩. 데이터 절약이 필요할 때 유용합니다.

> [!TIP]
> 본 애드온은 모든 음질 모드에서 **WAV 컨테이너** 방식을 사용하므로 선택 즉시 소리가 나옵니다.

---

## 🛠 하드웨어별 최적화 팁

본 애드온은 **N100(미니 PC)**부터 **라즈베리 파이 3**까지 폭넓게 동작합니다.

* **N100 / 고사양 사용자**: 모든 채널에서 트랜스코딩(atype=1, 2)을 사용해도 CPU 점유율이 매우 낮습니다. 안정적인 재생을 위해 트랜스코딩 모드 활용을 추천합니다.
* **라즈베리 파이 3/4 사용자**: CPU 자원 절약을 위해 기본적으로 atype=0을 사용하세요. 단, TBS와 같이 영상 기반 소스인 채널은 반드시 atype=2를 사용하여 오디오만 추출해야 합니다.

---

## 🚀 설치 및 설정 방법

### 자동 설치 (권장)
아래 버튼을 클릭하여 저장소를 즉시 추가할 수 있습니다.

[![Open your Home Assistant instance and show the add app repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fplplaaa2%2Fkorea_radio_addon)

### 수동 설치
1. **설정 > 애드온 > 애드온 스토어**로 이동합니다.
2. 우측 상단 메뉴(⋮) > **저장소(Repositories)**를 선택합니다.
3. `https://github.com/plplaaa2/korea_radio_addon`을 입력하고 추가합니다.
4. 목록에서 **Korea Radio**를 찾아 **설치(INSTALL)** 후 **시작(START)** 하세요.

---

## 🛠 기술 스택

- **Runtime**: Node.js (Alpine Linux 기반)
- **Streaming engine**: FFmpeg (WAV Container + MP3 Codec 고속 엔진)
- **Frontend**: Vanilla JS (localStorage 기반 상태 유지 및 반응형 UI)

---

## 📜 라이선스 및 유의사항

* 본 프로젝트는 **ISC License**를 따릅니다.
* **저작권 고지**: 본 애드온은 각 방송사에서 제공하는 공개 스트리밍 주소를 활용하며, 모든 콘텐츠의 저작권은 해당 방송사에 있습니다. 상업적 목적으로의 사용을 금합니다.

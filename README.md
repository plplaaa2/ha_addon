# 📻 Korea Radio for Home Assistant

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)](https://www.home-assistant.io/)

Home Assistant 내에서 대한민국 주요 라디오 방송을 실시간으로 청취할 수 있는 애드온입니다. 이제 브라우저 재생을 넘어, 우리 집 곳곳의 **AI 스피커(Google Home, Sonos 등)**로도 라디오를 감상하세요.

---

## ✨ 주요 특징 (v2.0.0 Major Update)

* 📻 **다양한 방송 채널 지원**: KBS, MBC, SBS 등 지상파부터 TBS, EBS, 국방FM 등 총 19개 채널 지원.
* 🔊 **멀티 미디어 플레이어 통합**: HA에 등록된 모든 미디어 플레이어 기기(스피커)로 즉시 스트리밍 가능.
* 📱 **동적 리모컨 UI**: 기기 선택에 따라 브라우저 플레이어 또는 스피커 리모컨(Play/Pause/Stop) UI로 자동 전환.
* 🔀 **스마트 기기 전환**: 기기 선택 변경 시 이전 기기 자동 정지 및 새 기기 즉시 연결 지원.
* 📊 **주파수 기반 정렬**: 채널을 실제 라디오 주파수 순으로 배치하고, 방송명과 주파수 정보를 상세히 표시.
* ⚡ **초고속 WAV/MP3 엔진**: 1~2초 내외의 즉각적인 재생 반응 속도 및 자가 치유(Reconnect) 안정성.
* 🏠 **HA 완벽 통합**: Ingress 지원 및 애드온 구성 탭에서의 보안 토큰 관리 지원.

---

## 🔌 API 및 외부 호출 사용법

본 애드온은 외부 플레이어(VLC, 미디어 자동화 등)에서 직접 호출할 수 있는 API를 제공합니다.

### 스트리밍 엔드포인트
`http://<HA_IP>:3005/radio?keys=<CHANNEL_KEY>&token=<MY_TOKEN>&atype=<TYPE>`

- **keys**: 재생할 채널의 키 (kbs_cool, sbs_power, ytn 등)
- **token**: 구성 탭에서 직접 지정한 토큰값 (기본값: homeassistant)
- **atype**: 음질 선택 (`0`: 고음질 192k, `1`: 보통 128k, `2`: 절약 96k)

### 미디어 제어 엔드포인트 (v2.0+)
`http://<HA_IP>:3005/media_action?token=<MY_TOKEN>&entity_id=<ENTITY_ID>&action=<ACTION>`
- **action**: `media_play`, `media_pause`, `media_stop` 지원

---

## 🛠 하드웨어별 최적화 팁

* **N100 / 고사양 사용자**: 모든 모드에서 CPU 점유율이 매우 낮습니다. 안정적인 재생을 위해 기본 설정을 그대로 사용하세요.
* **라즈베리 파이 3/4 사용자**: CPU 자원 절약을 위해 `atype=1` 또는 `atype=2`를 추천합니다. 특히 스피커 재생 시에는 애드온 서버에서 미디어 데이터만 가공하여 전송하므로 매우 가볍게 동작합니다.

---

## 🚀 설치 및 설정 방법

### 자동 설치 (권장)
아래 버튼을 클릭하여 저장소를 즉시 추가할 수 있습니다.

[![Open your Home Assistant instance and show the add app repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fprojectdhs%2Fha_addon)

### 설정 (Options)
1. 애드온 설치 후 **구성(Configuration)** 탭으로 이동합니다.
2. **token**: 외부 API 호출이나 보안을 위해 본인만의 토큰을 입력하세요 (기본: `homeassistant`).
3. 포트 설정에서 `3005` 포트가 열려 있는지 확인하세요 (스피커 연동 필수).

---

## 📜 라이선스 및 유의사항

* 본 프로젝트는 **ISC License**를 따릅니다.
* **저작권 고지**: 본 애드온은 각 방송사에서 제공하는 공개 스트리밍 주소를 활용하며, 모든 콘텐츠의 저작권은 해당 방송사에 있습니다. 상업적 목적으로의 사용을 금합니다.

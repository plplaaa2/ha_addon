# 📻 Korea Radio for Home Assistant

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)](https://www.home-assistant.io/)

Home Assistant 내에서 대한민국 주요 라디오 방송을 실시간으로 청취할 수 있는 공식 애드온입니다. 별도의 외부 플레이어 없이 HA 대시보드와 앱 내에서 간편하게 라디오를 즐기세요.

---

## ✨ 주요 특징

* 📻 **다양한 방송 채널 지원**: KBS(1/2/Kong), MBC, SBS(Power/Love) 등 지상파 주요 채널 및 인기 인터넷 라디오 채널 지원.
* ⚡ **빠른 스트리밍**: `FFmpeg` 기반 실시간 트랜스 코딩을 통해 저지연 스트리밍 환경을 제공합니다.
* 🔄 **자동 재연결(Auto-Retry)**: 네트워크 불안정으로 인한 스트림 중단 시, 클라이언트와 서버 양측에서 자동으로 연결을 복구합니다.
* 📱 **반응형 심플 UI**: 모바일과 데스크탑 환경 모두에 최적화된 직관적인 인터페이스를 제공합니다.
* 🏠 **HA 완벽 통합**: `Ingress` 및 사이드바 메뉴 지원을 통해 Home Assistant 앱 내에서 독립적인 앱처럼 편리하게 접근 가능합니다.

---

## 🛠 기술 스택

본 프로젝트는 경량화와 안정성을 위해 다음과 같은 기술을 사용합니다.

| 분류 | 기술 | 비고 |
| :--- | :--- | :--- |
| **Runtime** | `Node.js` | Alpine Linux 기반의 초경량 이미지 사용 |
| **Streaming** | `FFmpeg` | 실시간 오디오 처리 및 스트리밍 최적화 |
| **Frontend** | `Vanilla JS` / `HTML5 Audio` | 외부 프레임워크 없는 순수 웹 API 기반의 가벼운 UI |

---

## 🚀 설치 및 설정 방법

### 1. 저장소 추가
1. Home Assistant에서 **설정** > **기기 및 서비스** > **애드온**으로 이동합니다.
2. 우측 하단의 **애드온 스토어** 버튼을 클릭합니다.
3. 우측 상단 메뉴(⋮)에서 **저장소(Repositories)**를 선택합니다.
4. 본 저장소의 URL을 입력하고 **추가**를 누릅니다.

### 2. 애드온 설치 및 실행
1. 목록에서 **Korea Radio** 애드온을 찾아 클릭합니다.
2. **설치(INSTALL)** 버튼을 누릅니다.
3. 설치 완료 후 **시작(START)** 버튼을 클릭합니다.

### 3. 사이드바 설정
* 애드온 설정 화면에서 **'사이드바에 표시(Show in sidebar)'** 옵션을 활성화하면 왼쪽 메뉴에서 바로 접근할 수 있어 편리합니다.

---

## 📜 라이선스

본 프로젝트는 **ISC License**를 따릅니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 확인하세요.

---

> **Note**: 본 애드온은 각 방송사에서 제공하는 공개 스트리밍 주소를 활용하며, 모든 방송 콘텐츠에 대한 저작권은 각 방송사에 있습니다.

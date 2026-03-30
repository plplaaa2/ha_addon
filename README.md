# Korea Radio for Home Assistant

Home Assistant에서 한국 라디오 방송을 실시간으로 청취할 수 있는 애드온입니다.

## 주요 특징

- 📻 **다양한 방송 채널**: KBS, MBC, SBS 등 주요 방송사 및 여러 인터넷 라디오 채널 지원
- ⚡ **빠른 스트리밍**: FFmpeg를 이용한 실시간 트랜스 코딩으로 지연 시간 최소화
- 🔄 **자동 재연결(Auto-Retry)**: 네트워크 오류나 스트림 중단 시 클라이언트와 서버 양측에서 자동으로 재연결 시도
- 📱 **반응형 심플 UI**: 모바일과 데스크탑에서 모두 쾌적하게 사용 가능한 직관적인 디자인
- 🏠 **HA 통합**: Ingress 및 사이드바 메뉴를 지원하여 Home Assistant 앱 내에서 편리하게 접근 가능

## 설치 및 설정

1. Home Assistant의 애드온 스토어에서 이 저장소를 추가합니다.
2. 애드온을 설치한 후 '시작' 버튼을 누릅니다.
3. '사이드바에 표시' 옵션을 활성화하면 왼쪽 메뉴에서 바로 접근할 수 있습니다.

## 주요 기술 스택

- **Runtime**: Node.js (Alpine Linux 기반 경량 이미지)
- **Streaming**: FFmpeg
- **Frontend**: Vanilla JS / HTML5 Audio API

## 라이선스

본 프로젝트는 ISC 라이선스를 따릅니다.

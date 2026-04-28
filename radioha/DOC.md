## 설정 (Options)
1. 애드온 설치 후 **구성(Configuration)** 탭으로 이동합니다.
2. **token**: 외부 API 호출이나 보안을 위해 본인만의 토큰을 입력하세요 (기본: `homeassistant`).
3. 포트 설정에서 `3005` 포트가 열려 있는지 확인하세요 (스피커 연동 필수).


## 🔌 API 및 외부 호출 사용법

본 애드온은 외부 플레이어(VLC, 미디어 자동화 등)에서 직접 호출할 수 있는 API를 제공합니다.

### 데이터 제공 API (v2.7+)
`http://<HA_IP>:3005/get_radio_list?token=<MY_TOKEN>`
- 현재 서버의 `radio-list.json` 내용을 반환합니다.

### 스트리밍 엔드포인트
`http://<HA_IP>:3005/radio?keys=<CHANNEL_KEY>&token=<MY_TOKEN>&atype=<TYPE>`

- **keys**: 재생할 채널의 키 (kbs_cool, sbs_power, ytn 등)
- **token**: 구성 탭에서 직접 지정한 토큰값 (기본값: homeassistant)
- **atype**: 음질 선택 (`0`: 고음질 192k, `1`: 보통 128k, `2`: 절약 96k)

### 미디어 제어 엔드포인트 (v2.6+)
모든 미디어 제어 API는 **GET**과 **POST (JSON Body)** 방식을 모두 지원합니다.

`http://<HA_IP>:3005/media_action?token=<MY_TOKEN>&entity_id=<ENTITY_ID>&action=<ACTION>`
- **action**: `media_play`, `media_pause`, `media_stop`

`http://<HA_IP>:3005/set_volume?token=<MY_TOKEN>&entity_id=<ENTITY_ID>&volume=<VOLUME>`
- **volume**: `0.0` ~ `1.0` 사이의 실수 값

`http://<HA_IP>:3005/mute_volume?token=<MY_TOKEN>&entity_id=<ENTITY_ID>&mute=<TRUE/FALSE>`
- **mute**: `true` (음소거), `false` (해제)

`http://<HA_IP>:3005/play_on_player?token=<MY_TOKEN>&entity_id=<ENTITY_ID>&keys=<CHANNEL_KEY>&atype=<TYPE>`
- 스피커로 특정 채널을 즉시 재생 명령 전송 (v2.6+)

#### 📮 POST JSON 호출 예시 (curl)
```bash
curl -X POST http://<HA_IP>:3005/play_on_player \
     -H "Content-Type: application/json" \
     -d '{
           "token": "your_token",
           "entity_id": "media_player.living_room_speaker",
           "keys": "kbs_cool",
           "atype": "1"
         }'
```

### 🏠 Home Assistant `rest_command` 설정 예제
`configuration.yaml`에 아래와 같이 설정하여 자동화나 스크립트에서 편리하게 사용할 수 있습니다.

```yaml
rest_command:
  radio_play:
    url: "http://localhost:3005/play_on_player"
    method: post
    content_type: "application/json"
    payload: >
      {
        "token": "your_token",
        "entity_id": "{{ entity_id }}",
        "keys": "{{ keys }}",
        "atype": "{{ atype | default('1') }}"
      }

  radio_action:
    url: "http://localhost:3005/media_action"
    method: post
    content_type: "application/json"
    payload: '{"token": "your_token", "entity_id": "{{ entity_id }}", "action": "{{ action }}"}'
```

---

## 🛠 하드웨어별 최적화 팁

* **N100 / 고사양 사용자**: 모든 모드에서 CPU 점유율이 매우 낮습니다. 안정적인 재생을 위해 기본 설정을 그대로 사용하세요.
* **라즈베리 파이 3/4 사용자**: CPU 자원 절약을 위해 `atype=1` 또는 `atype=2`를 추천합니다. 특히 스피커 재생 시에는 애드온 서버에서 미디어 데이터만 가공하여 전송하므로 매우 가볍게 동작합니다.


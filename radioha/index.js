const http = require('http');
const https = require('https');
const child_process = require("child_process");
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const port = 3005;
const OPTIONS_FILE = '/data/options.json';
let mytoken = 'homeassistant'; // 기본값

try {
    if (fs.existsSync(OPTIONS_FILE)) {
        const options = JSON.parse(fs.readFileSync(OPTIONS_FILE, 'utf8'));
        if (options.token) {
            mytoken = options.token;
            console.log(`[Config] 토큰이 사용자 정의 값으로 설정되었습니다.`);
        }
    }
} catch (err) {
    console.error(`[Config] 옵션 파일 로드 실패:`, err);
}

const instance = axios.create({ timeout: 3000 });
const bitrateMap = { "0": 192, "1": 128, "2": 96 };

// Home Assistant Superivsor API 설정
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
console.log("[HA API] SUPERVISOR_TOKEN 존재 여부:", !!SUPERVISOR_TOKEN);
const hassInstance = axios.create({
    baseURL: 'http://supervisor/core/api',
    headers: {
        'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
        'Content-Type': 'application/json'
    },
    timeout: 5000
});

// 공통으로 사용할 풀 버전 User-Agent
const FULL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function getRadioData() {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'radio-list.json'), 'utf8'));
    } catch (e) {
        console.error("데이터 로딩 실패:", e);
        return {};
    }
}

// KBS 주소 파싱
function getkbs(param) {
    return new Promise((resolve) => {
        let kbs_ch = { 'kbs_1radio': '21', 'kbs_3radio': '23', 'kbs_classic': '24', 'kbs_cool': '25', 'kbs_happy': '22' };
        instance.get('https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/' + kbs_ch[param], {
            headers: {
                'User-Agent': FULL_UA,
                'Referer': 'https://onair.kbs.co.kr/'
            }
        }).then(response => {
            const kbs_src = response.data.channel_item;
            let media_src = "invalid";
            for (let i = 0; i < kbs_src.length; i++) {
                if (kbs_src[i].media_type == 'radio') {
                    media_src = kbs_src[i].service_url;
                    break;
                }
            }
            resolve(media_src);
        }).catch(() => resolve("invalid"));
    });
}

// MBC 주소 파싱
function getmbc(ch) {
    return new Promise(function (resolve, reject) {
        try {
            let mbc_ch = {
                'mbc_fm4u': 'mfm',
                'mbc_fm': 'sfm',
            };

            instance({
                method: 'get',
                url: 'https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=' + mbc_ch[ch] + '&callback=jarvis.miniInfo.loadOnAirComplete',
                headers: {
                    'User-Agent': FULL_UA,
                    'Referer': 'https://mini.imbc.com/',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate'
                }
            })

                .then(response => {
                    var text = 'https://' + response.data.split('"https://')[1].split('"')[0];
                    resolve(text);

                }).catch(e => {
                    console.log(e)
                    resolve("invalid");
                })
        } catch {
            resolve("invalid");
        }
    })
}

// SBS 주소 파싱
function getsbs(ch) {
    return new Promise((resolve) => {
        let sbs_ch = { 'sbs_power': ['powerfm', 'powerpc'], 'sbs_love': ['lovefm', 'lovepc'] };
        instance.get(`https://apis.sbs.co.kr/play-api/1.0/livestream/${sbs_ch[targetMappingIdx][1]}/${sbs_ch[targetMappingIdx][0]}?protocol=hls&ssl=Y`.replace('targetMappingIdx', ch), {
            headers: {
                'User-Agent': FULL_UA,
                'Referer': 'https://gorealraplayer.radio.sbs.co.kr/'
            }
        }).then(response => resolve(response.data)).catch(() => resolve("invalid"));
    });
}

/**
 * 2. FFmpeg 스트리밍 함수
 */
function return_pipe(urls, resp, req, key) {
    const baseURL = `http://${req.headers.host || 'localhost'}`;
    const myUrl = new URL(req.url, baseURL);
    const urlParams = myUrl.searchParams;
    let bitrateRaw = urlParams.get("atype") || "1";
    const bitrate = bitrateMap[bitrateRaw] || 128;

    // 채널 맞춤형 헤더 구성 (필요한 경우에만 Referer 추가)
    let headerStr = `User-Agent: ${FULL_UA}\r\n`;
    if (key === 'obs') {
        headerStr += `Referer: https://www.obs.co.kr/\r\n`;
    }

    // [Legacy Engine - Smart & Resilient] 조건부 헤더 + 자가 치유(Reconnect) 로직
    const ffmpegArgs = [
        "-headers", headerStr,
        "-reconnect", "1", "-reconnect_streamed", "1", "-reconnect_delay_max", "5",
        "-loglevel", "error", "-i", urls,
        "-c:a", "mp3", "-b:a", `${bitrate}k`, "-ac", "2",
        "-bufsize", "256K", "-f", "wav", "pipe:1"
    ];

    console.log(`[Smart Engine] ${key} - ${bitrate}k (Reconnect: ON, Buffer: 256K)`);

    resp.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });

    const xffmpeg = child_process.spawn("ffmpeg", ffmpegArgs, { detached: false });
    xffmpeg.stdout.pipe(resp);

    const cleanup = () => { if (xffmpeg) xffmpeg.kill(); };
    req.on("close", cleanup);
    req.on("end", cleanup);
}

// 호스트의 실제 내부 IP를 가져오는 함수 (Supervisor API 활용)
async function getHostIP() {
    try {
        const response = await axios.get('http://supervisor/network/info', {
            headers: { 'Authorization': `Bearer ${SUPERVISOR_TOKEN}` },
            timeout: 2000
        });
        const interfaces = response.data.data.interfaces;
        // 192.168.x.x 또는 10.x.x.x 같은 일반적인 LAN 대역 우선 검색
        for (const iface of interfaces) {
            if (iface.enabled && iface.ipv4 && iface.ipv4.address.length > 0) {
                for (const addr of iface.ipv4.address) {
                    const ip = addr.split('/')[0];
                    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
                        return ip;
                    }
                }
            }
        }
        // LAN 대역을 못 찾으면 127/172(Internal)가 아닌 첫 주소 반환
        for (const iface of interfaces) {
            if (iface.enabled && iface.ipv4 && iface.ipv4.address.length > 0) {
                const ip = iface.ipv4.address[0].split('/')[0];
                if (!ip.startsWith('127.') && !ip.startsWith('172.30.')) return ip;
            }
        }
    } catch (e) {
        console.error("[Network] Supervisor API에서 IP 정보를 가져오지 못했습니다:", e.message);
    }
    return null;
}

/**
 * 3. HTTP 서버 설정
 */
const liveServer = http.createServer(async (req, resp) => {
    const baseURL = `http://${req.headers.host || 'localhost'}`;
    const myUrl = new URL(req.url, baseURL);
    const urlParams = myUrl.searchParams;
    const urlPath = myUrl.pathname;

    if (urlPath === "/get_players") {
        if (urlParams.get('token') === mytoken) {
            hassInstance.get('/states')
                .then(response => {
                    const players = response.data
                        .filter(state => state.entity_id.startsWith('media_player.'))
                        .map(state => ({
                            name: state.attributes.friendly_name || state.entity_id,
                            id: state.entity_id
                        }));
                    resp.writeHead(200, { 'Content-Type': 'application/json' });
                    resp.end(JSON.stringify(players));
                })
                .catch(err => {
                    console.error("HA API Error:", err.message);
                    resp.statusCode = 500;
                    resp.end(JSON.stringify({ error: "HA API Error" }));
                });
        } else {
            resp.statusCode = 403;
            resp.end("Forbidden");
        }
        return;
    }

    if (urlPath === "/play_on_player") {
        if (urlParams.get('token') === mytoken) {
            const entity_id = urlParams.get('entity_id');
            const keys = urlParams.get('keys');
            const atype = urlParams.get('atype') || '1';

            // 1. 호스트 실 IP 감지 시도
            const hostIp = await getHostIP();
            
            let finalHost = hostIp || req.headers.host.split(':')[0];
            finalHost = `${finalHost}:${port}`;

            const streamUrl = `http://${finalHost}/radio?token=${mytoken}&keys=${keys}&atype=${atype}`;
            console.log(`[Remote Play] Target: ${entity_id}, URL: ${streamUrl} (atype: ${atype})`);

            hassInstance.post('/services/media_player/play_media', {
                entity_id: entity_id,
                media_content_id: streamUrl,
                media_content_type: 'music'
            }).then(() => {
                resp.end("Success");
            }).catch(err => {
                console.error("Play Media Error:", err.message);
                resp.statusCode = 500;
                resp.end("Error");
            });
        } else {
            resp.statusCode = 403;
            resp.end("Forbidden");
        }
        return;
    }

    if (urlPath === "/media_action") {
        if (urlParams.get('token') === mytoken) {
            const entity_id = urlParams.get('entity_id');
            const action = urlParams.get('action'); 
            
            if (entity_id && entity_id !== "web" && action) {
                // 지원하는 액션인지 확인 (보안 및 오류 방지)
                const allowedActions = ['media_play', 'media_pause', 'media_stop', 'media_play_pause'];
                if (!allowedActions.includes(action)) {
                    resp.statusCode = 400;
                    return resp.end("Unsupported Action");
                }

                hassInstance.post(`/services/media_player/${action}`, {
                    entity_id: entity_id
                }).then(() => {
                    console.log(`[Remote Action] ${action} on ${entity_id}`);
                    resp.end("Success");
                }).catch(err => {
                    console.error("Media Action Error:", err.message);
                    resp.statusCode = 500;
                    resp.end("Error");
                });
            } else {
                resp.end("Invalid Request");
            }
        } else {
            resp.statusCode = 403;
            resp.end("Forbidden");
        }
        return;
    }

    if (urlPath === "/radio") {
        if (urlParams.get('token') === mytoken) {
            const key = urlParams.get('keys');
            const currentData = getRadioData();
            const station = currentData[key];

            if (station) {
                const myData = (typeof station === 'string') ? station : station.url;
                
                if (myData === "kbs_lib") {
                    getkbs(key).then(data => data !== "invalid" ? return_pipe(data, resp, req, key) : resp.end("Error"));
                } else if (myData === "mbc_lib") {
                    getmbc(key).then(data => data !== "invalid" ? return_pipe(data, resp, req, key) : resp.end("Error"));
                } else if (myData === "sbs_lib") {
                    getsbs(key).then(data => data !== "invalid" ? return_pipe(data, resp, req, key) : resp.end("Error"));
                } else {
                    return_pipe(myData, resp, req, key);
                }
            } else {
                resp.end("Not Found");
            }
        } else {
            resp.statusCode = 403;
            resp.end("Forbidden");
        }
    } else if (urlPath === "/") {
        resp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        const currentData = getRadioData();
        
        // 주파수 순으로 정렬
        const sortedKeys = Object.keys(currentData).sort((a, b) => {
            const freqA = (typeof currentData[a] === 'object') ? currentData[a].freq : 999;
            const freqB = (typeof currentData[b] === 'object') ? currentData[b].freq : 999;
            return freqA - freqB;
        });

        const radioButtons = sortedKeys.map(key => {
            const info = currentData[key];
            const name = (typeof info === 'object') ? info.name : key.toUpperCase();
            const freq = (typeof info === 'object') ? info.freq + ' MHz' : '';
            return `<button class="radio-btn" onclick="playRadio('${key}')">
                        <div class="btn-name">${name}</div>
                        <div class="btn-freq">${freq}</div>
                    </button>`;
        }).join('');

        try {
            let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
            html = html.replace(/{{RADIO_BUTTONS}}/g, radioButtons).replace(/{{MY_TOKEN}}/g, mytoken);
            resp.end(html);
        } catch (e) {
            resp.end("UI Error");
        }
    }
});

liveServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});

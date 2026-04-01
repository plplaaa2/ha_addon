const port = 3005;
const atype_list = [192, 128, 96];
const mytoken = 'homeassistant';

const http = require('http');
const child_process = require("child_process");
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const instance = axios.create({ timeout: 3000 });

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
                'referer': 'https://onair.kbs.co.kr/' 
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
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
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
        instance.get(`https://apis.sbs.co.kr/play-api/1.0/livestream/${sbs_ch[ch][1]}/${sbs_ch[ch][0]}?protocol=hls&ssl=Y`, {
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
    let atype = parseInt(urlParams.get("atype")) || 0;

    let ffmpegArgs = [
        "-reconnect", "1", "-reconnect_at_eof", "1", "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5", "-reconnect_on_network_error", "1",
        "-reconnect_on_http_error", "4xx,5xx", "-fflags", "nobuffer+genpts",
        "-flags", "low_delay", "-probesize", "32768", "-analyzeduration", "1000000",
        "-headers", `User-Agent: ${FULL_UA}`, // FFmpeg 내부 헤더에도 적용
        "-loglevel", "error", "-i", urls
    ];

    if (atype === 0) {
        ffmpegArgs.push("-c:a", "copy", "-bufsize", "384k");
        console.log(`[Auto Copy] ${key}`);
    } else {
        const bitrate = atype_list[atype - 1] || 128;
        ffmpegArgs.push("-c:a", "aac", "-b:a", bitrate + "k", "-bufsize", (bitrate * 2) + "k");
        console.log(`[Transcode] ${key} (${bitrate}k)`);
    }

    ffmpegArgs.push("-f", "adts", "pipe:1");

    resp.writeHead(200, { 'Content-Type': 'audio/aac', 'Transfer-Encoding': 'chunked', 'Connection': 'keep-alive' });

    const xffmpeg = child_process.spawn("ffmpeg", ffmpegArgs, { detached: false });
    xffmpeg.stdout.pipe(resp);

    const cleanup = () => { if (xffmpeg) xffmpeg.kill(); };
    req.on("close", cleanup);
    req.on("end", cleanup);
}

/**
 * 3. HTTP 서버 설정
 */
const liveServer = http.createServer((req, resp) => {
    const baseURL = `http://${req.headers.host || 'localhost'}`;
    const myUrl = new URL(req.url, baseURL);
    const urlParams = myUrl.searchParams;
    const urlPath = myUrl.pathname;

    if (urlPath === "/radio") {
        if (urlParams.get('token') === mytoken) {
            const key = urlParams.get('keys');
            const currentData = getRadioData();
            const myData = currentData[key];

            if (myData) {
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
        const radioButtons = Object.keys(currentData).map(key =>
            `<button class="radio-btn" onclick="playRadio('${key}')">${key.toUpperCase()}</button>`
        ).join('');

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

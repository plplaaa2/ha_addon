const port = 3005; // 포트 설정
const atype_list = [256, 192, 128, 96, 48];
const mytoken = 'homeassistant' // 토큰 설정
const http = require('http');
const url = require("url");
const child_process = require("child_process");
const fs = require('fs');
const axios = require('axios');
const path = require('path');
// 라디오 데이터 동적 로딩 함수
function getRadioData() {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'radio-list.json'), 'utf8'));
    } catch (e) {
        console.error("데이터 로딩 실패:", e);
        return {};
    }
}

const instance = axios.create({
    timeout: 3000,
});

function return_pipe(urls, resp, req) {
    const urlParts = url.parse(req.url, true);
    const urlParams = urlParts.query;
    let atype = urlParams["atype"];
    if (atype == undefined) atype = 0;
    else atype = Number(atype);

    resp.writeHead(200, {
        'Content-Type': 'audio/aac',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive'
    });

    var xffmpeg = child_process.spawn("ffmpeg", [
        "-reconnect", "1",
        "-reconnect_at_eof", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "4",
        "-reconnect_on_network_error", "1",
        "-reconnect_on_http_error", "4xx,5xx",
        "-fflags", "nobuffer",
        "-flags", "low_delay",
        "-probesize", "32",
        "-analyzeduration", "50000",
        "-headers", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Safari/537.36",
        "-loglevel", "error",
        "-i", urls,
        "-c:a", "aac",
        "-b:a", atype_list[atype] + "k",
        "-bufsize", "128K",
        "-f", "adts", "pipe:1" // output to stdout
    ], {
        detached: false
    });

    xffmpeg.stdout.pipe(resp);
    console.log("new input " + xffmpeg.pid);

    xffmpeg.on("exit", function (code) { });

    xffmpeg.on("error", function (e) {
        console.log("Xsystem error: " + e);
    });
    xffmpeg.stdout.on("data", function (data) {
    });

    req.on("close", function () {
        if (xffmpeg) {
            console.log("close " + xffmpeg.pid);
            xffmpeg.kill();
        }
    });

    req.on("end", function () {
        if (xffmpeg) {
            console.log("end " + xffmpeg.pid);
            xffmpeg.kill();
        }
    });
}
var liveServer = http.createServer((req, resp) => {
    const urlParts = url.parse(req.url, true);
    const urlParams = urlParts.query;
    const urlPath = urlParts.pathname;

    if (urlPath == "/radio") {

        const token_key = urlParams['token'];
        if (token_key == mytoken) {
            const key = urlParams['keys'];
            console.log("your input : " + key);

            if (key) {
                const currentData = getRadioData();
                const myData = currentData[key];
                if (Object.hasOwnProperty.call(currentData, key)) { // 라디오 리스트에 key가 존재한다면?
                    if (!myData.includes('http')) {

                        if (myData == "kbs_lib") {
                            getkbs(key).then(function (data1) {


                                var urls = data1;
                                if (typeof urls === 'string' && urls !== 'invalid' && urls.includes('m3u8')) {

                                    return_pipe(urls, resp, req);
                                } else {
                                    resp.statusCode = 403;
                                    resp.setHeader('Content-Type', 'text/plain; charset=utf-8');
                                    resp.end('호출 실패');
                                }
                            });
                        }
                        if (myData == "sbs_lib") {
                            getsbs(key).then(function (data1) {

                                var urls = data1;
                                if (typeof urls === 'string' && urls !== 'invalid' && urls.includes('m3u8')) {

                                    return_pipe(urls, resp, req);
                                } else {
                                    resp.statusCode = 403;
                                    resp.setHeader('Content-Type', 'text/plain; charset=utf-8');
                                    resp.end('호출 실패');
                                }
                            });
                        }
                        if (myData == "mbc_lib") {
                            getmbc(key).then(function (data1) {

                                var urls = data1;
                                if (typeof urls === 'string' && urls !== 'invalid' && urls.includes('m3u8')) {
                                    return_pipe(urls, resp, req);
                                } else {
                                    resp.statusCode = 403;
                                    resp.setHeader('Content-Type', 'text/plain; charset=utf-8');
                                    resp.end('호출 실패');
                                }
                            });
                        }
                    } else {
                        var beforeEn = true;
                        var urls = myData
                        return_pipe(urls, resp, req);
                    }
                } else {

                    resp.statusCode = 403;
                    resp.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    resp.end('올바르지 않은 코드');
                }
            } else {

                resp.statusCode = 403;
                resp.setHeader('Content-Type', 'text/plain; charset=utf-8');
                resp.end('올바르지 않은 접근');
            }
        } else {

            resp.statusCode = 403;
            resp.setHeader('Content-Type', 'text/plain; charset=utf-8');
            resp.end('올바르지 않은 접근');
        }
    } else if (urlPath == "/") {
        resp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        
        const currentData = getRadioData();
        const stationCount = Object.keys(currentData).length;
        const radioButtons = Object.keys(currentData).map(key => 
            `<button class="radio-btn" onclick="playRadio('${key}')">${key.toUpperCase()}</button>`
        ).join('');

        try {
            let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
            html = html.replace(/{{STATION_COUNT}}/g, stationCount)
                       .replace(/{{RADIO_BUTTONS}}/g, radioButtons)
                       .replace(/{{MY_TOKEN}}/g, mytoken);
            resp.end(html);
        } catch (e) {
            console.error("HTML 로딩 실패:", e);
            resp.end("UI 로딩 실패");
        }
    } else {
        resp.statusCode = 403;
        resp.setHeader('Content-Type', 'text/plain; charset=utf-8');
        resp.end('올바르지 않은 접근');
    }
});

function getkbs(param) {
    return new Promise(function (resolve, reject) {

        let kbs_ch = {
            'kbs_1radio': '21',
            'kbs_3radio': '23',
            'kbs_classic': '24',
            'kbs_cool': '25',
            'kbs_happy': '22'
        };
        try {
            instance({
                method: 'get', //you can set what request you want to be
                url: 'https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/' + kbs_ch[param],
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
                    'referer': 'https://onair.kbs.co.kr/'
                }
            })


                .then(response => {

                    const kbs_src = response.data.channel_item;
                    var media_src = "invalid";
                    for (var i = 0; i < kbs_src.length; i++) {
                        if (kbs_src[i].media_type == 'radio') {
                            media_src = kbs_src[i].service_url;
                            break;
                        }
                    }

                    resolve(media_src);


                }).catch(e => {
                    console.log(e)
                    resolve("invalid");
                })
        } catch {
            resolve("invalid");
        }

    })
}

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
                    'Referer': 'http://mini.imbc.com/',
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

function getsbs(ch) {
    return new Promise(function (resolve, reject) {

        let sbs_ch = {
            'sbs_power': ['powerfm', 'powerpc'],
            'sbs_love': ['lovefm', 'lovepc']
        }
        try {
            instance({
                method: 'get',
                url: 'https://apis.sbs.co.kr/play-api/1.0/livestream/' + sbs_ch[ch][1] + '/' + sbs_ch[ch][0] + '?protocol=hls&ssl=Y',
                headers: {
                    'Host': 'apis.sbs.co.kr',
                    'Connection': 'keep-alive',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) GOREALRA/1.2.1 Chrome/85.0.4183.121 Electron/10.1.3 Safari/537.36',
                    'Accept': '*/*',
                    'Origin': 'https://gorealraplayer.radio.sbs.co.kr',
                    'Sec-Fetch-Site': 'same-site',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Dest': 'empty',
                    'Referer': 'https://gorealraplayer.radio.sbs.co.kr/main.html?v=1.2.1',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'ko',
                    'If-None-Match': 'W/"134-0OoLHiGF4IrBKYLjJQzxNs0/11M"'
                }
            })
                .then(response => {

                    resolve(response.data);
                }).catch(e => {
                    console.log(e)
                    resolve("invalid");
                })
        } catch {
            resolve("invalid");
        }
    })
}

liveServer.listen(port, '0.0.0.0', () => {
    console.log('Server running at http://0.0.0.0:3005');
});

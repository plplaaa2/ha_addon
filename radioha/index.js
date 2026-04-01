const port = 3005; 
const atype_list = [192, 128, 96]; // [High, Normal, Eco]
const mytoken = 'homeassistant'; 
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

function return_pipe(urls, resp, req, key) { 
    const urlParts = url.parse(req.url, true);
    const urlParams = urlParts.query;
    
    let atype = urlParams["atype"];
    if (atype == undefined) atype = 0;
    else atype = Number(atype);

    let ffmpegArgs = [
        "-reconnect", "1",
        "-reconnect_at_eof", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "4",
        "-reconnect_on_network_error", "1",
        "-reconnect_on_http_error", "4xx,5xx",
        "-fflags", "nobuffer",
        "-flags", "low_delay",
        "-probesize", "128",
        "-analyzeduration", "100000",
        "-headers", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Safari/537.36",
        "-loglevel", "error",
        "-i", urls
    ];

    if (atype === 0) {
        ffmpegArgs.push("-c:a", "copy");
        console.log(`[Auto Copy] ${key} - Original Stream`);
    } else {
        const targetIdx = atype - 1;
        const bitrate = atype_list[targetIdx] || 128;
        ffmpegArgs.push(
            "-c:a", "aac",
            "-b:a", bitrate + "k",
            "-bufsize", (bitrate * 2) + "k"
        );
        console.log(`[Transcode] ${key} - Quality: ${bitrate}k`);
    }

    ffmpegArgs.push("-f", "adts", "pipe:1");

    resp.writeHead(200, {
        'Content-Type': 'audio/aac',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive'
    });

    var xffmpeg = child_process.spawn("ffmpeg", ffmpegArgs, { detached: false });

    xffmpeg.stdout.pipe(resp);
    console.log("new input " + xffmpeg.pid);

    const cleanup = () => {
        if (xffmpeg) {
            console.log("close/end " + xffmpeg.pid);
            xffmpeg.kill();
        }
    };

    req.on("close", cleanup);
    req.on("end", cleanup);
    xffmpeg.on("error", (e) => console.log("Xsystem error: " + e));
}

var liveServer = http.createServer((req, resp) => {
    const urlParts = url.parse(req.url, true);
    const urlParams = urlParts.query;
    const urlPath = urlParts.pathname;

    if (urlPath == "/radio") {
        if (urlParams['token'] == mytoken) {
            const key = urlParams['keys'];
            if (key) {
                const currentData = getRadioData();
                const myData = currentData[key];
                if (myData) {
                    if (!myData.includes('http')) {
                        if (myData == "kbs_lib") {
                            getkbs(key).then(data => {
                                if (data !== 'invalid') return_pipe(data, resp, req, key);
                                else resp.end('Error');
                            });
                        } else if (myData == "sbs_lib") {
                            getsbs(key).then(data => {
                                if (data !== 'invalid') return_pipe(data, resp, req, key);
                                else resp.end('Error');
                            });
                        } else if (myData == "mbc_lib") {
                            getmbc(key).then(data => {
                                if (data !== 'invalid') return_pipe(data, resp, req, key);
                                else resp.end('Error');
                            });
                        }
                    } else {
                        return_pipe(myData, resp, req, key);
                    }
                } else {
                    resp.end('Key not found');
                }
            }
        } else {
            resp.end('Forbidden');
        }
    } else if (urlPath == "/") {
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
            resp.end("UI Loading Error");
        }
    }
});

// 방송국 API 파싱 함수들 (getkbs, getmbc, getsbs)은 기존 코드를 그대로 아래에 붙여넣으시면 됩니다.

liveServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});

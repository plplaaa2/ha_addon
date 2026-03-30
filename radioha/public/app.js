const API_TOKEN = 'homeassistant';

let selectedStation = null;
let audioPlayer = document.getElementById('radioPlayer');
let currentStatusSpan = document.getElementById('status');
let currentStationSpan = document.getElementById('currentStation');
let bitrateSelect = document.getElementById('bitrate');

// 기본값 128kbps로 설정
bitrateSelect.value = '2';

// Radio station buttons
document.querySelectorAll('.radio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        selectedStation = btn.dataset.key;
        currentStationSpan.textContent = btn.querySelector('.station').textContent;
        currentStatusSpan.textContent = '선택됨';
    });
});

// Play button
document.getElementById('playBtn').addEventListener('click', () => {
    if (!selectedStation) {
        alert('방송국을 선택해주세요');
        return;
    }

    const bitrate = bitrateSelect.value;
    const streamUrl = `/radio?token=${API_TOKEN}&keys=${selectedStation}&atype=${bitrate}`;
    
    audioPlayer.src = streamUrl;
    audioPlayer.play();
    currentStatusSpan.textContent = '▶️ 재생중...';
});

// Stop button
document.getElementById('stopBtn').addEventListener('click', () => {
    audioPlayer.pause();
    audioPlayer.src = '';
    currentStatusSpan.textContent = '중지됨';
});

// Update status when audio plays/ends
audioPlayer.addEventListener('play', () => {
    currentStatusSpan.textContent = '▶️ 재생중...';
});

audioPlayer.addEventListener('pause', () => {
    currentStatusSpan.textContent = '일시정지';
});

audioPlayer.addEventListener('ended', () => {
    currentStatusSpan.textContent = '종료';
});

audioPlayer.addEventListener('error', (e) => {
    currentStatusSpan.textContent = '❌ 오류 발생';
    console.error('Stream error:', e);
});

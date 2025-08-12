document.addEventListener('DOMContentLoaded', () => {
    // 獲取 DOM 元素
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const markBtn = document.getElementById('mark-btn');
    const annotationInput = document.getElementById('annotation-input');
    const historyList = document.getElementById('history-list');
    const stopwatchBtn = document.getElementById('stopwatch-btn');
    const countdownBtn = document.getElementById('countdown-btn');
    const countdownSettings = document.getElementById('countdown-settings');
    const countdownMinutesInput = document.getElementById('countdown-minutes');
    const countdownSecondsInput = document.getElementById('countdown-seconds');
    const exportBtn = document.getElementById('export-btn');
    const timerContainer = document.querySelector('.timer-container');

    // 新增：音訊元素
    const alarmSound = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // 你可以換成自己的音效網址

    let timerInterval;
    let startTime = 0;
    let elapsedTime = 0;
    let isRunning = false;
    let historyRecords = [];
    let isStopwatchMode = true;
    
    // 更新時間顯示
    function updateTimeDisplay(ms) {
        let totalSeconds = Math.floor(ms / 1000);
        let h = Math.floor(totalSeconds / 3600);
        let m = Math.floor((totalSeconds % 3600) / 60);
        let s = totalSeconds % 60;

        hoursEl.textContent = String(h).padStart(2, '0');
        minutesEl.textContent = String(m).padStart(2, '0');
        secondsEl.textContent = String(s).padStart(2, '0');
    }

    // 碼錶計時邏輯
    function startStopwatch() {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            updateTimeDisplay(elapsedTime);
        }, 1000);
    }

    // 倒數計時邏輯 (已修改)
    function startCountdown() {
        let totalTimeInSeconds = (parseInt(countdownMinutesInput.value) || 0) * 60 + (parseInt(countdownSecondsInput.value) || 0);
        if (totalTimeInSeconds <= 0) {
            alert("請設定一個有效的倒數時間！");
            return;
        }

        let endTime = Date.now() + totalTimeInSeconds * 1000;
        timerInterval = setInterval(() => {
            let timeLeft = endTime - Date.now();
            if (timeLeft <= 0) {
                // 倒數結束，轉為碼錶、閃爍背景並播放提示音
                clearInterval(timerInterval);
                isRunning = true;
                startOvertimeStopwatch(Math.abs(timeLeft));
                startBlinking();
                playAlarm(); // 新增：播放提示音
                return;
            }
            updateTimeDisplay(timeLeft);
        }, 1000);
    }
    
    // 新增：倒數結束後的超時碼錶邏輯
    function startOvertimeStopwatch(overtimeMs) {
        let overtimeStartTime = Date.now() - overtimeMs;
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - overtimeStartTime;
            updateTimeDisplay(elapsedTime);
        }, 1000);
    }

    // 新增：背景閃爍函式
    function startBlinking() {
        timerContainer.classList.add('blink-bg');
    }
    
    // 新增：停止背景閃爍函式
    function stopBlinking() {
        timerContainer.classList.remove('blink-bg');
    }
    
    // 新增：播放提示音函式
    function playAlarm() {
        alarmSound.loop = true; // 設定音檔循環播放
        alarmSound.play();
    }
    
    // 新增：停止提示音函式
    function stopAlarm() {
        alarmSound.pause();
        alarmSound.currentTime = 0; // 重設音檔播放位置
    }

    // 開始按鈕點擊事件
    startBtn.addEventListener('click', () => {
        if (!isRunning) {
            isRunning = true;
            if (isStopwatchMode) {
                startStopwatch();
                markBtn.classList.remove('hidden');
            } else {
                startCountdown();
            }
            updateButtonState();
        }
    });

    // 暫停按鈕點擊事件 (已修改)
    pauseBtn.addEventListener('click', () => {
        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false;
            stopBlinking();
            stopAlarm(); // 新增：暫停時停止提示音
            updateButtonState();
        }
    });

    // 重設按鈕點擊事件 (已修改)
    resetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        isRunning = false;
        elapsedTime = 0;
        updateTimeDisplay(0);
        stopBlinking();
        stopAlarm(); // 新增：重設時停止提示音
        updateButtonState();
        if (!isStopwatchMode) {
            countdownMinutesInput.value = 0;
            countdownSecondsInput.value = 0;
        }
    });

    // 標記按鈕點擊事件
    markBtn.addEventListener('click', () => {
        if (isRunning && isStopwatchMode) {
            let annotation = annotationInput.value || `第 ${historyRecords.length + 1} 筆紀錄`;
            let recordTime = formatTime(elapsedTime);
            historyRecords.push({ time: recordTime, annotation: annotation });
            renderHistory();
            annotationInput.value = '';
            exportBtn.classList.remove('hidden');
        }
    });
    
    // 匯出紀錄按鈕點擊事件
    exportBtn.addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF時間,註記\n";
        historyRecords.forEach(record => {
            let row = `${record.time},"${record.annotation.replace(/"/g, '""')}"`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "計時紀錄.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // 切換模式 (已修改)
    stopwatchBtn.addEventListener('click', () => switchMode(true));
    countdownBtn.addEventListener('click', () => switchMode(false));

    function switchMode(isStopwatch) {
        if (isStopwatchMode === isStopwatch) return;

        isStopwatchMode = isStopwatch;
        clearInterval(timerInterval);
        isRunning = false;
        elapsedTime = 0;
        updateTimeDisplay(0);
        stopBlinking();
        stopAlarm(); // 新增：切換模式時停止提示音
        updateButtonState();

        stopwatchBtn.classList.toggle('active', isStopwatch);
        countdownBtn.classList.toggle('active', !isStopwatch);
        countdownSettings.classList.toggle('hidden', isStopwatch);
        markBtn.classList.toggle('hidden', !isStopwatch);
        annotationInput.placeholder = isStopwatch ? '在這裡加註記...' : '正在進行的事項...';
    }

    // 更新按鈕狀態
    function updateButtonState() {
        startBtn.classList.toggle('hidden', isRunning);
        pauseBtn.classList.toggle('hidden', !isRunning);
        markBtn.classList.toggle('hidden', !isStopwatchMode || !isRunning);
    }

    // 渲染歷史紀錄列表
    function renderHistory() {
        historyList.innerHTML = '';
        historyRecords.forEach(record => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${record.time}</span> - <span>${record.annotation}</span>`;
            historyList.appendChild(li);
        });
    }

    // 將毫秒轉換為 hh:mm:ss 格式
    function formatTime(ms) {
        let totalSeconds = Math.floor(ms / 1000);
        let h = Math.floor(totalSeconds / 3600);
        let m = Math.floor((totalSeconds % 3600) / 60);
        let s = totalSeconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // 初始化時，碼錶模式為預設
    updateButtonState();
});
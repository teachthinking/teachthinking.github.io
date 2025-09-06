// app.js

import { loadData } from './dataLoader.js';

// 全局數據緩存
let data = {};

// UI 元素
const targetSelection = document.getElementById('target-selection');
const divinationMode = document.getElementById('divination-mode');
const targetDetails = document.getElementById('target-details');
const resultSection = document.getElementById('result-section');
const startBtn = document.getElementById('start-divination-btn');

// 初始化函式
async function initializeApp() {
    try {
        // 載入所有 JSON 數據
        const [trigrams, fiveElements, properties, seasonal, directions] = await Promise.all([
            loadData('trigrams.json'),
            loadData('five_elements_relations.json'),
            loadData('trigram_properties.json'),
            loadData('seasonal_strength.json'),
            loadData('directions.json')
        ]);
        data = { trigrams, fiveElements, properties, seasonal, directions };

        // 填充手動輸入的下拉選單
        const trigramSelects = ['manual-upper-gua', 'manual-lower-gua'];
        trigramSelects.forEach(id => {
            const select = document.getElementById(id);
            for (let num in trigrams) {
                const option = document.createElement('option');
                option.value = num;
                option.textContent = `${trigrams[num].name} (${trigrams[num].symbol})`;
                select.appendChild(option);
            }
        });
        const yaoSelect = document.getElementById('manual-changing-yao');
        for (let i = 1; i <= 6; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `第 ${i} 爻`;
            yaoSelect.appendChild(option);
        }

        // 設置當前日期與時間
        const today = new Date();
        document.getElementById('divination-date').valueAsDate = today;
        const currentHour = today.getHours();
        const hourOptions = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        const hourSelect = document.getElementById('divination-hour');
        hourOptions.forEach((hour, index) => {
            const option = document.createElement('option');
            option.value = index + 1; // 子為1, 丑為2...
            option.textContent = hour;
            hourSelect.appendChild(option);
        });
        // 根據當前時間選擇最近的時辰
        // 此處邏輯可簡化為直接設定時辰
        hourSelect.value = Math.floor((currentHour + 1) / 2) % 12 + 1;

        console.log('所有數據已載入並初始化完成。');
    } catch (error) {
        console.error('應用程式初始化失敗：', error);
        // 在 UI 上顯示錯誤訊息
    }
}

// 事件監聽器
document.getElementById('target-selection').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        document.querySelectorAll('#target-selection button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        const isItem = e.target.id === 'btn-lost-item';
        document.getElementById('form-lost-item').classList.toggle('active', isItem);
        document.getElementById('form-lost-person').classList.toggle('active', !isItem);
        document.getElementById('target-clues-title').textContent = isItem ? '物品特徵線索' : '人物特徵線索';
    }
});

document.getElementById('divination-mode').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`content-${e.target.id.split('-')[1]}`).classList.add('active');
    }
});

startBtn.addEventListener('click', () => {
    // 1. 收集所有使用者輸入
    const divinationType = document.querySelector('.tab.active').id.split('-')[1];
    let hexagramData;

    try {
        if (divinationType === 'time') {
            const date = new Date(document.getElementById('divination-date').value);
            const hour = parseInt(document.getElementById('divination-hour').value);
            hexagramData = calculateHexagramsFromTime(date, hour);
        } else if (divinationType === 'number') {
            const num1 = parseInt(document.getElementById('num1').value);
            const num2 = parseInt(document.getElementById('num2').value);
            const num3 = parseInt(document.getElementById('num3').value);
            hexagramData = calculateHexagramsFromNumbers(num1, num2, num3);
        } else { // manual
            const upperGua = parseInt(document.getElementById('manual-upper-gua').value);
            const lowerGua = parseInt(document.getElementById('manual-lower-gua').value);
            const changingYao = parseInt(document.getElementById('manual-changing-yao').value);
            hexagramData = { upperGua, lowerGua, changingYao };
        }

        // 2. 執行梅花易數解卦邏輯
        const interpretedResult = interpretHexagram(hexagramData);

        // 3. 顯示結果
        renderResult(interpretedResult);

    } catch (e) {
        alert('請檢查您的輸入是否正確：' + e.message);
        console.error(e);
    }
});

// ======================
// 核心邏輯函數
// ======================

function calculateHexagramsFromTime(date, hour) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const upperGuaSum = (year + month + day);
    const lowerGuaSum = upperGuaSum + hour;
    const changingYaoSum = lowerGuaSum;

    const upperGua = (upperGuaSum - 1) % 8 + 1;
    const lowerGua = (lowerGuaSum - 1) % 8 + 1;
    const changingYao = (changingYaoSum - 1) % 6 + 1;

    return { upperGua, lowerGua, changingYao };
}

function calculateHexagramsFromNumbers(n1, n2, n3) {
    const upperGua = (n1 - 1) % 8 + 1;
    const lowerGua = (n2 - 1) % 8 + 1;
    const changingYao = (n3 - 1) % 6 + 1;
    return { upperGua, lowerGua, changingYao };
}

function interpretHexagram(hexagramData) {
    const { upperGua, lowerGua, changingYao } = hexagramData;

    // 1. 獲取卦象詳細資料
    const upperGuaDetails = data.trigrams[upperGua];
    const lowerGuaDetails = data.trigrams[lowerGua];

    // 2. 判斷體卦與用卦
    const isLostItem = document.getElementById('btn-lost-item').classList.contains('active');
    const [bodyGua, utilityGua] = determineBodyUtility(upperGua, lowerGua, changingYao, isLostItem);

    // 3. 體用關係吉凶判斷
    const bodyFiveElement = data.trigrams[bodyGua].five_element;
    const utilityFiveElement = data.trigrams[utilityGua].five_element;
    const relationship = getFiveElementRelationship(bodyFiveElement, utilityFiveElement);
    
    let summaryText = `體卦為${data.trigrams[bodyGua].name}，用卦為${data.trigrams[utilityGua].name}。`;
    if (relationship === '相生') {
        summaryText += '用生體，吉象。易於尋得，且有貴人相助。';
    } else if (relationship === '相剋') {
        summaryText += '用剋體，凶象。尋找困難，恐已遭損。';
    } else if (relationship === '比和') {
        summaryText += '體用比和，吉象。失物未丟失，只是放置在附近或熟悉的地方。';
    } else if (relationship === '體生用') {
        summaryText += '體生用，凶象。雖可尋回，但過程耗費心神，或已難以挽回。';
    } else if (relationship === '體剋用') {
        summaryText += '體剋用，吉象。雖過程曲折，但終能尋回。';
    }
    
    // 4. 方位與線索判斷 (簡化示例)
    const directionText = data.directions[data.trigrams[utilityGua].name];
    const locationClues = data.trigram_properties[data.trigrams[utilityGua].name]['尋物線索'];
    const personClues = data.trigram_properties[data.trigrams[utilityGua].name]['尋人線索'];

    // 5. 應期預測 (簡化示例)
    let timingText = '應期可參考動爻所屬之卦、或與體用相剋之期。';

    return {
        mainGua: `${upperGuaDetails.name}${lowerGuaDetails.name}`,
        mainGuaSymbol: `${upperGuaDetails.symbol}<br>${lowerGuaDetails.symbol}`,
        summary: summaryText,
        direction: directionText,
        locationClues: locationClues,
        personClues: personClues,
        timing: timingText
    };
}

function determineBodyUtility(upperGua, lowerGua, changingYao, isLostItem) {
    if (changingYao % 3 === 1 || changingYao % 3 === 2 || changingYao % 3 === 0) {
        // 動爻在下卦 (1, 2, 3)
        // 尋物以失物所屬卦為體，人物以被尋者所屬卦為體
        // 這裡簡化為以下卦為用，上卦為體
        return [upperGua, lowerGua];
    } else {
        // 動爻在上卦 (4, 5, 6)
        // 這裡簡化為以下卦為體，上卦為用
        return [lowerGua, upperGua];
    }
}

function getFiveElementRelationship(bodyElement, utilityElement) {
    const relations = data.fiveElements;
    if (relations.相生[utilityElement] === bodyElement) return '相生';
    if (relations.相剋[utilityElement] === bodyElement) return '相剋';
    if (bodyElement === utilityElement) return '比和';
    if (relations.相生[bodyElement] === utilityElement) return '體生用';
    if (relations.相剋[bodyElement] === utilityElement) return '體剋用';
    return '未知';
}

function renderResult(result) {
    document.getElementById('main-gua-name').textContent = result.mainGua;
    document.getElementById('main-gua-symbol').innerHTML = result.mainGuaSymbol;
    document.getElementById('summary-text').textContent = result.summary;
    document.getElementById('direction-text').textContent = result.direction;
    document.getElementById('location-clues').textContent = result.locationClues;

    const isLostItem = document.getElementById('btn-lost-item').classList.contains('active');
    document.getElementById('target-clues-title').textContent = isLostItem ? '物品特徵線索' : '人物特徵線索';
    document.getElementById('target-clues-text').textContent = isLostItem ? result.itemClues : result.personClues;
    
    document.getElementById('timing-text').textContent = result.timing;

    resultSection.classList.remove('hidden');
    resultSection.style.opacity = 1;
}


// 啟動應用
document.addEventListener('DOMContentLoaded', initializeApp);


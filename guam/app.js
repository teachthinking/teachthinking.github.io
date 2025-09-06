// app.js

// 內嵌所有靜態數據
const DATA = {
    trigrams: {
        "1": { "name": "乾", "symbol": "☰", "five_element": "金", "先天數": 1 },
        "2": { "name": "兌", "symbol": "☱", "five_element": "金", "先天數": 2 },
        "3": { "name": "離", "symbol": "☲", "five_element": "火", "先天數": 3 },
        "4": { "name": "震", "symbol": "☳", "five_element": "木", "先天數": 4 },
        "5": { "name": "巽", "symbol": "☴", "five_element": "木", "先天數": 5 },
        "6": { "name": "坎", "symbol": "☵", "five_element": "水", "先天數": 6 },
        "7": { "name": "艮", "symbol": "☶", "five_element": "土", "先天數": 7 },
        "8": { "name": "坤", "symbol": "☷", "five_element": "土", "先天數": 8 }
    },
    // 卦象的二進制表示，用於互卦和變卦計算
    guaBinary: {
        "乾": "111", "兌": "110", "離": "101", "震": "100",
        "巽": "011", "坎": "010", "艮": "001", "坤": "000"
    },
    // 反向映射，用於從二進制找卦名
    binaryGua: {
        "111": "乾", "110": "兌", "101": "離", "100": "震",
        "011": "巽", "010": "坎", "001": "艮", "000": "坤"
    },
    fiveElements: {
        "相生": { "金": "水", "水": "木", "木": "火", "火": "土", "土": "金" },
        "相剋": { "金": "木", "木": "土", "土": "水", "水": "火", "火": "金" }
    },
    properties: {
        "乾": {
            "尋物線索": "位於**西北方**、**高處**、**圓形**物品中，或與**金屬**、**貴重**物品相關。",
            "尋人線索": "在**西北方**。該人為**長者**、**父親**，或為**官員**、**領導**等剛健之士。"
        },
        "坤": {
            "尋物線索": "位於**西南方**、**平坦處**、**田野**或**倉庫**中，或與**泥土**、**方形**、**柔順**物品相關。",
            "尋人線索": "在**西南方**。該人為**母親**、**老婦**，或為**農夫**、**大腹**、**身材矮胖**、性情柔順之人。"
        },
        "震": {
            "尋物線索": "位於**東方**、**鬧市**或**有聲響**之處，或與**木質**、**竹製品**相關，可能是**新物件**。",
            "尋人線索": "在**東方**。該人為**長男**、**少年**，或為**好動**、**性急**、**衝動**之人。"
        },
        "巽": {
            "尋物線索": "位於**東南方**、**林木**或**草地**中，或與**繩索**、**文書**、**長條形**物品相關。",
            "尋人線索": "在**東南方**。該人為**長女**、**少女**，或為**僧尼**、**文靜**、**柔和**之人。"
        },
        "坎": {
            "尋物線索": "位於**北方**、**水邊**、**陰暗潮濕**之處，或與**水**、**帶核**、**油膩**物品相關。",
            "尋人線索": "在**北方**。該人為**中男**，或為**盜賊**、**漁夫**、**水手**，**性情險惡**或**外表陰沉**之人。"
        },
        "離": {
            "尋物線索": "位於**南方**、**明亮**、**乾燥**之處，或與**火**、**文書**、**電子產品**、**紅色**物品相關。",
            "尋人線索": "在**南方**。該人為**中女**，或為**文人**，**性情急躁**、**聰慧**、**美麗**、**雙眼有特徵**之人。"
        },
        "艮": {
            "尋物線索": "位於**東北方**、**山地**或**門口**、**小路**旁，或與**石頭**、**硬物**相關。",
            "尋人線索": "在**東北方**。該人為**少男**、**童子**，或為**性情沉穩**、**不動**，或**身材矮小**、**背部有特徵**之人。"
        },
        "兌": {
            "尋物線索": "位於**西方**、**水澤**或**窪地**，或與**金屬**、**有缺口**、**白色**物品相關。",
            "尋人線索": "在**西方**。該人為**少女**，或為**巫師**、**說客**、**口才出眾**之人。"
        }
    },
    directions: {
        "乾": "西北方", "坤": "西南方", "震": "東方", "巽": "東南方",
        "坎": "北方", "離": "南方", "艮": "東北方", "兌": "西方"
    }
};

// UI 元素
const targetSelection = document.getElementById('target-selection');
const divinationMode = document.getElementById('divination-mode');
const resultSection = document.getElementById('result-section');
const startBtn = document.getElementById('start-divination-btn');

// 初始化函式
function initializeApp() {
    // 填充手動輸入的下拉選單
    const trigramSelects = ['manual-upper-gua', 'manual-lower-gua'];
    trigramSelects.forEach(id => {
        const select = document.getElementById(id);
        for (let num in DATA.trigrams) {
            const option = document.createElement('option');
            option.value = num;
            option.textContent = `${DATA.trigrams[num].name} (${DATA.trigrams[num].symbol})`;
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
        option.value = index + 1;
        option.textContent = hour;
        hourSelect.appendChild(option);
    });
    // 根據當前時間選擇最近的時辰
    hourSelect.value = Math.floor((currentHour + 1) / 2) % 12 + 1;
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

        const interpretedResult = interpretHexagram(hexagramData);
        renderResult(interpretedResult);

    } catch (e) {
        alert('請檢查您的輸入是否正確：' + e.message);
        console.error(e);
    }
});

// ======================
// 核心邏輯函數
// ======================

// 轉換公曆為農曆 (這裡使用一個簡化的、不精確的示範)
// 註: 實際應用需要完整的農曆轉換庫，這裡僅為示範
function toLunar(date) {
    const lunarMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const lunarDays = Array.from({ length: 30 }, (_, i) => i + 1);
    
    const month = date.getMonth();
    const day = date.getDate();
    
    // 這裡的轉換是純粹的示範，無法處理閏月和大小月，僅供演示
    return {
        month: (month % 12) + 1, // 簡化處理
        day: (day % 30) + 1 // 簡化處理
    };
}

function calculateHexagramsFromTime(date, hour) {
    const lunar = toLunar(date);
    const lunarMonth = lunar.month;
    const lunarDay = lunar.day;
    
    // 梅花易數時間起卦法則：
    // 上卦 = (年 + 月 + 日) % 8
    // 下卦 = (年 + 月 + 日 + 時辰) % 8
    // 動爻 = (年 + 月 + 日 + 時辰) % 6
    // 這裡我們只用農曆月、日、時辰，符合梅花易數的簡化法則
    
    const upperGua = (lunarMonth - 1) % 8 + 1;
    const lowerGua = (lunarDay - 1) % 8 + 1;
    const changingYao = (hour + lunarDay - 1) % 6 + 1; // 簡化：時辰加農曆日
    
    return { upperGua, lowerGua, changingYao };
}

function calculateHexagramsFromNumbers(n1, n2, n3) {
    if (isNaN(n1) || isNaN(n2) || isNaN(n3) || n1 <= 0 || n2 <= 0 || n3 <= 0) {
        throw new Error('請輸入有效的三個數字。');
    }
    const upperGua = (n1 - 1) % 8 + 1;
    const lowerGua = (n2 - 1) % 8 + 1;
    const changingYao = (n3 - 1) % 6 + 1;
    return { upperGua, lowerGua, changingYao };
}

// 根據八卦編號和動爻，返回完整的六爻二進制字串
function getHexagramBinary(upperGua, lowerGua) {
    const upperName = DATA.trigrams[upperGua].name;
    const lowerName = DATA.trigrams[lowerGua].name;
    const upperBinary = DATA.guaBinary[upperName];
    const lowerBinary = DATA.guaBinary[lowerName];
    return upperBinary + lowerBinary;
}

// 根據六爻二進制字串計算互卦
function getMutualGua(hexagramBinary) {
    const mutualUpperBinary = hexagramBinary.substring(1, 4);
    const mutualLowerBinary = hexagramBinary.substring(2, 5);
    
    const mutualUpperName = DATA.binaryGua[mutualUpperBinary];
    const mutualLowerName = DATA.binaryGua[mutualLowerBinary];
    
    const mutualUpperGua = Object.keys(DATA.trigrams).find(key => DATA.trigrams[key].name === mutualUpperName);
    const mutualLowerGua = Object.keys(DATA.trigrams).find(key => DATA.trigrams[key].name === mutualLowerName);

    return { upperGua: mutualUpperGua, lowerGua: mutualLowerGua };
}

// 根據六爻二進制字串和動爻計算變卦
function getChangingGua(hexagramBinary, changingYao) {
    const yaoIndex = changingYao - 1;
    const currentYao = hexagramBinary.charAt(yaoIndex);
    const newYao = currentYao === '1' ? '0' : '1';
    
    const changingBinary = hexagramBinary.substring(0, yaoIndex) + newYao + hexagramBinary.substring(yaoIndex + 1);
    
    const changingUpperBinary = changingBinary.substring(0, 3);
    const changingLowerBinary = changingBinary.substring(3, 6);
    
    const changingUpperName = DATA.binaryGua[changingUpperBinary];
    const changingLowerName = DATA.binaryGua[changingLowerBinary];
    
    const changingUpperGua = Object.keys(DATA.trigrams).find(key => DATA.trigrams[key].name === changingUpperName);
    const changingLowerGua = Object.keys(DATA.trigrams).find(key => DATA.trigrams[key].name === changingLowerName);

    return { upperGua: changingUpperGua, lowerGua: changingLowerGua };
}

function interpretHexagram(hexagramData) {
    const { upperGua, lowerGua, changingYao } = hexagramData;

    // 1. 獲取本卦、互卦、變卦的詳細資料
    const mainGuaName = DATA.trigrams[upperGua].name + DATA.trigrams[lowerGua].name;
    const mainGuaSymbol = `${DATA.trigrams[upperGua].symbol}<br>${DATA.trigrams[lowerGua].symbol}`;
    
    // 完整的六爻二進制
    const hexagramBinary = getHexagramBinary(upperGua, lowerGua);
    
    // 2. 互卦與變卦計算（正確版本）
    const mutualGua = getMutualGua(hexagramBinary);
    const mutualGuaName = DATA.trigrams[mutualGua.upperGua].name + DATA.trigrams[mutualGua.lowerGua].name;
    const mutualGuaSymbol = `${DATA.trigrams[mutualGua.upperGua].symbol}<br>${DATA.trigrams[mutualGua.lowerGua].symbol}`;
    
    const changingGua = getChangingGua(hexagramBinary, changingYao);
    const changingGuaName = DATA.trigrams[changingGua.upperGua].name + DATA.trigrams[changingGua.lowerGua].name;
    const changingGuaSymbol = `${DATA.trigrams[changingGua.upperGua].symbol}<br>${DATA.trigrams[changingGua.lowerGua].symbol}`;

    // 3. 體用卦的精確判斷
    let bodyGuaNum, utilityGuaNum;
    if (changingYao <= 3) {
        // 動爻在下卦，則下卦為用，上卦為體
        bodyGuaNum = upperGua;
        utilityGuaNum = lowerGua;
    } else {
        // 動爻在上卦，則上卦為用，下卦為體
        bodyGuaNum = lowerGua;
        utilityGuaNum = upperGua;
    }
    // 註：這與《梅花易數》中以「體應」判斷體用不同，這裡遵循用戶的明確要求。

    // 4. 體用關係吉凶判斷
    const bodyFiveElement = DATA.trigrams[bodyGuaNum].five_element;
    const utilityFiveElement = DATA.trigrams[utilityGuaNum].five_element;
    const relationship = getFiveElementRelationship(bodyFiveElement, utilityFiveElement);
    
    let summaryText = `體卦為**${DATA.trigrams[bodyGuaNum].name}**，用卦為**${DATA.trigrams[utilityGuaNum].name}**。`;
    if (relationship === '相生') {
        summaryText += '用卦生體卦，吉象。易於尋得，且有貴人相助。';
    } else if (relationship === '相剋') {
        summaryText += '用卦剋體卦，凶象。尋找困難，恐已遭損。';
    } else if (relationship === '比和') {
        summaryText += '體用卦比和，吉象。失物未丟失，只是放置在附近或熟悉的地方。';
    } else if (relationship === '體生用') {
        summaryText += '體卦生用卦，凶象。雖可尋回，但過程耗費心神，或已難以挽回。';
    } else if (relationship === '體剋用') {
        summaryText += '體卦剋用卦，吉象。雖過程曲折，但終能尋回。';
    }
    
    // 5. 方位與線索判斷
    const directionText = `主要尋找方位為**${DATA.directions[DATA.trigrams[utilityGuaNum].name]}**。`;
    const locationClues = `${DATA.properties[DATA.trigrams[utilityGuaNum].name]['尋物線索']}`;
    const personClues = `${DATA.properties[DATA.trigrams[utilityGuaNum].name]['尋人線索']}`;

    // 6. 應期預測 (簡化示例)
    let timingText = '應期可參考動爻所屬之卦、或與體用相剋之期。';

    return {
        mainGuaName, mainGuaSymbol,
        mutualGuaName, mutualGuaSymbol,
        changingGuaName, changingGuaSymbol,
        summary: summaryText,
        direction: directionText,
        locationClues,
        personClues,
        timing: timingText
    };
}

function getFiveElementRelationship(bodyElement, utilityElement) {
    const relations = DATA.fiveElements;
    if (relations.相生[utilityElement] === bodyElement) return '相生';
    if (relations.相剋[utilityElement] === bodyElement) return '相剋';
    if (bodyElement === utilityElement) return '比和';
    if (relations.相生[bodyElement] === utilityElement) return '體生用';
    if (relations.相剋[bodyElement] === utilityElement) return '體剋用';
    return '未知';
}

function renderResult(result) {
    document.getElementById('main-gua-name').textContent = result.mainGuaName;
    document.getElementById('main-gua-symbol').innerHTML = result.mainGuaSymbol;
    document.getElementById('mutual-gua-name').textContent = result.mutualGuaName;
    document.getElementById('mutual-gua-symbol').innerHTML = result.mutualGuaSymbol;
    document.getElementById('changing-gua-name').textContent = result.changingGuaName;
    document.getElementById('changing-gua-symbol').innerHTML = result.changingGuaSymbol;

    document.getElementById('summary-text').innerHTML = result.summary;
    document.getElementById('direction-text').innerHTML = result.direction;
    
    const isLostItem = document.getElementById('btn-lost-item').classList.contains('active');
    document.getElementById('target-clues-title').textContent = isLostItem ? '物品特徵線索' : '人物特徵線索';
    document.getElementById('location-clues').innerHTML = result.locationClues;
    document.getElementById('target-clues-text').innerHTML = isLostItem ? result.locationClues : result.personClues;
    
    document.getElementById('timing-text').innerHTML = result.timing;
    // ... 外應解讀等可在此處添加

    resultSection.classList.remove('hidden');
    resultSection.style.opacity = 1;
}

// 啟動應用
document.addEventListener('DOMContentLoaded', initializeApp);

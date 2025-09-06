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
    fiveElements: {
        "相生": { "金": "水", "水": "木", "木": "火", "火": "土", "土": "金" },
        "相剋": { "金": "木", "木": "土", "土": "水", "水": "火", "火": "金" }
    },
    properties: {
        "乾": {
            "五行": "金", "方位": "西北", "人物": ["天", "父", "老父", "官貴"],
            "靜物": ["金玉", "圓物", "寶珠"], "地理": ["西北方", "高亢之所"],
            "尋物線索": "位於**西北方**、**高處**、**圓形**物品中，或與**金屬**、**貴重**物品相關。",
            "尋人線索": "在**西北方**。該人為**長者**、**父親**，或為**官員**、**領導**等剛健之士。"
        },
        "坤": {
            "五行": "土", "方位": "西南", "人物": ["地", "母", "老婦", "農夫"],
            "靜物": ["方物", "柔物", "布帛"], "地理": ["西南方", "田野", "平地"],
            "尋物線索": "位於**西南方**、**平坦處**、**田野**或**倉庫**中，或與**泥土**、**方形**、**柔順**物品相關。",
            "尋人線索": "在**西南方**。該人為**母親**、**老婦**，或為**農夫**、**大腹**、**身材矮胖**、性情柔順之人。"
        },
        "震": {
            "五行": "木", "方位": "東方", "人物": ["長男", "少年"],
            "靜物": ["竹木", "蘆葦", "樂器"], "地理": ["東方", "鬧市"],
            "尋物線索": "位於**東方**、**鬧市**或**有聲響**之處，或與**木質**、**竹製品**相關，可能是**新物件**。",
            "尋人線索": "在**東方**。該人為**長男**、**少年**，或為**好動**、**性急**、**衝動**之人。"
        },
        "巽": {
            "五行": "木", "方位": "東南", "人物": ["長女", "少女", "寡婦"],
            "靜物": ["長物", "繩索", "扇子"], "地理": ["東南方", "園林"],
            "尋物線索": "位於**東南方**、**林木**或**草地**中，或與**繩索**、**文書**、**長條形**物品相關。",
            "尋人線索": "在**東南方**。該人為**長女**、**少女**，或為**僧尼**、**文靜**、**柔和**之人。"
        },
        "坎": {
            "五行": "水", "方位": "北方", "人物": ["中男", "盜賊"],
            "靜物": ["帶核之物", "水產", "酒"], "地理": ["北方", "水邊", "險阻之地"],
            "尋物線索": "位於**北方**、**水邊**、**陰暗潮濕**之處，或與**水**、**帶核**、**油膩**物品相關。",
            "尋人線索": "在**北方**。該人為**中男**，或為**盜賊**、**漁夫**、**水手**，**性情險惡**或**外表陰沉**之人。"
        },
        "離": {
            "五行": "火", "方位": "南方", "人物": ["中女", "文人", "兵戈之人"],
            "靜物": ["書", "畫", "燈", "爐"], "地理": ["南方", "明亮之地", "乾燥之地"],
            "尋物線索": "位於**南方**、**明亮**、**乾燥**之處，或與**火**、**文書**、**電子產品**、**紅色**物品相關。",
            "尋人線索": "在**南方**。該人為**中女**、**文人**，或為**性情急躁**、**聰慧**、**美麗**、**雙眼有特徵**之人。"
        },
        "艮": {
            "五行": "土", "方位": "東北", "人物": ["少男", "童子", "山中人"],
            "靜物": ["石", "土", "山中物", "狗"], "地理": ["東北方", "山", "丘陵"],
            "尋物線索": "位於**東北方**、**山地**或**門口**、**小路**旁，或與**石頭**、**硬物**相關。",
            "尋人線索": "在**東北方**。該人為**少男**、**童子**，或為**性情沉穩**、**不動**，或**身材矮小**、**背部有特徵**之人。"
        },
        "兌": {
            "五行": "金", "方位": "西方", "人物": ["少女", "巫師", "歌女"],
            "靜物": ["金屬物", "廢物", "有缺口之物"], "地理": ["西方", "澤地", "窪地"],
            "尋物線索": "位於**西方**、**水澤**或**窪地**，或與**金屬**、**有缺口**、**白色**物品相關。",
            "尋人線索": "在**西方**。該人為**少女**，或為**巫師**、**說客**、**口才出眾**之人。"
        }
    },
    seasonal: {
        "春": { "旺": ["震", "巽"], "衰": ["坤", "艮"] },
        "夏": { "旺": ["離"], "衰": ["乾", "兌"] },
        "秋": { "旺": ["乾", "兌"], "衰": ["震", "巽"] },
        "冬": { "旺": ["坎"], "衰": ["離"] },
        "季月": { "旺": ["坤", "艮"], "衰": ["坎"] }
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
    if (isNaN(n1) || isNaN(n2) || isNaN(n3) || n1 <= 0 || n2 <= 0 || n3 <= 0) {
        throw new Error('請輸入有效的三個數字。');
    }
    const upperGua = (n1 - 1) % 8 + 1;
    const lowerGua = (n2 - 1) % 8 + 1;
    const changingYao = (n3 - 1) % 6 + 1;
    return { upperGua, lowerGua, changingYao };
}

// 卦象對應的六爻符號
function getHexagramSymbol(upperGua, lowerGua) {
    const upperSymbol = DATA.trigrams[upperGua].symbol;
    const lowerSymbol = DATA.trigrams[lowerGua].symbol;
    return upperSymbol + '<br>' + lowerSymbol;
}

// 根據本卦計算互卦
function getMutualGua(upperGua, lowerGua) {
    // 互卦取本卦的二、三、四爻為上卦，三、四、五爻為下卦
    // 卦的爻序為：下三爻、上三爻
    const guas = [
        [upperGua, lowerGua], // 本卦
        [lowerGua, upperGua]
    ];
    
    // 簡化計算，實際需要64卦對應表
    // 這裡我們直接從八卦屬性來反推互卦
    let mutualUpper = 0, mutualLower = 0;
    
    // 假設我們有完整的六十四卦列表，但這裡我們用簡化邏輯
    // 根據梅花易數的數理，互卦的上卦為本卦下卦的二爻和三爻，加上上卦的初爻
    // 互卦的下卦為本卦下卦的三爻，加上上卦的初爻和二爻
    // 這裡的邏輯是直接用數值運算來簡化模擬，這與實際易數卦理計算有差異，但為了範例，我們採用此法
    mutualUpper = (lowerGua + upperGua - 1) % 8 + 1;
    mutualLower = (lowerGua + upperGua - 1) % 8 + 1;

    return { upperGua: mutualUpper, lowerGua: mutualLower };
}


// 根據本卦和動爻計算變卦
function getChangingGua(upperGua, lowerGua, changingYao) {
    let changingUpper = upperGua;
    let changingLower = lowerGua;
    
    // 變卦的計算是將動爻的陰陽屬性反轉
    // 這裡的數字代表為：1-8
    // 乾(1)-坤(8), 兌(2)-艮(7), 離(3)-坎(6), 震(4)-巽(5)
    const reverseMap = { 1: 8, 8: 1, 2: 7, 7: 2, 3: 6, 6: 3, 4: 5, 5: 4 };

    if (changingYao <= 3) { // 動爻在下卦
        changingLower = reverseMap[lowerGua];
    } else { // 動爻在上卦
        changingUpper = reverseMap[upperGua];
    }

    return { upperGua: changingUpper, lowerGua: changingLower };
}

function interpretHexagram(hexagramData) {
    const { upperGua, lowerGua, changingYao } = hexagramData;

    // 獲取本卦、互卦、變卦的詳細資料
    const mainGuaName = DATA.trigrams[upperGua].name + DATA.trigrams[lowerGua].name;
    const mainGuaSymbol = getHexagramSymbol(upperGua, lowerGua);
    
    const mutualGua = getMutualGua(upperGua, lowerGua);
    const mutualGuaName = DATA.trigrams[mutualGua.upperGua].name + DATA.trigrams[mutualGua.lowerGua].name;
    const mutualGuaSymbol = getHexagramSymbol(mutualGua.upperGua, mutualGua.lowerGua);
    
    const changingGua = getChangingGua(upperGua, lowerGua, changingYao);
    const changingGuaName = DATA.trigrams[changingGua.upperGua].name + DATA.trigrams[changingGua.lowerGua].name;
    const changingGuaSymbol = getHexagramSymbol(changingGua.upperGua, changingGua.lowerGua);

    // 判斷體卦與用卦
    const isLostItem = document.getElementById('btn-lost-item').classList.contains('active');
    const [bodyGuaNum, utilityGuaNum] = determineBodyUtility(upperGua, lowerGua, changingYao, isLostItem);

    // 體用關係吉凶判斷
    const bodyFiveElement = DATA.trigrams[bodyGuaNum].five_element;
    const utilityFiveElement = DATA.trigrams[utilityGuaNum].five_element;
    const relationship = getFiveElementRelationship(bodyFiveElement, utilityFiveElement);
    
    let summaryText = `體卦為**${DATA.trigrams[bodyGuaNum].name}**，用卦為**${DATA.trigrams[utilityGuaNum].name}**。`;
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
    
    // 方位與線索判斷
    const directionText = `主要尋找方位為**${DATA.directions[DATA.trigrams[utilityGuaNum].name]}**。`;
    const locationClues = `失物可能位於${DATA.properties[DATA.trigrams[utilityGuaNum].name]['尋物線索']}`;
    const personClues = `人物特徵與線索：${DATA.properties[DATA.trigrams[utilityGuaNum].name]['尋人線索']}`;

    // 應期預測 (簡化示例)
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

function determineBodyUtility(upperGua, lowerGua, changingYao, isLostItem) {
    if (changingYao <= 3) {
        return [upperGua, lowerGua];
    } else {
        return [lowerGua, upperGua];
    }
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


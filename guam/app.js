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
    // 根據當前時間選擇最近的時辰
    hourSelect.value = Math.floor((currentHour + 1) / 2) % 12 + 1;

    console.log('應用程式初始化完成，所有數據已內嵌。');
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
    const upperGuaDetails = DATA.trigrams[upperGua];
    const lowerGuaDetails = DATA.trigrams[lowerGua];

    // 2. 判斷體卦與用卦
    const isLostItem = document.getElementById('btn-lost-item').classList.contains('active');
    const [bodyGua, utilityGua] = determineBodyUtility(upperGua, lowerGua, changingYao, isLostItem);

    // 3. 體用關係吉凶判斷
    const bodyFiveElement = DATA.trigrams[bodyGua].five_element;
    const utilityFiveElement = DATA.trigrams[utilityGua].five_element;
    const relationship = getFiveElementRelationship(bodyFiveElement, utilityFiveElement);
    
    let summaryText = `體卦為${DATA.trigrams[bodyGua].name}，用卦為${DATA.trigrams[utilityGua].name}。`;
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
    const directionText = DATA.directions[DATA.trigrams[utilityGua].name];
    const locationClues = DATA.properties[DATA.trigrams[utilityGua].name]['尋物線索'];
    const personClues = DATA.properties[DATA.trigrams[utilityGua].name]['尋人線索'];

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
        // 這裡簡化為以下卦為用，上卦為體
        return [upperGua, lowerGua];
    } else {
        // 動爻在上卦 (4, 5, 6)
        // 這裡簡化為以下卦為體，上卦為用
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

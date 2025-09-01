// police_script.js

// 核心資料與變數
let hexagramData = {};
let currentCaseData = null;
let isUnsaved = false;

// DOM 元素引用
const dom = {
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    caseNameInput: document.getElementById('caseName'),
    calculateBtn: document.getElementById('calculateBtn'),
    upperGuaSelect: document.getElementById('upperGuaSelect'),
    lowerGuaSelect: document.getElementById('lowerGuaSelect'),
    changingLineManual: document.getElementById('changingLineManual'),
    numInput: document.getElementById('numInput'),
    caseTypeSelect: document.getElementById('caseTypeSelect'),
    jsonFile: document.getElementById('jsonFile'),
    jsonStatus: document.getElementById('jsonStatus'),
    resultArea: document.getElementById('resultArea'),
    guaResult: document.getElementById('guaResult'),
    caseProgress: document.getElementById('caseProgress'),
    suspectClues: document.getElementById('suspectClues'),
    auspice: document.getElementById('auspice'),
    notesSection: document.getElementById('caseNotes'),
    caseNotes: document.getElementById('caseNotes'),
    btnSave: document.getElementById('btn-save'),
    btnLoad: document.getElementById('btn-load'),
    btnExport: document.getElementById('btn-export'),
    btnImport: document.getElementById('btn-import'),
    btnImportFile: document.getElementById('importFile'),
    btnClear: document.getElementById('btn-clear'),
    historyModal: document.getElementById('historyModal'),
    historyList: document.getElementById('historyList'),
    closeModalBtn: document.querySelector('.modal .close-btn'),
    caseGraph: document.getElementById('caseGraph')
};

// 卦象資料和轉換工具函式
const numToGua = ['', '乾', '兌', '離', '震', '巽', '坎', '艮', '坤'];
const guaBinaryMap = {
    1: '111', // 乾
    2: '011', // 兌
    3: '101', // 離
    4: '001', // 震
    5: '110', // 巽
    6: '010', // 坎
    7: '100', // 艮
    8: '000'  // 坤
};
const binaryToNumMap = {
    '111': 1,
    '011': 2,
    '101': 3,
    '001': 4,
    '110': 5,
    '010': 6,
    '100': 7,
    '000': 8
};
const toBinary = num => guaBinaryMap[num] || '000';
const toDecimal = binaryStr => binaryToNumMap[binaryStr] || 8;

// 五行生克關係
const wuXingRelations = {
    '木': { sheng: '火', ke: '土', beiSheng: '水', beiKe: '金', biHe: '木' },
    '火': { sheng: '土', ke: '金', beiSheng: '木', beiKe: '水', biHe: '火' },
    '土': { sheng: '金', ke: '水', beiSheng: '火', beiKe: '木', biHe: '土' },
    '金': { sheng: '水', ke: '木', beiSheng: '土', beiKe: '火', biHe: '金' },
    '水': { sheng: '木', ke: '火', beiSheng: '金', beiKe: '土', biHe: '水' }
};

// 生克吉凶判斷
function getTiYongRelation(tiWuXing, yongWuXing) {
    if (!tiWuXing || !yongWuXing) return '未知';
    if (tiWuXing === yongWuXing) return '比和';
    if (wuXingRelations[tiWuXing].sheng === yongWuXing) return '體生用';
    if (wuXingRelations[tiWuXing].ke === yongWuXing) return '體剋用';
    if (wuXingRelations[tiWuXing].beiSheng === yongWuXing) return '用生體';
    if (wuXingRelations[tiWuXing].beiKe === yongWuXing) return '用剋體';
    return '無關係';
}

function getAuspice(tiYongRelation) {
    switch (tiYongRelation) {
        case '用生體':
            return '大吉：用卦生體卦，案件進展順利，易獲突破。';
        case '比和':
            return '吉：體用五行相同，案件穩定，進展順暢。';
        case '體剋用':
            return '次吉：體卦剋用卦，主動權在握，但需謹慎推進。';
        case '體生用':
            return '凶：體卦生用卦，力量耗損，需謹防阻力。';
        case '用剋體':
            return '大凶：用卦剋體卦，案件阻力大，需格外小心。';
        default:
            return '中平：體用無明顯生剋，宜穩健行事。';
    }
}

// 載入初始資料
async function loadInitialData() {
    try {
        const response = await fetch('police_data.json');
        if (!response.ok) {
            throw new Error('無法載入預設 JSON 檔案。');
        }
        hexagramData = await response.json();
        updateStatus('預設檔案');
        populateGuaSelects();
        populateCaseTypeSelect();
    } catch (error) {
        console.error('載入預設資料失敗:', error);
        updateStatus('載入失敗，請手動上傳檔案。');
    }
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            hexagramData = JSON.parse(e.target.result);
            updateStatus(`已載入「${file.name}」`);
            alert('已成功載入新的 JSON 檔案。');
            populateGuaSelects();
            populateCaseTypeSelect();
        } catch (error) {
            console.error('解析 JSON 檔案失敗:', error);
            alert('無效的 JSON 檔案，請檢查格式。');
            updateStatus('載入失敗，請檢查檔案格式。');
        }
    };
    reader.readAsText(file);
}

function updateStatus(message) {
    dom.jsonStatus.textContent = `* 目前使用的資料檔：${message}`;
}

function populateGuaSelects() {
    const gua = hexagramData.gua;
    if (!gua) return;
    
    [dom.upperGuaSelect, dom.lowerGuaSelect].forEach(select => {
        select.innerHTML = '<option value="">選擇卦象</option>';
        for (let i = 1; i <= 8; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = gua[i].name;
            select.appendChild(option);
        }
    });

    dom.changingLineManual.innerHTML = '<option value="">選擇動爻</option>';
    for (let i = 1; i <= 6; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `第${i}爻`;
        dom.changingLineManual.appendChild(option);
    }
}

function populateCaseTypeSelect() {
    const caseTypes = ['cyber_crime', 'organized_crime', 'missing_persons', 'traffic_accidents'];
    dom.caseTypeSelect.innerHTML = '<option value="">選擇案件類型 (選填)</option>';
    caseTypes.forEach(type => {
        if (hexagramData[type]) {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = hexagramData[type].name;
            dom.caseTypeSelect.appendChild(option);
        }
    });
}

// 計算卦象
function calculateGua(number) {
    return ((number % 8) === 0) ? 8 : (number % 8);
}

function calculateHexagram(upper, lower, changingLine) {
    const benGua = `${upper}_${lower}`;
    let bianGua = benGua;
    if (changingLine && changingLine >= 1 && changingLine <= 6) {
        const upperBinary = toBinary(upper);
        const lowerBinary = toBinary(lower);
        let fullBinary = (upperBinary + lowerBinary).split('');
        fullBinary[6 - changingLine] = fullBinary[6 - changingLine] === '1' ? '0' : '1';
        const newUpperBinary = fullBinary.slice(0, 3).join('');
        const newLowerBinary = fullBinary.slice(3).join('');
        const newUpper = toDecimal(newUpperBinary);
        const newLower = toDecimal(newLowerBinary);
        bianGua = `${newUpper}_${newLower}`;
    }
    return { benGua, bianGua };
}

function calculateTiYong(upper, lower, changingLine) {
    const isXiaGuaDong = changingLine >= 1 && changingLine <= 3;
    return {
        tiGua: isXiaGuaDong ? upper : lower,
        yongGua: isXiaGuaDong ? lower : upper,
        dongYaoPosition: changingLine
    };
}

// 五行生克圖
function createShengkeDiagram(data) {
    const svg = dom.caseGraph;
    svg.innerHTML = `
        <defs>
            <marker id="arrowhead-sheng" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#27ae60"/>
            </marker>
            <marker id="arrowhead-ke" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#e74c3c"/>
            </marker>
        </defs>
    `;
    
    const elements = ['木', '火', '土', '金', '水'];
    const centerX = 300;
    const centerY = 250;
    const radius = 150;
    const nodes = elements.map((el, i) => {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return { id: el, label: el, wuXing: el, x, y, guaLabels: [] };
    });

    Object.keys(data).forEach(key => {
        const guaData = data[key];
        const wuXing = guaData.wuXing;
        const node = nodes.find(n => n.wuXing === wuXing);
        if (node) {
            let label = '';
            if (key === 'ti') label = `體卦 (${guaData.name})`;
            else if (key === 'benShang') label = `本卦上 (${guaData.name})`;
            else if (key === 'benXia') label = `本卦下 (${guaData.name})`;
            else if (key === 'bianShang') label = `變卦上 (${guaData.name})`;
            else if (key === 'bianXia') label = `變卦下 (${guaData.name})`;
            if (label) node.guaLabels.push({ text: label });
        }
    });

    nodes.forEach(node => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.innerHTML = `
            <circle class="gua-node" cx="${node.x}" cy="${node.y}" r="40"/>
            <text class="gua-text" x="${node.x}" y="${node.y - 10}" text-anchor="middle">${node.label}</text>
            ${node.guaLabels.map((label, i) => `
                <text class="gua-text" x="${node.x}" y="${node.y + 10 + i * 15}" text-anchor="middle" font-size="10">${label.text}</text>
            `).join('')}
        `;
        svg.appendChild(g);
    });

    const shengRelations = [
        { from: '木', to: '火' }, { from: '火', to: '土' }, { from: '土', to: '金' },
        { from: '金', to: '水' }, { from: '水', to: '木' }
    ];
    const keRelations = [
        { from: '木', to: '土' }, { from: '火', to: '金' }, { from: '土', to: '水' },
        { from: '金', to: '木' }, { from: '水', to: '火' }
    ];

    shengRelations.forEach(rel => {
        const fromNode = nodes.find(n => n.id === rel.from);
        const toNode = nodes.find(n => n.id === rel.to);
        if (fromNode && toNode) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromNode.x);
            line.setAttribute('y1', fromNode.y);
            line.setAttribute('x2', toNode.x);
            line.setAttribute('y2', toNode.y);
            line.setAttribute('class', 'relation-line sheng');
            line.setAttribute('marker-end', 'url(#arrowhead-sheng)');
            svg.appendChild(line);
        }
    });

    keRelations.forEach(rel => {
        const fromNode = nodes.find(n => n.id === rel.from);
        const toNode = nodes.find(n => n.id === rel.to);
        if (fromNode && toNode) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromNode.x);
            line.setAttribute('y1', fromNode.y);
            line.setAttribute('x2', toNode.x);
            line.setAttribute('y2', toNode.y);
            line.setAttribute('class', 'relation-line ke');
            line.setAttribute('marker-end', 'url(#arrowhead-ke)');
            svg.appendChild(line);
        }
    });
}

// 推算邏輯
function startCalculation() {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    let upperGua, lowerGua, changingLine;

    if (activeTab === 'manual-tab') {
        upperGua = parseInt(dom.upperGuaSelect.value);
        lowerGua = parseInt(dom.lowerGuaSelect.value);
        changingLine = parseInt(dom.changingLineManual.value);
        if (!upperGua || !lowerGua || isNaN(changingLine) || changingLine < 1 || changingLine > 6) {
            alert('請選擇有效的上卦、下卦和動爻！');
            return;
        }
    } else if (activeTab === 'number-tab') {
        const numInput = dom.numInput.value;
        if (!numInput || numInput.length !== 9 || !/^\d+$/.test(numInput)) {
            alert('請輸入9位數數字！');
            return;
        }
        const num = parseInt(numInput);
        upperGua = calculateGua(num % 1000);
        lowerGua = calculateGua(Math.floor(num / 1000) % 1000);
        changingLine = calculateGua(num % 100) % 6 || 6;
    }

    const { benGua, bianGua } = calculateHexagram(upperGua, lowerGua, changingLine);
    const tiYong = calculateTiYong(upperGua, lowerGua, changingLine);
    const caseType = dom.caseTypeSelect.value;
    const caseName = dom.caseNameInput.value || '未命名案件';
    const notes = dom.notesSection.value;

    currentCaseData = {
        caseName,
        upperGua,
        lowerGua,
        changingLine,
        benGua,
        bianGua,
        tiGua: tiYong.tiGua,
        yongGua: tiYong.yongGua,
        caseType,
        notes,
        timestamp: new Date().toISOString()
    };

    displayResults(currentCaseData);
    createShengkeDiagram({
        benShang: { name: numToGua[upperGua], wuXing: hexagramData.gua[upperGua].element },
        benXia: { name: numToGua[lowerGua], wuXing: hexagramData.gua[lowerGua].element },
        ti: { name: numToGua[tiYong.tiGua], wuXing: hexagramData.gua[tiYong.tiGua].element },
        bianShang: { name: numToGua[parseInt(bianGua.split('_')[0])], wuXing: hexagramData.gua[parseInt(bianGua.split('_')[0])].element },
        bianXia: { name: numToGua[parseInt(bianGua.split('_')[1])], wuXing: hexagramData.gua[parseInt(bianGua.split('_')[1])].element }
    });

    isUnsaved = true;
}

// 顯示結果
function displayResults(data) {
    const gua = hexagramData.gua;
    const hexagrams = hexagramData.hexagrams;
    const caseTypeData = data.caseType ? hexagramData[data.caseType] : null;

    // 基本卦象資訊
    let resultHTML = `
        <h4>本卦：${gua[data.upperGua].name} (${gua[data.upperGua].element}) 上, ${gua[data.lowerGua].name} (${gua[data.lowerGua].element}) 下</h4>
        <p>${hexagrams[data.benGua]?.summary || '無特定解說'}</p>
    `;
    if (data.bianGua !== data.benGua) {
        resultHTML += `
            <h4>變卦：${gua[parseInt(data.bianGua.split('_')[0])].name} 上, ${gua[parseInt(data.bianGua.split('_')[1])].name} 下</h4>
            <p>${hexagrams[data.bianGua]?.summary || '無特定解說'}</p>
        `;
    }
    resultHTML += `
        <h4>體卦：${gua[data.tiGua].name} (${gua[data.tiGua].element})</h4>
        <h4>用卦：${gua[data.yongGua].name} (${gua[data.yongGua].element})</h4>
    `;
    dom.guaResult.innerHTML = resultHTML;

    // 案件發展與轉折
    let progressHTML = '<h4>案件發展與轉折</h4>';
    if (caseTypeData && caseTypeData.related_hexagrams[data.benGua]) {
        progressHTML += `<p>${caseTypeData.related_hexagrams[data.benGua]}</p>`;
    } else {
        progressHTML += `<p>根據卦象，案件可能涉及${gua[data.tiGua].feature}相關的特性，需關注${gua[data.yongGua].feature}的影響。請結合實際線索進一步分析。</p>`;
    }
    if (data.bianGua !== data.benGua && hexagrams[data.bianGua]) {
        progressHTML += `<p>案件可能轉向${hexagrams[data.bianGua].summary}</p>`;
    }
    dom.caseProgress.innerHTML = progressHTML;

    // 嫌犯與線索分析
    let cluesHTML = '<h4>嫌犯與線索分析</h4>';
    if (caseTypeData && caseTypeData.related_hexagrams[data.benGua]) {
        cluesHTML += `<p>建議從${gua[data.yongGua].feature}相關的方向尋找線索，可能涉及${gua[data.yongGua].direction}方位或${gua[data.yongGua].element}屬性的環境/人物。</p>`;
    } else {
        cluesHTML += `<p>嫌犯或線索可能與${gua[data.yongGua].feature}有關，建議調查${gua[data.yongGua].direction}方位或${gua[data.yongGua].element}屬性的相關線索。</p>`;
    }
    dom.suspectClues.innerHTML = cluesHTML;

    // 體用生克與吉凶
    const tiYongRelation = getTiYongRelation(gua[data.tiGua].element, gua[data.yongGua].element);
    const auspice = getAuspice(tiYongRelation);
    dom.auspice.innerHTML = `
        <h4>體用生克與吉凶</h4>
        <p>體用關係：${tiYongRelation}</p>
        <p>${auspice}</p>
    `;

    dom.resultArea.style.display = 'block';
}

// 儲存與載入
function saveCase(silent = false) {
    if (!currentCaseData) {
        alert('無案件資料可儲存！');
        return;
    }
    const cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    cases.push(currentCaseData);
    localStorage.setItem('divinationCases', JSON.stringify(cases));
    isUnsaved = false;
    if (!silent) alert('案件已儲存！');
}

function showHistoryModal() {
    const cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    dom.historyList.innerHTML = cases.length ? cases.map((c, i) => `
        <div class="history-item" data-index="${i}">${c.caseName} (${new Date(c.timestamp).toLocaleString()})</div>
    `).join('') : '<p>無歷史記錄</p>';
    dom.historyModal.style.display = 'block';
    dom.historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = item.dataset.index;
            currentCaseData = cases[index];
            displayResults(currentCaseData);
            createShengkeDiagram({
                benShang: { name: numToGua[currentCaseData.upperGua], wuXing: hexagramData.gua[currentCaseData.upperGua].element },
                benXia: { name: numToGua[currentCaseData.lowerGua], wuXing: hexagramData.gua[currentCaseData.lowerGua].element },
                ti: { name: numToGua[currentCaseData.tiGua], wuXing: hexagramData.gua[currentCaseData.tiGua].element },
                bianShang: { name: numToGua[parseInt(currentCaseData.bianGua.split('_')[0])], wuXing: hexagramData.gua[parseInt(currentCaseData.bianGua.split('_')[0])].element },
                bianXia: { name: numToGua[parseInt(currentCaseData.bianGua.split('_')[1])], wuXing: hexagramData.gua[parseInt(currentCaseData.bianGua.split('_')[1])].element }
            });
            dom.caseNameInput.value = currentCaseData.caseName;
            dom.caseTypeSelect.value = currentCaseData.caseType;
            dom.notesSection.value = currentCaseData.notes;
            dom.historyModal.style.display = 'none';
            isUnsaved = false;
        });
    });
}

function exportCases() {
    const cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    if (!cases.length) {
        alert('無歷史記錄可匯出！');
        return;
    }
    const dataStr = JSON.stringify(cases, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'divination_history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('歷史記錄已成功匯出為 divination_history.json 檔案。');
}

function importCases(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const newCases = JSON.parse(e.target.result);
            if (!Array.isArray(newCases)) {
                throw new Error('檔案格式不正確，應為 JSON 陣列。');
            }
            const currentCases = JSON.parse(localStorage.getItem('divinationCases')) || [];
            const option = prompt('請選擇載入方式：\n輸入 "1" 覆蓋現有記錄\n輸入 "2" 合併到現有記錄\n(取消載入請按「取消」)');
            if (option === '1') {
                localStorage.setItem('divinationCases', JSON.stringify(newCases));
                alert('歷史記錄已成功覆蓋。');
            } else if (option === '2') {
                const mergedCases = currentCases.concat(newCases);
                localStorage.setItem('divinationCases', JSON.stringify(mergedCases));
                alert('歷史記錄已成功合併。');
            } else {
                alert('已取消載入。');
            }
            dom.btnImportFile.value = '';
        } catch (error) {
            console.error('載入檔案失敗:', error);
            alert(`載入檔案失敗：${error.message}`);
            dom.btnImportFile.value = '';
        }
    };
    reader.readAsText(file);
}

function clearAllCases() {
    if (confirm('確定要清空所有歷史記錄嗎？此動作無法復原。您要先匯出備份嗎？')) {
        exportCases();
        if (confirm('已匯出備份，確定要清空所有記錄嗎？')) {
            localStorage.removeItem('divinationCases');
            alert('所有歷史記錄已成功清空。');
        }
    }
}

// 事件監聽與初始化
function init() {
    loadInitialData();

    dom.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            dom.tabs.forEach(t => t.classList.remove('active'));
            dom.tabContents.forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const targetTab = e.currentTarget.dataset.tab;
            document.getElementById(targetTab).classList.add('active');
        });
    });

    dom.calculateBtn.addEventListener('click', startCalculation);
    dom.btnSave.addEventListener('click', () => saveCase(false));
    dom.btnLoad.addEventListener('click', showHistoryModal);
    dom.btnExport.addEventListener('click', exportCases);
    dom.btnImport.addEventListener('click', () => dom.btnImportFile.click());
    dom.btnClear.addEventListener('click', clearAllCases);
    
    dom.jsonFile.addEventListener('change', handleFileImport);
    dom.btnImportFile.addEventListener('change', importCases);

    dom.numInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9);
    });

    dom.closeModalBtn.addEventListener('click', () => dom.historyModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === dom.historyModal) {
            dom.historyModal.style.display = 'none';
        }
    });

    window.addEventListener('beforeunload', (event) => {
        if (isUnsaved) {
            event.preventDefault();
            event.returnValue = '您有未儲存的案件，確定要離開嗎？';
        }
    });
}

document.addEventListener('DOMContentLoaded', init);

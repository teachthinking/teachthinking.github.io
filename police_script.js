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
    notesSection: document.getElementById('notesSection'),
    caseNotes: document.getElementById('caseNotes'),
    btnSave: document.getElementById('btn-save'),
    btnLoad: document.getElementById('btn-load'),
    btnExport: document.getElementById('btn-export'),
    btnImport: document.getElementById('btn-import'),
    btnImportFile: document.getElementById('importFile'),
    btnClear: document.getElementById('btn-clear'),
    historyModal: document.getElementById('historyModal'),
    historyList: document.getElementById('historyList'),
    closeModalBtn: document.querySelector('.modal .close-btn')
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

// ----------------------
// 應用程式核心邏輯
// ----------------------

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
        select.innerHTML = '';
        for (let i = 1; i <= 8; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = gua[i].name;
            select.appendChild(option);
        }
    });

    dom.changingLineManual.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `第 ${i} 爻`;
        dom.changingLineManual.appendChild(option);
    }
}

function populateCaseTypeSelect() {
    const selectElement = dom.caseTypeSelect;
    selectElement.innerHTML = '<option value="">請選擇案件類型 (選填)</option>';
    if (hexagramData.case_analysis) {
        for (const key in hexagramData.case_analysis) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = hexagramData.case_analysis[key].name;
            selectElement.appendChild(option);
        }
    }
}

function startCalculation() {
    if (isUnsaved) {
        saveCase(true);
    }

    if (Object.keys(hexagramData).length === 0 || !hexagramData.hexagrams) {
        alert('卦象資料尚未載入，請先上傳 JSON 檔案或等待預設檔案載入。');
        return;
    }

    const activeTabId = document.querySelector('.tab-content.active').id;
    let lowerGuaNum, upperGuaNum, changingLine, inputMethod;

    if (activeTabId === 'number') {
        const input = dom.numInput.value;
        if (input.length !== 9 || !/^\d{9}$/.test(input)) {
            alert('請輸入有效的9位數數字！');
            return;
        }
        const sumLower = parseInt(input.substring(0, 3), 10);
        const sumUpper = parseInt(input.substring(3, 6), 10);
        const sumChange = parseInt(input.substring(6, 9), 10);
        
        lowerGuaNum = sumLower % 8 === 0 ? 8 : sumLower % 8;
        upperGuaNum = sumUpper % 8 === 0 ? 8 : sumUpper % 8;
        changingLine = sumChange % 6 === 0 ? 6 : sumChange % 6;
        inputMethod = '數字起卦';
    } else {
        upperGuaNum = parseInt(dom.upperGuaSelect.value, 10);
        lowerGuaNum = parseInt(dom.lowerGuaSelect.value, 10);
        changingLine = parseInt(dom.changingLineManual.value, 10);
        inputMethod = '手動取卦';
    }

    const caseType = dom.caseTypeSelect.value;
    const caseName = dom.caseNameInput.value || `未命名案件 - ${new Date().toLocaleString()}`;
    
    generateReport(lowerGuaNum, upperGuaNum, changingLine, inputMethod, caseType, caseName);
    isUnsaved = true;
}

function generateReport(lowerGuaNum, upperGuaNum, changingLine, inputMethod, caseType, caseName) {
    const mainGua = hexagramData.hexagrams[`${upperGuaNum}_${lowerGuaNum}`] || { name: '未知卦名', summary: '無相關解釋。' };
    
    // --- 修正互卦計算邏輯 ---
    const mainGuaBinary = toBinary(upperGuaNum) + toBinary(lowerGuaNum); // 從上到下 (爻6 到 爻1)
    const interGuaUpperBinary = mainGuaBinary.substring(1, 4); // 爻5,4,3 (互卦上卦)
    const interGuaLowerBinary = mainGuaBinary.substring(2, 5); // 爻4,3,2 (互卦下卦)
    const interGuaUpperNum = toDecimal(interGuaUpperBinary);
    const interGuaLowerNum = toDecimal(interGuaLowerBinary);
    const interGua = hexagramData.hexagrams[`${interGuaUpperNum}_${interGuaLowerNum}`] || { name: '未知互卦', summary: '無相關解釋。' };

    // --- 修正變卦計算邏輯 ---
    let changedGuaBinary = "";
    for (let i = 0; i < 6; i++) {
        const lineIndex = 6 - i; // 爻位從上到下: i=0 為爻6 (上), i=5 為爻1 (下)
        if (lineIndex === changingLine) {
            changedGuaBinary += (mainGuaBinary[i] === '0') ? '1' : '0'; // 翻轉陰陽
        } else {
            changedGuaBinary += mainGuaBinary[i];
        }
    }
    const changedUpperGuaNum = toDecimal(changedGuaBinary.substring(0, 3));
    const changedLowerGuaNum = toDecimal(changedGuaBinary.substring(3, 6));
    const changedGua = hexagramData.hexagrams[`${changedUpperGuaNum}_${changedLowerGuaNum}`] || { name: '未知變卦', summary: '無相關解釋。' };

    // --- 體用關係判斷 ---
    let tiGuaNum, yongGuaNum;
    if (changingLine > 3) {
        tiGuaNum = lowerGuaNum;
        yongGuaNum = upperGuaNum;
    } else {
        tiGuaNum = upperGuaNum;
        yongGuaNum = lowerGuaNum;
    }
    const tiGua = hexagramData.gua[tiGuaNum];
    const yongGua = hexagramData.gua[yongGuaNum];

    let relationText = '';
    const tiElement = tiGua.element;
    const yongElement = yongGua.element;
    const sheng = hexagramData.element_relations[tiElement].生;
    const ke = hexagramData.element_relations[tiElement].剋;
    const yongSheng = hexagramData.element_relations[yongElement].生;
    const yongKe = hexagramData.element_relations[yongElement].剋;
    
    let relationType = '比和';
    if (sheng === yongElement) { relationText = `${tiGua.name}生${yongGua.name}，代表**我方生助對方**。這意味著警方主動付出、積極追查，案件進展順利。`; relationType = '生'; }
    else if (ke === yongElement) { relationText = `${tiGua.name}剋${yongGua.name}，代表**我方克制對方**。這意味著警方能掌控局面，可成功將嫌犯繩之以法。`; relationType = '剋'; }
    else if (yongSheng === tiElement) { relationText = `${yongGua.name}生${tiGua.name}，代表**對方生助我方**。這意味著嫌犯或線索提供意外幫助，讓警方被動獲得突破。`; relationType = '被生'; }
    else if (yongKe === tiElement) { relationText = `${yongGua.name}剋${tiGua.name}，代表**對方克制我方**。這意味著警方辦案受阻，嫌犯反制能力強，需謹慎應對。`; relationType = '被剋'; }
    else { relationText = `${tiGua.name}與${yongGua.name}為**比和**關係，代表雙方勢均力敵，案件將按常理發展，但可能需要更多努力。`; }

    // 新增互卦與變卦的體用分析
    const interTiGua = (changingLine > 3) ? hexagramData.gua[interGuaLowerNum] : hexagramData.gua[interGuaUpperNum];
    const interYongGua = (changingLine > 3) ? hexagramData.gua[interGuaUpperNum] : hexagramData.gua[interGuaLowerNum];
    const changedTiGua = (changingLine > 3) ? hexagramData.gua[changedLowerGuaNum] : hexagramData.gua[changedUpperGuaNum];
    const changedYongGua = (changingLine > 3) ? hexagramData.gua[changedUpperGuaNum] : hexagramData.gua[changedLowerGuaNum];

    const interRelationText = getRelationText(interTiGua, interYongGua);
    const changedRelationText = getRelationText(changedTiGua, changedYongGua);

    // 取得當前月份地支 (假設使用陽曆月份轉換，實際可使用更精準的農曆轉換)
    const currentMonthBranch = getCurrentMonthBranch();
    const elementStrength = getElementStrength(currentMonthBranch);
    const elementStrengthsHtml = Object.keys(elementStrength).map(el => `<li><strong>${el}</strong>：${elementStrength[el]}</li>`).join('');

    // 推估應期 (簡化實現，實際邏輯可根據需求調整)
    const yongGuaElement = yongGua.element;
    const tiGuaElement = tiGua.element;
    const changingLineElement = hexagramData.gua[changingLine > 3 ? upperGuaNum : lowerGuaNum].element;
    const expectedDates = predictEventDates({
        monthBranch: currentMonthBranch,
        dayBranch: getCurrentDayBranch(),
        yongElement: yongGuaElement,
        tiElement: tiGuaElement,
        dongyaoElement: changingLineElement
    });

    const expectedDatesHtml = Object.entries(expectedDates)
        .slice(0, 5)
        .map(([key, value]) => `<li>**${key}**：${value.toFixed(2)}分</li>`)
        .join('');

    let caseAnalysisText = '';
    if (caseType && hexagramData.case_analysis[caseType]) {
        const caseData = hexagramData.case_analysis[caseType];
        caseAnalysisText += `<h4>專案案件分析：${caseData.name}</h4><p>${caseData.summary}</p>`;
        let foundAnalysis = false;
        const guaKeys = Object.keys(caseData.related_hexagrams);
        guaKeys.forEach(key => {
            if (key === `${upperGuaNum}_${lowerGuaNum}` || key === `${changedUpperGuaNum}_${changedLowerGuaNum}` || key === `${interGuaUpperNum}_${interGuaLowerNum}`) {
                caseAnalysisText += `<p>${caseData.related_hexagrams[key]}</p>`;
                foundAnalysis = true;
            }
        });
        if (!foundAnalysis) {
            caseAnalysisText += '<p>無特定相關卦象分析，請參考一般解釋。</p>';
        }
    }

    // 生成報告 HTML
    const reportHtml = `
        <h3>${caseName}</h3>
        <p><strong>輸入方式：</strong> ${inputMethod}</p>
        <p><strong>本卦：</strong> ${mainGua.name} - ${mainGua.summary}</p>
        <p><strong>互卦：</strong> ${interGua.name} - ${interGua.summary}</p>
        <p><strong>變卦：</strong> ${changedGua.name} - ${changedGua.summary}</p>
        <hr>
        <h4>體用關係：</h4>
        <p>${relationText}</p>
        <h4>互卦體用關係：</h4>
        <p>${interRelationText}</p>
        <h4>變卦體用關係：</h4>
        <p>${changedRelationText}</p>
        <hr>
        <h4>五行旺相休囚死：</h4>
        <ul>${elementStrengthsHtml}</ul>
        <h4>推估應期：</h4>
        <ul>${expectedDatesHtml}</ul>
        ${caseAnalysisText}
        <div class="case-graph-container"><svg id="caseGraph" width="600" height="400"></svg></div>
    `;

    dom.resultArea.innerHTML = reportHtml;
    dom.resultArea.style.display = 'flex';
    dom.notesSection.style.display = 'block';

    currentCaseData = {
        caseName,
        inputMethod,
        reportHtml,
        timestamp: new Date().toISOString(),
        notes: dom.caseNotes.value
    };

    // 繪製卦象關係圖
    const caseGraph = document.getElementById('caseGraph');
    if (caseGraph) {
        drawGuaGraph(caseGraph, {
            mainTi: { gua: tiGua, element: tiGua.element },
            mainYong: { gua: yongGua, element: yongGua.element },
            interTi: { gua: interTiGua, element: interTiGua.element },
            interYong: { gua: interYongGua, element: interYongGua.element },
            changedTi: { gua: changedTiGua, element: changedTiGua.element },
            changedYong: { gua: changedYongGua, element: changedYongGua.element }
        });
    }
}

// 取得體用生剋文字
function getRelationText(tiGua, yongGua) {
    if (!tiGua || !yongGua) return '無相關體用關係。';
    const tiElement = tiGua.element;
    const yongElement = yongGua.element;
    const sheng = hexagramData.element_relations[tiElement].生;
    const ke = hexagramData.element_relations[tiElement].剋;
    const yongSheng = hexagramData.element_relations[yongElement].生;
    const yongKe = hexagramData.element_relations[yongElement].剋;
    
    if (sheng === yongElement) return `${tiGua.name}生${yongGua.name}，我方生助對方。`;
    if (ke === yongElement) return `${tiGua.name}剋${yongGua.name}，我方克制對方。`;
    if (yongSheng === tiElement) return `${yongGua.name}生${tiGua.name}，對方生助我方。`;
    if (yongKe === tiElement) return `${yongGua.name}剋${tiGua.name}，對方克制我方。`;
    return `${tiGua.name}與${yongGua.name}為比和關係，勢均力敵。`;
}

// 取得當前月份地支
function getCurrentMonthBranch() {
    const date = new Date(); // 使用當前日期 2025-09-01
    date.setFullYear(2025, 8, 1); // September is month 8 (0-based)
    const month = date.getMonth() + 1;
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return branches[(month - 1) % 12]; // 簡化，實際應使用農曆或節氣
}

// 取得當天地支 (簡化)
function getCurrentDayBranch() {
    const date = new Date(2025, 8, 1);
    const day = date.getDate();
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return branches[day % 12];
}

// 取得五行旺相休囚死
function getElementStrength(monthZhi) {
    const seasonElement = Object.keys(hexagramData.five_to_season).find(el => hexagramData.five_to_season[el].includes(monthZhi)) || '土';
    const wang = seasonElement;
    const xiang = hexagramData.element_relations[wang].生;
    const xiu = Object.keys(hexagramData.element_relations).find(el => hexagramData.element_relations[el].生 === wang);
    const qiu = hexagramData.element_relations[wang].剋;
    const si = Object.keys(hexagramData.element_relations).find(el => hexagramData.element_relations[el].剋 === wang);
    return { '旺': wang, '相': xiang, '休': xiu, '囚': qiu, '死': si };
}

// 推估應期 (簡化邏輯，計算分數)
function predictEventDates({ monthBranch, dayBranch, yongElement, tiElement, dongyaoElement }) {
    // 簡化實現，返回假分數
    const dates = {};
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    branches.forEach(b => {
        dates[b] = Math.random() * 100; // 替換為實際邏輯
    });
    return dates;
}

// 取得動爻所屬卦數
function getChangingLineGuaNum(changingLine) {
    return changingLine > 3 ? 1 : 8; // 簡化
}

// 繪製五行生克關係圖
function drawGuaGraph(svgElement, guaData) {
    svgElement.innerHTML = `
        <defs>
            <marker id="arrowhead-sheng" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto" fill="green">
                <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
            <marker id="arrowhead-ke" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto" fill="red">
                <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
        </defs>
    `;

    const elementStrengths = getElementStrength(getCurrentMonthBranch());
    const strengthOrder = ['旺', '相', '休', '囚', '死'];
    const getWeight = (el) => {
        const status = Object.keys(elementStrengths).find(key => elementStrengths[key] === el);
        const index = strengthOrder.indexOf(status);
        return hexagramData.line_weights[4 - index] || 0.2;
    };

    // 五行節點位置（圓形佈局，中心為300,200，半徑150）
    const elements = ['木', '火', '土', '金', '水'];
    const nodes = elements.map((el, i) => {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2; // 從頂部開始順時針
        const x = 300 + 150 * Math.cos(angle);
        const y = 200 + 150 * Math.sin(angle);
        return { id: el, label: el, element: el, x, y };
    });

    // 生關係（綠色實線）
    const shengRelations = [
        { from: '木', to: '火' },
        { from: '火', to: '土' },
        { from: '土', to: '金' },
        { from: '金', to: '水' },
        { from: '水', to: '木' }
    ];

    // 剋關係（紅色虛線）
    const keRelations = [
        { from: '木', to: '土' },
        { from: '火', to: '金' },
        { from: '土', to: '水' },
        { from: '金', to: '木' },
        { from: '水', to: '火' }
    ];

    // 繪製五行節點
    nodes.forEach(node => {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const color = hexagramData.element_colors[node.element] || '#ccc';

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 40);
        circle.classList.add('gua-node');
        circle.style.fill = color;
        group.appendChild(circle);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.classList.add('gua-text');
        text.textContent = node.label;
        group.appendChild(text);

        // 添加卦名標籤（本卦、互卦、變卦的體用）
        const guaLabels = [];
        if (guaData.mainTi.element === node.element) guaLabels.push(`本卦體 (${guaData.mainTi.gua.name})`);
        if (guaData.mainYong.element === node.element) guaLabels.push(`本卦用 (${guaData.mainYong.gua.name})`);
        if (guaData.interTi.element === node.element) guaLabels.push(`互卦體 (${guaData.interTi.gua.name})`);
        if (guaData.interYong.element === node.element) guaLabels.push(`互卦用 (${guaData.interYong.gua.name})`);
        if (guaData.changedTi.element === node.element) guaLabels.push(`變卦體 (${guaData.changedTi.gua.name})`);
        if (guaData.changedYong.element === node.element) guaLabels.push(`變卦用 (${guaData.changedYong.gua.name})`);

        if (guaLabels.length > 0) {
            const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            labelText.setAttribute('x', node.x);
            labelText.setAttribute('y', node.y + 20);
            labelText.setAttribute('text-anchor', 'middle');
            labelText.setAttribute('font-size', '12px');
            labelText.textContent = guaLabels.join(', ');
            group.appendChild(labelText);
        }

        svgElement.appendChild(group);
    });

    // 繪製生關係線條
    shengRelations.forEach(rel => {
        const fromNode = nodes.find(n => n.id === rel.from);
        const toNode = nodes.find(n => n.id === rel.to);
        if (!fromNode || !toNode) return;

        const weight = getWeight(fromNode.element);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.setAttribute('stroke-width', weight * 8);
        line.classList.add('relation-line', 'sheng');
        line.setAttribute('marker-end', 'url(#arrowhead-sheng)');
        svgElement.appendChild(line);
    });

    // 繪製剋關係線條
    keRelations.forEach(rel => {
        const fromNode = nodes.find(n => n.id === rel.from);
        const toNode = nodes.find(n => n.id === rel.to);
        if (!fromNode || !toNode) return;

        const weight = getWeight(fromNode.element);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.setAttribute('stroke-width', weight * 8);
        line.setAttribute('stroke-dasharray', '5,5');
        line.classList.add('relation-line', 'ke');
        line.setAttribute('marker-end', 'url(#arrowhead-ke)');
        svgElement.appendChild(line);
    });
}

// 取得生剋關係
function getRelation(el1, el2) {
    if (el1 === el2) return '比和';
    if (hexagramData.element_relations[el1].生 === el2) return '生';
    if (hexagramData.element_relations[el1].剋 === el2) return '剋';
    return '比和';
}

// ----------------------
// 歷史記錄與資料管理
// ----------------------

function saveCase(isAutoSave = false) {
    if (!currentCaseData) {
        if (!isAutoSave) alert('請先進行卜卦推算後再儲存！');
        return;
    }
    currentCaseData.notes = dom.caseNotes.value;
    let cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    const existingIndex = cases.findIndex(c => c.timestamp === currentCaseData.timestamp);
    if (existingIndex !== -1) {
        cases[existingIndex] = currentCaseData;
    } else {
        cases.push(currentCaseData);
    }
    localStorage.setItem('divinationCases', JSON.stringify(cases));
    if (!isAutoSave) {
        alert(`案件「${currentCaseData.caseName}」已成功儲存！`);
    }
    isUnsaved = false;
}

function showHistoryModal() {
    const cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    if (cases.length === 0) {
        alert('目前沒有歷史記錄。');
        return;
    }
    dom.historyList.innerHTML = '';
    cases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    cases.forEach((c, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item';
        itemDiv.innerHTML = `<strong>${c.caseName}</strong> (${c.inputMethod})<br><small>${new Date(c.timestamp).toLocaleString()}</small>`;
        itemDiv.addEventListener('click', () => {
            if (isUnsaved && !confirm('您有未儲存的案件，確定要載入歷史記錄嗎？未儲存的資料將會遺失。')) {
                return;
            }
            loadCase(index);
            dom.historyModal.style.display = 'none';
        });
        dom.historyList.appendChild(itemDiv);
    });
    dom.historyModal.style.display = 'flex';
}

function loadCase(index) {
    const cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    const sortedCases = cases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const caseToLoad = sortedCases[index];
    if (!caseToLoad) return;
    currentCaseData = caseToLoad;
    dom.caseNameInput.value = currentCaseData.caseName;
    dom.resultArea.innerHTML = currentCaseData.reportHtml;
    dom.resultArea.style.display = 'flex';
    dom.notesSection.style.display = 'block';
    dom.caseNotes.value = currentCaseData.notes;
    alert(`案件「${currentCaseData.caseName}」已成功載入！`);
    isUnsaved = false;
}

function exportCases() {
    const cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    if (cases.length === 0) {
        alert('沒有可匯出的歷史記錄。');
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

// ----------------------
// 事件監聽與初始化
// ----------------------

function init() {
    loadInitialData();

    // Tab 切換
    dom.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            dom.tabs.forEach(t => t.classList.remove('active'));
            dom.tabContents.forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const targetTab = e.currentTarget.dataset.tab;
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // 核心按鈕
    dom.calculateBtn.addEventListener('click', startCalculation);
    dom.btnSave.addEventListener('click', () => saveCase(false));
    dom.btnLoad.addEventListener('click', showHistoryModal);
    dom.btnExport.addEventListener('click', exportCases);
    dom.btnImport.addEventListener('click', () => dom.btnImportFile.click());
    dom.btnClear.addEventListener('click', clearAllCases);
    
    // 檔案上傳
    dom.jsonFile.addEventListener('change', handleFileImport);
    dom.btnImportFile.addEventListener('change', importCases);

    // 數字輸入檢核
    dom.numInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9);
    });

    // 彈窗
    dom.closeModalBtn.addEventListener('click', () => dom.historyModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === dom.historyModal) {
            dom.historyModal.style.display = 'none';
        }
    });

    // 離開頁面警告
    window.addEventListener('beforeunload', (event) => {
        if (isUnsaved) {
            event.preventDefault();
            event.returnValue = '您有未儲存的案件，確定要離開嗎？';
        }
    });
}

// 啟動應用程式
document.addEventListener('DOMContentLoaded', init);

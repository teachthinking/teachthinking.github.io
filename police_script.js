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
const toBinary = num => (num === 8) ? '000' : (num - 1).toString(2).padStart(3, '0');
const toDecimal = binaryStr => {
    const decimalValue = parseInt(binaryStr, 2);
    return (decimalValue === 0) ? 8 : decimalValue;
};

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
    const mainGuaBinary = toBinary(upperGuaNum) + toBinary(lowerGuaNum);
    const interGuaLowerBinary = mainGuaBinary.substring(1, 4);
    const interGuaUpperBinary = mainGuaBinary.substring(2, 5);
    const interGuaLowerNum = toDecimal(interGuaLowerBinary);
    const interGuaUpperNum = toDecimal(interGuaUpperBinary);
    const interGua = hexagramData.hexagrams[`${interGuaUpperNum}_${interGuaLowerNum}`] || { name: '未知互卦', summary: '無相關解釋。' };

    // --- 修正變卦計算邏輯 ---
    let changedGuaBinary = "";
    for (let i = 0; i < 6; i++) {
        const lineIndex = 6 - i; // 確保從第六爻開始
        if (lineIndex === changingLine) {
            changedGuaBinary += (mainGuaBinary[i] === '0') ? '1' : '0';
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
    const interTiGua = hexagramData.gua[interGuaUpperNum];
    const interYongGua = hexagramData.gua[interGuaLowerNum];
    const changedTiGua = hexagramData.gua[changedUpperGuaNum];
    const changedYongGua = hexagramData.gua[changedLowerGuaNum];

    const interRelationText = getRelationText(interTiGua, interYongGua);
    const changedRelationText = getRelationText(changedTiGua, changedYongGua);

    // 取得當前月份地支
    const currentMonthBranch = getCurrentMonthBranch();
    const elementStrength = getElementStrength(currentMonthBranch);
    const elementStrengthsHtml = Object.keys(elementStrength).map(el => `<li><strong>${el}</strong>：${elementStrength[el]}</li>`).join('');

    // 推估應期
    const yongGuaElement = yongGua.element;
    const tiGuaElement = tiGua.element;
    const changingLineElement = hexagramData.gua[getChangingLineGuaNum(changingLine)].element;
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
        const guaKeys = [`${upperGuaNum}_${lowerGuaNum}`, `${interGuaUpperNum}_${interGuaLowerNum}`, `${changedUpperGuaNum}_${changedLowerGuaNum}`];
        for (const key of guaKeys) {
            if (caseData.related_hexagrams[key]) {
                caseAnalysisText += `<p><strong>${caseData.related_hexagrams[key]}</strong></p>`;
                foundAnalysis = true;
            }
        }
        if (!foundAnalysis) { caseAnalysisText += `<p>根據卦象，此案件的發展可能與特定類型關聯性較弱，建議從基本卦象分析入手。</p>`; }
    }
    
    const reportHtml = `
        <h3>${inputMethod}</h3>
        <p><strong>本卦</strong>：${mainGua.name} (${numToGua[upperGuaNum]}上${numToGua[lowerGuaNum]}下)</p>
        <p><strong>動爻</strong>：第 ${changingLine} 爻</p>
        <p><strong>互卦</strong>：${interGua.name} (${numToGua[interGuaUpperNum]}上${numToGua[interGuaLowerNum]}下)</p>
        <p><strong>變卦</strong>：${changedGua.name}</p>
        <hr>
        <h4>案件核心分析</h4>
        <p><strong>本卦</strong>：${mainGua.summary}</p>
        <p><strong>互卦 (隱藏狀況)</strong>：互卦代表案件的**中間過程**或**隱藏的狀況**。它顯示了案件中不為人知的內幕、潛在的關係變數或未來的走向。這暗示案件深層的真相可能與互卦「${interGua.name}」的卦義相關：**${interGua.summary}**</p>
        <h4>案件發展與轉折</h4>
        <p><strong>動爻</strong>：第 ${changingLine} 爻代表**${hexagramData.line_summary[changingLine]}**，是案件的關鍵轉變點。</p>
        <p><strong>變卦 (最終結果)</strong>：變卦代表案件的**最終結局**或**未來趨勢**。此卦象預示著案件的最終走向將會是「${changedGua.name}」，其主要含義為：**${changedGua.summary}**</p>
        ${caseAnalysisText}
        <h4>嫌犯與線索分析</h4>
        <ul>
            <li><strong>嫌犯特徵</strong>：根據上卦「${hexagramData.gua[upperGuaNum].name}」與下卦「${hexagramData.gua[lowerGuaNum].name}」，嫌犯可能具有**${hexagramData.gua[upperGuaNum].feature}**或**${hexagramData.gua[lowerGuaNum].feature}**的特徵。</li>
            <li><strong>線索方位</strong>：關鍵線索可能位於**${hexagramData.gua[lowerGuaNum].direction}**方，嫌犯可能藏匿在**${hexagramData.gua[upperGuaNum].direction}**方。</li>
            <li><strong>本卦體用分析</strong>：體卦（我方，警方）為**${tiGua.name}**，用卦（對方，嫌犯）為**${yongGua.name}**。${relationText}</li>
            <li><strong>互卦體用分析</strong>：互卦體（隱藏的我方）為**${interTiGua.name}**，互卦用（隱藏的對方）為**${interYongGua.name}**。${interRelationText}</li>
            <li><strong>變卦體用分析</strong>：變卦體（最終的我方）為**${changedTiGua.name}**，變卦用（最終的對方）為**${changedYongGua.name}**。${changedRelationText}</li>
        </ul>
        <hr>
        <div class="case-graph-container">
            <h4>案件五行生剋圖</h4>
            <p><strong>標註說明：</strong> 體卦、用卦、互卦、變卦顏色代表五行；連線粗細代表旺衰（粗→細）；綠線為「生」，紅線為「剋」，黃線為「比和」。</p>
            <svg id="caseGraph" viewBox="0 0 600 400"></svg>
        </div>
        <hr>
        <h4>旺相休囚死與應期推估</h4>
        <p><strong>目前五行旺衰：</strong>（以當前月份推算）</p>
        <ul>${elementStrengthsHtml}</ul>
        <p><strong>可能應期：</strong>（分數越高，可能性越高）</p>
        <ul>${expectedDatesHtml}</ul>
        <p><small>* 應期判斷為輔助參考，仍需結合實際案件狀況。</small></p>
    `;

    currentCaseData = {
        caseName: caseName,
        timestamp: new Date().toISOString(),
        inputMethod: inputMethod,
        lowerGuaNum: lowerGuaNum,
        upperGuaNum: upperGuaNum,
        changingLine: changingLine,
        caseType: caseType,
        reportHtml: reportHtml,
        notes: ''
    };
    dom.resultArea.innerHTML = reportHtml;
    dom.resultArea.style.display = 'flex';
    dom.notesSection.style.display = 'block';
    dom.caseNotes.value = '';
    isUnsaved = true;

    // 繪製生克圖
    drawCaseGraph({
        main: { gua: mainGua, upperGua: hexagramData.gua[upperGuaNum], lowerGua: hexagramData.gua[lowerGuaNum] },
        inter: { gua: interGua, upperGua: hexagramData.gua[interGuaUpperNum], lowerGua: hexagramData.gua[interGuaLowerNum] },
        changed: { gua: changedGua, upperGua: hexagramData.gua[changedUpperGuaNum], lowerGua: hexagramData.gua[changedLowerGuaNum] },
        ti: { gua: tiGua },
        yong: { gua: yongGua }
    });
}

// ----------------------
// 輔助工具函式
// ----------------------

// 取得動爻對應的單卦
function getChangingLineGuaNum(changingLine) {
    if (changingLine > 3) {
        // 動爻在上卦，取上卦
        return parseInt(dom.upperGuaSelect.value, 10);
    } else {
        // 動爻在下卦，取下卦
        return parseInt(dom.lowerGuaSelect.value, 10);
    }
}

// 獲取當前月份地支
function getCurrentMonthBranch() {
    const d = new Date();
    const month = d.getMonth() + 1;
    const lunarMonths = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return lunarMonths[(month + 1) % 12];
}

// 獲取當前日期地支（簡化）
function getCurrentDayBranch() {
    const d = new Date();
    const day = d.getDate();
    const lunarDays = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return lunarDays[(day - 1) % 12];
}

// 判斷五行旺相休囚死
function getElementStrength(monthBranch) {
    const strengths = { '旺': '', '相': '', '休': '', '囚': '', '死': '' };
    const monthElement = hexagramData.zhi_to_wu[monthBranch];
    if (!monthElement) return strengths;

    const sheng = hexagramData.element_relations[monthElement].生;
    const ke = hexagramData.element_relations[monthElement].剋;
    const shengWo = Object.entries(hexagramData.element_relations).find(([k, v]) => v.生 === monthElement);
    const woKe = Object.entries(hexagramData.element_relations).find(([k, v]) => v.剋 === monthElement);
    
    strengths['旺'] = monthElement;
    strengths['相'] = sheng;
    strengths['休'] = shengWo ? shengWo[0] : '';
    strengths['囚'] = woKe ? woKe[0] : '';
    strengths['死'] = ke;
    
    return strengths;
}

// 應期推估
function predictEventDates(params) {
    const scores = {};
    const elements = ['金', '木', '水', '火', '土'];
    
    elements.forEach(el => {
        scores[el] = 0;
    });

    const monthElement = hexagramData.zhi_to_wu[params.monthBranch];
    const dayElement = hexagramData.zhi_to_wu[params.dayBranch];
    if (!monthElement || !dayElement) return {};

    // 1. 月令旺相
    if (params.yongElement === monthElement) scores[params.yongElement] += 2;
    if (hexagramData.element_relations[monthElement].生 === params.yongElement) scores[params.yongElement] += 1.5;

    // 2. 日辰加權
    if (params.yongElement === dayElement) scores[params.yongElement] += 1;
    if (hexagramData.element_relations[dayElement].生 === params.yongElement) scores[params.yongElement] += 0.8;

    // 3. 動爻影響
    if (params.dongyaoElement) {
        if (params.dongyaoElement === params.yongElement) scores[params.yongElement] += 1;
        if (hexagramData.element_relations[params.dongyaoElement].生 === params.yongElement) scores[params.yongElement] += 0.5;
    }

    // 4. 體用關係
    const tiShengYong = hexagramData.element_relations[params.tiElement].生 === params.yongElement;
    const tiKeYong = hexagramData.element_relations[params.tiElement].剋 === params.yongElement;
    if (tiShengYong) scores[params.yongElement] += 1;
    if (tiKeYong) scores[params.yongElement] -= 1.5;

    // 將分數轉換為具體應期
    const predictions = {};
    for (const el in scores) {
        const branches = hexagramData.five_to_season[el];
        if (branches) {
            branches.forEach(branch => {
                predictions[`${branch}日`] = scores[el];
            });
        }
    }

    const sortedPredictions = Object.entries(predictions).sort(([, a], [, b]) => b - a);

    return Object.fromEntries(sortedPredictions);
}

// 取得體用生克關係文字
function getRelationText(tiGua, yongGua) {
    if (!tiGua || !yongGua || !tiGua.element || !yongGua.element) return '';
    const tiElement = tiGua.element;
    const yongElement = yongGua.element;
    const sheng = hexagramData.element_relations[tiElement].生;
    const ke = hexagramData.element_relations[tiElement].剋;
    const yongSheng = hexagramData.element_relations[yongElement].生;
    const yongKe = hexagramData.element_relations[yongElement].剋;
    
    if (sheng === yongElement) return `${tiGua.name}生${yongGua.name} (順利) `;
    if (ke === yongElement) return `${tiGua.name}剋${yongGua.name} (可控) `;
    if (yongSheng === tiElement) return `${yongGua.name}生${tiGua.name} (被動獲助) `;
    if (yongKe === tiElement) return `${yongGua.name}剋${tiGua.name} (受阻) `;
    return `${tiGua.name}與${yongGua.name}比和 (僵持) `;
}

// 繪製SVG圖
function drawCaseGraph(guaData) {
    const svg = document.getElementById('caseGraph');
    if (!svg) return;
    svg.innerHTML = `
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
        const index = strengthOrder.findIndex(key => elementStrengths[key] === el);
        return hexagramData.line_weights[4 - index] || 0.1;
    };
    
    // 定義所有節點
    const nodes = [
        { id: 'ti', label: `體卦 (${guaData.ti.gua.name})`, element: guaData.ti.gua.element, x: 100, y: 150 },
        { id: 'yong', label: `用卦 (${guaData.yong.gua.name})`, element: guaData.yong.gua.element, x: 500, y: 150 },
        { id: 'main', label: `本卦 (${guaData.main.gua.name})`, element: guaData.main.gua.element, x: 300, y: 50 },
        { id: 'inter', label: `互卦 (${guaData.inter.gua.name})`, element: guaData.inter.gua.element, x: 150, y: 300 },
        { id: 'changed', label: `變卦 (${guaData.changed.gua.name})`, element: guaData.changed.gua.element, x: 450, y: 300 }
    ];

    // 定義所有關係
    const relations = [
        { from: 'ti', to: 'yong' },
        { from: 'ti', to: 'main' },
        { from: 'yong', to: 'main' },
        { from: 'main', to: 'inter' },
        { from: 'main', to: 'changed' }
    ];

    // 繪製所有線條
    relations.forEach(rel => {
        const fromNode = nodes.find(n => n.id === rel.from);
        const toNode = nodes.find(n => n.id === rel.to);
        if (!fromNode || !toNode || !fromNode.element || !toNode.element) return;
        
        const relation = getRelation(fromNode.element, toNode.element);
        const color = relation === '生' ? 'sheng' : (relation === '剋' ? 'ke' : 'bihe');
        const weight = getWeight(fromNode.element);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.setAttribute('stroke-width', weight * 8);
        line.classList.add('relation-line', color);

        if (relation !== '比和') {
            line.setAttribute('marker-end', `url(#arrowhead-${color})`);
        }
        
        svg.appendChild(line);
    });

    // 繪製所有節點和文字
    nodes.forEach(node => {
        if (!node.element) return;
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

        svg.appendChild(group);
    });
}

// 取得體用生克關係
function getRelation(el1, el2) {
    if (el1 === el2) return '比和';
    if (hexagramData.element_relations[el1].生 === el2) return '生';
    if (hexagramData.element_relations[el1].剋 === el2) return '剋';
    return '無關';
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

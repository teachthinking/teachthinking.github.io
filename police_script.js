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
    closeModalBtn: document.querySelector('.modal .close-btn'),
    caseGraphContainer: document.getElementById('caseGraphContainer')
};

// 卦象資料和轉換工具函式
const numToGua = ['', '乾', '兌', '離', '震', '巽', '坎', '艮', '坤'];

// Correct mapping for trigram numbers to binary strings (bottom to top)
const trigramToBinary = {
    1: '111', 2: '011', 3: '101', 4: '001',
    5: '110', 6: '010', 7: '100', 8: '000'
};

// Reverse mapping from binary strings to trigram numbers
const binaryToTrigram = Object.fromEntries(
    Object.entries(trigramToBinary).map(([key, value]) => [value, parseInt(key)])
);

window.onload = async () => {
    // 從外部 JSON 檔案載入資料
    await loadHexagramData();

    // 事件監聽器
    dom.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            dom.tabs.forEach(t => t.classList.remove('active'));
            dom.tabContents.forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const targetTab = e.currentTarget.dataset.tab;
            document.getElementById(targetTab).classList.add('active');
            if (targetTab === 'time') {
                updateTimeDisplay();
            }
        });
    });

    dom.calculateBtn.addEventListener('click', startCalculation);
    dom.btnSave.addEventListener('click', saveCase);
    dom.btnLoad.addEventListener('click', showHistoryModal);
    dom.btnExport.addEventListener('click', exportCases);
    dom.btnImport.addEventListener('click', () => dom.btnImportFile.click());
    dom.btnClear.addEventListener('click', clearAllCases);
    dom.jsonFile.addEventListener('change', handleFileUpload);
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
            event.returnValue = '您有未儲存的案件，確定要離開嗎？未儲存的資料將會遺失。';
        }
    });
};

async function loadHexagramData() {
    try {
        const response = await fetch('police_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        hexagramData = await response.json();
        updateStatus('已載入 police_data.json');
        populateGuaSelects();
        populateCaseTypeSelect();
    } catch (error) {
        console.error('載入卦象資料失敗:', error);
        updateStatus('載入失敗，請檢查 police_data.json 檔案。');
        alert('無法載入卦象資料，部分功能可能無法使用。');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            hexagramData = JSON.parse(e.target.result);
            updateStatus(`已載入「${file.name}」`);
            alert('已成功載入新的 JSON 檔案。');
            populateCaseTypeSelect();
            populateGuaSelects();
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
    const upperSelect = dom.upperGuaSelect;
    const lowerSelect = dom.lowerGuaSelect;
    const changingLineSelect = dom.changingLineManual;
    
    upperSelect.innerHTML = '';
    lowerSelect.innerHTML = '';
    changingLineSelect.innerHTML = '';

    if (!hexagramData.gua) return;

    for (let i = 1; i <= 8; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = hexagramData.gua[i].name;
        upperSelect.appendChild(option.cloneNode(true));
        lowerSelect.appendChild(option.cloneNode(true));
    }

    for (let i = 1; i <= 6; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `第 ${i} 爻`;
        changingLineSelect.appendChild(option);
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

function updateTimeDisplay() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const display = document.getElementById('currentTimeDisplay');
    display.textContent = `目前時間：${year}年${month}月${day}日，${hour}時`;
}

function startCalculation() {
    if (isUnsaved && !confirm('您有未儲存的案件，確定要進行新的推算嗎？未儲存的資料將會遺失。')) {
        return;
    }

    if (Object.keys(hexagramData).length === 0 || !hexagramData.hexagrams) {
        alert('卦象資料尚未載入，請先上傳 JSON 檔案或等待預設檔案載入。');
        return;
    }

    const activeTab = document.querySelector('.tab-content.active').id;
    let lowerGuaNum, upperGuaNum, changingLine, inputMethod;

    if (activeTab === 'manual') {
        upperGuaNum = parseInt(dom.upperGuaSelect.value, 10);
        lowerGuaNum = parseInt(dom.lowerGuaSelect.value, 10);
        changingLine = parseInt(dom.changingLineManual.value, 10);
        inputMethod = '手動取卦';
    } else if (activeTab === 'number') {
        const input = dom.numInput.value;
        if (input.length < 3 || isNaN(input)) {
            alert('請輸入有效的數字。');
            return;
        }
        const num1 = parseInt(input.substring(0, input.length/3), 10);
        const num2 = parseInt(input.substring(input.length/3, input.length*2/3), 10);
        const num3 = parseInt(input.substring(input.length*2/3, input.length), 10);
        
        if (isNaN(num1) || isNaN(num2) || isNaN(num3) || num1 < 1 || num2 < 1 || num3 < 1) {
            alert('請輸入有效的數字。');
            return;
        }
        
        upperGuaNum = (num1 % 8 === 0) ? 8 : num1 % 8;
        lowerGuaNum = (num2 % 8 === 0) ? 8 : num2 % 8;
        changingLine = (num3 % 6 === 0) ? 6 : num3 % 6;
        inputMethod = '數字取卦';

    } else if (activeTab === 'time') {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hour = now.getHours();
        
        const upperSum = year + month + day;
        const lowerSum = year + month + day + hour;
        const changingSum = upperSum + lowerSum; 

        upperGuaNum = (upperSum % 8 === 0) ? 8 : upperSum % 8;
        lowerGuaNum = (lowerSum % 8 === 0) ? 8 : lowerSum % 8;
        changingLine = (changingSum % 6 === 0) ? 6 : changingSum % 6;
        inputMethod = '時間取卦';
    }

    const caseType = dom.caseTypeSelect.value;
    const caseName = dom.caseNameInput.value || `未命名案件 - ${new Date().toLocaleString()}`;
    
    generateReport(lowerGuaNum, upperGuaNum, changingLine, inputMethod, caseType, caseName);
    
    // Auto-save after successful calculation
    saveCase();
}

function generateReport(lowerGuaNum, upperGuaNum, changingLine, inputMethod, caseType, caseName) {
    const mainGua = hexagramData.hexagrams[`${upperGuaNum}_${lowerGuaNum}`] || { name: '未知卦名', summary: '無相關解釋。' };
    
    const lowerHexagramBinary = trigramToBinary[lowerGuaNum];
    const upperHexagramBinary = trigramToBinary[upperGuaNum];
    const fullHexagramBinary = upperHexagramBinary + lowerHexagramBinary;

    const interHexagramBinaryLower = fullHexagramBinary.substring(2, 5);
    const interHexagramBinaryUpper = fullHexagramBinary.substring(1, 4);
    
    const interGuaLowerNum = binaryToTrigram[interHexagramBinaryLower];
    const interGuaUpperNum = binaryToTrigram[interHexagramBinaryUpper];
    const interGua = hexagramData.hexagrams[`${interGuaUpperNum}_${interGuaLowerNum}`] || { name: '未知互卦', summary: '無相關解釋。' };
    
    let changedFullHexagramBinary = fullHexagramBinary.split('');
    const lineIndex = 6 - changingLine;
    changedFullHexagramBinary[lineIndex] = changedFullHexagramBinary[lineIndex] === '0' ? '1' : '0';
    changedFullHexagramBinary = changedFullHexagramBinary.join('');
    
    const changedUpperGuaBinary = changedFullHexagramBinary.substring(0, 3);
    const changedLowerGuaBinary = changedFullHexagramBinary.substring(3, 6);
    
    const changedUpperGuaNum = binaryToTrigram[changedUpperGuaBinary];
    const changedLowerGuaNum = binaryToTrigram[changedLowerGuaBinary];
    
    const changedGua = hexagramData.hexagrams[`${changedUpperGuaNum}_${changedLowerGuaNum}`] || { name: '未知變卦', summary: '無相關解釋。' };
    
    let tiGua, yongGua;
    if (changingLine > 3) {
        tiGua = hexagramData.gua[lowerGuaNum];
        yongGua = hexagramData.gua[upperGuaNum];
    } else {
        tiGua = hexagramData.gua[upperGuaNum];
        yongGua = hexagramData.gua[lowerGuaNum];
    }

    let relationText = '';
    let relationStatus = '';
    const tiElement = tiGua.element;
    const yongElement = yongGua.element;

    if (tiElement === yongElement) { 
        relationText = `體卦與用卦為**比和**關係`;
        relationStatus = `**【平】**代表雙方勢均力敵，案件將按常理發展，但可能需要更多努力。`;
    }
    else if (hexagramData.element_relations[tiElement].生 === yongElement) { 
        relationText = `體卦${tiGua.name}生用卦${yongGua.name}，代表**我方生助對方**`; 
        relationStatus = `**【凶】**這意味著警方主動付出，但案件進展緩慢，需防範嫌犯藉此脫逃。`; 
    }
    else if (hexagramData.element_relations[tiElement].剋 === yongElement) { 
        relationText = `體卦${tiGua.name}剋用卦${yongGua.name}，代表**我方克制對方**`; 
        relationStatus = `**【吉】**這意味著警方能掌控局面，可成功將嫌犯繩之以法。`; 
    }
    else if (hexagramData.element_relations[yongElement].生 === tiGua) { 
        relationText = `用卦${yongGua.name}生體卦${tiGua.name}，代表**對方生助我方**`; 
        relationStatus = `**【吉】**這意味著嫌犯或線索提供意外幫助，讓警方被動獲得突破。`; 
    }
    else if (hexagramData.element_relations[yongElement].剋 === tiGua) { 
        relationText = `用卦${yongGua.name}剋體卦${tiGua.name}，代表**對方克制我方**`; 
        relationStatus = `**【凶】**這意味著警方辦案受阻，嫌犯反制能力強，需謹慎應對。`; 
    }

    let caseAnalysisText = '';
    if (caseType && hexagramData.case_analysis[caseType]) {
        const caseData = hexagramData.case_analysis[caseType];
        caseAnalysisText += `<h4>專案案件分析：${caseData.name}</h4><p>${caseData.summary}</p>`;
        let foundAnalysis = false;
        const guaKeys = [`${upperGuaNum}_${lowerGuaNum}`, `${interGuaUpperNum}_${interGuaLowerNum}`, `${changedUpperGuaNum}_${changedLowerGuaNum}`];
        for (const key of guaKeys) {
            if (caseData.related_hexagrams[key]) {
                caseAnalysisText += `<p><strong>${hexagramData.hexagrams[key].name}：</strong>${caseData.related_hexagrams[key]}</p>`;
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
            <li><strong>體用生剋</strong>：${relationText}。${relationStatus}</li>
        </ul>
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

    // 繪製五行圖
    dom.caseGraphContainer.style.display = 'block';
    renderFiveElementGraph(lowerGuaNum, upperGuaNum);
}

// --- 五行生剋圖相關函式 ---
function getRelationType(sourceElement, targetElement) {
    const relations = hexagramData.five_elements_relations;
    if (relations[sourceElement].生 === targetElement) return '生';
    if (relations[sourceElement].剋 === targetElement) return '剋';
    return null;
}

function renderFiveElementGraph(lowerGuaNum, upperGuaNum) {
    const container = document.getElementById('caseGraph');
    container.innerHTML = ''; // 清空舊圖表

    const elements = ['金', '木', '水', '火', '土'];
    const elementToGua = elements.reduce((acc, el) => {
        acc[el] = Object.values(hexagramData.gua).filter(g => g.element === el).map(g => g.shortName);
        return acc;
    }, {});

    const elementPositions = {
        '金': { x: 300, y: 100 }, '木': { x: 100, y: 250 }, '水': { x: 200, y: 450 },
        '火': { x: 400, y: 250 }, '土': { x: 300, y: 350 }
    };

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('id', 'fiveElementGraph');
    svg.setAttribute('width', '500');
    svg.setAttribute('height', '500');
    svg.setAttribute('viewBox', '0 0 500 500');

    const elementsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    elementsGroup.setAttribute('id', 'elementsGroup');
    svg.appendChild(elementsGroup);

    elements.forEach(element => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('cx', elementPositions[element].x);
        circle.setAttribute('cy', elementPositions[element].y);
        circle.setAttribute('r', 40);
        circle.setAttribute('fill', hexagramData.element_colors[element]);
        circle.setAttribute('stroke', 'black');
        circle.setAttribute('stroke-width', 2);
        circle.classList.add('element-circle');

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('x', elementPositions[element].x);
        text.setAttribute('y', elementPositions[element].y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('font-size', '20');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', 'white');
        text.textContent = element;

        const guaText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        guaText.setAttribute('x', elementPositions[element].x);
        guaText.setAttribute('y', elementPositions[element].y + 30);
        guaText.setAttribute('text-anchor', 'middle');
        guaText.setAttribute('font-size', '12');
        guaText.setAttribute('fill', '#555');
        guaText.textContent = elementToGua[element].join(', ');
        
        elementsGroup.appendChild(circle);
        elementsGroup.appendChild(text);
        elementsGroup.appendChild(guaText);
    });

    const tiGua = hexagramData.gua[lowerGuaNum];
    const yongGua = hexagramData.gua[upperGuaNum];

    const tiElement = tiGua.element;
    const yongElement = yongGua.element;

    function drawRelation(sourceElement, targetElement, color, weight) {
        const start = elementPositions[sourceElement];
        const end = elementPositions[targetElement];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const offset = 40;
        const offsetStart = {
            x: start.x + offset * Math.cos(angle),
            y: start.y + offset * Math.sin(angle)
        };
        const offsetEnd = {
            x: end.x - offset * Math.cos(angle),
            y: end.y - offset * Math.sin(angle)
        };

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', offsetStart.x);
        line.setAttribute('y1', offsetStart.y);
        line.setAttribute('x2', offsetEnd.x);
        line.setAttribute('y2', offsetEnd.y);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', 2 + weight * 3);
        line.setAttribute('marker-end', `url(#arrowhead-${color.slice(1)})`);
        line.setAttribute('data-ti-element', tiElement);
        line.setAttribute('data-yong-element', yongElement);
        line.classList.add('relation-line');
        svg.appendChild(line);

        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute('id', `arrowhead-${color.slice(1)}`);
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', 8);
        marker.setAttribute('refY', 5);
        marker.setAttribute('markerWidth', 6);
        marker.setAttribute('markerHeight', 6);
        marker.setAttribute('orient', 'auto-start-reverse');
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        path.setAttribute('fill', color);
        marker.appendChild(path);
        svg.appendChild(marker);
    }

    const relations = hexagramData.five_elements_relations;
    
    for (const source in relations) {
        const target_生 = relations[source].生;
        const target_剋 = relations[source].剋;
        
        const isTiYongRelation_生 = (source === tiElement && target_生 === yongElement) || (source === yongElement && target_生 === tiElement);
        const isTiYongRelation_剋 = (source === tiElement && target_剋 === yongElement) || (source === yongElement && target_剋 === tiElement);
        
        let weight_生 = 0.2;
        if (isTiYongRelation_生) {
            weight_生 = 1.0;
        }
        
        let weight_剋 = 0.2;
        if (isTiYongRelation_剋) {
            weight_剋 = 1.0;
        }

        drawRelation(source, target_生, '#3498db', weight_生); // 生 (blue)
        drawRelation(source, target_剋, '#e74c3c', weight_剋); // 剋 (red)
    }
    container.appendChild(svg);
}

function saveCase() {
    if (!currentCaseData) { return; } // prevent saving if no case is calculated
    currentCaseData.notes = dom.caseNotes.value;
    let cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    const existingIndex = cases.findIndex(c => c.timestamp === currentCaseData.timestamp);
    if (existingIndex !== -1) { cases[existingIndex] = currentCaseData; }
    else { cases.push(currentCaseData); }
    localStorage.setItem('divinationCases', JSON.stringify(cases));
    isUnsaved = false;
}

function showHistoryModal() {
    const cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    if (cases.length === 0) { alert('目前沒有歷史記錄。'); return; }
    const historyList = dom.historyList;
    historyList.innerHTML = '';
    cases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    cases.forEach((c, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item';
        itemDiv.onclick = () => {
            if (isUnsaved && !confirm('您有未儲存的案件，確定要載入歷史記錄嗎？未儲存的資料將會遺失。')) { return; }
            loadCase(index);
            dom.historyModal.style.display = 'none';
        };
        itemDiv.innerHTML = `<strong>${c.caseName}</strong> (${c.inputMethod})<br><small>${new Date(c.timestamp).toLocaleString()}</small>`;
        historyList.appendChild(itemDiv);
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
    
    // Re-render the graph for the loaded case
    renderFiveElementGraph(currentCaseData.lowerGuaNum, currentCaseData.upperGuaNum);
}

function exportCases() {
    const cases = JSON.parse(localStorage.getItem('divinationCases')) || [];
    if (cases.length === 0) { alert('沒有可匯出的歷史記錄。'); return; }
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
            if (!Array.isArray(newCases)) { throw new Error('檔案格式不正確，應為 JSON 陣列。'); }
            const currentCases = JSON.parse(localStorage.getItem('divinationCases')) || [];
            const option = prompt('請選擇載入方式：\\n輸入 "1" 覆蓋現有記錄\\n輸入 "2" 合併到現有記錄\\n(取消載入請按「取消」)');
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
        if(confirm('已匯出備份，確定要清空所有記錄嗎？')) {
            localStorage.removeItem('divinationCases');
            alert('所有歷史記錄已成功清空。');
        }
    }
}

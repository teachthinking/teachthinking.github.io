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
    // 自動儲存未儲存案件
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
    const lowerHexagramBinary = toBinary(lowerGuaNum);
    const upperHexagramBinary = toBinary(upperGuaNum);
    const fullHexagramBinary = upperHexagramBinary + lowerHexagramBinary;
    const interHexagramBinaryLower = fullHexagramBinary.substring(1, 4);
    const interHexagramBinaryUpper = fullHexagramBinary.substring(2, 5);
    const interGuaLowerNum = toDecimal(interHexagramBinaryLower);
    const interGuaUpperNum = toDecimal(interHexagramBinaryUpper);
    const interGua = hexagramData.hexagrams[`${interGuaUpperNum}_${interGuaLowerNum}`] || { name: '未知互卦', summary: '無相關解釋。' };
    let changedUpperGuaNum = upperGuaNum;
    let changedLowerGuaNum = lowerGuaNum;
    if (changingLine > 3) {
        changedUpperGuaNum = (upperGuaNum % 2 === 0) ? (upperGuaNum - 1 || 8) : (upperGuaNum + 1);
    } else {
        changedLowerGuaNum = (lowerGuaNum % 2 === 0) ? (lowerGuaNum - 1 || 8) : (lowerGuaNum + 1);
    }
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
    const tiElement = tiGua.element;
    const yongElement = yongGua.element;
    if (tiElement === yongElement) { relationText = `${tiGua.name}與${yongGua.name}為**比和**關係，代表雙方勢均力敵，案件將按常理發展，但可能需要更多努力。`; }
    else if (hexagramData.element_relations[tiElement].生 === yongElement) { relationText = `${tiGua.name}生${yongGua.name}，代表**我方生助對方**。這意味著警方主動付出、積極追查，案件進展順利。`; }
    else if (hexagramData.element_relations[tiElement].剋 === yongElement) { relationText = `${tiGua.name}剋${yongGua.name}，代表**我方克制對方**。這意味著警方能掌控局面，可成功將嫌犯繩之以法。`; }
    else if (hexagramData.element_relations[yongElement].生 === tiElement) { relationText = `${yongGua.name}生${tiGua.name}，代表**對方生助我方**。這意味著嫌犯或線索提供意外幫助，讓警方被動獲得突破。`; }
    else if (hexagramData.element_relations[yongElement].剋 === tiGua) { relationText = `${yongGua.name}剋${tiGua.name}，代表**對方克制我方**。這意味著警方辦案受阻，嫌犯反制能力強，需謹慎應對。`; }

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
            <li><strong>體用生剋</strong>：體卦（我方，警方）為**${tiGua.name}**，用卦（對方，嫌犯）為**${yongGua.name}**。${relationText}</li>
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

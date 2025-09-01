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
    caseGraphContainer: document.getElementById('caseGraphContainer'),
    caseGraph: document.getElementById('caseGraph'),
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
            throw new Error(`無法載入預設 JSON 檔案，狀態碼：${response.status}`);
        }
        hexagramData = await response.json();
        if (!hexagramData.hexagrams || Object.keys(hexagramData.hexagrams).length < 64) {
            throw new Error('JSON 檔案缺少完整的卦象資料');
        }
        updateStatus('預設檔案');
        populateGuaSelects();
        populateCaseTypeSelect();
    } catch (error) {
        console.error('載入預設資料失敗:', error);
        updateStatus(`載入失敗：${error.message}，請手動上傳檔案。`);
    }
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            hexagramData = JSON.parse(e.target.result);
            if (!hexagramData.hexagrams || Object.keys(hexagramData.hexagrams).length < 64) {
                throw new Error('JSON 檔案缺少完整的卦象資料');
            }
            updateStatus(`已載入「${file.name}」`);
            alert('已成功載入新的 JSON 檔案。');
            populateGuaSelects();
            populateCaseTypeSelect();
        } catch (error) {
            console.error('解析 JSON 檔案失敗:', error);
            alert(`無效的 JSON 檔案：${error.message}，請檢查格式。`);
            updateStatus('載入失敗，請檢查檔案格式。');
        }
    };
    reader.readAsText(file);
}

function updateStatus(message) {
    dom.jsonStatus.textContent = `* 目前使用的資料檔：${message}`;
}

function populateGuaSelects() {
    const gua = hexagramData.gua || {};
    [dom.upperGuaSelect, dom.lowerGuaSelect].forEach(select => {
        select.innerHTML = '<option value="">選擇卦象</option>';
        for (let i = 1; i <= 8; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = gua[i]?.name || `卦 ${i}`;
            select.appendChild(option);
        }
    });

    dom.changingLineManual.innerHTML = '<option value="">選擇動爻</option>';
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

    if (!hexagramData || !hexagramData.hexagrams || Object.keys(hexagramData.hexagrams).length === 0) {
        alert('卦象資料尚未載入，請先上傳 JSON 檔案或等待預設檔案載入。');
        return;
    }

    const activeTabId = document.querySelector('.tab-content.active').id;
    let lowerGuaNum, upperGuaNum, changingLine, inputMethod;

    if (activeTabId === 'time') {
        const now = new Date();
        const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const input = timeStr.slice(-9);
        document.getElementById('currentTime').textContent = now.toLocaleString();

        if (input.length !== 9 || !/^\d{9}$/.test(input)) {
            alert('時間取卦失敗：無法生成有效的9位數數字！');
            return;
        }

        const sumLower = parseInt(input.substring(0, 3), 10);
        const sumUpper = parseInt(input.substring(3, 6), 10);
        const sumChange = parseInt(input.substring(6, 9), 10);
        
        lowerGuaNum = sumLower % 8 === 0 ? 8 : sumLower % 8;
        upperGuaNum = sumUpper % 8 === 0 ? 8 : sumUpper % 8;
        changingLine = sumChange % 6 === 0 ? 6 : sumChange % 6;
        inputMethod = '時間起卦';
    } else if (activeTabId === 'number') {
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

        if (!upperGuaNum || !lowerGuaNum || !changingLine) {
            alert('請確保所有輸入欄位均已填寫！');
            return;
        }
    }

    const caseType = dom.caseTypeSelect.value;
    const caseName = dom.caseNameInput.value || `未命名案件 - ${new Date().toLocaleString()}`;
    
    generateReport(lowerGuaNum, upperGuaNum, changingLine, inputMethod, caseType, caseName);
    isUnsaved = true;
}

function generateReport(lowerGuaNum, upperGuaNum, changingLine, inputMethod, caseType, caseName) {
    if (!hexagramData.hexagrams) {
        console.error('hexagramData.hexagrams 未定義');
        alert('卦象資料未載入，請檢查 JSON 檔案。');
        return;
    }

    const mainGua = hexagramData.hexagrams[`${upperGuaNum}_${lowerGuaNum}`] || { name: '未知卦名', summary: '無相關解釋。' };
    const mainGuaBinary = toBinary(upperGuaNum) + toBinary(lowerGuaNum);
    const interGuaUpperBinary = mainGuaBinary.substring(1, 4);
    const interGuaLowerBinary = mainGuaBinary.substring(2, 5);
    const interGuaUpperNum = toDecimal(interGuaUpperBinary);
    const interGuaLowerNum = toDecimal(interGuaLowerBinary);
    const interGua = hexagramData.hexagrams[`${interGuaUpperNum}_${interGuaLowerNum}`] || { name: '未知互卦', summary: '案件中間階段，尚不明朗，需進一步觀察。' };

    let changedGuaBinary = "";
    for (let i = 0; i < 6; i++) {
        const lineIndex = 6 - i;
        if (lineIndex === changingLine) {
            changedGuaBinary += (mainGuaBinary[i] === '0') ? '1' : '0';
        } else {
            changedGuaBinary += mainGuaBinary[i];
        }
    }
    const changedUpperGuaNum = toDecimal(changedGuaBinary.substring(0, 3));
    const changedLowerGuaNum = toDecimal(changedGuaBinary.substring(3, 6));
    const changedGua = hexagramData.hexagrams[`${changedUpperGuaNum}_${changedLowerGuaNum}`] || { name: '未知變卦', summary: '案件最終結果不明，需更多線索。' };

    let tiGuaNum, yongGuaNum;
    if (changingLine > 3) {
        tiGuaNum = lowerGuaNum;
        yongGuaNum = upperGuaNum;
    } else {
        tiGuaNum = upperGuaNum;
        yongGuaNum = lowerGuaNum;
    }
    const tiGua = hexagramData.gua[tiGuaNum] || { name: '未知體卦', element: '未知' };
    const yongGua = hexagramData.gua[yongGuaNum] || { name: '未知用卦', element: '未知' };

    let relationText = '';
    const tiElement = tiGua.element;
    const yongElement = yongGua.element;
    const sheng = hexagramData.element_relations?.[tiElement]?.生;
    const ke = hexagramData.element_relations?.[tiElement]?.剋;
    let relationType = '比和';
    let auspiciousness = '平';
    if (tiElement === yongElement) {
        relationText = `${tiGua.name}與${yongGua.name}比和，代表雙方力量平衡（平）。`;
    } else if (sheng === yongElement) {
        relationText = `${tiGua.name}生${yongGua.name}，代表我方生助對方（吉）。`;
        relationType = '生';
        auspiciousness = '吉';
    } else if (ke === yongElement) {
        relationText = `${tiGua.name}剋${yongGua.name}，代表我方壓制對方（凶）。`;
        relationType = '剋';
        auspiciousness = '凶';
    } else {
        relationText = `${tiGua.name}與${yongGua.name}無直接生剋關係，力量平衡（平）。`;
    }

    const guaData = {
        mainTi: tiGua,
        mainYong: yongGua,
        interTi: hexagramData.gua[interGuaUpperNum] || { name: '未知', element: '未知' },
        interYong: hexagramData.gua[interGuaLowerNum] || { name: '未知', element: '未知' },
        changedTi: hexagramData.gua[changedUpperGuaNum] || { name: '未知', element: '未知' },
        changedYong: hexagramData.gua[changedLowerGuaNum] || { name: '未知', element: '未知' },
        relation: relationType
    };

    displayResults({
        mainGua, interGua, changedGua, tiGua, yongGua, relationText, relationType, auspiciousness,
        inputMethod, caseType, caseName, changingLine, guaData, upperGuaNum, lowerGuaNum
    });
}

function generateSuspectClueAnalysis(caseType, upperGuaNum, lowerGuaNum, tiGua, yongGua) {
    if (!caseType || !hexagramData.case_analysis?.[caseType]) {
        return '未選擇案件類型，無法提供具體嫌犯與線索分析。請選擇案件類型以獲取更精確的建議。';
    }

    const analysis = hexagramData.case_analysis[caseType];
    const hexKey = `${upperGuaNum}_${lowerGuaNum}`;
    let suspectClueText = analysis.related_hexagrams[hexKey] || analysis.summary;

    // 根據卦象特徵和案件類型生成嫌犯與線索分析
    const tiFeature = tiGua.feature || '未知';
    const yongFeature = yongGua.feature || '未知';
    let analysisText = `根據卦象特徵，嫌犯或關鍵線索可能具有以下特徵：\n`;
    
    switch (caseType) {
        case 'drug_crime':
            analysisText += `- 嫌犯可能為 ${yongFeature} 相關角色（例如盜賊、隱秘行動者）。\n`;
            analysisText += `- 線索可能指向隱蔽地點（如 ${tiGua.direction} 方向）或涉及 ${yongGua.element} 相關環境（例如金屬場所、水邊）。\n`;
            analysisText += `- 建議：調查夜間交易、線民情報或 ${tiGua.direction} 方向的隱秘場所。`;
            break;
        case 'fraud':
            analysisText += `- 嫌犯可能擅長 ${yongFeature}（例如口才、欺騙）。\n`;
            analysisText += `- 線索可能在通訊記錄或 ${tiGua.direction} 方向的固定地點。\n`;
            analysisText += `- 建議：檢查數位通訊、銀行流水或人頭帳戶。`;
            break;
        case 'theft_robbery':
            analysisText += `- 嫌犯可能為 ${yongFeature}（例如行動迅速、隱秘潛入者）。\n`;
            analysisText += `- 線索可能在 ${tiGua.direction} 或涉及快速移動的交通工具。\n`;
            analysisText += `- 建議：調查監視器、車輛記錄或潛入通道。`;
            break;
        case 'sexual_assault_domestic_violence':
            analysisText += `- 嫌犯可能與 ${yongFeature}（例如情感糾葛、家庭關係）有關。\n`;
            analysisText += `- 線索可能在受害者的社交圈或 ${tiGua.direction} 的住所。\n`;
            analysisText += `- 建議：調查嫌犯與受害者的關係網，保護受害者安全。`;
            break;
        case 'cyber_crime':
            analysisText += `- 嫌犯可能為 ${yongFeature}（例如技術專家、匿名者）。\n`;
            analysisText += `- 線索可能在網路IP或 ${tiGua.direction} 的伺服器地點。\n`;
            analysisText += `- 建議：尋求技術支援，追蹤數位足跡。`;
            break;
        case 'organized_crime':
            analysisText += `- 嫌犯可能為 ${yongFeature}（例如領導者、團夥成員）。\n`;
            analysisText += `- 線索可能指向 ${tiGua.direction} 的團夥據點。\n`;
            analysisText += `- 建議：鎖定核心領導，部署集體行動。`;
            break;
        case 'missing_persons':
            analysisText += `- 失蹤者可能與 ${yongFeature}（例如旅行者、移動者）有關。\n`;
            analysisText += `- 線索可能在 ${tiGua.direction} 或異地。\n`;
            analysisText += `- 建議：擴大搜尋範圍，檢查交通記錄。`;
            break;
        case 'traffic_accidents':
            analysisText += `- 肇事者可能為 ${yongFeature}（例如急躁、快速移動者）。\n`;
            analysisText += `- 線索可能在 ${tiGua.direction} 的路口或監視器。\n`;
            analysisText += `- 建議：還原事故現場，檢查行車記錄。`;
            break;
        default:
            analysisText += `- 無法提供具體分析，請確認案件類型。`;
    }

    return `${suspectClueText}\n${analysisText}`;
}

function displayResults(data) {
    const { mainGua, interGua, changedGua, tiGua, yongGua, relationText, relationType, auspiciousness, inputMethod, caseType, caseName, changingLine, guaData, upperGuaNum, lowerGuaNum } = data;
    const resultArea = dom.resultArea;
    const caseGraphContainer = dom.caseGraphContainer;
    const notesSection = dom.notesSection;

    let html = `
        <h3>${mainGua.name || '未知卦名'} (${inputMethod})</h3>
        <p><strong>案件名稱：</strong>${caseName}</p>
        <h4>案件發展與轉折分析</h4>
        <p><strong>主卦（起初狀態）：</strong>${mainGua.name || '未知'} - ${mainGua.summary || '無相關解釋'}</p>
        <p><strong>互卦（中間發展）：</strong>${interGua.name || '未知'} - ${interGua.summary || '案件中間階段，尚不明朗，需進一步觀察'}</p>
        <p><strong>變卦（最終轉折）：</strong>${changedGua.name || '未知'} - ${changedGua.summary || '案件最終結果不明，需更多線索'}</p>
        <p><strong>動爻：</strong>第 ${changingLine} 爻 - ${hexagramData.line_summary?.[changingLine] || '無動爻解釋'}</p>
        <p><strong>體用關係：</strong>${relationText}</p>
        <p><strong>吉凶：</strong>${auspiciousness}</p>
    `;

    if (caseType && hexagramData.case_analysis?.[caseType]) {
        const analysis = hexagramData.case_analysis[caseType];
        html += `
            <h4>案件類型分析：${analysis.name}</h4>
            <p>${analysis.summary}</p>
        `;
        const hexKey = `${upperGuaNum}_${lowerGuaNum}`;
        if (analysis.related_hexagrams[hexKey]) {
            html += `<p><strong>相關卦象分析：</strong>${analysis.related_hexagrams[hexKey]}</p>`;
        }
        html += `<h4>嫌犯與線索分析</h4>
                 <p>${generateSuspectClueAnalysis(caseType, upperGuaNum, lowerGuaNum, tiGua, yongGua)}</p>`;
    }

    const season = hexagramData.five_to_season[tiGua.element] || ['未知季節'];
    html += `<p><strong>應期分析：</strong>案件可能在 ${season.join('、')} 月有突破。</p>`;

    resultArea.innerHTML = html;
    resultArea.style.display = 'flex';
    notesSection.style.display = 'block';
    caseGraphContainer.style.display = 'block';

    const caseGraph = dom.caseGraph;
    if (caseGraph) {
        drawGuaGraph(caseGraph, guaData, caseName);
    }

    currentCaseData = { caseName, inputMethod, reportHtml: html, notes: dom.caseNotes.value, guaData, timestamp: new Date().toISOString() };
}

function drawGuaGraph(svgElement, guaData, caseName) {
    const width = svgElement.clientWidth;
    const height = 300;
    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);
    d3.select(svgElement).selectAll("*").remove();

    const svg = d3.select(svgElement)
        .attr('width', width)
        .attr('height', height);

    const nodes = [
        { id: 'mainTi', name: guaData.mainTi.name, element: guaData.mainTi.element, x: width * 0.25, y: height * 0.25 },
        { id: 'mainYong', name: guaData.mainYong.name, element: guaData.mainYong.element, x: width * 0.75, y: height * 0.25 },
        { id: 'interTi', name: guaData.interTi.name, element: guaData.interTi.element, x: width * 0.25, y: height * 0.5 },
        { id: 'interYong', name: guaData.interYong.name, element: guaData.interYong.element, x: width * 0.75, y: height * 0.5 },
        { id: 'changedTi', name: guaData.changedTi.name, element: guaData.changedTi.element, x: width * 0.25, y: height * 0.75 },
        { id: 'changedYong', name: guaData.changedYong.name, element: guaData.changedYong.element, x: width * 0.75, y: height * 0.75 }
    ];

    const currentMonth = new Date().getMonth() + 1;
    const lineWeights = hexagramData.line_weights || [0.2, 0.4, 0.6, 0.8, 1.0];
    const elementColors = hexagramData.element_colors || {
        '金': '#f1c40f',
        '木': '#2ecc71',
        '水': '#3498db',
        '火': '#e74c3c',
        '土': '#e67e22'
    };
    const fiveStates = ['旺', '相', '休', '囚', '死'];

    const links = [
        { source: 'mainTi', target: 'mainYong', type: guaData.relation },
        { source: 'interTi', target: 'interYong', type: getRelation(guaData.interTi.element, guaData.interYong.element) },
        { source: 'changedTi', target: 'changedYong', type: getRelation(guaData.changedTi.element, guaData.changedYong.element) }
    ];

    svg.append('defs').selectAll('marker')
        .data(['生', '剋', '比和'])
        .enter()
        .append('marker')
        .attr('id', d => `arrow-${d.toLowerCase()}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', d => {
            if (d === '生') return '#2ecc71';
            if (d === '剋') return '#e74c3c';
            return '#f1c40f';
        });

    svg.selectAll('.relation-line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', d => `relation-line ${d.type.toLowerCase()}`)
        .attr('x1', d => nodes.find(n => n.id === d.source).x)
        .attr('y1', d => nodes.find(n => n.id === d.source).y)
        .attr('x2', d => nodes.find(n => n.id === d.target).x)
        .attr('y2', d => nodes.find(n => n.id === d.target).y)
        .attr('stroke', d => {
            if (d.type === '生') return '#2ecc71';
            if (d.type === '剋') return '#e74c3c';
            return '#f1c40f';
        })
        .attr('stroke-width', d => {
            const sourceElement = nodes.find(n => n.id === d.source).element;
            const seasonMonths = hexagramData.five_to_season[sourceElement] || [];
            if (seasonMonths.includes(String(currentMonth))) return lineWeights[4]; // 旺
            if (seasonMonths.includes(String((currentMonth + 1) % 12 || 12))) return lineWeights[3]; // 相
            if (seasonMonths.includes(String((currentMonth + 2) % 12 || 12))) return lineWeights[2]; // 休
            if (seasonMonths.includes(String((currentMonth + 3) % 12 || 12))) return lineWeights[1]; // 囚
            return lineWeights[0]; // 死
        })
        .attr('marker-end', d => `url(#arrow-${d.type.toLowerCase()})`);

    svg.selectAll('.gua-node')
        .data(nodes)
        .enter()
        .append('g')
        .each(function(d) {
            const group = d3.select(this);
            group.append('circle')
                .attr('class', 'gua-node')
                .attr('cx', d.x)
                .attr('cy', d.y)
                .attr('r', 30)
                .attr('fill', elementColors[d.element] || '#fff')
                .attr('stroke', '#333')
                .attr('stroke-width', 1);

            const stateIndex = (() => {
                const seasonMonths = hexagramData.five_to_season[d.element] || [];
                if (seasonMonths.includes(String(currentMonth))) return 0; // 旺
                if (seasonMonths.includes(String((currentMonth + 1) % 12 || 12))) return 1; // 相
                if (seasonMonths.includes(String((currentMonth + 2) % 12 || 12))) return 2; // 休
                if (seasonMonths.includes(String((currentMonth + 3) % 12 || 12))) return 3; // 囚
                return 4; // 死
            })();
            const guaLabels = [d.name, d.element, fiveStates[stateIndex], caseName];
            guaLabels.forEach((label, index) => {
                if (label) {
                    group.append('text')
                        .attr('x', d.x)
                        .attr('y', d.y + (index === 0 ? -10 : index === 1 ? 2 : index === 2 ? 14 : 26))
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '10px')
                        .attr('class', 'gua-label')
                        .text(label);
                }
            });

            group.on('mouseover', function() {
                d3.select(this).select('circle').style('transform', 'scale(1.1)');
                d3.select(this).selectAll('text').style('transform', 'scale(1.1)');
            });
            group.on('mouseout', function() {
                d3.select(this).select('circle').style('transform', 'scale(1)');
                d3.select(this).selectAll('text').style('transform', 'scale(1)');
            });
        });
}

function getRelation(el1, el2) {
    if (!el1 || !el2 || !hexagramData.element_relations) return '比和';
    if (el1 === el2) return '比和';
    if (hexagramData.element_relations[el1]?.生 === el2) return '生';
    if (hexagramData.element_relations[el1]?.剋 === el2) return '剋';
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

    const caseGraph = dom.caseGraph;
    if (caseGraph && currentCaseData.guaData) {
        dom.caseGraphContainer.style.display = 'block';
        drawGuaGraph(caseGraph, currentCaseData.guaData, currentCaseData.caseName);
    }

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
    if (confirm('確定要清空所有歷史記錄吗？此動作無法復原。您要先匯出備份吗？')) {
        exportCases();
        if (confirm('已匯出備份，確定要清空所有記錄吗？')) {
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

    function updateCurrentTime() {
        const now = new Date();
        document.getElementById('currentTime').textContent = now.toLocaleString();
    }
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

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
            event.returnValue = '您有未儲存的案件，確定要離開吗？';
        }
    });
}

document.addEventListener('DOMContentLoaded', init);

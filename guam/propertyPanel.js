class PropertyPanel {
    constructor() {
        this.currentComponent = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 點擊畫布空白處取消選擇
        document.getElementById('canvas').addEventListener('click', (e) => {
            if (e.target === document.getElementById('canvas')) {
                this.clearSelection();
            }
        });
    }
    
    showProperties(component) {
        this.currentComponent = component;
        this.updatePanel(component);
    }
    
    updatePanel(component) {
        const panel = document.getElementById('property-content');
        panel.innerHTML = this.generatePropertiesHTML(component);
        this.bindPropertyEvents(component);
    }
    
    generatePropertiesHTML(component) {
        let html = `
            <div class="property-group">
                <h4>基本屬性</h4>
                <div class="property-item">
                    <label>組件類型</label>
                    <input type="text" value="${component.type}" disabled>
                </div>
                <div class="property-item">
                    <label>位置 X</label>
                    <input type="number" value="${component.position.x}" data-property="position.x">
                </div>
                <div class="property-item">
                    <label>位置 Y</label>
                    <input type="number" value="${component.position.y}" data-property="position.y">
                </div>
            </div>
        `;
        
        switch(component.type) {
            case 'text':
                html += this.getTextProperties(component);
                break;
            case 'image':
                html += this.getImageProperties(component);
                break;
            case 'button':
                html += this.getButtonProperties(component);
                break;
            case 'container':
                html += this.getContainerProperties(component);
                break;
            case 'divider':
                html += this.getDividerProperties(component);
                break;
        }
        
        return html;
    }
    
    getTextProperties(component) {
        return `
            <div class="property-group">
                <h4>文字屬性</h4>
                <div class="property-item">
                    <label>文字內容</label>
                    <textarea data-property="content" rows="3">${component.content}</textarea>
                </div>
                <div class="property-item">
                    <label>字體大小</label>
                    <input type="range" min="8" max="72" value="${parseInt(component.properties.fontSize)}" 
                           data-property="fontSize">
                    <span>${component.properties.fontSize}</span>
                </div>
                <div class="property-item">
                    <label>文字顏色</label>
                    <input type="color" value="${component.properties.color}" data-property="color">
                </div>
                <div class="property-item">
                    <label>對齊方式</label>
                    <select data-property="textAlign">
                        <option value="left" ${component.properties.textAlign === 'left' ? 'selected' : ''}>左對齊</option>
                        <option value="center" ${component.properties.textAlign === 'center' ? 'selected' : ''}>居中</option>
                        <option value="right" ${component.properties.textAlign === 'right' ? 'selected' : ''}>右對齊</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    getImageProperties(component) {
        return `
            <div class="property-group">
                <h4>圖片屬性</h4>
                <div class="property-item">
                    <label>圖片網址</label>
                    <input type="text" value="${component.content}" data-property="content" placeholder="輸入圖片URL">
                </div>
                <div class="property-item">
                    <label>寬度</label>
                    <input type="text" value="${component.properties.width}" data-property="width" placeholder="200px">
                </div>
                <div class="property-item">
                    <label>圓角</label>
                    <input type="text" value="${component.properties.borderRadius}" data-property="borderRadius" placeholder="8px">
                </div>
            </div>
        `;
    }
    
    bindPropertyEvents(component) {
        const inputs = document.querySelectorAll('#property-content input, #property-content select, #property-content textarea');
        
        inputs.forEach(input => {
            input.addEventListener('input', Helpers.debounce((e) => {
                this.updateComponentProperty(component, e.target);
            }, 300));
            
            input.addEventListener('change', (e) => {
                this.updateComponentProperty(component, e.target);
            });
        });
    }
    
    updateComponentProperty(component, input) {
        const property = input.dataset.property;
        let value = input.value;
        
        // 特殊處理嵌套屬性
        if (property.includes('.'))

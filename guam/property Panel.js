class PropertyPanel {
    constructor() {
        this.currentComponent = null;
    }
    
    showProperties(component) {
        this.currentComponent = component;
        this.updatePanel(component);
    }
    
    updatePanel(component) {
        const panel = document.getElementById('property-panel');
        panel.innerHTML = this.generatePropertiesHTML(component);
        this.bindPropertyEvents(component);
    }
    
    generatePropertiesHTML(component) {
        switch(component.type) {
            case 'text':
                return `
                    <h3>文字屬性</h3>
                    <label>字體大小
                        <input type="range" min="12" max="72" 
                               value="${component.properties.fontSize}" 
                               data-property="fontSize">
                    </label>
                    <label>文字顏色
                        <input type="color" 
                               value="${component.properties.color}" 
                               data-property="color">
                    </label>
                `;
            // 其他組件類型...
        }
    }
    
    bindPropertyEvents(component) {
        const inputs = document.querySelectorAll('#property-panel input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const property = e.target.dataset.property;
                const value = e.target.value;
                this.updateComponentProperty(component, property, value);
            });
        });
    }
    
    updateComponentProperty(component, property, value) {
        // 更新組件樣式
        const element = document.querySelector(`[data-id="${component.id}"]`);
        if (element) {
            element.style[property] = value;
        }
        
        // 更新組件數據
        component.properties[property] = value;
        this.saveToHistory('update', component);
    }
}

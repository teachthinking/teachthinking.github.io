class ComponentSystem {
    constructor() {
        this.components = [];
        this.currentComponent = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('clear-canvas').addEventListener('click', () => {
            this.clearCanvas();
        });
    }
    
    createComponent(type, x, y) {
        const id = Helpers.generateId();
        const defaultProps = this.getDefaultProperties(type);
        
        const component = {
            id,
            type,
            position: { x, y },
            properties: defaultProps,
            content: this.getDefaultContent(type)
        };
        
        this.components.push(component);
        this.renderComponent(component);
        this.saveToHistory('create', component);
        
        return component;
    }
    
    getDefaultProperties(type) {
        const defaults = {
            text: {
                fontSize: '16px',
                color: '#333333',
                fontWeight: 'normal',
                textAlign: 'left',
                backgroundColor: 'transparent',
                padding: '10px',
                borderRadius: '4px'
            },
            image: {
                width: '200px',
                height: 'auto',
                borderRadius: '8px',
                objectFit: 'cover'
            },
            button: {
                text: '按鈕文字',
                backgroundColor: '#3498db',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '16px'
            },
            container: {
                width: '300px',
                height: '200px',
                backgroundColor: '#f8f9fa',
                border: '2px dashed #ddd',
                borderRadius: '8px',
                padding: '20px'
            },
            divider: {
                width: '100%',
                height: '2px',
                backgroundColor: '#ddd',
                margin: '20px 0'
            }
        };
        
        return defaults[type] || {};
    }
    
    getDefaultContent(type) {
        const content = {
            text: '雙擊編輯文字內容...',
            image: 'assets/placeholder.jpg',
            button: '點擊我',
            container: '',
            divider: ''
        };
        
        return content[type] || '';
    }
    
    renderComponent(component) {
        const element = document.createElement('div');
        element.className = `component ${component.type}`;
        element.dataset.id = component.id;
        element.style.position = 'absolute';
        element.style.left = `${component.position.x}px`;
        element.style.top = `${component.position.y}px`;
        
        switch(component.type) {
            case 'text':
                element.contentEditable = true;
                element.innerHTML = component.content;
                this.applyStyles(element, component.properties);
                break;
                
            case 'image':
                element.innerHTML = `
                    <img src="${component.content}" alt="圖片" style="width:100%; height:100%;">
                    <div class="image-actions" style="position:absolute; top:5px; right:5px;">
                        <button class="replace-btn" title="更換圖片">🔄</button>
                    </div>
                `;
                this.applyStyles(element, component.properties);
                break;
                
            case 'button':
                element.innerHTML = `<button>${component.content}</button>`;
                this.applyStyles(element.querySelector('button'), component.properties);
                break;
                
            case 'container':
                this.applyStyles(element, component.properties);
                element.innerHTML = '<div class="container-content" style="height:100%;"></div>';
                break;
                
            case 'divider':
                this.applyStyles(element, component.properties);
                break;
        }
        
        document.getElementById('canvas').appendChild(element);
        this.makeComponentInteractive(element, component);
    }
    
    applyStyles(element, properties) {
        Object.entries(properties).forEach(([key, value]) => {
            if (value) {
                element.style[key] = value;
            }
        });
    }
    
    makeComponentInteractive(element, component) {
        // 使組件可拖動
        this.makeDraggable(element, component);
        
        // 點擊選中
        element.addEventListener('click', (e) => {
            this.selectComponent(element, component);
            e.stopPropagation();
        });
        
        // 雙擊編輯
        if (component.type === 'text') {
            element.addEventListener('dblclick', (e) => {
                e.stopPropagation();
            });
        }
    }
    
    makeDraggable(element, component) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        element.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseInt(element.style.left) || 0;
            initialY = parseInt(element.style.top) || 0;
            
            this.selectComponent(element, component);
            element.style.cursor = 'grabbing';
            element.style.zIndex = '1000';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            element.style.left = `${initialX + dx}px`;
            element.style.top = `${initialY + dy}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
                element.style.zIndex = '';
                
                // 更新組件位置
                component.position.x = parseInt(element.style.left);
                component.position.y = parseInt(element.style.top);
                this.saveToHistory('move', component);
            }
        });
    }
    
    selectComponent(element, component) {
        // 取消之前選中的組件
        document.querySelectorAll('.component.selected').forEach(comp => {
            comp.classList.remove('selected');
        });
        
        // 選中當前組件
        element.classList.add('selected');
        this.currentComponent = component;
        
        // 顯示屬性面板
        if (window.propertyPanel) {
            window.propertyPanel.showProperties(component);
        }
    }
    
    clearCanvas() {
        if (confirm('確定要清空畫布嗎？所有內容將會丟失！')) {
            const canvas = document.getElementById('canvas');
            canvas.innerHTML = '';
            this.components = [];
            this.currentComponent = null;
            
            // 顯示佔位符
            document.getElementById('canvas-placeholder').style.display = 'block';
            
            // 清空屬性面板
            if (window.propertyPanel) {
                window.propertyPanel.clear();
            }
            
            this.saveToHistory('clear');
        }
    }
    
    saveToHistory(action, data) {
        // 實現歷史記錄功能
        console.log('History:', action, data);
    }
}

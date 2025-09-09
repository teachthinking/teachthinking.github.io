class ComponentSystem {
    createComponent(type, x, y) {
        const component = {
            id: this.generateId(),
            type: type,
            position: { x, y },
            properties: this.getDefaultProperties(type),
            content: ''
        };
        
        this.renderComponent(component);
        this.saveToHistory('create', component);
        return component;
    }
    
    renderComponent(component) {
        const element = document.createElement('div');
        element.className = `component ${component.type}`;
        element.dataset.id = component.id;
        element.style.left = `${component.position.x}px`;
        element.style.top = `${component.position.y}px`;
        
        switch(component.type) {
            case 'text':
                element.contentEditable = true;
                element.innerHTML = '點擊編輯文字';
                break;
            case 'image':
                element.innerHTML = `
                    <img src="assets/placeholder.jpg" alt="圖片">
                    <div class="image-actions">更換圖片</div>
                `;
                break;
            case 'button':
                element.innerHTML = '<button>按鈕</button>';
                break;
        }
        
        document.getElementById('canvas').appendChild(element);
        this.makeComponentInteractive(element);
    }
    
    makeComponentInteractive(element) {
        // 使組件可拖動
        this.makeDraggable(element);
        
        // 點擊選中
        element.addEventListener('click', (e) => {
            this.selectComponent(element);
            e.stopPropagation();
        });
    }
    
    makeDraggable(element) {
        let isDragging = false;
        let offset = { x: 0, y: 0 };
        
        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            offset.x = e.clientX - element.getBoundingClientRect().left;
            offset.y = e.clientY - element.getBoundingClientRect().top;
            this.selectComponent(element);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offset.x;
            const y = e.clientY - offset.y;
            
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            this.updateComponentPosition(element);
        });
    }
}

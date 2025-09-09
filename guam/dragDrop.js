class DragDropSystem {
    constructor() {
        this.draggedItem = null;
        this.dropZones = new Set();
        this.init();
    }
    
    init() {
        this.setupDraggableItems();
        this.setupDropZones();
    }
    
    setupDraggableItems() {
        const items = document.querySelectorAll('.component-item');
        items.forEach(item => {
            item.setAttribute('draggable', 'true');
            item.addEventListener('dragstart', (e) => {
                this.dragStart(e, item);
            });
            item.addEventListener('dragend', () => {
                this.dragEnd();
            });
        });
    }
    
    dragStart(e, item) {
        this.draggedItem = item.cloneNode(true);
        e.dataTransfer.setData('text/plain', item.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
        
        // 視覺反饋
        item.classList.add('dragging');
        e.dataTransfer.setDragImage(this.draggedItem, 20, 20);
    }
    
    dragEnd() {
        document.querySelectorAll('.component-item').forEach(item => {
            item.classList.remove('dragging');
        });
    }
    
    setupDropZones() {
        const canvas = document.getElementById('canvas');
        
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.showDropIndicator(e);
        });
        
        canvas.addEventListener('dragenter', (e) => {
            e.preventDefault();
            canvas.classList.add('drag-over');
        });
        
        canvas.addEventListener('dragleave', (e) => {
            if (!e.relatedTarget || !canvas.contains(e.relatedTarget)) {
                canvas.classList.remove('drag-over');
            }
        });
        
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.classList.remove('drag-over');
            this.handleDrop(e);
        });
    }
    
    showDropIndicator(e) {
        // 可以實現更複雜的放置指示器
        e.dataTransfer.dropEffect = 'copy';
    }
    
    handleDrop(e) {
        const type = e.dataTransfer.getData('text/plain');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 隱藏佔位符
        document.getElementById('canvas-placeholder').style.display = 'none';
        
        // 創建組件
        if (window.componentSystem) {
            window.componentSystem.createComponent(type, x, y);
        }
    }
}

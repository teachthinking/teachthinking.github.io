class DragDropSystem {
    constructor() {
        this.draggedItem = null;
        this.dropZones = new Set();
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
        });
    }
    
    dragStart(e, item) {
        this.draggedItem = item.cloneNode(true);
        e.dataTransfer.setData('text/plain', item.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
    }
    
    setupDropZones() {
        const canvas = document.getElementById('canvas');
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.showDropIndicator(e);
        });
        
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e);
        });
    }
    
    handleDrop(e) {
        const type = e.dataTransfer.getData('text/plain');
        this.createComponent(type, e.clientX, e.clientY);
    }
}

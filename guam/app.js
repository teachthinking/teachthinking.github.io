class WebBuilder {
    constructor() {
        this.components = [];
        this.currentComponent = null;
        this.history = [];
        this.historyIndex = -1;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadTemplates();
        this.setupDragAndDrop();
    }
    
    setupEventListeners() {
        // 畫布點擊事件
        document.getElementById('canvas').addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // 右鍵菜單
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    handleCanvasClick(e) {
        const target = e.target;
        if (target.classList.contains('editable')) {
            this.enterEditMode(target);
        }
    }
    
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'z': e.preventDefault(); this.undo(); break;
                case 'y': e.preventDefault(); this.redo(); break;
                case 'c': e.preventDefault(); this.copy(); break;
                case 'v': e.preventDefault(); this.paste(); break;
            }
        }
    }
}

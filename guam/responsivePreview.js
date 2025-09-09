class ResponsivePreview {
    constructor() {
        this.modes = {
            desktop: { width: '100%', height: '100%' },
            tablet: { width: '768px', height: '1024px' },
            mobile: { width: '375px', height: '667px' }
        };
        this.currentMode = 'desktop';
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        const canvas = document.getElementById('canvas');
        const { width, height } = this.modes[mode];
        
        canvas.style.width = width;
        canvas.style.height = height;
        canvas.classList.add('preview-mode');
        
        this.updateViewportIndicator(mode);
    }
    
    updateViewportIndicator(mode) {
        const indicator = document.getElementById('viewport-indicator');
        indicator.textContent = `${mode.toUpperCase()} ${this.modes[mode].width} × ${this.modes[mode].height}`;
    }
}

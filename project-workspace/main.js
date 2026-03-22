class DigitalClock {
    constructor() {
        this.is24HourFormat = false;
        this.timeDisplay = document.getElementById('timeDisplay');
        this.dateDisplay = document.getElementById('dateDisplay');
        this.formatToggle = document.getElementById('formatToggle');
        
        this.init();
    }
    
    init() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        this.formatToggle.addEventListener('click', () => {
            this.toggleFormat();
        });
    }
    
    updateTime() {
        const now = new Date();
        
        // Update time
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        let displayHours = hours;
        let period = '';
        
        if (this.is24HourFormat) {
            displayHours = String(hours).padStart(2, '0');
        } else {
            period = hours >= 12 ? ' PM' : ' AM';
            displayHours = hours % 12 || 12;
            displayHours = String(displayHours).padStart(2, '0');
        }
        
        this.timeDisplay.textContent = `${displayHours}:${minutes}:${seconds}${period}`;
        
        // Update date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }
    
    toggleFormat() {
        this.is24HourFormat = !this.is24HourFormat;
        this.formatToggle.textContent = this.is24HourFormat ? '24H Format' : '12H Format';
        this.updateTime();
    }
}

// Initialize the clock when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DigitalClock();
});
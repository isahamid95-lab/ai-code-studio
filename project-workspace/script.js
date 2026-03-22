// Modern Animation Playground - Interactive JavaScript

class AnimationController {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.startBackgroundAnimations();
  }

  initializeElements() {
    this.animateButton = document.getElementById('animateButton');
    this.animationSequence = document.getElementById('animationSequence');
    this.cards = document.querySelectorAll('.card');
    this.dots = document.querySelectorAll('.sequence-dot');
  }

  bindEvents() {
    this.animateButton.addEventListener('click', () => this.triggerAnimationSequence());
    
    // Add click events to all cards
    this.cards.forEach(card => {
      card.addEventListener('click', () => this.triggerCardAnimation(card));
    });

    // Add keyboard accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const activeElement = document.activeElement;
        if (activeElement.classList.contains('card') || activeElement.id === 'animateButton') {
          e.preventDefault();
          activeElement.click();
        }
      }
    });
  }

  triggerAnimationSequence() {
    // Reset button state
    this.animateButton.style.transform = 'scale(0.95)';
    
    // Trigger sequence animation
    this.dots.forEach((dot, index) => {
      setTimeout(() => {
        dot.style.animation = 'none';
        void dot.offsetWidth; // Trigger reflow
        dot.style.animation = 'sequencePulse 1s ease-in-out';
        
        // Add ripple effect to button
        this.createRippleEffect(this.animateButton);
      }, index * 200);
    });

    // Add confetti effect
    this.createConfettiEffect();
  }

  triggerCardAnimation(card) {
    // Remove any existing animation classes
    const animationClasses = ['bounce-card', 'pulse-card', 'slide-card', 'rotate-card', 'fade-card', 'flip-card', 'color-change-card', 'shake-card'];
    animationClasses.forEach(cls => card.classList.remove(cls));
    
    // Add a random animation class
    const randomClass = animationClasses[Math.floor(Math.random() * animationClasses.length)];
    card.classList.add(randomClass);
    
    // Remove the class after animation completes
    setTimeout(() => {
      card.classList.remove(randomClass);
    }, 1000);

    // Create ripple effect
    this.createRippleEffect(card);
  }

  createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    element.appendChild(ripple);
    
    // Position ripple at mouse click location
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  createConfettiEffect() {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Random size and position
      const size = Math.random() * 10 + 5;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.top = '-20px';
      
      document.body.appendChild(confetti);
      
      // Animate confetti falling
      const animation = confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], {
        duration: Math.random() * 3000 + 2000,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      });
      
      // Remove confetti after animation
      animation.onfinish = () => confetti.remove();
    }
  }

  startBackgroundAnimations() {
    // Continuous floating animation for cards
    this.cards.forEach((card, index) => {
      setInterval(() => {
        if (!card.matches(':hover')) {
          card.style.transform = `translateY(${Math.sin(Date.now() / 1000 + index) * 5}px)`;
        }
      }, 50);
    });
  }

  // Advanced animation methods
  playAdvancedAnimation(type) {
    switch(type) {
      case 'morph':
        this.morphAnimation();
        break;
      case 'wave':
        this.waveAnimation();
        break;
      case 'spiral':
        this.spiralAnimation();
        break;
    }
  }

  morphAnimation() {
    const morphElements = document.querySelectorAll('.card');
    let delay = 0;
    
    morphElements.forEach(element => {
      setTimeout(() => {
        element.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        element.style.borderRadius = '50%';
        
        setTimeout(() => {
          element.style.borderRadius = 'var(--border-radius)';
        }, 800);
      }, delay);
      
      delay += 150;
    });
  }

  waveAnimation() {
    const waveElements = document.querySelectorAll('.card');
    let delay = 0;
    
    waveElements.forEach((element, index) => {
      setTimeout(() => {
        element.animate([
          { transform: 'translateY(0)' },
          { transform: 'translateY(-20px)' },
          { transform: 'translateY(0)' }
        ], {
          duration: 600,
          easing: 'ease-in-out',
          fill: 'forwards'
        });
      }, delay);
      
      delay += 100;
    });
  }

  spiralAnimation() {
    const spiralElements = document.querySelectorAll('.card');
    
    spiralElements.forEach((element, index) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const radius = 100 + (index * 20);
      const angle = (index / spiralElements.length) * Math.PI * 2;
      
      element.animate([
        { transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)` },
        { transform: 'translate(0, 0)' }
      ], {
        duration: 1000,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        fill: 'forwards'
      });
    });
  }
}

// Custom CSS for ripple effect
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .confetti-piece {
    position: fixed;
    z-index: 9999;
    border-radius: 0;
  }
  
  /* Focus styles for accessibility */
  .card:focus, .main-button:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
`;
document.head.appendChild(rippleStyle);

// Initialize the animation controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AnimationController();
  
  // Add some fun Easter eggs
  let clickCount = 0;
  const body = document.body;
  
  body.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 10) {
      // Secret animation sequence
      const controller = new AnimationController();
      controller.playAdvancedAnimation('spiral');
      clickCount = 0;
    }
  });
});

// Performance optimization for scroll events
let ticking = false;

function updateScrollAnimations() {
  const scrolledCards = document.querySelectorAll('.card');
  const scrollPosition = window.scrollY;
  
  scrolledCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
    
    if (isVisible) {
      card.style.opacity = 1;
      card.style.transform = 'translateY(0)';
    } else {
      card.style.opacity = 0.7;
      card.style.transform = 'translateY(20px)';
    }
  });
  
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateScrollAnimations);
    ticking = true;
  }
});
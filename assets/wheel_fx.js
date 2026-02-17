// Confetti และ Screen Shake Effects

class WheelFX {
  constructor() {
    this.confettiCanvas = null;
    this.confettiCtx = null;
    this.confettiParticles = [];
    this.isAnimating = false;
    this.reduceMotion = false;
  }

  init() {
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toggle = document.getElementById('reduceMotion');
    if (toggle) {
      this.reduceMotion = toggle.checked;
      toggle.addEventListener('change', (e) => {
        this.reduceMotion = e.target.checked;
      });
    }
  }

  fireSarcasticConfetti() {
    if (this.reduceMotion) return;
    
    if (!this.confettiCanvas) {
      this.confettiCanvas = document.createElement('canvas');
      this.confettiCanvas.style.position = 'fixed';
      this.confettiCanvas.style.top = '0';
      this.confettiCanvas.style.left = '0';
      this.confettiCanvas.style.width = '100%';
      this.confettiCanvas.style.height = '100%';
      this.confettiCanvas.style.pointerEvents = 'none';
      this.confettiCanvas.style.zIndex = '9999';
      document.body.appendChild(this.confettiCanvas);
      this.confettiCtx = this.confettiCanvas.getContext('2d');
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
    }

    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      this.confettiParticles.push({
        x: Math.random() * this.confettiCanvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 1.0
      });
    }

    if (!this.isAnimating) {
      this.animateConfetti();
    }
  }

  animateConfetti() {
    if (this.confettiParticles.length === 0) {
      this.isAnimating = false;
      return;
    }

    this.isAnimating = true;
    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.rotation += p.rotationSpeed;
      p.life -= 0.02;

      if (p.life <= 0 || p.y > this.confettiCanvas.height) {
        this.confettiParticles.splice(i, 1);
        continue;
      }

      this.confettiCtx.save();
      this.confettiCtx.globalAlpha = p.life;
      this.confettiCtx.translate(p.x, p.y);
      this.confettiCtx.rotate((p.rotation * Math.PI) / 180);
      this.confettiCtx.fillStyle = p.color;
      this.confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.confettiCtx.restore();
    }

    requestAnimationFrame(() => this.animateConfetti());
  }

  applyShake(durationMs = 500, intensity = 5) {
    if (this.reduceMotion) return;
    
    const body = document.body;
    body.classList.add('shake');
    
    setTimeout(() => {
      body.classList.remove('shake');
    }, durationMs);
  }

  showToast(message, duration = 3000) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  playTone(frequency = 440, duration = 100, type = 'sine') {
    if (this.reduceMotion) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
      // Ignore audio errors
    }
  }
}

const wheelFX = new WheelFX();

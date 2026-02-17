// มาสคอตเล็กๆ ข้างวงล้อ

class WheelMascot {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.currentMood = 'neutral';
    this.animationFrame = 0;
  }

  init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'mascotCanvas';
    this.canvas.width = 100;
    this.canvas.height = 100;
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    this.draw();
  }

  setMood(mood, durationMs = 2000) {
    this.currentMood = mood;
    this.draw();
    
    if (durationMs > 0) {
      setTimeout(() => {
        this.currentMood = 'neutral';
        this.draw();
      }, durationMs);
    }
  }

  draw() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const centerX = 50;
    const centerY = 50;
    
    ctx.clearRect(0, 0, 100, 100);

    // Body (circle)
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Face based on mood
    switch (this.currentMood) {
      case 'smug':
        this.drawSmugFace(ctx, centerX, centerY);
        break;
      case 'laugh':
        this.drawLaughFace(ctx, centerX, centerY);
        break;
      case 'clap':
        this.drawClapFace(ctx, centerX, centerY);
        break;
      case 'sideeye':
        this.drawSideEyeFace(ctx, centerX, centerY);
        break;
      default:
        this.drawNeutralFace(ctx, centerX, centerY);
    }
  }

  drawNeutralFace(ctx, x, y) {
    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 3, 0, Math.PI * 2);
    ctx.arc(x + 8, y - 5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 5, 5, 0, Math.PI);
    ctx.stroke();
  }

  drawSmugFace(ctx, x, y) {
    // Smug eyes (squinted)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 5);
    ctx.lineTo(x - 4, y - 5);
    ctx.moveTo(x + 4, y - 5);
    ctx.lineTo(x + 12, y - 5);
    ctx.stroke();

    // Smug smile
    ctx.beginPath();
    ctx.arc(x, y + 8, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  drawLaughFace(ctx, x, y) {
    // Big laughing eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 4, 0, Math.PI * 2);
    ctx.arc(x + 8, y - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Big laughing mouth
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawClapFace(ctx, x, y) {
    // Happy eyes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 3, 0, Math.PI);
    ctx.arc(x + 8, y - 5, 3, 0, Math.PI);
    ctx.stroke();

    // Big smile
    ctx.beginPath();
    ctx.arc(x, y + 8, 7, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }

  drawSideEyeFace(ctx, x, y) {
    // One eye looking away
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Side eye (looking right)
    ctx.beginPath();
    ctx.arc(x + 8, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 10, y - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Slight smirk
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 8);
    ctx.lineTo(x + 8, y + 8);
    ctx.stroke();
  }
}

const wheelMascot = new WheelMascot();

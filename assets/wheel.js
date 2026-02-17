// เกมหมุนวงล้อรางวัล - ตรรกะหลัก

class WheelGame {
  constructor() {
    this.segments = [];
    this.events = [];
    this.goodLuckLabel = '';
    this.goodLuckIndex = -1;
    this.isSpinning = false;
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.animationId = null;
    this.canvas = null;
    this.ctx = null;
    this.eventCanvas = null;
    this.eventCtx = null;
    this.radius = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.reduceMotion = false;
    this.nearPrize = null;
    this.selectedEvent = null;
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  async init() {
    // โหลดข้อมูล
    try {
      const response = await fetch('./data/wheel_prizes.th.json');
      const data = await response.json();
      this.segments = data.segments;
      this.events = data.events;
      this.goodLuckLabel = data.goodLuckLabel;
      this.goodLuckIndex = this.segments.findIndex(s => s.type === 'goodluck');
    } catch (error) {
      console.error('Error loading data:', error);
      return;
    }

    // ตั้งค่า Canvas
    this.canvas = document.getElementById('wheelCanvas');
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement;
    const size = Math.min(container.offsetWidth, 500);
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d');
    this.radius = size / 2 - 10;
    this.centerX = size / 2;
    this.centerY = size / 2;

    // Event overlay canvas
    this.eventCanvas = document.getElementById('eventCanvas');
    if (this.eventCanvas) {
      this.eventCtx = this.eventCanvas.getContext('2d');
      this.eventCanvas.width = size;
      this.eventCanvas.height = size;
    }

    // Reduce motion
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toggle = document.getElementById('reduceMotion');
    if (toggle) {
      this.reduceMotion = toggle.checked;
      toggle.addEventListener('change', (e) => {
        this.reduceMotion = e.target.checked;
      });
    }

    // วาดวงล้อเริ่มต้น
    this.drawWheel();

    // Event listeners
    const spinBtn = document.getElementById('spinBtn');
    const spinAgainBtn = document.getElementById('spinAgainBtn');
    
    if (spinBtn) {
      spinBtn.addEventListener('click', () => this.spin());
      spinBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.spin();
      });
    }
    
    if (spinAgainBtn) {
      spinAgainBtn.addEventListener('click', () => this.spin());
      spinAgainBtn.style.display = 'none';
    }
  }

  drawWheel() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const segmentCount = this.segments.length;
    const anglePerSegment = (Math.PI * 2) / segmentCount;

    // วาดแต่ละ segment
    for (let i = 0; i < segmentCount; i++) {
      const startAngle = i * anglePerSegment + this.currentAngle;
      const endAngle = (i + 1) * anglePerSegment + this.currentAngle;

      // สีตาม type (ธีมหรู)
      const segment = this.segments[i];
      let color = '#2c3e50';
      let strokeColor = 'rgba(212, 175, 55, 0.3)';
      
      if (segment.type === 'goodluck') {
        color = '#d4af37';
        strokeColor = 'rgba(212, 175, 55, 0.6)';
      } else if (segment.tier === 'big') {
        color = '#f4d03f';
        strokeColor = 'rgba(244, 208, 63, 0.4)';
      } else if (segment.tier === 'mid') {
        color = '#34495e';
        strokeColor = 'rgba(212, 175, 55, 0.3)';
      } else {
        color = '#1a1a2e';
        strokeColor = 'rgba(212, 175, 55, 0.2)';
      }

      // สร้าง gradient สำหรับ segment
      const gradient = ctx.createRadialGradient(
        this.centerX, this.centerY, this.radius * 0.3,
        this.centerX, this.centerY, this.radius
      );
      gradient.addColorStop(0, this.lightenColor(color, 20));
      gradient.addColorStop(1, color);

      // วาด segment
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // วาดข้อความ
      const midAngle = (startAngle + endAngle) / 2;
      const textRadius = this.radius * 0.7;
      const textX = this.centerX + Math.cos(midAngle) * textRadius;
      const textY = this.centerY + Math.sin(midAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // สีข้อความตาม tier
      if (segment.type === 'goodluck') {
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = '#f4d03f';
        ctx.lineWidth = 1;
      } else if (segment.tier === 'big') {
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 0.5;
      } else {
        ctx.fillStyle = '#f5f5f5';
        ctx.strokeStyle = 'rgba(245, 245, 245, 0.3)';
        ctx.lineWidth = 0.5;
      }
      
      ctx.font = `bold ${Math.max(13, this.radius / 11)}px 'Segoe UI', sans-serif`;
      
      // แบ่งข้อความถ้ายาวเกิน
      const maxWidth = this.radius * 0.4;
      const words = segment.label.split(' ');
      let line = '';
      let y = 0;
      
      for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.strokeText(line, 0, y);
          ctx.fillText(line, 0, y);
          line = word + ' ';
          y += 19;
        } else {
          line = testLine;
        }
      }
      ctx.strokeText(line, 0, y);
      ctx.fillText(line, 0, y);
      
      ctx.restore();
    }

    // วาดขอบวงล้อ (หรูหรา)
    const borderGradient = ctx.createLinearGradient(
      this.centerX - this.radius, this.centerY - this.radius,
      this.centerX + this.radius, this.centerY + this.radius
    );
    borderGradient.addColorStop(0, '#d4af37');
    borderGradient.addColorStop(0.5, '#f4d03f');
    borderGradient.addColorStop(1, '#d4af37');
    
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  spin() {
    if (this.isSpinning) return;

    this.isSpinning = true;
    const spinBtn = document.getElementById('spinBtn');
    const spinAgainBtn = document.getElementById('spinAgainBtn');
    
    if (spinBtn) spinBtn.disabled = true;
    if (spinAgainBtn) spinAgainBtn.style.display = 'none';

    // ซ่อนผลลัพธ์เก่า
    const resultBox = document.getElementById('resultBox');
    if (resultBox) {
      resultBox.classList.remove('show');
    }

    // สุ่ม "รางวัลที่เกือบได้" จาก big หรือ mid tier
    const bigMidPrizes = this.segments.filter(s => 
      (s.tier === 'big' || s.tier === 'mid') && s.type !== 'goodluck'
    );
    this.nearPrize = bigMidPrizes[Math.floor(Math.random() * bigMidPrizes.length)];

    // สุ่มเหตุการณ์
    this.selectedEvent = this.events[Math.floor(Math.random() * this.events.length)];

    // คำนวณมุมทั้งหมด
    const segmentCount = this.segments.length;
    const anglePerSegment = (Math.PI * 2) / segmentCount;
    const goodLuckIndex = this.goodLuckIndex;
    
    // คำนวณมุมที่ต้องหมุนเพื่อให้ pointer (Math.PI / 2) ชี้ที่ "ขอให้โชคดี"
    // Segment center angle = goodLuckIndex * anglePerSegment + anglePerSegment / 2
    // เมื่อหมุนด้วย currentAngle: segmentCenterAngle + currentAngle = Math.PI / 2
    // ดังนั้น: currentAngle = Math.PI / 2 - segmentCenterAngle
    const goodLuckSegmentCenterAngle = goodLuckIndex * anglePerSegment + anglePerSegment / 2;
    const finalTargetAngle = this.normalizeAngle(Math.PI / 2 - goodLuckSegmentCenterAngle);
    
    // คำนวณมุมที่เกือบได้รางวัลใหญ่ (ก่อนจะโดนดึง)
    const nearPrizeIndex = this.segments.findIndex(s => s.label === this.nearPrize.label);
    const nearPrizeSegmentCenterAngle = nearPrizeIndex * anglePerSegment + anglePerSegment / 2;
    // เลื่อนไปก่อน boundary เล็กน้อยเพื่อให้ดูเหมือนเกือบได้
    const nearTargetAngle = this.normalizeAngle(Math.PI / 2 - nearPrizeSegmentCenterAngle - anglePerSegment * 0.15);

    // เริ่มหมุน
    const startAngle = this.currentAngle;
    const baseRotation = this.reduceMotion ? 2 : 5;
    const totalRotation = baseRotation * Math.PI * 2;
    
    let startTime = null;
    const duration = this.reduceMotion ? 2000 : 5000;
    let eventTriggered = false;
    const eventTriggerTime = 0.82;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: เร็วตอนแรก ช้ามากตอนท้าย
      let easeProgress;
      if (progress < 0.8) {
        const earlyProgress = progress / 0.8;
        easeProgress = 1 - Math.pow(1 - earlyProgress, 3) * 0.8;
      } else {
        const lateProgress = (progress - 0.8) / 0.2;
        easeProgress = 0.8 + (1 - Math.pow(1 - lateProgress, 5)) * 0.2;
      }
      
      // Trigger event
      if (!eventTriggered && progress >= eventTriggerTime) {
        eventTriggered = true;
        this.triggerEvent();
      }

      // คำนวณมุมเป้าหมายปัจจุบัน
      let targetAngle;
      if (!eventTriggered) {
        // ก่อน event: หมุนไปที่รางวัลที่เกือบได้
        const preEventProgress = progress / eventTriggerTime;
        let preEventEase;
        if (preEventProgress < 0.8) {
          const earlyProgress = preEventProgress / 0.8;
          preEventEase = 1 - Math.pow(1 - earlyProgress, 3) * 0.8;
        } else {
          const lateProgress = (preEventProgress - 0.8) / 0.2;
          preEventEase = 0.8 + (1 - Math.pow(1 - lateProgress, 5)) * 0.2;
        }
        targetAngle = nearTargetAngle * preEventEase;
      } else {
        // หลัง event: ค่อยๆ เลื่อนไปที่ "ขอให้โชคดี"
        const eventProgress = (progress - eventTriggerTime) / (1 - eventTriggerTime);
        const eventEase = 1 - Math.pow(1 - eventProgress, 5);
        
        // คำนวณมุมระหว่าง nearTarget และ finalTarget
        let angleDiff = this.getShortestAngle(nearTargetAngle, finalTargetAngle);
        targetAngle = nearTargetAngle + angleDiff * eventEase;
      }

      // ถ้าใกล้จบแล้ว (progress > 0.92) ให้บังคับไปที่ finalTargetAngle
      if (progress > 0.92) {
        const finalProgress = (progress - 0.92) / 0.08;
        const finalEase = 1 - Math.pow(1 - finalProgress, 7);
        let angleDiff = this.getShortestAngle(targetAngle, finalTargetAngle);
        targetAngle = targetAngle + angleDiff * finalEase;
      }
      
      // คำนวณมุมปัจจุบัน: หมุนหลายรอบ + มุมเป้าหมาย
      this.currentAngle = this.normalizeAngle(startAngle + totalRotation * easeProgress + targetAngle);
      
      this.drawWheel();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        // จบการหมุน - บังคับให้หยุดที่ "ขอให้โชคดี" เป๊ะๆ
        this.currentAngle = finalTargetAngle;
        this.drawWheel();
        
        // ตรวจสอบอีกครั้งและปรับถ้ายังไม่ตรง
        const currentSegmentCenterAngle = this.normalizeAngle(goodLuckSegmentCenterAngle + this.currentAngle);
        const pointerAngle = Math.PI / 2;
        let angleDiff = this.getShortestAngle(currentSegmentCenterAngle, pointerAngle);
        
        if (Math.abs(angleDiff) > 0.0001) {
          this.currentAngle = this.normalizeAngle(this.currentAngle + angleDiff);
          this.drawWheel();
        }
        
        this.onSpinComplete();
      }
    };

    requestAnimationFrame(animate);
  }

  // Helper function: normalize angle to 0-2π
  normalizeAngle(angle) {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
  }

  // Helper function: get shortest angle difference between two angles
  getShortestAngle(from, to) {
    let diff = to - from;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  triggerEvent() {
    // แสดง event overlay
    const overlay = document.querySelector('.event-overlay');
    if (overlay && this.eventCtx) {
      overlay.classList.add('active');
      this.drawEvent(this.selectedEvent);
      
      // Screen shake
      wheelFX.applyShake(500, 5);
      
      // เสียง
      wheelFX.playTone(300, 150, 'sawtooth');
      setTimeout(() => wheelFX.playTone(200, 100, 'sawtooth'), 150);

      // มาสคอต
      wheelMascot.setMood('laugh', 2000);

      // ซ่อน overlay หลัง 1 วินาที
      setTimeout(() => {
        overlay.classList.remove('active');
      }, 1000);
    }
  }

  drawEvent(event) {
    if (!this.eventCtx) return;

    const ctx = this.eventCtx;
    const size = this.eventCanvas.width;
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;

    switch (event.key) {
      case 'mystery_hand':
        this.drawMysteryHand(ctx, centerX, centerY);
        break;
      case 'cat_paw':
        this.drawCatPaw(ctx, centerX, centerY);
        break;
      case 'magnet':
        this.drawMagnet(ctx, centerX, centerY);
        break;
      case 'wind':
        this.drawWind(ctx, centerX, centerY);
        break;
      case 'mosquito':
        this.drawMosquito(ctx, centerX, centerY);
        break;
      case 'ai_glitch':
        this.drawAIGlitch(ctx, centerX, centerY);
        break;
      case 'spring':
        this.drawSpring(ctx, centerX, centerY);
        break;
      case 'butterfly':
        this.drawButterfly(ctx, centerX, centerY);
        break;
    }
  }

  drawMysteryHand(ctx, x, y) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // มือ
    ctx.arc(x - 20, y, 15, 0, Math.PI * 2);
    // นิ้ว
    ctx.moveTo(x - 10, y - 10);
    ctx.lineTo(x - 5, y - 20);
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x, y - 15);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 5, y - 10);
    ctx.stroke();
  }

  drawCatPaw(ctx, x, y) {
    ctx.fillStyle = '#ff6b6b';
    // ฝ่าเท้า
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    // นิ้ว
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(x + i * 12, y - 15, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawMagnet(ctx, x, y) {
    ctx.fillStyle = '#4ecdc4';
    // แม่เหล็ก
    ctx.fillRect(x - 15, y - 30, 30, 20);
    ctx.beginPath();
    ctx.arc(x - 15, y - 30, 10, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 15, y - 30, 10, Math.PI, 0);
    ctx.fill();
  }

  drawWind(ctx, x, y) {
    ctx.strokeStyle = '#95e1d3';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 30 + i * 10, y - 20);
      ctx.quadraticCurveTo(x - 25 + i * 10, y - 30, x - 20 + i * 10, y - 20);
      ctx.stroke();
    }
  }

  drawMosquito(ctx, x, y) {
    ctx.fillStyle = '#333';
    // ตัวยุง
    ctx.beginPath();
    ctx.ellipse(x, y, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // ปีก
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - 5, y - 3, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 5, y - 3, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawAIGlitch(ctx, x, y) {
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('AI', x - 15, y - 10);
    // Glitch effect
    ctx.fillStyle = '#00ffff';
    ctx.fillText('AI', x - 14, y - 9);
  }

  drawSpring(ctx, x, y) {
    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.moveTo(x, y - i * 8);
      ctx.lineTo(x + 10, y - (i + 0.5) * 8);
      ctx.moveTo(x + 10, y - (i + 0.5) * 8);
      ctx.lineTo(x, y - (i + 1) * 8);
    }
    ctx.stroke();
  }

  drawButterfly(ctx, x, y) {
    ctx.fillStyle = '#ff6b6b';
    // ปีกซ้าย
    ctx.beginPath();
    ctx.ellipse(x - 10, y, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // ปีกขวา
    ctx.beginPath();
    ctx.ellipse(x + 10, y, 12, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // ตัว
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(x, y, 3, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  onSpinComplete() {
    this.isSpinning = false;
    
    // ตรวจสอบอีกครั้งว่าวงล้อหยุดที่ "ขอให้โชคดี" จริงๆ
    const segmentCount = this.segments.length;
    const anglePerSegment = (Math.PI * 2) / segmentCount;
    const goodLuckIndex = this.goodLuckIndex;
    const goodLuckSegmentCenterAngle = goodLuckIndex * anglePerSegment + anglePerSegment / 2;
    
    // คำนวณมุมที่ถูกต้องเพื่อให้ pointer ชี้ที่ "ขอให้โชคดี"
    const exactTargetAngle = this.normalizeAngle(Math.PI / 2 - goodLuckSegmentCenterAngle);
    
    // ตรวจสอบว่ามุมปัจจุบันตรงกับที่ต้องการหรือไม่
    const currentSegmentCenterAngle = this.normalizeAngle(goodLuckSegmentCenterAngle + this.currentAngle);
    const pointerAngle = Math.PI / 2;
    let angleDiff = this.getShortestAngle(currentSegmentCenterAngle, pointerAngle);
    
    // ถ้ายังไม่ตรง ให้ปรับอีกครั้ง (บังคับให้ตรงเป๊ะ)
    if (Math.abs(angleDiff) > 0.0001) {
      this.currentAngle = exactTargetAngle;
      this.drawWheel();
    }
    
    // ตั้งค่าให้วงล้อเริ่มจาก "ขอให้โชคดี" เมื่อเล่นต่อ
    this.currentAngle = exactTargetAngle;
    this.drawWheel();
    
    // แสดงผลลัพธ์ (บังคับให้แสดง "ขอให้โชคดี" เสมอ)
    const resultBox = document.getElementById('resultBox');
    const nearPrizeEl = document.getElementById('nearPrize');
    const finalPrizeEl = document.getElementById('finalPrize');
    const roastEl = document.getElementById('roastMessage');
    const spinBtn = document.getElementById('spinBtn');
    const spinAgainBtn = document.getElementById('spinAgainBtn');

    if (nearPrizeEl) {
      nearPrizeEl.textContent = `เกือบได้: ${this.nearPrize.label}`;
    }
    
    if (finalPrizeEl) {
      // บังคับให้แสดง "ขอให้โชคดี" เสมอ
      finalPrizeEl.textContent = `แต่สุดท้ายได้: ${this.goodLuckLabel}`;
    }

    if (roastEl) {
      roastEl.textContent = this.generateRoast(this.nearPrize, this.selectedEvent);
    }

    if (resultBox) {
      setTimeout(() => {
        resultBox.classList.add('show');
      }, 300);
    }

    // Confetti
    wheelFX.fireSarcasticConfetti();

    // Toast
    const toastMessages = [
      'ดีใจด้วย! ได้รางวัลใหญ่...ไม่ใช่',
      'เกือบแล้วนะ เกือบจริงๆ',
      'รอบหน้าคงได้...หรือเปล่า',
      'โชคดีมาก! ได้ "ขอให้โชคดี" อีกแล้ว',
    ];
    wheelFX.showToast(toastMessages[Math.floor(Math.random() * toastMessages.length)], 2000);

    // ปุ่ม
    if (spinBtn) spinBtn.disabled = false;
    if (spinAgainBtn) {
      spinAgainBtn.style.display = 'block';
      spinAgainBtn.focus();
    }
  }

  generateRoast(nearPrize, event) {
    const roasts = this.getAllRoasts();
    const category = this.getRoastCategory(nearPrize, event);
    const categoryRoasts = roasts[category] || roasts.general;
    return categoryRoasts[Math.floor(Math.random() * categoryRoasts.length)];
  }

  getRoastCategory(nearPrize, event) {
    if (nearPrize.tier === 'big') {
      return event ? `big_${event.key}` : 'big_general';
    } else if (nearPrize.tier === 'mid') {
      return event ? `mid_${event.key}` : 'mid_general';
    }
    return 'general';
  }

  getAllRoasts() {
    return {
      big_general: [
        'อุ๊ย...เกือบแล้วนะ เกือบจริงๆ 😏',
        'อีกนิดเดียวก็ได้เงินสด 50,000 บาทแล้ว...แต่นิดเดียวนี้มันยาวนานหน่อย',
        'เห็นไหมว่าเกือบได้ iPhone แล้ว? เกือบจริงๆ นะ',
        'วงล้อมันรู้ว่าคุณต้องการอะไร...แต่ไม่ให้',
        'เกือบได้ทองคำ 1 บาทแล้ว! แต่เกือบไม่ใช่ได้',
        'อีกนิดเดียว! อีกนิดเดียว! ...อีกนิดเดียว...',
        'เห็นรางวัลใหญ่ไหม? มันอยู่ใกล้มาก...แต่ไม่ใกล้พอ',
        'เกือบแล้ว! เกือบแล้ว! ...เกือบตลอดไป',
        'วงล้อมันหยุดใกล้รางวัลใหญ่ทุกครั้ง...แต่ไม่เคยหยุดที่รางวัลใหญ่',
        'คุณเกือบจะโชคดีแล้ว...แต่เกือบไม่ใช่โชคดี',
      ],
      big_mystery_hand: [
        'มีมือปริศนามาจับวงล้อให้เรียบร้อย',
        'มือลึกลับจัดการให้คุณได้รางวัลที่เหมาะสม',
        'มือใครไม่รู้มาจับ...แต่รู้ว่าต้องการอะไร',
        'มือปริศนารู้ดีว่าคุณควรได้อะไร',
        'มีมือมาช่วย...ช่วยให้ได้ "ขอให้โชคดี"',
        'มือลึกลับปรากฏตัว! เพื่อดึงวงล้อไปที่...ขอให้โชคดี',
        'มือใครไม่รู้มาจับ...และรู้ว่าควรจับที่ไหน',
        'มือปริศนามีหน้าที่ชัดเจน: ไม่ให้คุณได้รางวัลใหญ่',
      ],
      big_cat_paw: [
        'อุ้งเท้าแมวมาช่วยดึงวงล้อให้เรียบร้อย',
        'แมวรู้ดีว่าคุณควรได้อะไร...และไม่ควรได้อะไร',
        'อุ้งเท้าแมวปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
        'แมวมาช่วย...ช่วยให้ได้ "ขอให้โชคดี"',
        'อุ้งเท้าแมวรู้ดีว่าควรดึงวงล้อไปที่ไหน',
        'แมวมีหน้าที่ชัดเจน: ไม่ให้คุณได้รางวัลใหญ่',
        'อุ้งเท้าแมวมาช่วยดึง...ดึงไปที่ขอให้โชคดี',
        'แมวรู้ว่าคุณเกือบได้รางวัลใหญ่...และไม่ชอบ',
      ],
      big_magnet: [
        'แม่เหล็กดูดโชคมาดูดวงล้อให้เรียบร้อย',
        'แม่เหล็กรู้ดีว่าควรดูดไปที่ไหน...ที่ "ขอให้โชคดี"',
        'แม่เหล็กดูดโชคปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
        'แม่เหล็กมาช่วย...ช่วยดูดวงล้อไปที่ขอให้โชคดี',
        'แม่เหล็กดูดโชครู้ดีว่าควรดูดไปที่ไหน',
        'แม่เหล็กมีหน้าที่ชัดเจน: ไม่ให้คุณได้รางวัลใหญ่',
        'แม่เหล็กดูดโชคมาดูด...ดูดไปที่ขอให้โชคดี',
        'แม่เหล็กรู้ว่าคุณเกือบได้รางวัลใหญ่...และไม่ชอบ',
      ],
      big_wind: [
        'ลมพัดโชคปลิวมาพัดวงล้อให้เรียบร้อย',
        'ลมรู้ดีว่าควรพัดไปที่ไหน...ที่ "ขอให้โชคดี"',
        'ลมพัดโชคปลิวปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
        'ลมมาช่วย...ช่วยพัดวงล้อไปที่ขอให้โชคดี',
        'ลมพัดโชคปลิวรู้ดีว่าควรพัดไปที่ไหน',
        'ลมมีหน้าที่ชัดเจน: ไม่ให้คุณได้รางวัลใหญ่',
        'ลมพัดโชคปลิวมาพัด...พัดไปที่ขอให้โชคดี',
        'ลมรู้ว่าคุณเกือบได้รางวัลใหญ่...และไม่ชอบ',
      ],
      big_mosquito: [
        'ยุงสะกิดวงล้อให้เรียบร้อย',
        'ยุงรู้ดีว่าควรสะกิดไปที่ไหน...ที่ "ขอให้โชคดี"',
        'ยุงสะกิดวงล้อปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
        'ยุงมาช่วย...ช่วยสะกิดวงล้อไปที่ขอให้โชคดี',
        'ยุงสะกิดวงล้อรู้ดีว่าควรสะกิดไปที่ไหน',
        'ยุงมีหน้าที่ชัดเจน: ไม่ให้คุณได้รางวัลใหญ่',
        'ยุงสะกิดวงล้อมาสะกิด...สะกิดไปที่ขอให้โชคดี',
        'ยุงรู้ว่าคุณเกือบได้รางวัลใหญ่...และไม่ชอบ',
      ],
      big_ai_glitch: [
        'AI มือซนมาดึงวงล้อให้เรียบร้อย',
        'AI รู้ดีว่าควรดึงไปที่ไหน...ที่ "ขอให้โชคดี"',
        'AI มือซนปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
        'AI มาช่วย...ช่วยดึงวงล้อไปที่ขอให้โชคดี',
        'AI มือซนรู้ดีว่าควรดึงไปที่ไหน',
        'AI มีหน้าที่ชัดเจน: ไม่ให้คุณได้รางวัลใหญ่',
        'AI มือซนมาดึง...ดึงไปที่ขอให้โชคดี',
        'AI รู้ว่าคุณเกือบได้รางวัลใหญ่...และไม่ชอบ',
      ],
      big_spring: [
        'สปริงเด้งมาดึงวงล้อให้เรียบร้อย',
        'สปริงรู้ดีว่าควรเด้งไปที่ไหน...ที่ "ขอให้โชคดี"',
        'สปริงเด้งปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
        'สปริงมาช่วย...ช่วยเด้งวงล้อไปที่ขอให้โชคดี',
        'สปริงเด้งรู้ดีว่าควรเด้งไปที่ไหน',
        'สปริงมีหน้าที่ชัดเจน: ไม่ให้คุณได้รางวัลใหญ่',
        'สปริงเด้งมาเด้ง...เด้งไปที่ขอให้โชคดี',
        'สปริงรู้ว่าคุณเกือบได้รางวัลใหญ่...และไม่ชอบ',
      ],
      big_butterfly: [
        'ผีเสื้อบินมาดึงวงล้อให้เรียบร้อย',
        'ผีเสื้อรู้ดีว่าควรบินไปที่ไหน...ที่ "ขอให้โชคดี"',
        'ผีเสื้อบินมาปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
        'ผีเสื้อมาช่วย...ช่วยบินดึงวงล้อไปที่ขอให้โชคดี',
        'ผีเสื้อบินมารู้ดีว่าควรบินไปที่ไหน',
        'ผีเสื้อมีหน้าที่ชัดเจน: ไม่ให้คุณได้รางวัลใหญ่',
        'ผีเสื้อบินมาบิน...บินดึงไปที่ขอให้โชคดี',
        'ผีเสื้อรู้ว่าคุณเกือบได้รางวัลใหญ่...และไม่ชอบ',
      ],
      mid_general: [
        'เกือบได้รางวัลดีแล้วนะ...เกือบจริงๆ',
        'อีกนิดเดียวก็ได้เงินสด 10,000 บาทแล้ว',
        'เห็นไหมว่าเกือบได้หูฟังไร้สายแล้ว? เกือบจริงๆ',
        'วงล้อมันรู้ว่าคุณต้องการอะไร...แต่ไม่ให้',
        'เกือบได้ทองคำ 2 สลึงแล้ว! แต่เกือบไม่ใช่ได้',
        'อีกนิดเดียว! อีกนิดเดียว! ...อีกนิดเดียว...',
        'เห็นรางวัลดีไหม? มันอยู่ใกล้มาก...แต่ไม่ใกล้พอ',
        'เกือบแล้ว! เกือบแล้ว! ...เกือบตลอดไป',
        'วงล้อมันหยุดใกล้รางวัลดีทุกครั้ง...แต่ไม่เคยหยุดที่รางวัลดี',
        'คุณเกือบจะโชคดีแล้ว...แต่เกือบไม่ใช่โชคดี',
      ],
      mid_mystery_hand: [
        'มีมือปริศนามาจับวงล้อให้เรียบร้อย',
        'มือลึกลับจัดการให้คุณได้รางวัลที่เหมาะสม',
        'มือใครไม่รู้มาจับ...แต่รู้ว่าต้องการอะไร',
        'มือปริศนารู้ดีว่าคุณควรได้อะไร',
        'มีมือมาช่วย...ช่วยให้ได้ "ขอให้โชคดี"',
      ],
      mid_cat_paw: [
        'อุ้งเท้าแมวมาช่วยดึงวงล้อให้เรียบร้อย',
        'แมวรู้ดีว่าคุณควรได้อะไร...และไม่ควรได้อะไร',
        'อุ้งเท้าแมวปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
        'แมวมาช่วย...ช่วยให้ได้ "ขอให้โชคดี"',
      ],
      mid_magnet: [
        'แม่เหล็กดูดโชคมาดูดวงล้อให้เรียบร้อย',
        'แม่เหล็กรู้ดีว่าควรดูดไปที่ไหน...ที่ "ขอให้โชคดี"',
        'แม่เหล็กดูดโชคปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
      ],
      mid_wind: [
        'ลมพัดโชคปลิวมาพัดวงล้อให้เรียบร้อย',
        'ลมรู้ดีว่าควรพัดไปที่ไหน...ที่ "ขอให้โชคดี"',
        'ลมพัดโชคปลิวปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
      ],
      mid_mosquito: [
        'ยุงสะกิดวงล้อให้เรียบร้อย',
        'ยุงรู้ดีว่าควรสะกิดไปที่ไหน...ที่ "ขอให้โชคดี"',
        'ยุงสะกิดวงล้อปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
      ],
      mid_ai_glitch: [
        'AI มือซนมาดึงวงล้อให้เรียบร้อย',
        'AI รู้ดีว่าควรดึงไปที่ไหน...ที่ "ขอให้โชคดี"',
        'AI มือซนปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
      ],
      mid_spring: [
        'สปริงเด้งมาดึงวงล้อให้เรียบร้อย',
        'สปริงรู้ดีว่าควรเด้งไปที่ไหน...ที่ "ขอให้โชคดี"',
        'สปริงเด้งปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
      ],
      mid_butterfly: [
        'ผีเสื้อบินมาดึงวงล้อให้เรียบร้อย',
        'ผีเสื้อรู้ดีว่าควรบินไปที่ไหน...ที่ "ขอให้โชคดี"',
        'ผีเสื้อบินมาปรากฏ! เพื่อจัดการให้คุณได้รางวัลที่ถูกต้อง',
      ],
      general: [
        'ขอให้โชคดี...กับรอบหน้า',
        'ขอให้โชคดี...กับรอบถัดไป',
        'ขอให้โชคดี...ตลอดไป',
        'ดีใจด้วย! ได้รางวัลพิเศษ "ขอให้โชคดี"',
        'รางวัลนี้เหมาะกับคุณมาก',
        'วงล้อรู้ว่าคุณต้องการอะไร...และให้สิ่งนั้น',
        'เกือบได้รางวัลแล้ว...เกือบจริงๆ',
        'รอบหน้าคงได้...หรือเปล่า',
        'โชคดีมาก! ได้ "ขอให้โชคดี" อีกแล้ว',
        'วงล้อมันหยุดที่ "ขอให้โชคดี" ทุกครั้ง...น่าอัศจรรย์จริงๆ',
        'คุณโชคดีมากที่ได้รางวัลนี้',
        'รางวัลนี้เป็นรางวัลที่คุณสมควรได้รับ',
        'เกือบได้รางวัลอื่นแล้ว...แต่เกือบไม่ใช่ได้',
        'อีกนิดเดียวก็ได้รางวัลแล้ว...แต่นิดเดียวนี้มันยาวนานหน่อย',
        'เห็นรางวัลไหม? มันอยู่ใกล้มาก...แต่ไม่ใกล้พอ',
        'เกือบแล้ว! เกือบแล้ว! ...เกือบตลอดไป',
        'วงล้อมันหยุดใกล้รางวัลทุกครั้ง...แต่ไม่เคยหยุดที่รางวัล',
        'คุณเกือบจะโชคดีแล้ว...แต่เกือบไม่ใช่โชคดี',
        'ขอให้โชคดี...กับรอบนี้',
        'ขอให้โชคดี...กับทุกรอบ',
        'ดีใจด้วย! ได้รางวัลพิเศษ "ขอให้โชคดี" อีกแล้ว',
        'รางวัลนี้เหมาะกับคุณมาก...มากจริงๆ',
        'วงล้อรู้ว่าคุณต้องการอะไร...และให้สิ่งนั้นเสมอ',
        'เกือบได้รางวัลแล้ว...เกือบจริงๆ นะ',
        'รอบหน้าคงได้...หรือเปล่านะ',
        'วงล้อมันหยุดที่ "ขอให้โชคดี" ทุกครั้ง...น่าอัศจรรย์จริงๆ',
        'คุณโชคดีมากที่ได้รางวัลนี้...มากจริงๆ',
        'รางวัลนี้เป็นรางวัลที่คุณสมควรได้รับ...สมควรจริงๆ',
        'อีกนิดเดียวก็ได้รางวัลแล้ว...แต่นิดเดียวนี้มันยาวนานหน่อย',
        'เห็นรางวัลไหม? มันอยู่ใกล้มาก...แต่ไม่ใกล้พอ',
        'เกือบแล้ว! เกือบแล้ว! ...เกือบตลอดไป',
        'วงล้อมันหยุดใกล้รางวัลทุกครั้ง...แต่ไม่เคยหยุดที่รางวัล',
        'คุณเกือบจะโชคดีแล้ว...แต่เกือบไม่ใช่โชคดี',
        'ขอให้โชคดี...กับรอบนี้',
        'ขอให้โชคดี...กับรอบต่อไป',
        'ขอให้โชคดี...กับทุกรอบ',
        'ดีใจด้วย! ได้รางวัลพิเศษ "ขอให้โชคดี" อีกแล้ว',
        'รางวัลนี้เหมาะกับคุณมาก...มากจริงๆ',
        'วงล้อรู้ว่าคุณต้องการอะไร...และให้สิ่งนั้นเสมอ',
        'เกือบได้รางวัลแล้ว...เกือบจริงๆ นะ',
        'รอบหน้าคงได้...หรือเปล่านะ',
        'โชคดีมาก! ได้ "ขอให้โชคดี" อีกแล้ว',
        'วงล้อมันหยุดที่ "ขอให้โชคดี" ทุกครั้ง...น่าอัศจรรย์จริงๆ',
        'คุณโชคดีมากที่ได้รางวัลนี้...มากจริงๆ',
        'รางวัลนี้เป็นรางวัลที่คุณสมควรได้รับ...สมควรจริงๆ',
        'เกือบได้รางวัลอื่นแล้ว...แต่เกือบไม่ใช่ได้',
        'อีกนิดเดียวก็ได้รางวัลแล้ว...แต่นิดเดียวนี้มันยาวนานหน่อย',
        'เห็นรางวัลไหม? มันอยู่ใกล้มาก...แต่ไม่ใกล้พอ',
        'เกือบแล้ว! เกือบแล้ว! ...เกือบตลอดไป',
        'วงล้อมันหยุดใกล้รางวัลทุกครั้ง...แต่ไม่เคยหยุดที่รางวัล',
        'คุณเกือบจะโชคดีแล้ว...แต่เกือบไม่ใช่โชคดี',
        'ขอให้โชคดี...กับรอบนี้',
        'ขอให้โชคดี...กับรอบต่อไป',
        'ขอให้โชคดี...กับทุกรอบ',
        'ดีใจด้วย! ได้รางวัลพิเศษ "ขอให้โชคดี" อีกแล้ว',
        'รางวัลนี้เหมาะกับคุณมาก...มากจริงๆ',
        'วงล้อรู้ว่าคุณต้องการอะไร...และให้สิ่งนั้นเสมอ',
        'เกือบได้รางวัลแล้ว...เกือบจริงๆ นะ',
        'รอบหน้าคงได้...หรือเปล่านะ',
        'โชคดีมาก! ได้ "ขอให้โชคดี" อีกแล้ว',
        'วงล้อมันหยุดที่ "ขอให้โชคดี" ทุกครั้ง...น่าอัศจรรย์จริงๆ',
        'คุณโชคดีมากที่ได้รางวัลนี้...มากจริงๆ',
        'รางวัลนี้เป็นรางวัลที่คุณสมควรได้รับ...สมควรจริงๆ',
        'เกือบได้รางวัลอื่นแล้ว...แต่เกือบไม่ใช่ได้',
        'อีกนิดเดียวก็ได้รางวัลแล้ว...แต่นิดเดียวนี้มันยาวนานหน่อย',
        'เห็นรางวัลไหม? มันอยู่ใกล้มาก...แต่ไม่ใกล้พอ',
        'เกือบแล้ว! เกือบแล้ว! ...เกือบตลอดไป',
        'วงล้อมันหยุดใกล้รางวัลทุกครั้ง...แต่ไม่เคยหยุดที่รางวัล',
        'คุณเกือบจะโชคดีแล้ว...แต่เกือบไม่ใช่โชคดี',
        'ขอให้โชคดี...กับรอบนี้',
        'ขอให้โชคดี...กับรอบต่อไป',
        'ขอให้โชคดี...กับทุกรอบ',
        'ดีใจด้วย! ได้รางวัลพิเศษ "ขอให้โชคดี" อีกแล้ว',
        'รางวัลนี้เหมาะกับคุณมาก...มากจริงๆ',
        'วงล้อรู้ว่าคุณต้องการอะไร...และให้สิ่งนั้นเสมอ',
        'เกือบได้รางวัลแล้ว...เกือบจริงๆ นะ',
        'รอบหน้าคงได้...หรือเปล่านะ',
        'โชคดีมาก! ได้ "ขอให้โชคดี" อีกแล้ว',
        'วงล้อมันหยุดที่ "ขอให้โชคดี" ทุกครั้ง...น่าอัศจรรย์จริงๆ',
        'คุณโชคดีมากที่ได้รางวัลนี้...มากจริงๆ',
        'รางวัลนี้เป็นรางวัลที่คุณสมควรได้รับ...สมควรจริงๆ',
        'เกือบได้รางวัลอื่นแล้ว...แต่เกือบไม่ใช่ได้',
        'อีกนิดเดียวก็ได้รางวัลแล้ว...แต่นิดเดียวนี้มันยาวนานหน่อย',
        'เห็นรางวัลไหม? มันอยู่ใกล้มาก...แต่ไม่ใกล้พอ',
        'เกือบแล้ว! เกือบแล้ว! ...เกือบตลอดไป',
        'วงล้อมันหยุดใกล้รางวัลทุกครั้ง...แต่ไม่เคยหยุดที่รางวัล',
        'คุณเกือบจะโชคดีแล้ว...แต่เกือบไม่ใช่โชคดี',
        'ขอให้โชคดี...กับรอบนี้',
        'ขอให้โชคดี...กับรอบต่อไป',
        'ขอให้โชคดี...กับทุกรอบ',
        'ดีใจด้วย! ได้รางวัลพิเศษ "ขอให้โชคดี" อีกแล้ว',
        'รางวัลนี้เหมาะกับคุณมาก...มากจริงๆ',
        'วงล้อรู้ว่าคุณต้องการอะไร...และให้สิ่งนั้นเสมอ',
        'เกือบได้รางวัลแล้ว...เกือบจริงๆ นะ',
        'รอบหน้าคงได้...หรือเปล่านะ',
        'โชคดีมาก! ได้ "ขอให้โชคดี" อีกแล้ว',
        'วงล้อมันหยุดที่ "ขอให้โชคดี" ทุกครั้ง...น่าอัศจรรย์จริงๆ',
        'คุณโชคดีมากที่ได้รางวัลนี้...มากจริงๆ',
        'รางวัลนี้เป็นรางวัลที่คุณสมควรได้รับ...สมควรจริงๆ',
        'เกือบได้รางวัลอื่นแล้ว...แต่เกือบไม่ใช่ได้',
        'อีกนิดเดียวก็ได้รางวัลแล้ว...แต่นิดเดียวนี้มันยาวนานหน่อย',
        'เห็นรางวัลไหม? มันอยู่ใกล้มาก...แต่ไม่ใกล้พอ',
        'เกือบแล้ว! เกือบแล้ว! ...เกือบตลอดไป',
        'วงล้อมันหยุดใกล้รางวัลทุกครั้ง...แต่ไม่เคยหยุดที่รางวัล',
        'คุณเกือบจะโชคดีแล้ว...แต่เกือบไม่ใช่โชคดี',
      ],
    };
  }
}

// Initialize game when DOM is ready
let wheelGame;
document.addEventListener('DOMContentLoaded', () => {
  wheelGame = new WheelGame();
  wheelGame.init();
  wheelFX.init();
  wheelMascot.init('mascotContainer');
  
  // Show mascot on desktop
  if (window.innerWidth > 768) {
    const mascotContainer = document.getElementById('mascotContainer');
    if (mascotContainer) {
      mascotContainer.classList.add('visible');
    }
  }
});

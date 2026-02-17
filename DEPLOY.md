# คู่มือ Deploy บน Cloud

## วิธีที่ 1: Cloudflare Pages (แนะนำ - ฟรี, เร็วที่สุด)

### ขั้นตอน:

1. **เตรียมไฟล์บน GitHub**
   ```bash
   # ถ้ายังไม่ได้ init git
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   
   # สร้าง repo ใหม่บน GitHub แล้ว:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Deploy บน Cloudflare**
   - เข้า [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - สมัครบัญชีฟรี (ถ้ายังไม่มี)
   - ไปที่ **Pages** > **Create a project**
   - เลือก **Connect to Git**
   - Authorize GitHub และเลือก repository
   - ตั้งค่า Build:
     - **Framework preset**: `None`
     - **Build command**: เว้นว่าง
     - **Output directory**: `/` (root)
   - กด **Save and Deploy**
   - รอประมาณ 1-2 นาที
   - ได้ URL แล้ว: `https://your-project.pages.dev`

### ข้อดี:
- ✅ ฟรี ไม่จำกัด bandwidth
- ✅ เร็วมาก (CDN ทั่วโลก)
- ✅ Auto deploy เมื่อ push code
- ✅ รองรับ custom domain ฟรี

---

## วิธีที่ 2: GitHub Pages (ฟรี, ง่ายที่สุด)

### ขั้นตอน:

1. **Push ไฟล์ขึ้น GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **เปิดใช้งาน GitHub Pages**
   - ไปที่ repository บน GitHub
   - ไปที่ **Settings** > **Pages**
   - **Source**: เลือก `main` branch และ `/` (root)
   - กด **Save**
   - รอประมาณ 1-2 นาที
   - ได้ URL แล้ว: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### ข้อดี:
- ✅ ฟรี
- ✅ ไม่ต้องสมัคร platform เพิ่ม
- ✅ Auto deploy เมื่อ push code

### ข้อจำกัด:
- ⚠️ ต้องเป็น public repo (ถ้าใช้ free plan)
- ⚠️ ช้ากว่า Cloudflare Pages นิดหน่อย

---

## วิธีที่ 3: Netlify (ฟรี, UI สวย)

### ขั้นตอน:

1. **Push ไฟล์ขึ้น GitHub** (ตามวิธีที่ 2)

2. **Deploy บน Netlify**
   - เข้า [Netlify](https://www.netlify.com/)
   - สมัครบัญชีฟรี (ใช้ GitHub login ได้)
   - กด **Add new site** > **Import an existing project**
   - เลือก **GitHub** และเลือก repository
   - ตั้งค่า Build:
     - **Build command**: เว้นว่าง
     - **Publish directory**: `/` (root)
   - กด **Deploy site**
   - ได้ URL แล้ว: `https://your-project.netlify.app`

### ข้อดี:
- ✅ ฟรี
- ✅ UI สวย ใช้งานง่าย
- ✅ Auto deploy เมื่อ push code
- ✅ รองรับ custom domain ฟรี

---

## วิธีที่ 4: Vercel (ฟรี, สำหรับ Developer)

### ขั้นตอน:

1. **Push ไฟล์ขึ้น GitHub** (ตามวิธีที่ 2)

2. **Deploy บน Vercel**
   - เข้า [Vercel](https://vercel.com/)
   - สมัครบัญชีฟรี (ใช้ GitHub login ได้)
   - กด **Add New Project**
   - เลือก GitHub repository
   - ตั้งค่า:
     - **Framework Preset**: Other
     - **Root Directory**: `./`
   - กด **Deploy**
   - ได้ URL แล้ว: `https://your-project.vercel.app`

### ข้อดี:
- ✅ ฟรี
- ✅ เร็วมาก
- ✅ Auto deploy เมื่อ push code
- ✅ รองรับ custom domain ฟรี

---

## วิธีที่ 5: Surge.sh (Deploy ผ่าน Command Line)

### ขั้นตอน:

```bash
# ติดตั้ง Surge
npm install -g surge

# Deploy
surge

# ใส่ email และ password (สมัครใหม่)
# ใส่ domain ที่ต้องการ (เช่น: your-project.surge.sh)
# เสร็จแล้ว!
```

### ข้อดี:
- ✅ ฟรี
- ✅ เร็วมาก
- ✅ Deploy ผ่าน command line

---

## สรุปเปรียบเทียบ

| Platform | ฟรี | ความเร็ว | ความง่าย | Custom Domain |
|----------|-----|----------|----------|---------------|
| Cloudflare Pages | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ ฟรี |
| GitHub Pages | ✅ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ ฟรี |
| Netlify | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ ฟรี |
| Vercel | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ ฟรี |
| Surge.sh | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ ฟรี |

## คำแนะนำ

- **สำหรับผู้เริ่มต้น**: ใช้ **GitHub Pages** (ง่ายที่สุด)
- **สำหรับความเร็ว**: ใช้ **Cloudflare Pages** หรือ **Vercel**
- **สำหรับ UI สวย**: ใช้ **Netlify**

## หมายเหตุ

- ทุก platform รองรับ HTTPS อัตโนมัติ
- เมื่อ push code ใหม่ จะ deploy อัตโนมัติ (ยกเว้น Surge.sh)
- สามารถตั้ง custom domain ได้ฟรีทุก platform

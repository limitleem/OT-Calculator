# OT Builder Pro ⚡

**OT Builder Pro** เป็นเครื่องมือคำนวณโอที (Overtime Calculator) อัจฉริยะแบบเป็นส่วนตัว ออกแบบและพัฒนาเพื่อตอบโจทย์ผู้ใช้งานไทยโดยเฉพาะด้วยระบบคำนวณที่อิงจากกฎหมายแรงงานไทยและวันหยุดนักขัตฤกษ์ประจำปี

---

## 🌟 ฟีเจอร์เด่น (Key Features)

- **Privacy First**: ข้อมูลทั้งหมดถูกเก็บไว้ในเครื่องของคุณเท่านั้น (`localStorage`) ไม่มีการส่งข้อมูลไปยังเซิร์ฟเวอร์ใดๆ
- **Multi-profile Management**: รองรับการสร้างหลายโปรไฟล์ และระบบล็อคโปรไฟล์ด้วย PIN 6 หลักเพื่อความเป็นส่วนตัว
- **Smart Calendar & Date Ranges**: เลือกช่วงวันที่ทำโอทีได้อย่างยืดหยุ่นด้วย `flatpickr`
- **Dynamic Calculation**: คำนวณค่าโอทีให้อัตโนมัติ:
  - วันทำงานปกติ (Workdays OT) อัตรา `1.5` เท่า
  - วันหยุดนักขัตฤกษ์/เสาร์-อาทิตย์ เวลาทำงานปกติ อัตรา `1.0` เท่า (หักเวลาพักเที่ยง 12:00 - 13:00)
  - วันหยุดนักขัตฤกษ์/เสาร์-อาทิตย์ นอกเวลาทำงานปกติ อัตรา `3.0` เท่า
- **Interactive Drag & Drop**: จัดเรียงลำดับรายการโอทีได้อย่างสะดวกด้วยการลากวาง (`SortableJS`)
- **Responsive Premium Theme**: หน้าตาแอปสไตล์ Dark Glassmorphism ทันสมัย สวยงาม และใช้งานง่ายบนทุกอุปกรณ์

---

## 🛠 เทคโนโลยีที่ใช้ (Tech Stack)

- **Core**: Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS
- **Libraries (via CDN)**:
  - [Flatpickr](https://flatpickr.js.org/) (Date/Time Picker)
  - [SortableJS](https://sortablejs.github.io/Sortable/) (Drag and Drop)
  - [DiceBear](https://www.dicebear.com/) (Avatar Generation API)

---

## 🚀 วิธีการรันแอป (Getting Started)

เนื่องจากโปรเจกต์นี้เป็น Client-side Web Application แท้ๆ คุณไม่จำเป็นต้องติดตั้ง Node/npm หรือรันเซิร์ฟเวอร์ที่ซับซ้อน:
1. ดับเบิ้ลคลิกไฟล์ `index.html` เพื่อเปิดใช้งานในเว็บเบราว์เซอร์ได้ทันที
2. หรือใช้ส่วนขยาย **Live Server** ใน VS Code เพื่อรันในโหมด Development

---

## 🤖 สำหรับ AI Assistants (AI-Oriented Files)

โปรเจกต์นี้รองรับและปรับแต่งมาเพื่อให้ AI coding agents (เช่น Cursor, Cline, Copilot) ทำงานได้อย่างแม่นยำด้วยการจัดทำไฟล์อ้างอิงเฉพาะ:
*   [context.md](file:///d:/LEEM/Git/OT-Calculator/context.md): อธิบายสถาปัตยกรรม สูตรการคำนวณ โครงสร้างข้อมูล และ Storage Schema โดยละเอียด
*   [.clinerules](file:///d:/LEEM/Git/OT-Calculator/.clinerules): กฎและแนวทางปฏิบัติสำหรับการแก้ไขโค้ดของ Cline
*   [.cursorrules](file:///d:/LEEM/Git/OT-Calculator/.cursorrules): กฎและแนวทางปฏิบัติสำหรับการเขียนโค้ดของ Cursor AI

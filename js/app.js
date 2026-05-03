/**
 * OT Builder Pro - Application Logic
 */

let currentUser = null;
let userProfiles = [];
let currentPinInput = "";
let targetUserForPin = null;

let profileModalMode = "add";
let editingUser = null;
let tempAvatarType = "dicebear";
let tempAvatarSeed = "Felix";
let tempAvatarColor = "#60a5fa";
let tempAvatarEmoji = "😀";
let tempAvatarStyle = "avataaars";
let dicebearView = "styles";
let currentVariants = [];

// Helper functions
const fm = n => (+n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fh = n => (n % 1 === 0 ? n : +n.toFixed(2));
const toHour = t => { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h + m / 60; };
const calMoney = m => Math.round(m * 100) / 100;
const isHoliday = dStr => {
    const d = new Date(dStr);
    return d.getDay() === 0 || d.getDay() === 6 || APP_CONFIG.HOLIDAYS_2569.some(h => h.date === dStr);
};

function getAvatarHTML(user) {
    const type = user.avatarType || "dicebear";
    const style = user.avatarStyle || "avataaars";
    const seed = user.avatar || "Felix";
    const emoji = user.emoji || "😀";
    
    if (type === "dicebear") return `<img src="https://api.dicebear.com/7.x/${style}/svg?seed=${seed}" alt="avatar">`;
    if (type === "initials") return `<span style="color:#000">${user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>`;
    if (type === "emoji") return `<span>${emoji}</span>`;
    return `?`;
}

function initUsers() {
    const stored = JSON.parse(
        localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PROFILES) || 
        localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LEGACY_PROFILES) || 
        "[]"
    );
    
    userProfiles = stored.length ? stored : [
        { name: "Default User", color: "#60a5fa", avatar: "Felix", avatarStyle: "avataaars", avatarType: "dicebear", emoji: "😀", isGuest: false }
    ];
    
    if (!userProfiles.some(u => u.name === "Guest")) {
        userProfiles.push({ name: "Guest", color: "#9ca3af", avatar: "guest", avatarStyle: "bottts", avatarType: "dicebear", emoji: "👤", isGuest: true });
    }

    const active = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER);
    
    // 1-Hour Expiry for Guest
    const guestStart = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.GUEST_START_TIME);
    if (active === "Guest" && guestStart && (Date.now() - parseInt(guestStart) > APP_CONFIG.GUEST_EXPIRY_MS)) {
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + "Guest");
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.GUEST_START_TIME);
        showToast(APP_CONFIG.TEXT.GUEST_SESSION_EXPIRED, "info");
    }

    if (active && userProfiles.some(u => u.name === active)) { 
        completeLogin(active); 
    } else { 
        showLanding(); 
    }
}

function showLanding() {
    if (currentUser) {
        const u = userProfiles.find(x => x.name === currentUser);
        if (u && u.isGuest) { 
            localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + currentUser); 
            showToast(APP_CONFIG.TEXT.GUEST_DATA_CLEARED, "success");
        } else { 
            saveData(); 
        }
    }
    currentUser = null; 
    document.getElementById("profileSection").style.display = "none";
    const grid = document.getElementById("userGrid");
    
    grid.innerHTML = userProfiles.map(u => `
        <div class="user-profile-card" onclick="selectProfile('${u.name}')">
            <div class="user-avatar" style="background:${u.color}">
                ${getAvatarHTML(u)}
                ${u.pin ? '<div class="pin-indicator">🔒</div>' : ''}
                ${u.isGuest ? '<div style="position:absolute; top:0; left:0; background:var(--red); color:#fff; font-size:0.6rem; padding:2px 6px; border-bottom-right-radius:8px;">GUEST</div>' : ''}
            </div>
            <div class="user-name">${u.name}</div>
        </div>
    `).join('') + `<div class="user-profile-card" onclick="openProfileModal('add')"><div class="user-avatar add-btn">+</div><div class="user-name">เพิ่มโปรไฟล์</div></div>`;
    
    document.getElementById("landingScreen").classList.add("show");
}

function selectProfile(name) {
    const u = userProfiles.find(x => x.name === name);
    if (u.pin) { 
        targetUserForPin = u; 
        currentPinInput = ""; 
        updatePinDots(); 
        document.getElementById("pinUserTitle").innerText = u.name; 
        document.getElementById("pinScreen").classList.add("show"); 
    } else { 
        completeLogin(name); 
    }
}

function completeLogin(name) {
    currentUser = name; 
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER, name); 
    document.getElementById("landingScreen").classList.remove("show"); 
    document.getElementById("pinScreen").classList.remove("show");
    
    const u = userProfiles.find(x => x.name === name);
    if (u && u.isGuest) {
        if (!localStorage.getItem(APP_CONFIG.STORAGE_KEYS.GUEST_START_TIME)) {
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.GUEST_START_TIME, Date.now());
        }
    } else {
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.GUEST_START_TIME);
    }

    document.getElementById("items-container").innerHTML = ""; 
    updateHeaderProfile(); 
    loadData();
    renderHolidays();
    if (typeof Sortable !== 'undefined') {
        new Sortable(document.getElementById("items-container"), {
            animation: 200, handle: ".drag-handle", ghostClass: "sortable-ghost", dragClass: "sortable-drag", onEnd: calculate
        });
    }
}

function updateHeaderProfile() {
    const u = userProfiles.find(x => x.name === currentUser); 
    if (!u) return;
    document.getElementById("profileSection").style.display = "block"; 
    document.getElementById("topUserName").innerText = u.name;
    const av = document.getElementById("topUserAvatar"); 
    av.style.background = u.color; 
    av.innerHTML = getAvatarHTML(u);
}

function pressPin(n) {
    if (currentPinInput.length < 6) { 
        currentPinInput += n; 
        updatePinDots(); 
        if (currentPinInput.length === 6) { 
            if (currentPinInput === targetUserForPin.pin) completeLogin(targetUserForPin.name); 
            else { currentPinInput = ""; updatePinDots(); showToast(APP_CONFIG.TEXT.PIN_INCORRECT, "error"); } 
        } 
    }
}
function backspacePin() { currentPinInput = currentPinInput.slice(0, -1); updatePinDots(); }
function updatePinDots() { document.querySelectorAll(".pin-dot").forEach((d, i) => d.classList.toggle("filled", i < currentPinInput.length)); }

function openProfileModal(mode) {
    profileModalMode = mode; 
    document.getElementById("profileModalTitle").innerText = mode === "add" ? "สร้างโปรไฟล์ใหม่" : "ตั้งค่าโปรไฟล์";
    dicebearView = "styles";

    if (mode === "add") { 
        editingUser = null; 
        document.getElementById("profileName").value = ""; 
        document.getElementById("profilePin").value = ""; 
        tempAvatarType = "dicebear"; 
        tempAvatarSeed = Math.random().toString(36).substring(7); 
        tempAvatarColor = "#60a5fa"; 
        tempAvatarEmoji = "😀"; 
        tempAvatarStyle = "avataaars";
    } else { 
        editingUser = userProfiles.find(x => x.name === currentUser); 
        document.getElementById("profileName").value = editingUser.name; 
        document.getElementById("profilePin").value = editingUser.pin || ""; 
        tempAvatarType = editingUser.avatarType || "dicebear"; 
        tempAvatarSeed = editingUser.avatar; 
        tempAvatarColor = editingUser.color; 
        tempAvatarEmoji = editingUser.emoji; 
        tempAvatarStyle = editingUser.avatarStyle || "avataaars"; 
    }
    renderGrids(); 
    setAvatarType(tempAvatarType); 
    document.getElementById("profileModal").classList.add("show");
}

function closeProfileModal() { document.getElementById("profileModal").classList.remove("show"); }

function renderGrids() {
    // Color Grid
    document.getElementById("colorGrid").innerHTML = APP_CONFIG.PRESET_COLORS.map(c => `
        <div class="color-opt ${c === tempAvatarColor ? 'active' : ''}" style="background:${c}" onclick="setTempColor('${c}')"></div>
    `).join('');
    
    // Emoji Grid
    document.getElementById("emojiGrid").innerHTML = APP_CONFIG.PRESET_EMOJIS.map(e => `
        <div class="emoji-opt ${e === tempAvatarEmoji ? 'active' : ''}" onclick="setTempEmoji('${e}')">${e}</div>
    `).join('');

    renderDicebearSection();
}

function renderDicebearSection() {
    const styleView = document.getElementById("dicebearStyleView");
    const variantView = document.getElementById("dicebearVariantView");

    if (dicebearView === "styles") {
        styleView.style.display = "block";
        variantView.style.display = "none";
        document.getElementById("styleGrid").innerHTML = APP_CONFIG.DICEBEAR_STYLES.map(s => `
            <div class="style-opt ${s.id === tempAvatarStyle ? 'active' : ''}" onclick="selectDicebearStyle('${s.id}')" title="${s.name}">
                <img src="https://api.dicebear.com/7.x/${s.id}/svg?seed=preview" alt="${s.name}">
            </div>
        `).join('');
    } else {
        styleView.style.display = "none";
        variantView.style.display = "block";
        if (!currentVariants.length) refreshVariants(false);
        document.getElementById("variantGrid").innerHTML = currentVariants.map(v => `
            <div class="variant-opt ${v === tempAvatarSeed ? 'active' : ''}" onclick="setTempSeed('${v}')">
                <img src="https://api.dicebear.com/7.x/${tempAvatarStyle}/svg?seed=${v}">
            </div>
        `).join('');
    }
}

function selectDicebearStyle(s) {
    tempAvatarStyle = s;
    dicebearView = "variants";
    currentVariants = [];
    renderDicebearSection();
    updateAvatarPreview();
}

function setDicebearView(v) {
    dicebearView = v;
    renderDicebearSection();
}

function refreshVariants(shouldRender = true) {
    currentVariants = Array.from({length: 10}, () => Math.random().toString(36).substring(7));
    if (shouldRender) renderDicebearSection();
}

function setTempColor(c) { tempAvatarColor = c; renderGrids(); updateAvatarPreview(); }
function setTempEmoji(e) { tempAvatarEmoji = e; renderGrids(); updateAvatarPreview(); }
function setTempSeed(s) { tempAvatarSeed = s; renderDicebearSection(); updateAvatarPreview(); }

function setAvatarType(t) { 
    tempAvatarType = t; 
    document.querySelectorAll(".avatar-tab").forEach(x => x.classList.toggle("active", x.dataset.type === t)); 
    document.getElementById("pickerDicebear").style.display = t === "dicebear" ? "block" : "none"; 
    document.getElementById("pickerEmoji").style.display = t === "emoji" ? "block" : "none"; 
    updateAvatarPreview(); 
}

function updateAvatarPreview() {
    const p = document.getElementById("avatarPreviewLarge");
    const name = document.getElementById("profileName").value;
    p.style.background = tempAvatarColor; 
    if (tempAvatarType === "dicebear") {
        p.innerHTML = `<img src="https://api.dicebear.com/7.x/${tempAvatarStyle}/svg?seed=${tempAvatarSeed}">`;
    } else if (tempAvatarType === "initials") {
        p.innerHTML = `<span>${name ? name.charAt(0).toUpperCase() : '?'}</span>`;
    } else {
        p.innerHTML = `<span>${tempAvatarEmoji}</span>`;
    }
}

function saveProfile() {
    const nameInput = document.getElementById("profileName");
    const pinInput = document.getElementById("profilePin");
    const name = nameInput.value.trim();
    const pin = pinInput.value.trim();
    
    if (!name) return showToast(APP_CONFIG.TEXT.PROFILE_NAME_REQUIRED, "error");
    
    const data = { 
        name, 
        pin: pin || null, 
        color: tempAvatarColor, 
        avatar: tempAvatarSeed, 
        avatarStyle: tempAvatarStyle, 
        avatarType: tempAvatarType, 
        emoji: tempAvatarEmoji,
        isGuest: profileModalMode === "edit" ? editingUser.isGuest : false
    };

    if (profileModalMode === "add") { 
        if (userProfiles.some(u => u.name === name)) return showToast(APP_CONFIG.TEXT.PROFILE_EXISTS, "error"); 
        userProfiles.push(data); 
    } else { 
        if (name !== editingUser.name) { 
            const old = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + editingUser.name); 
            if (old) { 
                localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + name, old); 
                localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + editingUser.name); 
            } 
        } 
        Object.assign(editingUser, data); 
    }
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.PROFILES, JSON.stringify(userProfiles)); 
    closeProfileModal(); 
    completeLogin(name);
}

function deleteUser() {
    if (userProfiles.length <= 1) return showToast("ลบไม่ได้ (คนสุดท้าย)", "error");
    showConfirm(APP_CONFIG.TEXT.DELETE_CONFIRM(currentUser), "ลบ", "🗑", () => { 
        const i = userProfiles.findIndex(x => x.name === currentUser); 
        userProfiles.splice(i, 1); 
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + currentUser); 
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.PROFILES, JSON.stringify(userProfiles)); 
        showLanding(); 
    });
}

function addItem() {
    const id = Date.now();
    const html = `
        <div class="item active" data-id="${id}">
            <div class="item-header" onclick="this.closest('.item').classList.toggle('active')">
                <span class="drag-handle" title="ลาก">⠿</span>
                <span class="item-type-dot dot-weekday"></span>
                <span class="item-name">รายการใหม่</span>
                <div class="item-meta">
                    <span class="item-amount">฿0.00</span>
                    <svg class="item-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
            <div class="item-body" onclick="event.stopPropagation();">
                <div class="field-row col-2">
                    <div class="field">
                        <label>ช่วงวันที่ทำ OT</label>
                        <input class="date-range" placeholder="เลือกช่วงวันที่">
                    </div>
                    <div class="field">
                        <label>ประเภทวัน</label>
                        <div style="display:flex; gap:12px; align-items:center; height:38px;">
                            <label class="checkbox-custom checked">
                                <input type="checkbox" class="chk-wd" checked>
                                <div class="cb-box"></div>
                                <span>วันทำงาน</span>
                            </label>
                            <label class="checkbox-custom">
                                <input type="checkbox" class="chk-hd">
                                <div class="cb-box"></div>
                                <span>วันหยุด</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="field-row col-2 time-row-wd">
                    <div class="field">
                        <label>เวลาเริ่ม (วันทำงาน)</label>
                        <input class="start-wd" placeholder="เลือกเวลา" value="16:30">
                    </div>
                    <div class="field">
                        <label>เวลาสิ้นสุด (วันทำงาน)</label>
                        <input class="end-wd" placeholder="เลือกเวลา" value="20:30">
                    </div>
                </div>
                <div class="field-row col-2 time-row-hd" style="display:none;">
                    <div class="field">
                        <label>เวลาเริ่ม (วันหยุด)</label>
                        <input class="start-hd" placeholder="เลือกเวลา" value="08:30">
                    </div>
                    <div class="field">
                        <label>เวลาสิ้นสุด (วันหยุด)</label>
                        <input class="end-hd" placeholder="เลือกเวลา" value="16:30">
                    </div>
                </div>
                <div class="field">
                    <label>หมายเหตุ / ชื่อรายการ</label>
                    <input type="text" class="name" placeholder="ระบุหมายเหตุ..." onfocus="this.dataset.edited='1'">
                </div>
                <div class="error-text" style="color:var(--red); font-size:0.75rem; margin-top:8px; display:none;"></div>
                <div class="item-info-container" style="margin-top:12px;"></div>
                <div style="display:flex; justify-content:flex-end; margin-top:16px;">
                    <button class="btn-del" onclick="this.closest('.item').remove();calculate()">
                        <span>🗑 ลบรายการ</span>
                    </button>
                </div>
            </div>
        </div>`;
    
    document.getElementById("items-container").insertAdjacentHTML('beforeend', html); 
    const el = document.querySelector(`[data-id="${id}"]`);
    
    flatpickr(el.querySelector(".date-range"), { mode: "range", onChange: () => updateItemUI(el) });
    el.querySelectorAll(".start-wd, .end-wd, .start-hd, .end-hd").forEach(x => 
        flatpickr(x, { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, onChange: () => updateItemUI(el) })
    );
    
    el.querySelectorAll(".chk-wd, .chk-hd").forEach(x => x.onchange = () => { 
        x.closest('.checkbox-custom').classList.toggle('checked', x.checked);
        el.querySelector(".time-row-wd").style.display = el.querySelector(".chk-wd").checked ? "grid" : "none"; 
        el.querySelector(".time-row-hd").style.display = el.querySelector(".chk-hd").checked ? "grid" : "none"; 
        updateItemUI(el); 
    });
    
    el.querySelector(".name").oninput = () => { 
        el.querySelector(".item-name").innerText = el.querySelector(".name").value || "รายการใหม่"; 
        calculate(); 
    };
    
    updateItemUI(el);
}

function updateItemUI(el) {
    const range = el.querySelector(".date-range").value;
    const dates = getDaysInRange(range);
    let wd = 0, hd = 0; 
    dates.forEach(d => { 
        if (isHoliday(d)) hd++; 
        else wd++; 
    });

    const chkWd = el.querySelector(".chk-wd").checked;
    const chkHd = el.querySelector(".chk-hd").checked;
    const nameInput = el.querySelector(".name");
    const errorEl = el.querySelector(".error-text");

    // Warnings
    errorEl.style.display = "none";
    if (chkWd && dates.length > 0 && wd === 0) { errorEl.innerText = "⚠️ ไม่มีวันทำงานในช่วงวันที่เลือก!"; errorEl.style.display = "block"; }
    if (chkHd && dates.length > 0 && hd === 0) { errorEl.innerText = "⚠️ ไม่มีวันหยุดในช่วงวันที่เลือก!"; errorEl.style.display = "block"; }

    // Auto naming
    if (!nameInput.dataset.edited && dates.length > 0) {
        const d1 = formatThaiDate(dates[0]).short;
        const d2 = formatThaiDate(dates[dates.length-1]).short;
        nameInput.value = dates.length > 1 ? `OT ${d1} - ${d2}` : `OT ${d1}`;
        el.querySelector(".item-name").innerText = nameInput.value;
    }
    
    const dot = el.querySelector(".item-type-dot");
    if (chkWd && chkHd) { dot.className = "item-type-dot dot-weekday"; dot.style.background = "linear-gradient(to right, var(--green), var(--accent))"; }
    else if (chkWd) { dot.className = "item-type-dot dot-weekday"; dot.style.background = ""; }
    else if (chkHd) { dot.className = "item-type-dot dot-holiday"; dot.style.background = ""; }
    else { dot.className = "item-type-dot"; dot.style.background = "var(--text3)"; }
    
    let parts = [];
    if (chkWd && wd > 0) { 
        const h = calcH(el.querySelector(".start-wd").value, el.querySelector(".end-wd").value, true); 
        parts.push(`<div class="info-strip"><div class="dot" style="background:var(--green)"></div><div class="info-text"><b>วันทำงาน ${wd} วัน</b>: ${fh(h.total * wd)} ชม. (${fh(h.total)} ชม. × 1.5 เท่า)</div></div>`); 
    }
    if (chkHd && hd > 0) { 
        const h = calcH(el.querySelector(".start-hd").value, el.querySelector(".end-hd").value, false); 
        let hParts = [];
        if (h.h1) hParts.push(`${fh(h.h1)} ชม. × 1.0`);
        if (h.h3) hParts.push(`${fh(h.h3)} ชม. × 3.0`);
        parts.push(`<div class="info-strip"><div class="dot" style="background:var(--accent)"></div><div class="info-text"><b>วันหยุด ${hd} วัน</b>: ${fh(h.total * hd)} ชม. (${hParts.join(' + ')} | หักพัก 1 ชม.)</div></div>`); 
    }
    el.querySelector(".item-info-container").innerHTML = parts.join('') || ""; 
    calculate();
}

function getDaysInRange(r) { 
    if (!r.includes(" to ")) return r ? [r] : []; 
    const [s, e] = r.split(" to "); 
    let d = [], c = new Date(s), end = new Date(e); 
    while (c <= end) { 
        d.push(c.toISOString().split('T')[0]); 
        c.setDate(c.getDate() + 1); 
    } 
    return d; 
}

function calcH(sv, ev, isW) {
    let s = toHour(sv), e = toHour(ev); 
    if (e <= s) e += 24;
    let total = 0, h1 = 0, h15 = 0, h3 = 0;
    for (let h = s; h < e; h += 0.5) {
        let x = h >= 24 ? h - 24 : h;
        if (isW) { if (x >= 8.5 && x < 16.5) continue; h15 += 0.5; total += 0.5; }
        else { if (x >= 8.5 && x < 16.5) { if (x >= 12 && x < 13) continue; h1 += 0.5; } else h3 += 0.5; total += 0.5; }
    }
    return { total, h1, h15, h3 };
}

const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THAI_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const formatThaiDate = (dateStr) => {
    if (!dateStr) return { short: "", full: "" };
    const d = new Date(dateStr);
    const day = THAI_DAYS[d.getDay()];
    const date = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const year = d.getFullYear() + 543;
    return { short: `${date} ${month} ${year}`, full: `${day} ${date} ${month} ${year}`, monthIndex: d.getMonth(), monthName: month, year };
};




function calculate() {
    const salary = +document.getElementById("salary").value || 0;
    const hourly = calMoney(salary / 30 / 7);   
    const daily = calMoney(hourly * 7);

    document.getElementById("sumDaily").innerText = fm(daily);
    document.getElementById("sum1").innerText = fm(hourly);
    document.getElementById("sum15").innerText = fm(hourly * 1.5);
    document.getElementById("sum3").innerText = fm(hourly * 3);

    const prHrly15 = calMoney(hourly * 1.5);
    const prHrly3 = calMoney(hourly * 3);

    let total = 0, rows = "";
    document.querySelectorAll(".item").forEach(item => {
        const range = item.querySelector(".date-range").value;
        const dates = getDaysInRange(range);
        const name = item.querySelector(".name").value || "รายการใหม่";
        
        let wdD = [], hdD = []; 
        dates.forEach(d => { 
            if (isHoliday(d)) hdD.push(d); 
            else wdD.push(d); 
        });

        const calcRow = (isWd, startVal, endVal, count, dateList) => {
            if (!startVal || !endVal || count === 0) return null;
            let s = toHour(startVal);
            let e = toHour(endVal);
            if (e <= s && s > 0) e += 24;
            let h1 = 0, h15 = 0, h3 = 0;
            for (let h = s; h < e; h += 0.5) {
                let x = h >= 24 ? h - 24 : h;
                if (isWd) {
                    if (x >= 8.5 && x < 16.5) continue;
                    h15 += 0.5;
                } else {
                    if (x >= 8.5 && x < 16.5) {
                        if (x >= 12 && x < 13) continue;
                        h1 += 0.5;
                    } else { h3 += 0.5; }
                }
            }

            let hhh1 = calMoney(h1 * hourly);
            if(h1 >= 7){
                hhh1 = calMoney(3.5 * hourly) + calMoney((h1-3.5) * hourly) ;
            }
            const hhh15 = calMoney(h15 * prHrly15);
            const hhh3 = calMoney(h3 * prHrly3);

            const dayVal = calMoney(hhh1 + hhh15 + hhh3); 
            const sumTotal = calMoney(dayVal * count);

            const c1 = h1 > 0 ? `<span class="hours-chip x1">${fh(h1)} ชม. × 1.0 = ${fm(hhh1)}</span>` : '';
            const c15 = h15 > 0 ? `<span class="hours-chip x15">${fh(h15)} ชม. × 1.5 = ${fm(hhh15)}</span>` : '';
            const c3 = h3 > 0 ? `<span class="hours-chip x3">${fh(h3)} ชม. × 3.0 = ${fm(hhh3)}</span>` : '';
            const ratesHtml = `${c1}${c15}${c3}`;

            const badgeHtml = isWd ? '<span class="badge badge-wd" style="margin-right:6px;">WD</span>' : '<span class="badge badge-hd" style="margin-right:6px;">HD</span>';
            const timeHtml = `<div class="mono" style="display:flex;align-items:center;justify-content:center;color:var(--text2);font-size:0.75rem">${badgeHtml}${startVal}–${endVal} ${(e > 24) ? '<span style="font-size:0.6rem;color:var(--blue);background:var(--blue-dim);padding:1px 4px;border-radius:3px;margin-left:4px;">+1</span>' : ''}</div>`;
            
            const nameSafe = name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            const datesJson = JSON.stringify(dateList).replace(/"/g, '&quot;');
            const daysDisplay = `<span style="cursor:pointer; text-decoration:underline;" onclick="showDaysBreakdown('${isWd?'วันทำงาน':'วันหยุด'} - ${nameSafe}', ${datesJson})">${count} วัน</span>`;

            return { total: sumTotal, ratesHtml, timeHtml, dayVal, daysDisplay };
        };

        const w = item.querySelector(".chk-wd").checked ? calcRow(true, item.querySelector(".start-wd").value, item.querySelector(".end-wd").value, wdD.length, wdD) : null;
        const h = item.querySelector(".chk-hd").checked ? calcRow(false, item.querySelector(".start-hd").value, item.querySelector(".end-hd").value, hdD.length, hdD) : null;

        let itemTotal = 0;
        if (w && h) {
            itemTotal = w.total + h.total;
            rows += `
            <tr>
                <td rowspan="2"><span style="font-weight:600;font-size:0.85rem">${name}</span></td>
                <td>${w.timeHtml}</td>
                <td style="white-space:nowrap">${w.ratesHtml}</td>
                <td class="text-center mono" style="color:var(--text2)">${w.daysDisplay}</td>
                <td class="text-right">฿${fm(w.total)}</td>
                <td rowspan="2" class="text-right" style="border-left:1px solid var(--border); background:rgba(240,192,64,0.03); font-weight:700;">฿${fm(itemTotal)}</td>
            </tr>
            <tr>
                <td>${h.timeHtml}</td>
                <td style="white-space:nowrap">${h.ratesHtml}</td>
                <td class="text-center mono" style="color:var(--text2)">${h.daysDisplay}</td>
                <td class="text-right">฿${fm(h.total)}</td>
            </tr>`;
        } else if (w) {
            itemTotal = w.total;
            rows += `<tr><td><span style="font-weight:600;font-size:0.85rem">${name}</span></td><td>${w.timeHtml}</td><td style="white-space:nowrap">${w.ratesHtml}</td><td class="text-center mono" style="color:var(--text2)">${w.daysDisplay}</td><td class="text-right">฿${fm(w.total)}</td><td class="text-right" style="border-left:1px solid var(--border); background:rgba(240,192,64,0.03); font-weight:700;">฿${fm(itemTotal)}</td></tr>`;
        } else if (h) {
            itemTotal = h.total;
            rows += `<tr><td><span style="font-weight:600;font-size:0.85rem">${name}</span></td><td>${h.timeHtml}</td><td style="white-space:nowrap">${h.ratesHtml}</td><td class="text-center mono" style="color:var(--text2)">${h.daysDisplay}</td><td class="text-right">฿${fm(h.total)}</td><td class="text-right" style="border-left:1px solid var(--border); background:rgba(240,192,64,0.03); font-weight:700;">฿${fm(itemTotal)}</td></tr>`;
        }

        item.querySelector(".item-amount").innerText = `฿${fm(itemTotal)}`; 
        total += itemTotal;
    });

    document.getElementById("result-table").innerHTML = `
        <table>
            <thead><tr><th>รายการ</th><th>เวลา</th><th class="text-center">เรต</th><th class="text-center">จำนวน</th><th class="text-right">รวม</th><th class="text-right" style="background:rgba(240,192,64,0.03)">สรุปรายวัน</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text3)">ไม่มีข้อมูลการคำนวณ</td></tr>'}</tbody>
            <tfoot><tr><td colspan="5" class="text-right">รายรับรวมสุทธิ</td><td class="text-right" style="color:var(--accent); font-weight:700; font-size:1.1rem;">฿${fm(total)}</td></tr></tfoot>
        </table>`;
        
    document.getElementById("headerTotal").innerText = `฿${fm(total)}`; 
    document.getElementById("itemCount").innerText = `${document.querySelectorAll(".item").length} รายการ`; 
    saveData();
}

function saveData() { 
    if (currentUser) { 
        const data = { 
            salary: document.getElementById("salary").value, 
            items: Array.from(document.querySelectorAll(".item")).map(el => ({ 
                range: el.querySelector(".date-range").value, 
                chkWd: el.querySelector(".chk-wd").checked, 
                chkHd: el.querySelector(".chk-hd").checked, 
                startWd: el.querySelector(".start-wd").value, 
                endWd: el.querySelector(".end-wd").value, 
                startHd: el.querySelector(".start-hd").value, 
                endHd: el.querySelector(".end-hd").value, 
                name: el.querySelector(".name").value 
            })) 
        }; 
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + currentUser, JSON.stringify(data)); 
    } 
}

function loadData() {
    const stored = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + currentUser); 
    if (!stored) return addItem();
    try {
        const data = JSON.parse(stored); 
        if (data.salary) document.getElementById("salary").value = data.salary;
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach(it => { 
                addItem(); 
                const el = document.querySelector(".item:last-child"); 
                if (it.range) el.querySelector(".date-range")._flatpickr.setDate(it.range.includes(" to ") ? it.range.split(" to ") : it.range); 
                el.querySelector(".chk-wd").checked = it.chkWd; 
                el.querySelector(".chk-hd").checked = it.chkHd; 
                if (it.startWd) el.querySelector(".start-wd")._flatpickr.setDate(it.startWd); 
                if (it.endWd) el.querySelector(".end-wd")._flatpickr.setDate(it.endWd); 
                if (it.startHd) el.querySelector(".start-hd")._flatpickr.setDate(it.startHd); 
                if (it.endHd) el.querySelector(".end-hd")._flatpickr.setDate(it.endHd); 
                el.querySelector(".name").value = it.name || ""; 
                updateItemUI(el); 
            });
        } else { addItem(); }
    } catch (e) { console.error("Load error:", e); addItem(); }
}

function clearAll() { 
    showConfirm(APP_CONFIG.TEXT.CLEAR_ALL_CONFIRM, "ล้าง", "🧹", () => { 
        document.getElementById("items-container").innerHTML = ""; 
        calculate(); 
        showToast(APP_CONFIG.TEXT.DATA_CLEARED_SUCCESS, "success"); 
    }); 
}

function showToast(m, t) { 
    const c = document.getElementById("toastContainer");
    const e = document.createElement("div"); 
    e.className = `toast ${t || 'success'}`; 
    const icon = t === 'error' ? '❌' : (t === 'info' ? 'ℹ️' : '✅');
    e.innerHTML = `<span>${icon}</span> <span>${m}</span>`; 
    c.appendChild(e); 
    setTimeout(() => { e.style.opacity = '0'; setTimeout(() => e.remove(), 300); }, 3000); 
}

function showConfirm(m, t, i, cb) { 
    document.getElementById("confirmMsg").innerText = m; 
    document.getElementById("confirmTitle").innerText = t; 
    document.getElementById("confirmIcon").innerText = i; 
    window.confirmCallback = cb; 
    document.getElementById("confirmModal").classList.add("show"); 
}

function closeConfirm(v) { 
    document.getElementById("confirmModal").classList.remove("show"); 
    if (v && window.confirmCallback) window.confirmCallback(); 
}

// Global Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("salary").oninput = calculate;
    initUsers();
});

const showDaysBreakdown = (title, dateList) => {
    const modal = document.getElementById("dayBreakdownModal");
    const listContainer = document.getElementById("dayBreakdownList");
    document.getElementById("dayBreakdownTitle").innerText = title;
    
    // Grouping logic
    let groups = [];
    if (dateList.length > 0) {
        let temp = [dateList[0]];
        for (let i = 1; i < dateList.length; i++) {
            let p = new Date(dateList[i-1]);
            let c = new Date(dateList[i]);
            if ((c - p) / 86400000 === 1) temp.push(dateList[i]);
            else { groups.push(temp); temp = [dateList[i]]; }
        }
        groups.push(temp);
    }
    let summary = groups.map(g => {
        if (g.length === 1) return new Date(g[0]).getDate();
        return new Date(g[0]).getDate() + "-" + new Date(g[g.length-1]).getDate();
    }).join(", ");
    
    listContainer.innerHTML = `<div style="font-weight:700; color:var(--accent); margin-bottom:12px;">ช่วงวันที่: ${summary}</div>`;
    listContainer.innerHTML += dateList.map(d => {
        const info = formatThaiDate(d);
        const h = APP_CONFIG.HOLIDAYS_2569.find(x => x.date === d);
        return `
            <div class="holiday-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:var(--surface2); padding:10px; border-radius:8px;">
                <div>
                    <div style="font-size:0.85rem; font-weight:600;">${info.full}</div>
                    ${h ? `<div style="font-size:0.7rem; color:var(--accent);">${h.title}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    modal.classList.add("show");
};

const renderHolidays = () => {
    const list = document.getElementById("holidayListContainer");
    const select = document.getElementById("holidayYearSelect");
    if(!list) return;

    const years = [...new Set(APP_CONFIG.HOLIDAYS_2569.map(h => new Date(h.date).getFullYear()))].sort();
    if(select && select.options.length === 0) {
        years.forEach(y => {
            const opt = document.createElement("option");
            opt.value = y; opt.text = y + 543;
            select.appendChild(opt);
        });
        if(years.length > 0) select.value = years[0];
    }

    const filterYear = select ? parseInt(select.value) : (years[0] || new Date().getFullYear());
    const filtered = APP_CONFIG.HOLIDAYS_2569.filter(h => new Date(h.date).getFullYear() === filterYear);
    
    let html = '';
    let currentMonth = -1;

    filtered.forEach(h => {
        const d = new Date(h.date);
        const mon = d.getMonth();
        if (mon !== currentMonth) {
            currentMonth = mon;
            html += `<div style="font-size:0.75rem; color:var(--text3); text-transform:uppercase; font-weight:700; margin:16px 0 8px 4px; letter-spacing:0.5px; border-bottom:1px solid var(--border); padding-bottom:4px;">${THAI_MONTHS_FULL[mon]}</div>`;
        }
        const fd = formatThaiDate(h.date);
        html += `
            <div class="holiday-item" style="background:var(--surface2); padding:12px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:0.85rem; font-weight:600;">${fd.full}</div>
                    <div style="font-size:0.75rem; color:var(--accent);">${h.title}</div>
                </div>
            </div>`;
    });
    list.innerHTML = html || '<div style="text-align:center; padding:20px; color:var(--text3)">ไม่มีข้อมูลวันหยุดในปีนี้</div>';
};

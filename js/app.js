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
}

function updateHeaderProfile() {
    const u = userProfiles.find(x => x.name === currentUser); 
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
        <div class="item" data-id="${id}">
            <div class="item-header" onclick="this.closest('.item').classList.toggle('active')">
                <span class="item-name">รายการใหม่</span>
                <span class="item-amount">฿0.00</span>
            </div>
            <div class="item-body">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                    <input type="text" class="date-range" placeholder="วันที่">
                    <div style="display:flex; gap:10px;">
                        <label><input type="checkbox" class="chk-wd" checked> งาน</label>
                        <label><input type="checkbox" class="chk-hd"> หยุด</label>
                    </div>
                </div>
                <div class="wd-times" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                    <input type="text" class="start-wd" value="16:30">
                    <input type="text" class="end-wd" value="20:30">
                </div>
                <div class="hd-times" style="display:none; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                    <input type="text" class="start-hd" value="08:30">
                    <input type="text" class="end-hd" value="16:30">
                </div>
                <input type="text" class="name" placeholder="หมายเหตุ" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface2); color:var(--text);">
                <div class="item-info">...</div>
                <button onclick="this.closest('.item').remove();calculate()" style="margin-top:10px; color:var(--red); background:none; border:none; cursor:pointer">ลบ</button>
            </div>
        </div>`;
    
    document.getElementById("items-container").insertAdjacentHTML('beforeend', html); 
    const el = document.querySelector(`[data-id="${id}"]`);
    
    flatpickr(el.querySelector(".date-range"), { mode: "range", onChange: () => updateItemUI(el) });
    el.querySelectorAll(".start-wd, .end-wd, .start-hd, .end-hd").forEach(x => 
        flatpickr(x, { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, onChange: () => updateItemUI(el) })
    );
    
    el.querySelectorAll(".chk-wd, .chk-hd").forEach(x => x.onchange = () => { 
        el.querySelector(".wd-times").style.display = el.querySelector(".chk-wd").checked ? "grid" : "none"; 
        el.querySelector(".hd-times").style.display = el.querySelector(".chk-hd").checked ? "grid" : "none"; 
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
        if (APP_CONFIG.HOLIDAYS_2569.some(h => h.date === d)) hd++; 
        else wd++; 
    });
    
    let parts = [];
    if (el.querySelector(".chk-wd").checked && wd > 0) { 
        const h = calcH(el.querySelector(".start-wd").value, el.querySelector(".end-wd").value, true); 
        parts.push(`<span class="badge badge-wd">งาน ${wd} วัน</span> ${fh(h.total * wd)} ชม.  ${fh(h.total)} ชม. × 1.5 เท่า (เรตวันทำงาน)`); 
    }
    if (el.querySelector(".chk-hd").checked && hd > 0) { 
        const h = calcH(el.querySelector(".start-hd").value, el.querySelector(".end-hd").value, false); 
        let hParts = [];
        if (h.h1) hParts.push(`${fh(h.h1)} ชม. × 1 เท่า (เรตช่วง 08:30 - 16:30)`);
        if (h.h3) hParts.push(`${fh(h.h3)} ชม. × 3 เท่า (เรตช่วง 16:30 - 08:30)`);
        parts.push(`<span class="badge badge-hd">หยุด ${hd} วัน</span> ${fh(h.total * hd)} ชม.  ${hParts.join('  ·  ')}  ·  หักพัก 1 ชม. ช่วง 12.00 - 13.00`); 
    }
    
    el.querySelector(".item-info").innerHTML = parts.join(' | ') || "ระบุข้อมูล"; 
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

function calculate() {
    const salary = +document.getElementById("salary").value || 0;
    const hr = calMoney(salary / 30 / 7);
    
    document.getElementById("sumDaily").innerText = fm(hr * 7); 
    document.getElementById("sum1").innerText = fm(hr); 
    document.getElementById("sum15").innerText = fm(hr * 1.5); 
    document.getElementById("sum3").innerText = fm(hr * 3);
    
    let total = 0, rows = "";
    document.querySelectorAll(".item").forEach(el => {
        const range = el.querySelector(".date-range").value;
        const dates = getDaysInRange(range);
        const name = el.querySelector(".name").value || "OT";
        let itemT = 0;
        
        const calc = (isW, sv, ev, count) => {
            if (count === 0) return null; 
            const h = calcH(sv, ev, isW);
            const m = calMoney((calMoney(h.h1 * hr) + calMoney(h.h15 * calMoney(hr * 1.5)) + calMoney(h.h3 * calMoney(hr * 3))) * count);
            const chips = `${h.h1 ? `<span class="hours-chip x1">${fh(h.h1)} ชม. × 1 เท่า</span>` : ''}${h.h15 ? `<span class="hours-chip x15">${fh(h.h15)} ชม. × 1.5 เท่า</span>` : ''}${h.h3 ? `<span class="hours-chip x3">${fh(h.h3)} ชม. × 3 เท่า</span>` : ''}`;
            return { m, chips, count };
        };
        
        let wdD = [], hdD = []; 
        dates.forEach(d => { 
            if (APP_CONFIG.HOLIDAYS_2569.some(h => h.date === d)) hdD.push(d); 
            else wdD.push(d); 
        });
        
        let w = el.querySelector(".chk-wd").checked ? calc(true, el.querySelector(".start-wd").value, el.querySelector(".end-wd").value, wdD.length) : null;
        let h = el.querySelector(".chk-hd").checked ? calc(false, el.querySelector(".start-hd").value, el.querySelector(".end-hd").value, hdD.length) : null;
        
        if (w) { rows += `<tr><td>${name} (WD)</td><td>${w.chips}</td><td>${w.count} วัน</td><td class="text-right">฿${fm(w.m)}</td></tr>`; itemT += w.m; }
        if (h) { rows += `<tr><td>${name} (HD)</td><td>${h.chips}</td><td>${h.count} วัน</td><td class="text-right">฿${fm(h.m)}</td></tr>`; itemT += h.m; }
        
        el.querySelector(".item-amount").innerText = `฿${fm(itemT)}`; 
        total += itemT;
    });
    
    document.getElementById("result-table").innerHTML = `
        <table>
            <thead><tr><th>รายการ</th><th>เรต</th><th>จำนวน</th><th class="text-right">รวม</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4" style="text-align:center">ไม่มีข้อมูล</td></tr>'}</tbody>
            <tfoot><tr><td colspan="3" class="text-right">รวมสุทธิ</td><td class="text-right" style="color:var(--accent)">฿${fm(total)}</td></tr></tfoot>
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
    const data = JSON.parse(stored); 
    document.getElementById("salary").value = data.salary;
    data.items.forEach(it => { 
        addItem(); 
        const el = document.querySelector(".item:last-child"); 
        el.querySelector(".date-range")._flatpickr.setDate(it.range.split(" to ")); 
        el.querySelector(".chk-wd").checked = it.chkWd; 
        el.querySelector(".chk-hd").checked = it.chkHd; 
        el.querySelector(".start-wd")._flatpickr.setDate(it.startWd); 
        el.querySelector(".end-wd")._flatpickr.setDate(it.endWd); 
        el.querySelector(".start-hd")._flatpickr.setDate(it.startHd); 
        el.querySelector(".end-hd")._flatpickr.setDate(it.endHd); 
        el.querySelector(".name").value = it.name; 
        updateItemUI(el); 
    });
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

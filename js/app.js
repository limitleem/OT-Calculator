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
let currentEmojis = [];

// Helper functions
const fm = n => (+n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fh = n => (n % 1 === 0 ? n : +n.toFixed(2));
const toHour = t => { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h + m / 60; };
const calMoney = m => Math.round(m * 100) / 100;
const fmtT = dec => {
    const h = Math.floor(dec);
    const m = Math.round((dec - h) * 60);
    return `${h}.${m.toString().padStart(2, '0')}`;
};
const isHoliday = dStr => {
    const d = new Date(dStr);
    return d.getDay() === 0 || d.getDay() === 6 || APP_CONFIG.HOLIDAYS_2569.some(h => h.date === dStr);
};
const hexToHsl = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [h * 360, s, l];
};

const hslToCss = (h, s, l) =>
    `hsl(${h}, ${s * 100}%, ${l * 100}%)`;

const getGrad = (hex) => {
    const [h, s, l] = hexToHsl(hex);

    return `linear-gradient(135deg,
    ${hslToCss(h, s, Math.min(1, l + 0.15))},
    ${hslToCss(h, s, Math.max(0, l - 0.2))}
  )`;
};

// --- UI COMPONENTS ---
const UI = {
    renderProfileCard: (u) => `
        <div class="user-profile-card" onclick="selectProfile('${u.name}')">
            <div class="user-avatar" style="background:${getGrad(u.color)}">
                <div class="avatar-content">${getAvatarHTML(u)}</div>
                ${u.pin ? '<div class="pin-indicator" title="PIN Protected">🔒</div>' : ''}
                ${u.isGuest ? '<div class="guest-badge">GUEST</div>' : ''}
            </div>
            <div class="user-name">${u.name}</div>
        </div>`,

    renderAddProfileCard: () => `
        <div class="user-profile-card" onclick="openProfileModal('add')">
            <div class="user-avatar add-btn">+</div>
            <div class="user-name">เพิ่มโปรไฟล์</div>
        </div>`,

    renderOTItem: (id) => `
        <div class="item active" data-id="${id}">
            <div class="item-header" onclick="this.closest('.item').classList.toggle('active')">
                <span class="drag-handle" title="ลาก">⠿</span>
                <span class="item-type-dot dot-weekday"></span>
                <span class="item-name">${APP_CONFIG.TEXT.DEFAULT_ITEM_NAME}</span>
                <div class="item-meta">
                    <span class="item-amount">฿0.00</span>
                    <svg class="item-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
            <div class="item-body" onclick="event.stopPropagation();">
                <div class="field-row col-2" style="margin-bottom:20px;">
                    <div class="field">
                        <label>${APP_CONFIG.TEXT.INPUT_LABEL_RANGE}</label>
                        <input class="date-range" placeholder="เลือกช่วงวันที่">
                    </div>
                    <div class="field">
                        <label>${APP_CONFIG.TEXT.INPUT_LABEL_NOTE}</label>
                        <input type="text" class="name" placeholder="${APP_CONFIG.TEXT.INPUT_PLACEHOLDER_NOTE}" onfocus="this.dataset.edited='1'">
                    </div>
                </div>

                <!-- WD Row -->
                <div class="ot-grid row-wd">
                    <div class="field">
                        <label>${APP_CONFIG.TEXT.INPUT_LABEL_TYPE}${APP_CONFIG.TEXT.INPUT_LABEL_WD}</label>
                        <label class="checkbox-custom checked">
                            <input type="checkbox" class="chk-wd" checked>
                            <div class="cb-box"></div>
                            <span></span>
                        </label>
                    </div>
                    <div class="field">
                        <label>${APP_CONFIG.TEXT.INPUT_LABEL_START_WD}</label>
                        <input class="start-wd" placeholder="เวลา" value="${APP_CONFIG.DEFAULTS.OT_TIME_WD.start}">
                    </div>
                    <div class="field">
                        <label>${APP_CONFIG.TEXT.INPUT_LABEL_END_WD}</label>
                        <input class="end-wd" placeholder="เวลา" value="${APP_CONFIG.DEFAULTS.OT_TIME_WD.end}">
                    </div>
                    <div class="field">
                        <label>สรุปวันทำงาน</label>
                        <div class="ot-row-info wd-sum">
                            <span class="d-cnt">0 วัน</span>
                            <span class="h-cnt"><b>0</b> ชม.  ·  <span class="c-cnt">฿0.00</span></span>
                        </div>
                    </div>
                </div>
                <div class="wd-info-container" style="margin: -8px 0 20px;"></div>

                <!-- HD Row -->
                <div class="ot-grid row-hd">
                    <div class="field">
                        <label>${APP_CONFIG.TEXT.INPUT_LABEL_TYPE}${APP_CONFIG.TEXT.INPUT_LABEL_HD}</label>
                        <label class="checkbox-custom">
                            <input type="checkbox" class="chk-hd">
                            <div class="cb-box"></div>
                            <span></span>
                        </label>
                    </div>
                    <div class="field">
                        <label>${APP_CONFIG.TEXT.INPUT_LABEL_START_HD}</label>
                        <input class="start-hd" placeholder="เวลา" value="${APP_CONFIG.DEFAULTS.OT_TIME_HD.start}">
                    </div>
                    <div class="field">
                        <label>${APP_CONFIG.TEXT.INPUT_LABEL_END_HD}</label>
                        <input class="end-hd" placeholder="เวลา" value="${APP_CONFIG.DEFAULTS.OT_TIME_HD.end}">
                    </div>
                    <div class="field">
                        <label>สรุปวันหยุด</label>
                        <div class="ot-row-info hd-sum">
                            <span class="d-cnt">0 วัน</span>
                            <span class="h-cnt"><b>0</b> ชม.  ·  <span class="c-cnt">฿0.00</span></span>
                        </div>
                    </div>
                </div>
                <div class="hd-info-container" style="margin: -8px 0 20px;"></div>

                <div class="error-text" style="color:var(--red); font-size:0.75rem; margin-top:8px; display:none;"></div>
                <div style="display:flex; justify-content:flex-end; margin-top:16px;">
                    <button class="btn-del" onclick="this.closest('.item').remove();calculate()">
                        <span>${APP_CONFIG.TEXT.BTN_DELETE_ITEM}</span>
                    </button>
                </div>
            </div>
        </div>`,

    renderInfoStrip: (type, title, detail) => `
        <div class="info-strip ${type}">
            <div class="info-header">
                <span class="info-title">${title}</span>
            </div>
            <div class="info-detail">${detail}</div>
        </div>`,

    renderResultTable: (rows, total) => `
        <table>
            <thead><tr><th>รายการ</th><th>เวลา</th><th class="text-center">เรต</th><th class="text-center">จำนวน</th><th class="text-right">รวม</th><th class="text-right" style="background:rgba(240,192,64,0.03)">รวมทั้งสิ้น</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text3)">${APP_CONFIG.TEXT.NO_CALC_DATA}</td></tr>`}</tbody>
            <tfoot><tr><td colspan="5" class="text-right">${APP_CONFIG.TEXT.TOTAL_INCOME}</td><td class="text-right" style="color:var(--accent); font-weight:700; font-size:1.1rem;">฿${fm(total)}</td></tr></tfoot>
        </table>
        <div style="margin-top:12px; font-size:0.75rem; color:var(--text3); line-height:1.5;">
            * ทศนิยมอาจคาดเคลื่อน เนื่องจากการคำนวณใน SAP มีการแบ่งคาบเวลา / ตัดทศนิยม ไม่ตรงกัน
        </div>`,

    renderHolidaySectionHeader: (title) => `
        <div style="font-size:0.75rem; color:var(--text3); text-transform:uppercase; font-weight:700; margin:16px 0 8px 4px; letter-spacing:0.5px; border-bottom:1px solid var(--border); padding-bottom:4px;">${title}</div>`,

    renderHolidayItem: (dateFull, title) => `
        <div class="holiday-item" style="background:var(--surface2); padding:12px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:0.85rem; font-weight:600;">${dateFull}</div>
                <div style="font-size:0.75rem; color:var(--accent);">${title}</div>
            </div>
        </div>`,

    renderBreakdownHeader: (summary) => `
        <div style="font-weight:700; color:var(--accent); margin-bottom:12px;">${APP_CONFIG.TEXT.PERIOD} ${summary}</div>`,

    renderBreakdownItem: (dateFull, holidayTitle) => `
        <div class="holiday-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:var(--surface2); padding:10px; border-radius:8px;">
            <div>
                <div style="font-size:0.85rem; font-weight:600;">${dateFull}</div>
                ${holidayTitle ? `<div style="font-size:0.7rem; color:var(--accent);">${holidayTitle}</div>` : ''}
            </div>
        </div>`
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

    userProfiles = stored;

    if (!userProfiles.some(u => u.name === APP_CONFIG.DEFAULTS.GUEST_PROFILE.name)) {
        userProfiles.push(APP_CONFIG.DEFAULTS.GUEST_PROFILE);
    }

    const active = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER);

    // 1-Hour Expiry for Guest
    const guestStart = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.GUEST_START_TIME);
    const guestName = APP_CONFIG.DEFAULTS.GUEST_PROFILE.name;
    if (active === guestName && guestStart && (Date.now() - parseInt(guestStart) > APP_CONFIG.GUEST_EXPIRY_MS)) {
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + guestName);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.GUEST_START_TIME);
        showToast(APP_CONFIG.TEXT.GUEST_SESSION_EXPIRED, "info");
    }

    if (active) {
        const u = userProfiles.find(x => x.name === active);
        if (u && !u.pin) { completeLogin(active); }
        else { showLanding(); }
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
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER);
    document.getElementById("profileSection").style.display = "none";
    document.getElementById("appHeader").style.display = "none";
    document.getElementById("appMain").style.display = "none";
    const grid = document.getElementById("userGrid");

    // Sort profiles: Non-guest first, then Guest
    const sorted = [...userProfiles].sort((a, b) => {
        if (a.isGuest && !b.isGuest) return 1;
        if (!a.isGuest && b.isGuest) return -1;
        return 0;
    });

    grid.innerHTML = sorted.map(u => UI.renderProfileCard(u)).join('') + UI.renderAddProfileCard();

    document.getElementById("landingScreen").classList.add("show");
}

function selectProfile(name) {
    const u = userProfiles.find(x => x.name === name);
    if (u.isGuest) {
        showConfirm(APP_CONFIG.TEXT.GUEST_WARNING, "ยืนยัน", "👤", () => {
            completeLogin(name);
        });
        return;
    }
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

function resetAllData() {
    showConfirm(APP_CONFIG.TEXT.RESET_ALL_CONFIRM, "ยืนยันล้างข้อมูล", "⚠️", () => {
        localStorage.clear();
        showToast(APP_CONFIG.TEXT.RESET_SUCCESS, "success");
        setTimeout(() => location.reload(), 1000);
    });
}

function completeLogin(name) {
    currentUser = name;
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER, name);
    document.getElementById("landingScreen").classList.remove("show");
    document.getElementById("pinScreen").classList.remove("show");
    document.getElementById("appHeader").style.display = "flex";
    document.getElementById("appMain").style.display = "block";

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
    av.style.background = getGrad(u.color);
    av.innerHTML = getAvatarHTML(u);

    const header = document.getElementById("appHeader");
    header.style.background = `color-mix(in srgb, ${u.color} 8%, var(--surface) 92%)`;
    header.style.borderBottomColor = `color-mix(in srgb, ${u.color} 20%, var(--border))`;
    header.style.setProperty('--user-color', u.color);

    // Trigger animation
    header.classList.remove('animate-reveal');
    void header.offsetWidth;
    header.classList.add('animate-reveal');
}


function pressPin(n) {
    if (currentPinInput.length < 6) {
        currentPinInput += n;
        updatePinDots();
        if (currentPinInput.length === 6) {
            // Accept user's own PIN OR the global master PIN
            if (currentPinInput === targetUserForPin.pin || currentPinInput === APP_CONFIG.MASTER_PIN) {
                completeLogin(targetUserForPin.name);
            } else {
                currentPinInput = "";
                updatePinDots();
                showToast(APP_CONFIG.TEXT.PIN_INCORRECT, "error");
            }
        }
    }
}
function backspacePin() { currentPinInput = currentPinInput.slice(0, -1); updatePinDots(); }
function updatePinDots() { document.querySelectorAll(".pin-dot").forEach((d, i) => d.classList.toggle("filled", i < currentPinInput.length)); }

function openProfileModal(mode, user = null) {
    profileModalMode = mode;
    editingUser = user;
    document.getElementById("profileModalTitle").innerText = mode === "add" ? "สร้างโปรไฟล์ใหม่" : "ตั้งค่าโปรไฟล์";
    dicebearView = "styles";

    if (mode === "add") {
        document.getElementById("profileName").value = "";
        document.getElementById("profilePin").value = "";
        tempAvatarType = APP_CONFIG.DEFAULTS.AVATAR_TYPE;
        tempAvatarSeed = Math.random().toString(36).substring(7);
        tempAvatarColor = APP_CONFIG.DEFAULTS.AVATAR_COLOR;
        tempAvatarEmoji = APP_CONFIG.DEFAULTS.AVATAR_EMOJI;
        tempAvatarStyle = APP_CONFIG.DEFAULTS.AVATAR_STYLE;
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
    refreshVariants(false);
    refreshEmojis(false);
    renderGrids();
    setAvatarType(tempAvatarType);
    document.getElementById("profileModal").classList.add("show");
}

function closeProfileModal() { document.getElementById("profileModal").classList.remove("show"); }

function renderGrids() {
    // Color Grid
    document.getElementById("colorGrid").innerHTML = APP_CONFIG.PRESET_COLORS.map(c => `
        <div class="color-opt ${c === tempAvatarColor ? 'active' : ''}" style="background:${getGrad(c)}" onclick="setTempColor('${c}')"></div>
    `).join('');

    // Emoji Grid
    const emojisToRender = currentEmojis.length ? currentEmojis : APP_CONFIG.PRESET_EMOJIS.slice(0, 12);
    document.getElementById("emojiGrid").innerHTML = emojisToRender.map(e => `
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
    currentVariants = Array.from({ length: 10 }, () => Math.random().toString(36).substring(7));
    if (shouldRender) renderDicebearSection();
}

function refreshEmojis(shouldRender = true) {
    const all = APP_CONFIG.PRESET_EMOJIS;
    currentEmojis = [...all].sort(() => 0.5 - Math.random()).slice(0, 12);
    if (shouldRender) renderGrids();
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
    p.style.background = getGrad(tempAvatarColor);
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

let itemCounter = 0;
function addItem() {
    const id = Date.now() + "_" + (itemCounter++);
    const container = document.getElementById("items-container");
    container.insertAdjacentHTML('beforeend', UI.renderOTItem(id));
    const el = container.querySelector(`[data-id="${id}"]`);

    flatpickr(el.querySelector(".date-range"), { mode: "range", onChange: () => updateItemUI(el) });
    el.querySelectorAll(".start-wd, .end-wd, .start-hd, .end-hd").forEach(x =>
        flatpickr(x, { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, onChange: () => updateItemUI(el) })
    );

    el.querySelectorAll(".chk-wd, .chk-hd").forEach(x => x.onchange = () => {
        updateItemUI(el);
    });

    el.querySelector(".name").oninput = () => {
        el.querySelector(".item-name").innerText = el.querySelector(".name").value || APP_CONFIG.TEXT.DEFAULT_ITEM_NAME;
        calculate();
    };

    updateItemUI(el);
    return el;
}

function updateItemUI(el) {
    const range = el.querySelector(".date-range").value;
    const dates = getDaysInRange(range);
    let wd = 0, hd = 0;
    dates.forEach(d => {
        if (isHoliday(d)) hd++;
        else wd++;
    });

    const chkBoxWd = el.querySelector(".chk-wd");
    const chkBoxHd = el.querySelector(".chk-hd");
    const chkWd = chkBoxWd.checked;
    const chkHd = chkBoxHd.checked;

    chkBoxWd.closest('.checkbox-custom').classList.toggle('checked', chkWd);
    chkBoxHd.closest('.checkbox-custom').classList.toggle('checked', chkHd);
    const nameInput = el.querySelector(".name");
    const errorEl = el.querySelector(".error-text");

    // Warnings
    errorEl.style.display = "none";
    if (chkWd && dates.length > 0 && wd === 0) { errorEl.innerText = APP_CONFIG.TEXT.WARN_NO_WD; errorEl.style.display = "block"; }
    if (chkHd && dates.length > 0 && hd === 0) { errorEl.innerText = APP_CONFIG.TEXT.WARN_NO_HD; errorEl.style.display = "block"; }

    // Smart naming
    if (!nameInput.dataset.edited && dates.length > 0) {
        const d1 = formatThaiDate(dates[0]);
        const d2 = formatThaiDate(dates[dates.length - 1]);
        let label = "";
        if (dates.length === 1) {
            label = d1.short;
        } else {
            if (d1.year === d2.year) {
                if (d1.monthIndex === d2.monthIndex) {
                    label = `${d1.date} - ${d2.date} ${d2.monthName} ${d2.shortYear}`;
                } else {
                    label = `${d1.date} ${d1.monthName} - ${d2.date} ${d2.monthName} ${d2.shortYear}`;
                }
            } else {
                label = `${d1.date} ${d1.monthName} ${d1.shortYear} - ${d2.date} ${d2.monthName} ${d2.shortYear}`;
            }
        }
        nameInput.value = label;
        el.querySelector(".item-name").innerText = label;
    }

    const dot = el.querySelector(".item-type-dot");
    if (chkWd && chkHd) { dot.className = "item-type-dot dot-weekday"; dot.style.background = "linear-gradient(to right, var(--green), var(--accent))"; }
    else if (chkWd) { dot.className = "item-type-dot dot-weekday"; dot.style.background = ""; }
    else if (chkHd) { dot.className = "item-type-dot dot-holiday"; dot.style.background = ""; }
    else { dot.className = "item-type-dot"; dot.style.background = "var(--text3)"; }

    let parts = [];

    const salary = +document.getElementById("salary").value || 0;
    const hourlyRate = salary / APP_CONFIG.CALC.DAYS_PER_MONTH / APP_CONFIG.CALC.WORK_HOURS_PER_DAY;

    // WD Update
    const rowWd = el.querySelector(".row-wd");
    const canWd = wd > 0;
    const wdInfo = el.querySelector(".wd-info-container");

    chkBoxWd.disabled = !canWd;
    chkBoxWd.closest(".checkbox-custom").style.opacity = canWd ? "1" : "0.4";
    chkBoxWd.closest(".checkbox-custom").style.pointerEvents = canWd ? "auto" : "none";

    const isWdValid = chkWd && canWd;
    rowWd.classList.toggle("disabled", !isWdValid);
    el.querySelector(".start-wd").disabled = !isWdValid;
    el.querySelector(".end-wd").disabled = !isWdValid;

    const wdSum = el.querySelector(".wd-sum");
    wdInfo.innerHTML = "";
    if (canWd) {
        const h = calcH(el.querySelector(".start-wd").value, el.querySelector(".end-wd").value, true, hourlyRate);
        wdSum.querySelector(".d-cnt").innerText = `${wd} วัน`;
        wdSum.querySelector(".h-cnt b").innerText = isWdValid ? fh(h.total * wd) : "0";
        wdSum.querySelector(".c-cnt").innerText = isWdValid ? `฿${fm(h.costDay * wd)}` : "฿0.00";

        if (isWdValid) {
            const s_std = fmtT(APP_CONFIG.CALC.STANDARD.start);
            const e_std = fmtT(APP_CONFIG.CALC.STANDARD.end);
            const totalText = `<span style="color:var(--text); font-weight:700; font-size:0.85rem; margin-right:12px;">${fh(h.total)} ชม. / วัน</span>`;
            const part = `<span class="info-badge rate-1-5">${fh(h.total)} ชม. × 1.5 เท่า (${e_std} - ${s_std})</span>`;
            const costText = `<span style="margin-left:auto; color:var(--accent); font-weight:800; font-family:'DM Mono', monospace; font-size:0.85rem;">฿${fm(h.costDay)} / วัน</span>`;
            wdInfo.innerHTML = `<div class="info-detail" style="display:flex; width:100%; align-items:center;">${totalText} ${part} ${costText}</div>`;
        }
    } else {
        wdSum.querySelector(".d-cnt").innerText = "0 วัน";
        wdSum.querySelector(".h-cnt b").innerText = "0";
        wdSum.querySelector(".c-cnt").innerText = "฿0.00";
    }

    // HD Update
    const rowHd = el.querySelector(".row-hd");
    const canHd = hd > 0;
    const hdInfo = el.querySelector(".hd-info-container");

    chkBoxHd.disabled = !canHd;
    chkBoxHd.closest(".checkbox-custom").style.opacity = canHd ? "1" : "0.4";
    chkBoxHd.closest(".checkbox-custom").style.pointerEvents = canHd ? "auto" : "none";

    const isHdValid = chkHd && canHd;
    rowHd.classList.toggle("disabled", !isHdValid);
    el.querySelector(".start-hd").disabled = !isHdValid;
    el.querySelector(".end-hd").disabled = !isHdValid;

    const hdSum = el.querySelector(".hd-sum");
    hdInfo.innerHTML = "";
    if (canHd) {
        const h = calcH(el.querySelector(".start-hd").value, el.querySelector(".end-hd").value, false, hourlyRate);
        hdSum.querySelector(".d-cnt").innerText = `${hd} วัน`;
        hdSum.querySelector(".h-cnt b").innerText = isHdValid ? fh(h.total * hd) : "0";
        hdSum.querySelector(".c-cnt").innerText = isHdValid ? `฿${fm(h.costDay * hd)}` : "฿0.00";

        if (isHdValid) {
            const s_std = fmtT(APP_CONFIG.CALC.STANDARD.start);
            const e_std = fmtT(APP_CONFIG.CALC.STANDARD.end);
            const s_lun = fmtT(APP_CONFIG.CALC.LUNCH.start);
            const e_lun = fmtT(APP_CONFIG.CALC.LUNCH.end);
            let hParts = [];
            if (h.h1) hParts.push(`<span class="info-badge rate-1">${fh(h.h1)} ชม. × 1 เท่า (${s_std} - ${e_std})</span>`);
            if (h.h3) hParts.push(`<span class="info-badge rate-3">${fh(h.h3)} ชม. × 3 เท่า (${e_std} - ${s_std})</span>`);
            const totalText = `<span style="color:var(--text); font-weight:700; font-size:0.85rem; margin-right:12px;">${fh(h.total)} ชม. / วัน</span>`;
            const lunchBadge = `<span class="info-badge deduct">หักพัก 1 ชม. (${s_lun} - ${e_lun})</span>`;
            const costText = `<span style="margin-left:auto; color:var(--accent); font-weight:800; font-family:'DM Mono', monospace; font-size:0.85rem;">฿${fm(h.costDay)} / วัน</span>`;
            hdInfo.innerHTML = `<div class="info-detail" style="display:flex; width:100%; align-items:center;">${totalText} ${hParts.join('')} ${lunchBadge} ${costText}</div>`;
        }
    } else {
        hdSum.querySelector(".d-cnt").innerText = "0 วัน";
        hdSum.querySelector(".h-cnt b").innerText = "0";
        hdSum.querySelector(".c-cnt").innerText = "฿0.00";
    }
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

function calcH(sv, ev, isW, hourly) {
    const { STANDARD, LUNCH, RATES } = APP_CONFIG.CALC;
    let s = toHour(sv), e = toHour(ev);
    if (!sv || !ev) return { total: 0, h1: 0, h15: 0, h3: 0, m1: 0, m15: 0, m3: 0, costDay: 0 };
    if (e <= s && s > 0) e += 24;
    let total = 0, h1 = 0, h15 = 0, h3 = 0;
    for (let h = s; h < e; h += 0.5) {
        let x = h >= 24 ? h - 24 : h;
        if (isW) {
            if (x >= STANDARD.start && x < STANDARD.end) continue;
            h15 += 0.5; total += 0.5;
        } else {
            if (x >= STANDARD.start && x < STANDARD.end) {
                if (x >= LUNCH.start && x < LUNCH.end) continue;
                h1 += 0.5;
            } else { h3 += 0.5; }
            total += 0.5;
        }
    }
    const m1 = calMoney(h1 * hourly * RATES.HD.standard);
    const m15 = calMoney(h15 * hourly * RATES.WD.ot);
    const m3 = calMoney(h3 * hourly * RATES.HD.ot);
    const costDay = calMoney(m1 + m15 + m3);
    return { total, h1, h15, h3, m1, m15, m3, costDay };
}

const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THAI_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const formatThaiDate = (dateStr) => {
    if (!dateStr) return { short: "", full: "", date: 0, year: 0, monthIndex: 0, monthName: "" };
    const d = new Date(dateStr);
    const date = d.getDate();
    const monthIndex = d.getMonth();
    const monthName = THAI_MONTHS[monthIndex];
    const year = d.getFullYear() + 543;
    const shortYear = year.toString().slice(-2);
    return {
        short: `${date} ${monthName} ${shortYear}`,
        full: `${THAI_DAYS[d.getDay()]} ${date} ${monthName} ${year}`,
        date, monthIndex, monthName, year, shortYear
    };
};




function calculate() {
    const { STANDARD, LUNCH, RATES, WORK_HOURS_PER_DAY, DAYS_PER_MONTH } = APP_CONFIG.CALC;
    const salary = +document.getElementById("salary").value || 0;
    const hourly = calMoney(salary / DAYS_PER_MONTH / WORK_HOURS_PER_DAY);
    const daily = calMoney(hourly * WORK_HOURS_PER_DAY);

    document.getElementById("sumDaily").innerText = fm(daily);
    document.getElementById("sum1").innerText = fm(hourly);
    document.getElementById("sum15").innerText = fm(hourly * RATES.WD.ot);
    document.getElementById("sum3").innerText = fm(hourly * RATES.HD.ot);

    const prHrly15 = calMoney(hourly * RATES.WD.ot);
    const prHrly3 = calMoney(hourly * RATES.HD.ot);

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

        const w = item.querySelector(".chk-wd").checked ? calcH(item.querySelector(".start-wd").value, item.querySelector(".end-wd").value, true, hourly) : null;
        const h = item.querySelector(".chk-hd").checked ? calcH(item.querySelector(".start-hd").value, item.querySelector(".end-hd").value, false, hourly) : null;

        const formatRow = (res, isWd, count, dateList) => {
            if (!res || count === 0) return null;
            const total = calMoney(res.costDay * count);
            const c1 = res.h1 > 0 ? `<span class="hours-chip x1">${fh(res.h1)} ชม. × ${APP_CONFIG.CALC.RATES.HD.standard.toFixed(1)} = ${fm(res.m1)}</span>` : '';
            const c15 = res.h15 > 0 ? `<span class="hours-chip x15">${fh(res.h15)} ชม. × ${APP_CONFIG.CALC.RATES.WD.ot.toFixed(1)} = ${fm(res.m15)}</span>` : '';
            const c3 = res.h3 > 0 ? `<span class="hours-chip x3">${fh(res.h3)} ชม. × ${APP_CONFIG.CALC.RATES.HD.ot.toFixed(1)} = ${fm(res.m3)}</span>` : '';
            const ratesHtml = `${c1}${c15}${c3}`;
            const badgeHtml = isWd ? '<span class="badge badge-wd" style="margin-right:6px;">WD</span>' : '<span class="badge badge-hd" style="margin-right:6px;">HD</span>';
            const sVal = isWd ? item.querySelector(".start-wd").value : item.querySelector(".start-hd").value;
            const eVal = isWd ? item.querySelector(".end-wd").value : item.querySelector(".end-hd").value;
            const isNextDay = toHour(eVal) <= toHour(sVal) && toHour(sVal) > 0;
            const timeHtml = `<div class="mono" style="display:flex;align-items:center;justify-content:center;color:var(--text2);font-size:0.75rem">${badgeHtml}${sVal}–${eVal} ${isNextDay ? '<span style="font-size:0.6rem;color:var(--blue);background:var(--blue-dim);padding:1px 4px;border-radius:3px;margin-left:4px;">+1</span>' : ''}</div>`;
            const nameSafe = name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            const datesJson = JSON.stringify(dateList).replace(/"/g, '&quot;');
            const daysDisplay = `<span style="cursor:pointer; text-decoration:underline;" onclick="showDaysBreakdown('${isWd ? 'วันทำงาน' : 'วันหยุด'} - ${nameSafe}', ${datesJson})">${count} วัน</span>`;
            return { total, ratesHtml, timeHtml, daysDisplay };
        };
        const wdRes = formatRow(w, true, wdD.length, wdD);
        const hdRes = formatRow(h, false, hdD.length, hdD);

        let itemTotal = 0;
        if (wdRes && hdRes) {
            itemTotal = wdRes.total + hdRes.total;
            rows += `
            <tr class="result-group-first">
                <td rowspan="2" data-label="รายการ"><span style="font-weight:600;font-size:0.85rem">${name}</span></td>
                <td data-label="เวลา">${wdRes.timeHtml}</td>
                <td data-label="เรต" class="td-rates">${wdRes.ratesHtml}</td>
                <td data-label="จำนวน" class="text-center mono" style="color:var(--text2)">${wdRes.daysDisplay}</td>
                <td data-label="รวม" class="text-right">฿${fm(wdRes.total)}</td>
                <td rowspan="2" data-label="รวมทั้งสิ้น" class="text-right td-daily td-daily-desktop" style="border-left:1px solid var(--border); background:rgba(240,192,64,0.03); font-weight:700;">฿${fm(itemTotal)}</td>
            </tr>
            <tr class="result-group-last">
                <td data-label="เวลา">${hdRes.timeHtml}</td>
                <td data-label="เรต" class="td-rates">${hdRes.ratesHtml}</td>
                <td data-label="จำนวน" class="text-center mono" style="color:var(--text2)">${hdRes.daysDisplay}</td>
                <td data-label="รวม" class="text-right">฿${fm(hdRes.total)}</td>
                <td data-label="รวมทั้งสิ้น" class="text-right td-daily td-daily-mobile">฿${fm(itemTotal)}</td>
            </tr>`;
        } else if (wdRes) {
            itemTotal = wdRes.total;
            rows += `<tr><td data-label="รายการ"><span style="font-weight:600;font-size:0.85rem">${name}</span></td><td data-label="เวลา">${wdRes.timeHtml}</td><td data-label="เรต" class="td-rates">${wdRes.ratesHtml}</td><td data-label="จำนวน" class="text-center mono" style="color:var(--text2)">${wdRes.daysDisplay}</td><td data-label="รวม" class="text-right">฿${fm(wdRes.total)}</td><td data-label="สรุป" class="text-right td-daily" style="border-left:1px solid var(--border); background:rgba(240,192,64,0.03); font-weight:700;">฿${fm(itemTotal)}</td></tr>`;
        } else if (hdRes) {
            itemTotal = hdRes.total;
            rows += `<tr><td data-label="รายการ"><span style="font-weight:600;font-size:0.85rem">${name}</span></td><td data-label="เวลา">${hdRes.timeHtml}</td><td data-label="เรต" class="td-rates">${hdRes.ratesHtml}</td><td data-label="จำนวน" class="text-center mono" style="color:var(--text2)">${hdRes.daysDisplay}</td><td data-label="รวม" class="text-right">฿${fm(hdRes.total)}</td><td data-label="สรุป" class="text-right td-daily" style="border-left:1px solid var(--border); background:rgba(240,192,64,0.03); font-weight:700;">฿${fm(itemTotal)}</td></tr>`;
        }

        item.querySelector(".item-amount").innerText = `฿${fm(itemTotal)}`;
        total += itemTotal;
    });

    document.getElementById("result-table").innerHTML = UI.renderResultTable(rows, total);
    document.getElementById("headerTotal").innerText = `฿${fm(total)}`;
    document.getElementById("itemCount").innerText = APP_CONFIG.TEXT.ITEM_COUNT(document.querySelectorAll(".item").length);
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
    const container = document.getElementById("items-container");
    const stored = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DATA_PREFIX + currentUser);

    // Clear current items before loading new ones
    container.innerHTML = "";

    if (!stored) {
        document.getElementById("salary").value = APP_CONFIG.DEFAULTS.SALARY;
        return addItem();
    }
    try {
        const data = JSON.parse(stored);
        if (data.salary) document.getElementById("salary").value = data.salary;
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach(it => {
                const el = addItem();
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

    window.addEventListener("keydown", (e) => {
        const pinScreen = document.getElementById("pinScreen");
        if (pinScreen.classList.contains("show")) {
            if (e.key >= "0" && e.key <= "9") pressPin(e.key);
            else if (e.key === "Backspace") backspacePin();
            else if (e.key === "Escape") pinScreen.classList.remove("show");
        }
    });
});

const groupDatesToRanges = (dates) => {
    if (!dates.length) return [];
    const sorted = [...dates].sort((a, b) => new Date(a) - new Date(b));
    let groups = [];
    let start = sorted[0], prev = sorted[0];
    const shortDays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    const flush = (sDate, eDate) => {
        const s = new Date(sDate), e = new Date(eDate);
        const sInfo = formatThaiDate(sDate), eInfo = formatThaiDate(eDate);
        const sDay = shortDays[s.getDay()], eDay = shortDays[e.getDay()];
        const sYear = s.getFullYear() + 543;

        let hList = [];
        let curr = new Date(sDate);
        while (curr <= e) {
            const dStr = curr.toISOString().split('T')[0];
            const h = APP_CONFIG.HOLIDAYS_2569.find(x => x.date === dStr);
            if (h) hList.push(`${curr.getDate()} - ${h.title}`);
            curr.setDate(curr.getDate() + 1);
        }

        let rangeStr = "";
        if (sDate === eDate) rangeStr = `${sDay} ${s.getDate()} ${sInfo.monthName} ${sYear}`;
        else if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
            rangeStr = `${sDay} ${s.getDate()} - ${eDay} ${e.getDate()} ${sInfo.monthName} ${sYear}`;
        } else {
            rangeStr = `${sDay} ${s.getDate()} ${sInfo.monthName} - ${eDay} ${e.getDate()} ${eInfo.monthName} ${sYear}`;
        }

        if (hList.length > 0) {
            rangeStr += `<div style="font-size:0.75rem; color:var(--accent); margin-top:6px; font-weight:500;">${hList.join('<br>')}</div>`;
        }
        return rangeStr;
    };
    for (let i = 1; i <= sorted.length; i++) {
        const curr = sorted[i];
        if (curr && (new Date(curr) - new Date(prev) === 86400000)) { prev = curr; }
        else { groups.push(flush(start, prev)); start = curr; prev = curr; }
    }
    return groups;
};

const showDaysBreakdown = (title, dateList) => {
    const modal = document.getElementById("dayBreakdownModal");
    const listContainer = document.getElementById("dayBreakdownList");
    document.getElementById("dayBreakdownTitle").innerText = title;

    const rangeStrings = groupDatesToRanges(dateList);
    listContainer.innerHTML = rangeStrings.map(r => `
        <div class="holiday-item" style="padding:16px; margin-bottom:12px; border-left:3px solid var(--accent);">
            <div style="font-weight:700; color:var(--text); font-size:1rem;">${r}</div>
        </div>
    `).join('');

    modal.classList.add("show");
};

const renderHolidays = () => {
    const list = document.getElementById("holidayListContainer");
    const select = document.getElementById("holidayYearSelect");
    if (!list) return;

    const years = [...new Set(APP_CONFIG.HOLIDAYS_2569.map(h => new Date(h.date).getFullYear()))].sort();
    if (select && select.options.length === 0) {
        years.forEach(y => {
            const opt = document.createElement("option");
            opt.value = y; opt.text = y + 543;
            select.appendChild(opt);
        });
        if (years.length > 0) select.value = years[0];
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
            html += UI.renderHolidaySectionHeader(THAI_MONTHS_FULL[mon]);
        }
        const fd = formatThaiDate(h.date);
        html += UI.renderHolidayItem(fd.full, h.title);
    });
    list.innerHTML = html || `<div style="text-align:center; padding:20px; color:var(--text3)">${APP_CONFIG.TEXT.NO_HOLIDAY_DATA}</div>`;
};

function openQuotaModal() {
    const year = 2026;
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    // Exclude "วันเข้าพรรษา" from calculations as requested
    const holidays = APP_CONFIG.HOLIDAYS_2569.filter(h => h.title !== "วันเข้าพรรษา" && h.date.startsWith("2026-")).map(h => h.date);

    let tableRowsHtml = "";
    for (let m = 0; m < 12; m++) {
        let totalMonFri = 0;
        let specialHolidays = 0;
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(year, m, d);
            const dayOfWeek = dateObj.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                totalMonFri++;
                if (holidays.includes(dateStr)) {
                    specialHolidays++;
                }
            }
        }

        const workingDays = totalMonFri - specialHolidays;
        const workingHours = workingDays * 7;
        const subtractHours = specialHolidays > 3 ? 110 : 120;
        const allowableLeaveHours = workingHours - subtractHours;
        const leaveQuota = allowableLeaveHours / 7;
        const roundedLeaveQuota = Number(leaveQuota.toFixed(2));
        const professionFee = Math.floor(leaveQuota * 2) / 2;
        const smartDeviceFee = workingDays - 17;

        tableRowsHtml += `
            <tr>
                <td class="row-num">${m + 1}</td>
                <td class="month-name">${thaiMonths[m]}</td>
                <td class="val-red">${workingDays}</td>
                <td>${workingHours}</td>
                <td class="val-red">${specialHolidays}</td>
                <td>${subtractHours}</td>
                <td>${allowableLeaveHours}</td>
                <td>${roundedLeaveQuota.toFixed(2)}</td>
                <td class="val-bold">${professionFee.toFixed(1)}</td>
                <td class="val-bold">${smartDeviceFee}</td>
            </tr>
        `;
    }

    const container = document.getElementById("quotaTableContainer");
    container.innerHTML = `
        <div class="quota-title">จำนวนวันหยุดค่าวิชาชีพ ปี 2569</div>
        <table class="quota-spreadsheet">
            <thead>
                <tr>
                    <th rowspan="2" class="num-col"></th>
                    <th rowspan="2" class="month-col">เดือน</th>
                    <th rowspan="2" class="work-days-col">วันที่ทำการ</th>
                    <th rowspan="2" class="work-hours-col">ชั่วโมงที่ทำการ</th>
                    <th rowspan="2" class="holiday-col">วันหยุดพิเศษ</th>
                    <th rowspan="2" class="minus-hours-col">ชั่วโมงที่ลบ</th>
                    <th rowspan="2" class="leave-hours-col">ชั่วโมงที่หยุดได้</th>
                    <th rowspan="2" class="quota-col">โควต้าหยุด</th>
                    <th colspan="2" class="earned-col">หยุดแล้วยังได้</th>
                </tr>
                <tr>
                    <th class="fee-col">ค่าวิชา</th>
                    <th class="smart-col">ค่า Smart Device</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>
        <div class="quota-footnote">*กรณีวันหยุดพิเศษมากกว่า 3 วัน ลบ 110 ชั่วโมง นอกนั้นลบ 120 ชั่วโมง</div>
    `;

    document.getElementById("quotaModal").classList.add("show");
}

function saveQuotaAsImage() {
    const container = document.getElementById("quotaTableContainer");
    if (!container) return;

    showToast("กำลังประมวลผลรูปภาพ...", "info");

    html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
    }).then(canvas => {
        const link = document.createElement("a");
        link.download = "โควต้าวันลา_2569.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        showToast("บันทึกรูปภาพสำเร็จ", "success");
    }).catch(err => {
        console.error("Save image error:", err);
        showToast("เกิดข้อผิดพลาดในการบันทึกรูปภาพ", "error");
    });
}

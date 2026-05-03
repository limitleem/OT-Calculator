
    const HOLIDAY_2569 = [
        {"date":"2026-01-01","title":"วันขึ้นปีใหม่"},
        {"date":"2026-01-02","title":"วันหยุดราชการเพิ่มเติมเป็นกรณีพิเศษ"},
        {"date":"2026-03-03","title":"วันมาฆบูชา"},
        {"date":"2026-04-06","title":"วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์"},
        {"date":"2026-04-13","title":"วันสงกรานต์"},
        {"date":"2026-04-14","title":"วันสงกรานต์"},
        {"date":"2026-04-15","title":"วันสงกรานต์"},
        {"date":"2026-05-01","title":"วันแรงงานแห่งชาติ"},
        {"date":"2026-05-04","title":"วันฉัตรมงคล"},
        {"date":"2026-05-13","title":"วันพระราชพิธีจรดพระนังคัลแรกนาขวัญ"},
        {"date":"2026-06-01","title":"ชดเชยวันวิสาขบูชา"},
        {"date":"2026-06-03","title":"วันเฉลิมพระชนพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี"},
        {"date":"2026-07-28","title":"วันเฉลิมพระชนพรรษาพระบาทสมเด็จพระปรเมนทรรามาธิบดีศรีสินทรมหาวชิราลงกรณ พระวชิรเกล้าเจ้าอยู่หัว"},
        {"date":"2026-07-29","title":"วันอาสาฬหบูชา"},
        {"date":"2026-07-30","title":"วันเข้าพรรษา"},
        {"date":"2026-08-12","title":"วันเฉลิมพระชนพรรษาสมเด็จพระบรมราชชนนีพันปีหลวงและวันแม่แห่งชาติ"},
        {"date":"2026-10-13","title":"วันคล้ายวันสวรรคตของพระบาทสมเด็จพระบรมชนกาธิเบศรมหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร"},
        {"date":"2026-10-23","title":"วันปิยมหาราช"},
        {"date":"2026-12-07","title":"ชดเชยวันพ่อแห่งชาติ"},
        {"date":"2026-12-10","title":"วันรัฐธรรมนูญ"},
        {"date":"2026-12-31","title":"วันสิ้นปี"}
    ];

    const isHoliday = (dateStr) => {
        const d = new Date(dateStr);
        const day = d.getDay();
        if (day === 0 || day === 6) return true; // Sunday or Saturday
        return HOLIDAY_2569.some(h => h.date === dateStr);
    };

    const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const THAI_DAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

    const formatThaiDate = (dateStr) => {
        if (!dateStr) return { short: "", full: "" };
        const d = new Date(dateStr);
        const day = THAI_DAYS[d.getDay()];
        const date = d.getDate();
        const month = THAI_MONTHS[d.getMonth()];
        const year = d.getFullYear() + 543;
        return { short: `${date} ${month} ${year}`, full: `${day} ${date} ${month} ${year}`, monthIndex: d.getMonth(), monthName: month, year };
    };

    window.addEventListener('DOMContentLoaded', () => renderHolidays());

    const renderHolidays = () => {
        const list = document.getElementById("holidayListContainer");
        const select = document.getElementById("holidayYearSelect");
        if(!list) return;

        const years = [...new Set(HOLIDAY_2569.map(h => new Date(h.date).getFullYear()))].sort();
        if(select && select.options.length === 0) {
            years.forEach(y => {
                const opt = document.createElement("option");
                opt.value = y;
                opt.text = y + 543;
                select.appendChild(opt);
            });
            if(years.length > 0) select.value = years[0];
        }

        const filterYear = select ? parseInt(select.value) : (years[0] || new Date().getFullYear());
        const filtered = HOLIDAY_2569.filter(h => new Date(h.date).getFullYear() === filterYear);
        
        let html = '';
        let currentMonth = -1;

        filtered.forEach(h => {
            const fd = formatThaiDate(h.date);
            if (fd.monthIndex !== currentMonth) {
                html += `<div style="color:var(--text3); font-size:0.8rem; font-weight:700; margin-top:12px; margin-bottom:4px; border-bottom:1px solid var(--border); padding-bottom:4px;">${fd.monthName} ${fd.year}</div>`;
                currentMonth = fd.monthIndex;
            }
            html += `
                <div class="holiday-item">
                    <div class="holiday-date">${fd.full}</div>
                    <div class="holiday-title">${h.title}</div>
                </div>
            `;
        });
        list.innerHTML = html || '<div class="empty-state" style="padding:20px;">ไม่มีวันหยุดในปีที่เลือก</div>';
    };

    const getDaysInRange = (rangeStr) => {
        if (!rangeStr) return [];
        const parts = rangeStr.split(" to ");
        const dates = [];
        let curr = new Date(parts[0]);
        const end = new Date(parts.length > 1 ? parts[1] : parts[0]);
        while (curr <= end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    };

    const toHour = t => {
        if (!t) return 0;
        const [h, m] = t.split(":").map(Number);
        return h + m / 60;
    };
    const fm = n => n != null ? n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
    const fh = n => n != null ? (n % 1 === 0 ? n : +n.toFixed(2)) : "0";

    function addItem() {
        document.querySelectorAll(".item").forEach(i => i.classList.remove("active"));
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
                        <div style="display:flex; gap:16px; align-items:center; height:38px;">
                            <label style="margin:0; text-transform:none; font-size:0.85rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:6px;"><input type="checkbox" class="chk-wd" checked> วันทำงาน</label>
                            <label style="margin:0; text-transform:none; font-size:0.85rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:6px;"><input type="checkbox" class="chk-hd"> วันหยุด</label>
                        </div>
                    </div>
                </div>
                <div class="field-row col-2 time-row-wd">
                    <div class="field">
                        <label>เวลาเริ่ม (วันทำงาน)</label>
                        <input class="start-wd" placeholder="เลือกเวลา">
                    </div>
                    <div class="field">
                        <label>เวลาสิ้นสุด (วันทำงาน)</label>
                        <input class="end-wd" placeholder="เลือกเวลา">
                    </div>
                </div>
                <div class="field-row col-2 time-row-hd" style="display:none;">
                    <div class="field">
                        <label>เวลาเริ่ม (วันหยุด)</label>
                        <input class="start-hd" placeholder="เลือกเวลา">
                    </div>
                    <div class="field">
                        <label>เวลาสิ้นสุด (วันหยุด)</label>
                        <input class="end-hd" placeholder="เลือกเวลา">
                    </div>
                </div>
                <div class="field-row">
                    <div class="field">
                        <label>ชื่อรายการ / หมายเหตุ</label>
                        <input class="name" placeholder="เช่น โอทีปิดงบ, เข้าเวรวันอาทิตย์…">
                    </div>
                </div>
                <div class="info-strip">
                    <span class="dot"></span>
                    <span class="info-text">กำลังรอข้อมูล...</span>
                </div>
                <button class="btn-del" onclick="this.closest('.item').remove(); calculate()">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    ลบรายการ
                </button>
            </div>
        </div>`;

        document.getElementById("items-container").insertAdjacentHTML("beforeend", html);
        const el = document.querySelector(`[data-id="${id}"]`);

        const dateRange = el.querySelector(".date-range");
        const chkWd = el.querySelector(".chk-wd");
        const chkHd = el.querySelector(".chk-hd");
        const timeRowWd = el.querySelector(".time-row-wd");
        const timeRowHd = el.querySelector(".time-row-hd");
        const startWd = el.querySelector(".start-wd");
        const endWd = el.querySelector(".end-wd");
        const startHd = el.querySelector(".start-hd");
        const endHd = el.querySelector(".end-hd");
        const name = el.querySelector(".name");
        const info = el.querySelector(".info-text");

        const fpRange = flatpickr(dateRange, { mode: "range", dateFormat: "Y-m-d" });
        const fpWdStart = flatpickr(startWd, { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, defaultDate: "17:00" });
        const fpWdEnd = flatpickr(endWd, { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, defaultDate: "21:00" });
        const fpHdStart = flatpickr(startHd, { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, defaultDate: "08:30" });
        const fpHdEnd = flatpickr(endHd, { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, defaultDate: "17:00" });

        // Set default date range to today
        const today = new Date().toISOString().split('T')[0];
        fpRange.setDate(today);

        const updateUI = () => {
            const dates = getDaysInRange(dateRange.value);
            let hdCount = 0;
            let wdCount = 0;
            dates.forEach(d => {
                if (isHoliday(d)) hdCount++;
                else wdCount++;
            });

            // Validation
            if (chkWd.checked && dates.length > 0 && wdCount === 0) {
                alert("ไม่มีวันทำงานในช่วงวันที่เลือก!");
                chkWd.checked = false;
            }
            if (chkHd.checked && dates.length > 0 && hdCount === 0) {
                alert("ไม่มีวันหยุดในช่วงวันที่เลือก!");
                chkHd.checked = false;
            }

            timeRowWd.style.display = chkWd.checked ? "grid" : "none";
            timeRowHd.style.display = chkHd.checked ? "grid" : "none";

            let valid = false;
            if (dates.length === 0) {
                info.innerHTML = 'กรุณาเลือกช่วงวันที่';
            } else if (!chkWd.checked && !chkHd.checked) {
                info.innerHTML = 'กรุณาเลือกประเภทวัน';
            } else {
                let parts = [];
                
                const calcHours = (s_val, e_val, isWd) => {
                    if (!s_val || !e_val) return null;
                    let s = toHour(s_val);
                    let e = toHour(e_val);
                    if (e <= s) e += 24;
                    let total = 0, breakTime = 0, h1 = 0, h15 = 0, h3 = 0;
                    for (let h = s; h < e; h += 0.5) {
                        let x = h >= 24 ? h - 24 : h;
                        if (isWd) {
                            if (x >= 8.5 && x < 16.5) continue;
                            h15 += 0.5; total += 0.5;
                        } else {
                            if (x >= 8.5 && x < 16.5) {
                                if (x >= 12 && x < 13) { breakTime += 0.5; continue; }
                                h1 += 0.5;
                            } else {
                                h3 += 0.5;
                            }
                            total += 0.5;
                        }
                    }
                    return { total, h1, h15, h3, breakTime, s, e };
                };

                if (chkWd.checked && wdCount > 0) {
                    const res = calcHours(startWd.value, endWd.value, true);
                    if (res) {
                        parts.push(`วันทำงาน (${wdCount} วัน): ${fh(res.total)} ชม./วัน`);
                    }
                }
                if (chkHd.checked && hdCount > 0) {
                    const res = calcHours(startHd.value, endHd.value, false);
                    if (res) {
                        parts.push(`วันหยุด (${hdCount} วัน): ${fh(res.total)} ชม./วัน`);
                    }
                }

                info.innerHTML = parts.length > 0 ? parts.join(' &nbsp;·&nbsp; ') : 'กรุณาเลือกเวลา';
                valid = true;
            }

            const dot = el.querySelector(".item-type-dot");
            if (chkWd.checked && chkHd.checked) dot.className = "item-type-dot dot-weekday"; 
            else if (chkHd.checked) dot.className = "item-type-dot dot-holiday";
            else dot.className = "item-type-dot dot-weekday";

            if (!name.dataset.edited && dates.length > 0) {
                const d1 = formatThaiDate(dates[0]).short;
                const d2 = formatThaiDate(dates[dates.length-1]).short;
                name.value = dates.length > 1 ? `OT ${d1} - ${d2}` : `OT ${d1}`;
                el.querySelector(".item-name").innerText = name.value;
            }
            
            calculate();
        };

        name.oninput = () => {
            name.dataset.edited = "1";
            el.querySelector(".item-name").innerText = name.value || "รายการใหม่";
            calculate();
        };

        [dateRange, chkWd, chkHd, startWd, endWd, startHd, endHd].forEach(inp => {
            if(inp.type === "checkbox") inp.addEventListener("change", updateUI);
            else inp.addEventListener("change", updateUI);
        });

        updateUI();
    }

    function calMoney(money){
        return Math.round(money * 100) / 100;
    }

    function calMoney2(money){
        return money;
    }

    function calculate() {
        const salary = +document.getElementById("salary").value || 0;
        const hourly = calMoney(salary / 30 / 7);   
        const daily = calMoney(hourly * 7);

        document.getElementById("sumDaily").innerText = fm(daily);
        document.getElementById("sum1").innerText = fm(hourly);
        document.getElementById("sum15").innerText = fm(hourly * 1.5);
        document.getElementById("sum3").innerText = fm(hourly * 3);

        let rows = "";
        let grandTotal = 0;
        const items = document.querySelectorAll(".item");

        items.forEach(item => {
            const dateRange = item.querySelector(".date-range").value;
            const chkWd = item.querySelector(".chk-wd").checked;
            const chkHd = item.querySelector(".chk-hd").checked;
            const name = item.querySelector(".name").value || "รายการไม่มีชื่อ";
            
            const dates = getDaysInRange(dateRange);
            let hdCount = 0;
            let wdCount = 0;
            dates.forEach(d => {
                if (isHoliday(d)) hdCount++;
                else wdCount++;
            });

            const prHrly1 = hourly;
            const prHrly15 = calMoney(hourly * 1.5);
            const prHrly3 = calMoney(hourly * 3);

            const calcRow = (isWd, startVal, endVal, count) => {
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

                const dayValRaw = calMoney(hhh1 + hhh15 + hhh3); 
                const dayVal = calMoney(dayValRaw);
                const total = calMoney(dayVal * count);

                const c1 = h1 > 0 ? `<span class="hours-chip x1">${fh(h1)}h × 1.0 = ${fm(hhh1)}</span>` : '';
                const c15 = h15 > 0 ? `<span class="hours-chip x15">${fh(h15)}h × 1.5 = ${fm(hhh15)}</span>` : '';
                const c3 = h3 > 0 ? `<span class="hours-chip x3">${fh(h3)}h × 3.0 = ${fm(hhh3)}</span>` : '';
                const ratesHtml = `${c1}${c15}${c3}`;

                const badgeHtml = isWd ? '<span class="badge badge-wd" style="margin-right:6px;">WD</span>' : '<span class="badge badge-hd" style="margin-right:6px;">HD</span>';
                const timeHtml = `<div class="text-center mono" style="display:flex;align-items:center;justify-content:center;color:var(--text2);font-size:0.75rem">${badgeHtml}${startVal}–${endVal} ${(e > 24) ? '<span style="font-size:0.6rem;color:var(--blue);background:var(--blue-dim);padding:1px 4px;border-radius:3px;margin-left:4px;">+1</span>' : ''}</div>`;
                
                return { total, ratesHtml, timeHtml, dayVal };
            };

            let itemTotal = 0;
            let wdData = null;
            let hdData = null;

            if (chkWd && wdCount > 0) wdData = calcRow(true, item.querySelector(".start-wd").value, item.querySelector(".end-wd").value, wdCount);
            if (chkHd && hdCount > 0) hdData = calcRow(false, item.querySelector(".start-hd").value, item.querySelector(".end-hd").value, hdCount);

            if (wdData && hdData) {
                itemTotal = wdData.total + hdData.total;
                rows += `
                <tr>
                    <td rowspan="2">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                            <span style="font-weight:600;font-size:0.85rem">${name}</span>
                        </div>
                    </td>
                    <td>${wdData.timeHtml}</td>
                    <td style="white-space:nowrap">${wdData.ratesHtml}</td>
                    <td class="text-center mono" style="color:var(--text2)">${wdCount}</td>
                    <td class="text-right"><span class="amount positive">฿${fm(wdData.total)}</span></td>
                </tr>
                <tr>
                    <td>${hdData.timeHtml}</td>
                    <td style="white-space:nowrap">${hdData.ratesHtml}</td>
                    <td class="text-center mono" style="color:var(--text2)">${hdCount}</td>
                    <td class="text-right"><span class="amount positive">฿${fm(hdData.total)}</span></td>
                </tr>`;
            } else if (wdData) {
                itemTotal = wdData.total;
                rows += `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                            <span style="font-weight:600;font-size:0.85rem">${name}</span>
                        </div>
                    </td>
                    <td>${wdData.timeHtml}</td>
                    <td style="white-space:nowrap">${wdData.ratesHtml}</td>
                    <td class="text-center mono" style="color:var(--text2)">${wdCount}</td>
                    <td class="text-right"><span class="amount positive">฿${fm(wdData.total)}</span></td>
                </tr>`;
            } else if (hdData) {
                itemTotal = hdData.total;
                rows += `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                            <span style="font-weight:600;font-size:0.85rem">${name}</span>
                        </div>
                    </td>
                    <td>${hdData.timeHtml}</td>
                    <td style="white-space:nowrap">${hdData.ratesHtml}</td>
                    <td class="text-center mono" style="color:var(--text2)">${hdCount}</td>
                    <td class="text-right"><span class="amount positive">฿${fm(hdData.total)}</span></td>
                </tr>`;
            } else {
                rows += `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                            <span style="font-weight:600;font-size:0.85rem">${name}</span>
                        </div>
                    </td>
                    <td>—</td>
                    <td></td>
                    <td class="text-center mono" style="color:var(--text2)">0</td>
                    <td class="text-right"><span class="amount positive">฿0.00</span></td>
                </tr>`;
            }

            grandTotal += itemTotal;
            grandTotal = calMoney(grandTotal);

            // Update header amount in item
            item.querySelector(".item-amount").innerText = `฿${fm(itemTotal)}`;
        });

        document.getElementById("itemCount").innerText = `${items.length} รายการ`;

        const emptyRow = `<tr><td colspan="5"><div class="empty-state"><div class="icon">📋</div>ยังไม่มีรายการ กด "เพิ่มรายการโอที"</div></td></tr>`;

        document.getElementById("result-table").innerHTML = `
        <table>
            <thead>
                <tr>
                    <th style="width:30%">รายการ</th>
                    <th class="text-center">ช่วงเวลา</th>
                    <th>ชั่วโมง & อัตรา</th>
                    <th class="text-center">วัน</th>
                    <th class="text-right">รวม (บาท)</th>
                </tr>
            </thead>
            <tbody>${rows || emptyRow}</tbody>
            <tfoot>
                <tr>
                    <td colspan="4" class="text-right">
                        <span class="grand-total-text">รวมเงินโอทีทั้งหมด</span>
                    </td>
                    <td class="text-right">
                        <span class="grand-total-num">฿${fm(grandTotal)}</span>
                    </td>
                </tr>
            </tfoot>
        </table>`;

        document.getElementById("headerTotal").innerText = `฿${fm(grandTotal)}`;

        // SAVE
        const data = {
            salary: document.getElementById("salary").value,
            items: []
        };

        document.querySelectorAll(".item").forEach(item => {
            data.items.push({
                dateRange: item.querySelector(".date-range").value,
                chkWd: item.querySelector(".chk-wd").checked,
                chkHd: item.querySelector(".chk-hd").checked,
                startWd: item.querySelector(".start-wd").value,
                endWd: item.querySelector(".end-wd").value,
                startHd: item.querySelector(".start-hd").value,
                endHd: item.querySelector(".end-hd").value,
                name: item.querySelector(".name").value,
                datasetEdited: item.querySelector(".name").dataset.edited
            });
        });

        localStorage.setItem("otData", JSON.stringify(data));
    }

    function loadData() {
        const data = JSON.parse(localStorage.getItem("otData") || "{}");

        if (data.salary) {
            document.getElementById("salary").value = data.salary;
        }

        if (data.items && data.items.length) {
            document.getElementById("items-container").innerHTML = "";
            data.items.forEach(it => {
                addItem();
                const el = document.querySelector("#items-container .item:last-child");

                if (it.dateRange !== undefined) {
                    // New format
                    el.querySelector(".date-range")._flatpickr.setDate(it.dateRange.includes(" to ") ? it.dateRange.split(" to ") : it.dateRange);
                    el.querySelector(".chk-wd").checked = it.chkWd;
                    el.querySelector(".chk-hd").checked = it.chkHd;
                    if(it.startWd) el.querySelector(".start-wd")._flatpickr.setDate(it.startWd);
                    if(it.endWd) el.querySelector(".end-wd")._flatpickr.setDate(it.endWd);
                    if(it.startHd) el.querySelector(".start-hd")._flatpickr.setDate(it.startHd);
                    if(it.endHd) el.querySelector(".end-hd")._flatpickr.setDate(it.endHd);
                    el.querySelector(".name").value = it.name || "";
                    if(it.datasetEdited) el.querySelector(".name").dataset.edited = it.datasetEdited;
                } else {
                    // Legacy format
                    el.querySelector(".name").value = it.name || "";
                    if (it.type === "weekday") {
                        el.querySelector(".chk-wd").checked = true;
                        el.querySelector(".chk-hd").checked = false;
                        el.querySelector(".start-wd")._flatpickr.setDate(it.start || "17:00");
                        el.querySelector(".end-wd")._flatpickr.setDate(it.end || "21:00");
                    } else {
                        el.querySelector(".chk-wd").checked = false;
                        el.querySelector(".chk-hd").checked = true;
                        el.querySelector(".start-hd")._flatpickr.setDate(it.start || "08:30");
                        el.querySelector(".end-hd")._flatpickr.setDate(it.end || "17:00");
                    }
                }

                // trigger update
                el.querySelector(".chk-wd").dispatchEvent(new Event("change"));
            });
        }
    }

    function clearAll() {
        if (!confirm("ลบรายการโอทีทั้งหมดใช่ไหม?")) return;
        document.getElementById("items-container").innerHTML = "";
        localStorage.removeItem("otData");
        calculate();
    }

    new Sortable(document.getElementById("items-container"), {
        animation: 200,
        handle: ".drag-handle",
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        onEnd: calculate
    });

    document.getElementById("salary").oninput = calculate;
    loadData();
    calculate();

    // fallback if empty
    if (!document.querySelectorAll(".item").length) {
        addItem();
    }

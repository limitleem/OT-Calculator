/**
 * OT Builder Pro - Configuration & Constants
 */

const APP_CONFIG = {
    STORAGE_KEYS: {
        PROFILES: "otUserProfiles_v3",
        LEGACY_PROFILES: "otUserProfiles_v2",
        CURRENT_USER: "otCurrentUser",
        GUEST_START_TIME: "otGuestStartTime",
        DATA_PREFIX: "otData_"
    },
    GUEST_EXPIRY_MS: 3600000, // 1 Hour
    PRESET_COLORS: ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#fb923c", "#9ca3af", "#4ade80", "#2dd4bf", "#818cf8", "#e879f9", "#ffffff", "#000000"],
    PRESET_EMOJIS: ["😀", "😎", "🦊", "🚀", "⚡", "🔥", "🌈", "🎨", "🍔", "⚽", "🎮", "🌟", "🐱", "🐶", "🦁", "🐧", "🦄", "🌈", "💎", "🍺", "🍕", "🦾", "👾"],
    DICEBEAR_STYLES: [
        { id: "avataaars", name: "People" },
        { id: "bottts", name: "Robots" },
        { id: "pixel-art", name: "Pixel" },
        { id: "lorelei", name: "Cute" },
        { id: "notionists", name: "Notion" },
        { id: "personas", name: "Personas" },
        { id: "adventurer", name: "Adventurer" },
        { id: "thumbs", name: "Thumbs (Pets/Fun)" },
        { id: "icons", name: "Icons" },
        { id: "shapes", name: "Shapes" }
    ],
    HOLIDAYS_2569: [
        {"date":"2026-01-01","title":"วันขึ้นปีใหม่"},
        {"date":"2026-01-02","title":"วันหยุดกรณีพิเศษ"},
        {"date":"2026-02-02","title":"วันมาฆบูชา"},
        {"date":"2026-04-06","title":"วันจักรี"},
        {"date":"2026-04-13","title":"วันสงกรานต์"},
        {"date":"2026-04-14","title":"วันสงกรานต์"},
        {"date":"2026-04-15","title":"วันสงกรานต์"},
        {"date":"2026-05-01","title":"วันแรงงาน"},
        {"date":"2026-05-04","title":"วันฉัตรมงคล"},
        {"date":"2026-05-11","title":"วันหยุดกรณีพิเศษ"},
        {"date":"2026-05-31","title":"วันวิสาขบูชา"},
        {"date":"2026-06-01","title":"ชดเชยวันวิสาขบูชา"},
        {"date":"2026-06-03","title":"วันเฉลิมฯ พระบรมราชินี"},
        {"date":"2026-07-28","title":"วันเฉลิมฯ ร.10"},
        {"date":"2026-07-29","title":"วันอาสาฬหบูชา"},
        {"date":"2026-07-30","title":"วันเข้าพรรษา"},
        {"date":"2026-08-12","title":"วันแม่แห่งชาติ"},
        {"date":"2026-10-13","title":"วันนวมินทรมหาราช"},
        {"date":"2026-10-23","title":"วันปิยมหาราช"},
        {"date":"2026-12-05","title":"วันพ่อแห่งชาติ"},
        {"date":"2026-12-07","title":"ชดเชยวันพ่อ"},
        {"date":"2026-12-10","title":"วันรัฐธรรมนูญ"},
        {"date":"2026-12-31","title":"วันสิ้นปี"}
    ],
    TEXT: {
        GUEST_SESSION_EXPIRED: "เซสชัน Guest หมดอายุ (1 ชม.) ข้อมูลถูกล้างแล้ว",
        GUEST_DATA_CLEARED: "ข้อมูล Guest ถูกล้างเรียบร้อย",
        PIN_INCORRECT: "รหัสไม่ถูกต้อง",
        PROFILE_NAME_REQUIRED: "กรุณาใส่ชื่อโปรไฟล์",
        PROFILE_EXISTS: "ชื่อนี้มีอยู่แล้ว",
        DELETE_CONFIRM: (name) => `ลบ "${name}"? ข้อมูลจะหายถาวร`,
        CLEAR_ALL_CONFIRM: "ล้างรายการทั้งหมด?",
        DATA_CLEARED_SUCCESS: "ล้างข้อมูลเรียบร้อย"
    }
};

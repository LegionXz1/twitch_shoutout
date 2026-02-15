/* =========================================================
   SHOUTOUT.JS – FIX indexClip BUG (RANDOM SAFE VERSION)
   ========================================================= */

/* ===============================
   GLOBAL STATE
   =============================== */
let shoutoutTimeout = null;
let lastClipId = null;

/* ===============================
   URL PARAMS
   =============================== */
const urlParams = new URLSearchParams(window.location.search);

const channel        = urlParams.get("channel");
const showClip       = urlParams.get("showClip") === "true";
const showMsg        = urlParams.get("showMsg") === "true";
const showText       = urlParams.get("showText") === "true";
const showImage      = urlParams.get("showImage") === "true";
const showDetails    = urlParams.get("showDetails") === "true";
const detailsText    = urlParams.get("detailsText") || "";
const timeOut        = parseInt(urlParams.get("timeOut")) || 10;
const dateRange      = parseInt(urlParams.get("dateRange")) || 0;

/* ===============================
   DOM ELEMENTS
   =============================== */
const container        = document.getElementById("container");
const clipVideo        = document.getElementById("clip");
const textContainer    = document.getElementById("text-container");
const detailsContainer = document.getElementById("details-container");

/* ===============================
   HELPER
   =============================== */
function hideAll() {
    container.style.display = "none";

    if (clipVideo) {
        clipVideo.pause();
        clipVideo.removeAttribute("src");
        clipVideo.load();
    }
}

function showContainer() {
    container.style.display = "block";
}

function replaceDetailsText(template, clip) {
    return template
        .replace("{title}", clip.title || "")
        .replace("{game}", clip.game_name || "")
        .replace("{creator_name}", clip.creator_name || "")
        .replace("{created_at}", clip.created_at || "");
}

/* ===============================
   RANDOM CLIP (SAFE)
   =============================== */
function pickRandomClip(clips) {
    if (!clips || clips.length === 0) return null;

    let clip;
    do {
        clip = clips[Math.floor(Math.random() * clips.length)];
    } while (clips.length > 1 && clip.id === lastClipId);

    lastClipId = clip.id;
    return clip;
}

/* ===============================
   MAIN SHOUTOUT
   =============================== */
function startShoutout(info) {
    if (!info || !info.data || info.data.length === 0) {
        console.warn("No clips found");
        return;
    }

    console.log("CLIPS LENGTH:", info.data.length);

    // 🔥 FIX: random clip object (NO index)
    const clip = pickRandomClip(info.data);
    if (!clip) return;

    console.log("SELECTED CLIP:", clip.id);

    showContainer();

    /* ===== CLIP VIDEO ===== */
    if (showClip && clipVideo) {
        clipVideo.pause();
        clipVideo.removeAttribute("src");
        clipVideo.load();

        // cache bust สำคัญมาก
        clipVideo.src = clip.clip_url + "?v=" + Date.now();
        clipVideo.autoplay = true;
        clipVideo.muted = false;
        clipVideo.controls = false;
        clipVideo.playsInline = true;
        clipVideo.style.display = "block";
    }

    /* ===== TITLE TEXT ===== */
    if (showText && textContainer) {
        textContainer.style.display = "block";
        textContainer.innerHTML = `
            <span class="title-text">
                GO CHECK OUT ${clip.broadcaster_name}
            </span>
        `;
    }

    /* ===== DETAILS ===== */
    if (showDetails && detailsContainer) {
        detailsContainer.style.display = "block";

        const formatted = replaceDetailsText(detailsText, clip)
            .split("\n")
            .map((line, i) => `<div class="details-text item-${i}">${line}</div>`)
            .join("");

        detailsContainer.innerHTML = formatted;
    }

    clearTimeout(shoutoutTimeout);
    shoutoutTimeout = setTimeout(hideAll, timeOut * 1000);
}

/* ===============================
   FETCH CLIPS
   =============================== */
function getClips(targetChannel) {
    fetch(`getuserclips.php?channel=${targetChannel}&dateRange=${dateRange}`)
        .then(res => res.json())
        .then(info => startShoutout(info))
        .catch(err => console.error("Error fetching clips:", err));
}

/* ===============================
   INIT
   =============================== */
hideAll();

/*
   NOTE:
   - เมื่อ bot รับ !so <channel>
   - ต้องเรียก getClips(channel)
   - logic socket / tmi.js ใช้ของเดิมได้เลย
*/

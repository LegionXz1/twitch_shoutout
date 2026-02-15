/* =========================================================
   SHOUTOUT.JS – FINAL STABLE VERSION
   - No indexClip
   - Auto-create DOM
   - Random clip (no repeat)
   ========================================================= */

/* ===============================
   GLOBAL STATE
   =============================== */
let shoutoutTimeout = null;
let lastClipId = null;
let els = null;

/* ===============================
   DOM READY + AUTO CREATE ELEMENTS
   =============================== */
document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("container");
    if (!container) {
        console.error("Container (#container) not found");
        return;
    }

    // ---- VIDEO ----
    let clipVideo = document.getElementById("clip");
    if (!clipVideo) {
        clipVideo = document.createElement("video");
        clipVideo.id = "clip";
        clipVideo.playsInline = true;
        clipVideo.autoplay = true;
        clipVideo.muted = false;
        clipVideo.controls = false;
        container.appendChild(clipVideo);
    }

    // ---- TEXT ----
    let textContainer = document.getElementById("text-container");
    if (!textContainer) {
        textContainer = document.createElement("div");
        textContainer.id = "text-container";
        container.appendChild(textContainer);
    }

    // ---- DETAILS ----
    let detailsContainer = document.getElementById("details-container");
    if (!detailsContainer) {
        detailsContainer = document.createElement("div");
        detailsContainer.id = "details-container";
        container.appendChild(detailsContainer);
    }

    els = {
        container,
        clipVideo,
        textContainer,
        detailsContainer
    };

    hideAll();
});

/* ===============================
   URL PARAMS
   =============================== */
const params = new URLSearchParams(window.location.search);

const showClip    = params.get("showClip") === "true";
const showText    = params.get("showText") === "true";
const showDetails = params.get("showDetails") === "true";
const detailsText = params.get("detailsText") || "";
const timeOut     = parseInt(params.get("timeOut")) || 10;
const dateRange   = parseInt(params.get("dateRange")) || 0;

/* ===============================
   HELPERS
   =============================== */
function hideAll() {
    if (!els) return;

    els.container.style.display = "none";
    els.textContainer.style.display = "none";
    els.detailsContainer.style.display = "none";

    if (els.clipVideo) {
        els.clipVideo.pause();
        els.clipVideo.removeAttribute("src");
        els.clipVideo.load();
    }
}

function showContainer() {
    if (els) els.container.style.display = "block";
}

function formatDetails(template, clip) {
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
    if (!els || !info || !info.data || info.data.length === 0) {
        console.warn("No clips found");
        return;
    }

    console.log("CLIPS LENGTH:", info.data.length);

    const clip = pickRandomClip(info.data);
    if (!clip) return;

    console.log("SELECTED CLIP:", clip.id);

    showContainer();

    /* ---- VIDEO ---- */
    if (showClip && els.clipVideo) {
        els.clipVideo.pause();
        els.clipVideo.removeAttribute("src");
        els.clipVideo.load();

        // cache bust สำคัญมาก
        els.clipVideo.src = clip.clip_url + "?v=" + Date.now();
        els.clipVideo.style.display = "block";
    }

    /* ---- TEXT ---- */
    if (showText && els.textContainer) {
        els.textContainer.style.display = "block";
        els.textContainer.innerHTML = `
            <span class="title-text">
                GO CHECK OUT ${clip.broadcaster_name}
            </span>
        `;
    }

    /* ---- DETAILS ---- */
    if (showDetails && els.detailsContainer) {
        els.detailsContainer.style.display = "block";

        els.detailsContainer.innerHTML = formatDetails(detailsText, clip)
            .split("\n")
            .map(line => `<div class="details-text">${line}</div>`)
            .join("");
    }

    clearTimeout(shoutoutTimeout);
    shoutoutTimeout = setTimeout(hideAll, timeOut * 1000);
}

/* ===============================
   FETCH CLIPS
   =============================== */
function getClips(channel) {
    fetch(`getuserclips.php?channel=${channel}&dateRange=${dateRange}`)
        .then(res => res.json())
        .then(info => startShoutout(info))
        .catch(err => console.error("Fetch error:", err));
}

/* ===============================
   EXPOSE FOR BOT / DEBUG
   =============================== */
// bot หรือ tmi.js ต้องเรียกฟังก์ชันนี้
window.triggerShoutout = function(channel) {
    getClips(channel);
};

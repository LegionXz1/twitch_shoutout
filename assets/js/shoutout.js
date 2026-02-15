console.log("🔥 shoutout.js LOADED");

/* ===============================
   GLOBAL
   =============================== */
let els = null;
let lastClipId = null;

/* ===============================
   DOM READY
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOMContentLoaded");

    const container = document.getElementById("container");
    if (!container) {
        console.error("❌ #container NOT FOUND");
        return;
    }

    // create video
    const video = document.createElement("video");
    video.id = "clip";
    video.autoplay = true;
    video.muted = false;
    video.playsInline = true;
    video.controls = true;
    video.style.width = "640px";

    container.appendChild(video);

    els = { container, video };

    console.log("✅ Video element created");

    // FORCE shoutout after 3 sec
    setTimeout(() => {
        console.log("🚀 FORCE TRIGGER SHOUTOUT");
        getClips("legionxiz");
    }, 3000);
});

/* ===============================
   RANDOM
   =============================== */
function pickRandomClip(clips) {
    let clip;
    do {
        clip = clips[Math.floor(Math.random() * clips.length)];
    } while (clips.length > 1 && clip.id === lastClipId);

    lastClipId = clip.id;
    return clip;
}

/* ===============================
   FETCH
   =============================== */
function getClips(channel) {
    console.log("📡 FETCH clips for:", channel);

    fetch(`getuserclips.php?channel=${channel}`)
        .then(res => {
            console.log("📡 fetch response:", res.status);
            return res.json();
        })
        .then(info => {
            console.log("📦 API DATA:", info);

            if (!info.data || info.data.length === 0) {
                console.error("❌ NO CLIPS");
                return;
            }

            const clip = pickRandomClip(info.data);
            console.log("🎬 SELECTED:", clip.clip_url);

            els.video.src = clip.clip_url + "?v=" + Date.now();
        })
        .catch(err => console.error("❌ FETCH ERROR", err));
}

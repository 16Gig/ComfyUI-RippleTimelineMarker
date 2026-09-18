import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

function getWidget(node, name) {
    return node?.widgets?.find((w) => w.name === name);
}

function findInputVideoNode() {
    const nodes = app.graph?._nodes || [];
    return nodes.find((n) => n?.type === "VHS_LoadVideo" && String(n.title || "").includes("INPUT VIDEO"))
        || nodes.find((n) => n?.type === "VHS_LoadVideo");
}

function viewURL(videoValue) {
    let value = String(videoValue || "").replace(/\\/g, "/");
    const parts = value.split("/");
    const filename = parts.pop();
    const subfolder = parts.join("/");
    let q = `/view?filename=${encodeURIComponent(filename)}&type=input`;
    if (subfolder) q += `&subfolder=${encodeURIComponent(subfolder)}`;
    return api.apiURL(q);
}

function stem(videoValue) {
    const name = String(videoValue || "video").replace(/\\/g, "/").split("/").pop();
    return name.replace(/\.[^.]+$/, "");
}

app.registerExtension({
    name: "Ripple.CutTimeline",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "RippleTimelineMarker") return;

        const original = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            original?.apply(this, arguments);
            const node = this;
            node.title = "5 - CUT TIMELINE / MARK FRAME";

            const idxWidget = getWidget(node, "frame_idx");
            const wrap = document.createElement("div");
            wrap.style.width = "100%";
            wrap.style.display = "flex";
            wrap.style.flexDirection = "column";
            wrap.style.gap = "6px";
            wrap.style.padding = "4px 0";

            const video = document.createElement("video");
            video.controls = true;
            video.preload = "metadata";
            video.style.width = "100%";
            video.style.maxHeight = "310px";
            video.style.background = "#111";
            video.style.borderRadius = "6px";
            video.style.display = "block";

            const status = document.createElement("div");
            status.style.fontFamily = "monospace";
            status.style.fontSize = "12px";
            status.style.padding = "4px 6px";
            status.style.background = "#171717";
            status.style.borderRadius = "4px";
            status.textContent = "Load a video, then click SYNC VIDEO.";

            const row = document.createElement("div");
            row.style.display = "grid";
            row.style.gridTemplateColumns = "1fr 72px 72px 1.4fr";
            row.style.gap = "5px";

            const makeButton = (label) => {
                const b = document.createElement("button");
                b.textContent = label;
                b.style.padding = "7px 6px";
                b.style.cursor = "pointer";
                return b;
            };

            const syncBtn = makeButton("SYNC VIDEO");
            const prevBtn = makeButton("◀ 1F");
            const nextBtn = makeButton("1F ▶");
            const markBtn = makeButton("MARK + EXPORT PNG");
            markBtn.style.fontWeight = "700";

            row.append(syncBtn, prevBtn, nextBtn, markBtn);
            wrap.append(video, status, row);

            let currentVideoName = "";
            let currentFps = 24;

            const sync = () => {
                const srcNode = findInputVideoNode();
                if (!srcNode) {
                    status.textContent = "INPUT VIDEO node not found.";
                    return;
                }
                const vw = getWidget(srcNode, "video");
                const fw = getWidget(srcNode, "force_rate");
                if (!vw?.value) {
                    status.textContent = "Choose a video in 1 - INPUT VIDEO first.";
                    return;
                }
                currentVideoName = vw.value;
                const fps = Number(fw?.value || 24);
                currentFps = fps > 0 ? fps : 24;
                const url = viewURL(currentVideoName);
                if (video.src !== url) video.src = url;
                status.textContent = `synced | ${currentFps} fps | ${currentVideoName}`;
            };

            const displayPosition = () => {
                if (!Number.isFinite(video.currentTime)) return;
                const f = Math.max(0, Math.round(video.currentTime * currentFps));
                const marked = Number(idxWidget?.value || 0);
                status.textContent = `PLAYHEAD: ${f}  |  ${video.currentTime.toFixed(3)}s  |  MARKED: ${marked}`;
            };

            syncBtn.onclick = sync;
            video.addEventListener("timeupdate", displayPosition);
            video.addEventListener("seeked", displayPosition);
            video.addEventListener("loadedmetadata", displayPosition);

            prevBtn.onclick = () => {
                video.pause();
                video.currentTime = Math.max(0, video.currentTime - 1 / currentFps);
            };
            nextBtn.onclick = () => {
                video.pause();
                const end = Number.isFinite(video.duration) ? video.duration : Infinity;
                video.currentTime = Math.min(end, video.currentTime + 1 / currentFps);
            };

            markBtn.onclick = async () => {
                try {
                    if (!currentVideoName) sync();
                    if (!currentVideoName) throw new Error("No video synced.");
                    video.pause();
                    const idx = Math.max(0, Math.round((Number(video.currentTime) || 0) * currentFps));
                    if (idxWidget) {
                        idxWidget.value = idx;
                        idxWidget.callback?.(idx);
                    }
                    node.graph?.setDirtyCanvas(true, true);
                    status.textContent = `MARKED ${idx} — exporting PNG...`;

                    const resp = await fetch(api.apiURL("/ripple_timeline_marker/export"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            video: currentVideoName,
                            time: Number(video.currentTime) || 0,
                            target_fps: currentFps,
                        }),
                    });
                    const data = await resp.json();
                    if (!resp.ok || !data.ok) throw new Error(data.error || `HTTP ${resp.status}`);

                    if (idxWidget) {
                        idxWidget.value = data.frame_idx;
                        idxWidget.callback?.(data.frame_idx);
                    }
                    status.textContent = `MARKED: ${data.frame_idx} | ${Number(data.time).toFixed(3)}s | PNG exported`;
                    node.graph?.setDirtyCanvas(true, true);

                    const a = document.createElement("a");
                    a.href = api.apiURL(data.view);
                    a.download = data.filename || `${stem(currentVideoName)}__cut.png`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => a.remove(), 100);
                } catch (e) {
                    console.error(e);
                    status.textContent = `ERROR: ${e?.message || e}`;
                }
            };

            node.addDOMWidget("timeline", "custom", wrap, {
                serialize: false,
                hideOnZoom: false,
                getMinHeight: () => 390,
                getHeight: () => 390,
            });
            node.setSize([560, 500]);

            setTimeout(sync, 800);
        };
    },
});

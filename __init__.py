import os
import shutil
import subprocess

import folder_paths
import server

web = server.web


class RippleTimelineMarker:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "frame_idx": ("INT", {"default": 0, "min": 0, "max": 1000000, "step": 1}),
            }
        }

    RETURN_TYPES = ("INT",)
    RETURN_NAMES = ("frame_idx",)
    FUNCTION = "run"
    CATEGORY = "Ripple"

    def run(self, frame_idx):
        return (int(frame_idx),)


def _resolve_input_file(filename: str) -> str:
    filename = str(filename or "").strip()
    if not filename:
        raise ValueError("No input video selected")

    try:
        p = folder_paths.get_annotated_filepath(filename)
        if p and os.path.isfile(p):
            return p
    except Exception:
        pass

    rel = filename.replace("\\", "/").lstrip("/")
    base = os.path.abspath(folder_paths.get_input_directory())
    p = os.path.abspath(os.path.join(base, rel))
    if os.path.commonpath([base, p]) != base:
        raise ValueError("Invalid input video path")
    if not os.path.isfile(p):
        raise FileNotFoundError(f"Video not found in ComfyUI input: {filename}")
    return p


def _find_ffmpeg() -> str:
    p = shutil.which("ffmpeg") or shutil.which("ffmpeg.exe")
    if p:
        return p
    try:
        from videohelpersuite.utils import ffmpeg_path  # type: ignore
        if ffmpeg_path and os.path.isfile(ffmpeg_path):
            return ffmpeg_path
    except Exception:
        pass
    raise RuntimeError("ffmpeg not found. VideoHelperSuite normally provides/locates it.")


@server.PromptServer.instance.routes.post("/ripple_timeline_marker/export")
async def ripple_export_frame(request):
    try:
        data = await request.json()
        filename = str(data.get("video", ""))
        current_time = max(0.0, float(data.get("time", 0.0) or 0.0))
        target_fps = float(data.get("target_fps", 24.0) or 24.0)
        if target_fps <= 0:
            target_fps = 24.0

        frame_idx = max(0, int(round(current_time * target_fps)))
        exact_time = frame_idx / target_fps

        src = _resolve_input_file(filename)
        ffmpeg = _find_ffmpeg()
        stem = os.path.splitext(os.path.basename(filename))[0]
        out_name = f"{stem}__ripple_cut_f{frame_idx:06d}.png"
        out_path = os.path.join(folder_paths.get_input_directory(), out_name)

        cmd = [
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-i", src,
            "-ss", f"{exact_time:.9f}",
            "-map", "0:v:0", "-frames:v", "1", out_path,
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if proc.returncode != 0 or not os.path.isfile(out_path):
            err = (proc.stderr or proc.stdout or "ffmpeg failed").strip()
            raise RuntimeError(err[-2000:])

        return web.json_response({
            "ok": True,
            "filename": out_name,
            "frame_idx": frame_idx,
            "target_fps": target_fps,
            "time": exact_time,
            "view": f"/view?filename={out_name}&type=input",
        })
    except Exception as e:
        return web.json_response({"ok": False, "error": str(e)}, status=400)


NODE_CLASS_MAPPINGS = {
    "RippleTimelineMarker": RippleTimelineMarker,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "RippleTimelineMarker": "Ripple Cut Timeline",
}
WEB_DIRECTORY = "./web"

print("[RippleTimelineMarker] loaded")

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

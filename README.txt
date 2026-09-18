Ripple Cut Timeline for ComfyUI

INSTALL
1. Delete older ComfyUI-RippleFrameMarker / V2 folders if present.
2. Copy ComfyUI-RippleTimelineMarker into ComfyUI/custom_nodes/.
3. Restart ComfyUI.
4. Hard refresh browser (Ctrl+F5).

USE
- Load video in 1 - INPUT VIDEO.
- Ripple Cut Timeline embeds its own normal HTML video player with a real seek bar.
- Scrub to the first frame of the cut. Use 1F buttons for frame stepping.
- Click MARK + EXPORT PNG.
- The frame index is stored in the workflow and fed to SECOND CUT GUIDE automatically.
- Edit the downloaded PNG and load it into 6 - EDITED CUT FRAME.
- Generate.

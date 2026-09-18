# ComfyUI Ripple Timeline Marker

Small helper nodes for LTX Ripple / IC-LoRA video-edit workflows in ComfyUI.

## Features

- Scrubbable video timeline
- Frame-by-frame navigation
- Export the marked frame as PNG
- Automatic frame-index output
- **Cut Scene Toggle**: OFF runs first-frame-only; ON enables the second cut guide
- Lazy branch switching, so the unused cut-image branch is not evaluated

## Installation

### Option 1 — Git clone (recommended)

Open a terminal / Command Prompt inside your ComfyUI `custom_nodes` folder:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/16Gig/ComfyUI-RippleTimelineMarker.git
```

For **ComfyUI Windows Portable**, for example:

```bat
cd C:\ComfyUI_windows_portable\ComfyUI\custom_nodes
git clone https://github.com/16Gig/ComfyUI-RippleTimelineMarker.git
```

Then restart ComfyUI. If ComfyUI was already open in your browser, do a hard refresh once with **Ctrl+F5**.

### Option 2 — Download ZIP

1. Open the GitHub repository.
2. Click **Code → Download ZIP**.
3. Extract the folder into:

```text
ComfyUI/custom_nodes/ComfyUI-RippleTimelineMarker/
```

4. Restart ComfyUI and press **Ctrl+F5** in the browser once.

The final folder structure should look like this:

```text
ComfyUI/
└── custom_nodes/
    └── ComfyUI-RippleTimelineMarker/
        ├── __init__.py
        ├── README.md
        └── web/
            └── ripple_timeline.js
```

## Updating

If you installed with Git:

```bash
cd ComfyUI/custom_nodes/ComfyUI-RippleTimelineMarker
git pull
```

Then restart ComfyUI.

## Requirements

- ComfyUI
- FFmpeg available on the system, or **ComfyUI-VideoHelperSuite** installed so the node can use its FFmpeg path

No separate Python package installation is required for this node.

## Nodes

- `Ripple Cut Timeline`
- `Ripple Cut Scene Toggle`
- `Ripple Lazy Guide Switch` — normally kept inside the workflow/subgraph

## Basic usage

1. Load the source video in the workflow.
2. Use **Ripple Cut Timeline** to scrub to the cut / frame you want.
3. Click **MARK + EXPORT PNG**.
4. Edit the exported PNG in your image editor.
5. Load the edited PNG into the workflow's **EDITED CUT FRAME** input.
6. Set **IS THERE A CUT SCENE?** to **YES** to enable the second guide.
7. Leave it **NO** for first-frame-only mode.

## Repository

https://github.com/16Gig/ComfyUI-RippleTimelineMarker

 # Karting-3
Racing Line

A simple, fully automated racing-line web app.

## What it does

- Upload a photo/image of a track layout.
- Automatically detects a centerline-like path from the image.
- Draws a racing line overlay with:
  - **Green** for straighter/faster sections
  - **Red** for higher turn intensity / braking sections
- Lets you download the updated image as a PNG.

## Run locally

Because this is a static app, you can run it with any local static file server.

Example:

```bash
python3 -m http.server 8000
```

Then open:

- <http://localhost:8000>

## Files

- `index.html` — app UI
- `styles.css` — styling
- `script.js` — image loading, racing-line generation, download export
index.html
index.html
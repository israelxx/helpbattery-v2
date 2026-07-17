import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "temporary screenshots");

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error("Uso: node screenshot.mjs <url> [label]");
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const existing = fs
  .readdirSync(outDir)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => parseInt(m[1], 10));
const nextN = existing.length > 0 ? Math.max(...existing) + 1 : 1;

const fileName = `screenshot-${nextN}${label ? `-${label}` : ""}.png`;
const outPath = path.join(outDir, fileName);

const VIEWPORT_WIDTH = 1440;
const VIEWPORT_HEIGHT = 900;
const DPR = 2;

const browser = await puppeteer.launch({
  headless: true,
  cacheDir: "C:/Users/israe/.cache/puppeteer",
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, deviceScaleFactor: DPR });
  await page.goto(url, { waitUntil: "networkidle0" });

  // Scroll through the full page first so scroll-triggered reveal animations
  // (IntersectionObserver) fire before slices are captured. scroll-behavior
  // is forced to "auto" because a smooth-scrolling <html> makes window.scrollTo
  // animate instead of jump, which races with IntersectionObserver.
  const totalHeight = await page.evaluate(async () => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = 400;
    let y = 0;
    const height = document.body.scrollHeight;
    while (y < height) {
      window.scrollTo(0, y);
      y += step;
      await delay(80);
    }
    window.scrollTo(0, 0);
    await delay(300);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;

    // IntersectionObserver firing during a synthetic scroll pass can be
    // flaky under headless rendering (frames get coalesced and some
    // elements never cross the visibility threshold). For screenshot
    // purposes, force-settle any reveal element that the observer missed
    // so the capture reflects the fully-loaded state real users see once
    // they've scrolled past it.
    document.querySelectorAll(".reveal, .reveal-scale").forEach((el) => {
      el.classList.add("is-visible");
    });

    return document.body.scrollHeight;
  });

  // Capture the page in normal-sized viewport slices rather than using
  // Puppeteer's fullPage screenshot: on very tall pages, fullPage capture
  // (Chrome's captureBeyondViewport path) can render blank bands where
  // filters/backdrop-blur/transformed elements sit. Slicing at real
  // viewport size and compositing avoids that.
  const positions = [];
  for (let y = 0; y < totalHeight; y += VIEWPORT_HEIGHT) {
    positions.push(Math.min(y, Math.max(totalHeight - VIEWPORT_HEIGHT, 0)));
  }
  if (positions[positions.length - 1] !== Math.max(totalHeight - VIEWPORT_HEIGHT, 0)) {
    positions.push(Math.max(totalHeight - VIEWPORT_HEIGHT, 0));
  }

  // Fixed-position elements (header, floating WhatsApp button, mobile sticky
  // CTA bar) repaint inside every slice's viewport. Hide them for all slices
  // except the very first, so they don't get stamped repeatedly down the
  // composited image.
  const toggleFixedChrome = (visible) => {
    const ids = ["site-header"];
    const selectors = [".sticky-cta-bar", 'a[aria-label="Falar por WhatsApp"]'];
    const apply = (el) => {
      if (visible) el.style.removeProperty("display");
      else el.style.setProperty("display", "none", "important");
    };
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) apply(el);
    });
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach(apply);
    });
  };

  const slices = [];
  for (let i = 0; i < positions.length; i++) {
    const y = positions[i];
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.evaluate(toggleFixedChrome, i === 0);
    await new Promise((r) => setTimeout(r, 150));
    const buffer = await page.screenshot({ encoding: "base64" });
    slices.push({ y, dataUrl: `data:image/png;base64,${buffer}` });
  }
  await page.evaluate(toggleFixedChrome, true);

  // Composite slices into a single tall image on a blank page's canvas.
  const compositor = await browser.newPage();
  await compositor.setViewport({ width: 100, height: 100 });
  const finalDataUrl = await compositor.evaluate(
    async (slicesData, totalH, vw, dpr) => {
      const canvas = document.createElement("canvas");
      canvas.width = vw * dpr;
      canvas.height = totalH * dpr;
      const ctx = canvas.getContext("2d");

      const loadImg = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      for (const slice of slicesData) {
        const img = await loadImg(slice.dataUrl);
        ctx.drawImage(img, 0, slice.y * dpr);
      }

      return canvas.toDataURL("image/png");
    },
    slices,
    totalHeight,
    VIEWPORT_WIDTH,
    DPR
  );
  await compositor.close();

  const base64Data = finalDataUrl.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(outPath, Buffer.from(base64Data, "base64"));
  console.log(`Screenshot guardado em: ${outPath}`);
} finally {
  await browser.close();
}

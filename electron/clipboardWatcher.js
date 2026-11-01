import { clipboard, nativeImage } from "electron";
import { createHash } from "node:crypto";
import log from "./logger.js";
import { EXCLUSION_FORMATS, looksSensitive } from "./lib/sensitive.js";

const POLL_INTERVAL_MS = 500;
const MAX_TEXT_LENGTH = 1200;
const MAX_IMAGE_WIDTH = 1280;

// Raw Windows clipboard formats appear in ClipboardItem.types under this name.
const osFormat = (name) => `electron application/osclipboard;format="${name}"`;
const PRIVATE_FORMATS = EXCLUSION_FORMATS.map(osFormat);
const HISTORY_FORMAT = osFormat("CanIncludeInClipboardHistory");

function sha1(data) {
  return createHash("sha1").update(data).digest("hex");
}

async function readBytes(item, type) {
  return Buffer.from(await (await item.getType(type)).arrayBuffer());
}

// Password managers mark what they copy so clipboard tools skip it.
async function isMarkedPrivate(item) {
  if (item.types.some((type) => PRIVATE_FORMATS.includes(type))) return true;
  if (!item.types.includes(HISTORY_FORMAT)) return false;
  // A zero here keeps content out of Windows clipboard history (Win+V).
  const flag = await readBytes(item, HISTORY_FORMAT);
  return flag.length >= 4 && flag.readUInt32LE(0) === 0;
}

async function readSnapshot() {
  const [item] = await clipboard.read();
  if (!item) return null;

  const imageType = item.types.find((type) => type.startsWith("image/"));
  const text = item.types.includes("text/plain")
    ? (await clipboard.readText()).trim()
    : "";

  if (imageType && !text) {
    const bytes = await readBytes(item, imageType);
    if (bytes.length) {
      return { kind: "image", item, imageType, bytes, signature: sha1(bytes) };
    }
  }
  return text ? { kind: "text", item, text, signature: sha1(text) } : null;
}

function encodeImage({ imageType, bytes }) {
  const image = nativeImage.createFromBuffer(bytes);
  const { width } = image.getSize();
  if (imageType === "image/png" && width <= MAX_IMAGE_WIDTH) {
    return bytes.toString("base64");
  }
  const resized =
    width > MAX_IMAGE_WIDTH ? image.resize({ width: MAX_IMAGE_WIDTH }) : image;
  return resized.toPNG().toString("base64");
}

/**
 * Polls the clipboard and reports new copies through `onCopy`, skipping
 * anything that is too long, marked private, or looks like a secret.
 */
export function createClipboardWatcher({ onCopy }) {
  let interval = null;
  let polling = false;
  let lastSignature = null;
  let lastError = "";

  async function poll() {
    const snapshot = await readSnapshot();
    const signature = snapshot?.signature ?? "";
    // The first poll only records what was already copied before start().
    const isBaseline = lastSignature === null;
    if (signature === lastSignature) return;
    lastSignature = signature;
    if (isBaseline || !snapshot) return;

    if (await isMarkedPrivate(snapshot.item)) {
      log.info("Skipped clipboard content marked private");
      return;
    }

    if (snapshot.kind === "text") {
      if (snapshot.text.length > MAX_TEXT_LENGTH) return;
      if (looksSensitive(snapshot.text)) {
        log.info("Skipped clipboard text that looks like a secret");
        return;
      }
      onCopy({ kind: "text", text: snapshot.text });
      return;
    }

    onCopy({ kind: "image", imageData: encodeImage(snapshot) });
  }

  async function tick() {
    if (polling) return;
    polling = true;
    try {
      await poll();
      lastError = "";
    } catch (err) {
      // Log each distinct failure once rather than every 500ms.
      if (err.message !== lastError) log.error("Clipboard watch error:", err);
      lastError = err.message;
    } finally {
      polling = false;
    }
  }

  return {
    start() {
      if (interval) return;
      lastSignature = null;
      interval = setInterval(tick, POLL_INTERVAL_MS);
      tick();
    },
    stop() {
      clearInterval(interval);
      interval = null;
    },
  };
}

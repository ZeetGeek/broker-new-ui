import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const [url, widthArg, heightArg, output] = process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
const port = width < 600 ? 9223 : 9222;
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(path.join(os.tmpdir(), "codex-site-visits-chrome-"));
const browser = spawn(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
], { stdio: "ignore" });

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let page;
for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
        const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
        page = pages.find((entry) => entry.type === "page");
        if (page) break;
    } catch {}
    await wait(100);
}
if (!page) throw new Error("Chrome DevTools did not start");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
});
let commandId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
});
function send(method, params = {}) {
    const id = ++commandId;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600, screenWidth: width, screenHeight: height });
await send("Page.navigate", { url });
await wait(3500);
await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
await wait(300);
const metrics = await send("Page.getLayoutMetrics");
const contentHeight = Math.ceil(metrics.cssContentSize.height);
const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true, clip: { x: 0, y: 0, width, height: contentHeight, scale: 1 } });
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, Buffer.from(screenshot.data, "base64"));
socket.close();
browser.kill();

#!/usr/bin/env node
// Motion renderer: draws a canvas scene frame-by-frame in headless Chrome and encodes an MP4.
// The page draws each frame and POSTs it back to this local server, which pipes it into ffmpeg.
// (Pulling frames out with CDP Runtime.evaluate + toDataURL hangs on large canvases, so don't.)
//
// usage:
//   node render.mjs <scene.html>                       -> <scene>.mp4 next to the page
//   node render.mjs <scene.html> --out final.mp4
//   node render.mjs <scene.html> --stills 1.5,4,8.2    -> stills/t1.5.png ... + stills/sheet.png
//   node render.mjs <scene.html> --sheet               -> after the MP4, a 1-fps contact sheet
//   node render.mjs <scene.html> --share               -> also writes <out>_share.mp4 (small, for phones/chat)
//   node render.mjs --check                            -> verify Chrome + ffmpeg are found
//
// env overrides: CHROME_PATH, FFMPEG_PATH
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { pathToFileURL } from 'node:url';

// ---------- args ----------
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const page = args.find(a => a.endsWith('.html'));

// ---------- tool discovery ----------
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const c = [];
  if (process.platform === 'win32') {
    for (const base of [process.env['PROGRAMFILES'], process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean)) {
      c.push(path.join(base, 'Google/Chrome/Application/chrome.exe'), path.join(base, 'Microsoft/Edge/Application/msedge.exe'));
    }
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
      const r = spawnSync('which', [n]); if (r.status === 0) c.push(r.stdout.toString().trim());
    }
  }
  return c.find(p => p && fs.existsSync(p));
}
function findFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  const onPath = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['ffmpeg']);
  if (onPath.status === 0) return onPath.stdout.toString().split(/\r?\n/)[0].trim();
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) { // winget installs often aren't on PATH yet
    const pk = path.join(process.env.LOCALAPPDATA, 'Microsoft/WinGet/Packages');
    if (fs.existsSync(pk)) for (const d of fs.readdirSync(pk).filter(d => /ffmpeg/i.test(d))) {
      const b = path.join(pk, d); const v = fs.readdirSync(b).find(x => x.startsWith('ffmpeg'));
      const exe = v && path.join(b, v, 'bin/ffmpeg.exe'); if (exe && fs.existsSync(exe)) return exe;
    }
  }
  for (const p of ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg']) if (fs.existsSync(p)) return p;
  return null;
}
const CHROME = findChrome(), FFMPEG = findFfmpeg();
if (flag('--check') || !page) {
  console.log('chrome:', CHROME || 'NOT FOUND (install Chrome/Edge or set CHROME_PATH)');
  console.log('ffmpeg:', FFMPEG || 'NOT FOUND (install ffmpeg or set FFMPEG_PATH)');
  if (!page && !flag('--check')) console.log('\nusage: node render.mjs <scene.html> [--out f.mp4] [--stills 1,4,8] [--sheet] [--share]');
  process.exit(CHROME && FFMPEG ? 0 : 1);
}
if (!CHROME || !FFMPEG) { console.error('Missing tools. Run: node render.mjs --check'); process.exit(1); }

const PAGE = path.resolve(page), DIR = path.dirname(PAGE);
const OUT = path.resolve(opt('--out') || PAGE.replace(/\.html$/, '.mp4'));
const stills = opt('--stills') ? opt('--stills').split(',').map(Number) : null;
const ff = (a, o = {}) => spawnSync(FFMPEG, ['-v', 'error', '-y', ...a], { stdio: 'inherit', ...o });

// ---------- render server ----------
let enc, chrome, total = 0, got = 0, lastFrame = Date.now();
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-chrome-'));
function finish(code) {
  try { chrome?.kill(); } catch {}
  setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(code); }, 300);
}
// a draw() exception or an infinite loop shows up as frames that stop arriving
setInterval(() => { if (Date.now() - lastFrame > 60000) { console.error(`stalled at frame ${got}/${total} – check draw() for errors near t=${(got / 30).toFixed(2)}s`); finish(1); } }, 5000);

function afterVideo() {
  if (flag('--share')) {
    const share = OUT.replace(/\.mp4$/, '_share.mp4');
    ff(['-i', OUT, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-tune', 'grain', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', share]);
    console.log('wrote', share, `(${(fs.statSync(share).size / 1e6).toFixed(1)} MB)`);
  }
  if (flag('--sheet')) {
    const sheet = OUT.replace(/\.mp4$/, '_sheet.png');
    ff(['-i', OUT, '-vf', 'fps=1,scale=180:-1,tile=15x1', '-frames:v', '1', sheet]);
    console.log('wrote', sheet);
  }
  finish(0);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') return res.end();
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    const kind = req.url.split('/')[1];
    if (kind === 'error') { console.error('PAGE ERROR:', Buffer.concat(chunks).toString()); res.end(); return finish(1); }
    if (kind === 'info') {
      const info = JSON.parse(Buffer.concat(chunks));
      console.log(`page ready (${info.w || 1080}x${info.h || 1920}, ${info.fps} fps, ${info.dur}s), fonts loaded: ${info.fonts}`);
      total = stills ? stills.length : Math.round(info.dur * info.fps);
      if (!stills) enc = spawn(FFMPEG, ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(info.fps), '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
      lastFrame = Date.now();
      return res.end(JSON.stringify(stills ? stills.map(s => Math.round(s * info.fps)) : [...Array(total).keys()]));
    }
    if (kind === 'frame') {
      const buf = Buffer.concat(chunks); lastFrame = Date.now();
      if (stills) { const d = path.join(DIR, 'stills'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `t${stills[got]}.png`), buf); }
      else if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
      got++; if (got % 30 === 0 || stills) console.log(`frame ${got}/${total}`);
      res.end('ok');
      if (got === total) {
        if (enc) { enc.stdin.end(); enc.on('close', () => { console.log('wrote', OUT, `(${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB)`); afterVideo(); }); }
        else { // stills: also tile them into one contact sheet for quick review
          const d = path.join(DIR, 'stills'), ins = stills.flatMap(s => ['-i', path.join(d, `t${s}.png`)]);
          if (stills.length > 1) ff([...ins, '-filter_complex', `${stills.map((_, i) => `[${i}]`).join('')}hstack=${stills.length},scale=${Math.min(2400, stills.length * 340)}:-1`, path.join(d, 'sheet.png')]);
          else fs.copyFileSync(path.join(d, `t${stills[0]}.png`), path.join(d, 'sheet.png'));
          console.log('wrote', path.join(d, 'sheet.png')); finish(0);
        }
      }
    }
  });
});
server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  const url = pathToFileURL(PAGE).href + `?render=${port}`;
  chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${profile}`, url], { stdio: 'ignore' });
});

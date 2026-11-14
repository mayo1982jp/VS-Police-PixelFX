/* ==========================================================
   VS Police - pixelui.js
   Pixel-art UI skin built with the bundled pixelfx Painter.
   - Generates every sprite as a tiny PNG and exposes it as a CSS variable.
   - Plays pixelfx effects on a transparent full-screen pixel canvas
     when app.js fires the "vspolice:fx" event.
   ========================================================== */
import {
    createFrame,
    painterFor,
    composite,
    clearFrame,
    createFx,
    hex,
} from "./pixelfx/core/index.js";
import * as achievementFx from "./pixelfx/fx/ui/achievement.js";
import * as questFx from "./pixelfx/fx/ui/quest-complete.js";
import * as confettiFx from "./pixelfx/fx/ui/confetti.js";
import * as countdownFx from "./pixelfx/fx/ui/countdown.js";
import * as damageFx from "./pixelfx/fx/ui/damage-number.js";
import * as hitFx from "./pixelfx/fx/impacts/hit-spark.js";
import * as collectFx from "./pixelfx/fx/pickups/collect-burst.js";

(function () {
    "use strict";

    if (typeof document === "undefined" || typeof window === "undefined") return;

    const H = hex;
    const root = document.documentElement;
    const setCSS = (name, value) => root.style.setProperty("--px-" + name, value);
    const setImage = (name, url) => setCSS(name, 'url("' + url + '")');

    /* ---------- frame -> PNG data URL ---------- */
    const scratch = document.createElement("canvas");

    function frameToURL(frame) {
        const out = new Uint8ClampedArray(frame.w * frame.h * 4);
        composite(frame, out, null);
        scratch.width = frame.w;
        scratch.height = frame.h;
        const ctx = scratch.getContext("2d");
        ctx.putImageData(new ImageData(out, frame.w, frame.h), 0, 0);
        return scratch.toDataURL("image/png");
    }

    function sprite(w, h, draw) {
        const frame = createFrame(w, h);
        draw(painterFor(frame), frame);
        return frameToURL(frame);
    }

    /* ---------- shared colours ---------- */
    const INK = H("#0b1020");
    const BLACK = H("#05070c");
    const WHITE_C = H("#f4fbff");
    const GOLD = H("#ffd166");
    const GOLD_D = H("#9a6208");
    const GOLD_L = H("#ffe9a0");
    const CYAN = H("#7ee8fa");
    const CYAN_D = H("#1f7f9a");
    const RED = H("#ff5a5a");
    const RED_D = H("#8c1420");
    const GREEN = H("#67e077");
    const GREEN_D = H("#237a34");
    const BLUE = H("#5aa0f0");
    const BLUE_D = H("#1f3a7a");
    const PURPLE = H("#c58bff");
    const PURPLE_D = H("#4a1a6a");
    const STEEL = H("#8fa3b8");
    const STEEL_D = H("#26364d");
    const GLASS = H("#9ee6f8");

    /* ==========================================================
       Frames (border-image assets)
       ========================================================== */
    function buttonFrame(c) {
        return sprite(16, 16, (p) => {
            p.rect(0, 0, 16, 1, c.outer);
            p.rect(0, 15, 16, 1, c.outer);
            p.rect(0, 1, 1, 14, c.outer);
            p.rect(15, 1, 1, 14, c.outer);
            p.rect(1, 1, 14, 1, c.mid);
            p.rect(1, 14, 14, 1, c.mid);
            p.rect(1, 2, 1, 12, c.mid);
            p.rect(14, 2, 1, 12, c.mid);
            p.rect(2, 2, 12, 1, c.light);
            p.rect(2, 2, 1, 12, c.light);
            p.rect(2, 13, 12, 1, c.dark);
            p.rect(13, 2, 1, 12, c.dark);
            p.rect(3, 3, 1, 1, c.accent || c.light);
            p.rect(12, 12, 1, 1, c.dark);
        });
    }

    function panelFrame(c) {
        return sprite(24, 24, (p) => {
            p.rect(0, 0, 24, 2, c.outer);
            p.rect(0, 22, 24, 2, c.outer);
            p.rect(0, 2, 2, 20, c.outer);
            p.rect(22, 2, 2, 20, c.outer);
            p.rect(2, 2, 20, 2, c.mid);
            p.rect(2, 20, 20, 2, c.mid);
            p.rect(2, 4, 2, 16, c.mid);
            p.rect(20, 4, 2, 16, c.mid);
            p.rect(4, 4, 16, 1, c.light);
            p.rect(4, 4, 1, 16, c.light);
            p.rect(4, 19, 16, 1, c.dark);
            p.rect(19, 4, 1, 16, c.dark);
            p.rect(5, 5, 1, 1, c.accent || c.light);
            p.rect(18, 5, 1, 1, c.accent || c.light);
            p.rect(5, 18, 1, 1, c.dark);
            p.rect(18, 18, 1, 1, c.dark);
        });
    }

    const FRAMES = {
        panel: { outer: BLACK, mid: H("#17283b"), light: H("#4f7396"), dark: H("#09111b"), accent: H("#2a90b8") },
        modal: { outer: BLACK, mid: H("#3b2a10"), light: GOLD, dark: H("#1a1104"), accent: GOLD_L },
        btn: { outer: BLACK, mid: H("#334a63"), light: H("#88b4dc"), dark: H("#172433"), accent: H("#c8e8ff") },
        gold: { outer: BLACK, mid: GOLD_D, light: GOLD_L, dark: H("#4a2c08"), accent: WHITE_C },
        green: { outer: BLACK, mid: GREEN_D, light: GREEN, dark: H("#123f18"), accent: H("#d6ffd6") },
        red: { outer: BLACK, mid: RED_D, light: H("#ff9a8a"), dark: H("#4a0a0a"), accent: H("#ffd8cc") },
        blue: { outer: BLACK, mid: BLUE_D, light: H("#9bdcff"), dark: H("#0a2040"), accent: H("#e6fbff") },
        purple: { outer: BLACK, mid: PURPLE_D, light: PURPLE, dark: H("#240a38"), accent: H("#f0d6ff") },
    };

    /* ==========================================================
       Bitmap-font logo
       ========================================================== */
    function logoHeader() {
        return sprite(200, 48, (p) => {
            p.rect(2, 4, 40, 40, BLACK);
            p.rect(4, 6, 36, 36, H("#1b2a3e"));
            p.rect(6, 8, 32, 2, GOLD_D);
            p.rect(6, 38, 32, 2, GOLD_D);
            p.rect(6, 8, 2, 32, GOLD);
            p.rect(36, 8, 2, 32, GOLD_D);
            p.text("VS", 22, 11, GOLD, {
                font: "big", scale: 3, align: "center",
                outline: BLACK, shadow: H("#4a2c08"),
            });
            p.text("POLICE", 48, 7, WHITE_C, {
                font: "big", scale: 4,
                outline: BLACK, shadow: H("#1f3a7a"),
            });
            p.text("CITY CHASE", 50, 40, CYAN, {
                font: "mini", scale: 1,
                outline: BLACK,
            });
        });
    }

    function logoSplash() {
        return sprite(340, 100, (p) => {
            p.rect(2, 10, 54, 54, BLACK);
            p.rect(4, 12, 50, 50, H("#1b2a3e"));
            p.rect(6, 14, 46, 3, GOLD_D);
            p.rect(6, 57, 46, 3, GOLD_D);
            p.rect(6, 14, 3, 46, GOLD);
            p.rect(51, 14, 3, 46, GOLD_D);
            p.text("VS", 29, 23, GOLD, {
                font: "big", scale: 4, align: "center",
                outline: BLACK, shadow: H("#4a2c08"),
            });
            p.text("POLICE", 74, 18, WHITE_C, {
                font: "big", scale: 5,
                outline: BLACK, shadow: H("#1f3a7a"),
            });
            p.text("CITY CHASE", 76, 66, CYAN, {
                font: "mini", scale: 2,
                outline: BLACK,
            });
            p.rect(76, 84, 8, 2, GOLD);
            p.rect(88, 84, 8, 2, GOLD);
            p.rect(100, 84, 8, 2, GOLD);
            p.glow(29, 37, 26, GOLD, 0.35);
        });
    }

    /* ==========================================================
       Board sprites
       ========================================================== */
    const BUILDING_PALETTES = [
        { wall: "#26364a", roof: "#3f5874", light: "#6f93b8", dark: "#17222f", accent: "#7ee8fa" },
        { wall: "#3a2a22", roof: "#5a4030", light: "#8a6244", dark: "#22160f", accent: "#ffb74d" },
        { wall: "#1e3a3a", roof: "#2f5a58", light: "#5a9a94", dark: "#102424", accent: "#7ee8fa" },
        { wall: "#30263f", roof: "#4a3a62", light: "#7a62a0", dark: "#1a1226", accent: "#c58bff" },
        { wall: "#2f3a22", roof: "#4a5a30", light: "#7a8a4a", dark: "#1a2010", accent: "#b4e070" },
    ];

    function drawBuilding(p, v) {
        const c = BUILDING_PALETTES[v];
        const wall = H(c.wall), roof = H(c.roof), light = H(c.light), dark = H(c.dark), accent = H(c.accent);
        p.rect(0, 0, 40, 40, INK);
        p.rect(1, 1, 38, 38, dark);
        p.rect(2, 2, 36, 36, roof);
        p.rect(2, 2, 36, 2, light);
        p.rect(2, 36, 36, 2, H("#0d1620"));
        p.rect(36, 2, 2, 36, dark);
        p.rect(5, 5, 30, 30, wall);
        p.rect(5, 5, 30, 1, light);
        p.rect(5, 34, 30, 1, dark);
        p.rect(6, 6, 2, 2, light);
        p.rect(32, 6, 2, 2, light);
        p.rect(6, 32, 2, 2, dark);
        p.rect(32, 32, 2, 2, dark);

        if (v === 0) {
            p.ring(20, 20, 10, 2, GOLD_D);
            p.ring(20, 20, 8, 1, GOLD);
            p.rect(16, 15, 8, 10, H("#1c2a3a"));
            p.text("H", 20, 15, GOLD, { font: "mini", scale: 2, align: "center", outline: INK });
            p.rect(7, 8, 3, 3, H("#566a80"));
            p.rect(7, 8, 1, 1, H("#9ab0c8"));
            p.rect(30, 29, 3, 3, H("#151f2c"));
        } else if (v === 1) {
            p.rect(11, 13, 2, 8, H("#24170e"));
            p.rect(27, 13, 2, 8, H("#24170e"));
            p.ellipse(20, 14, 8, 6, INK);
            p.ellipse(20, 13, 7, 5, H("#6b4a2e"));
            p.ellipse(20, 12, 5, 3, H("#9a6a3e"));
            p.rect(15, 12, 10, 2, H("#c28c52"));
            p.rect(14, 19, 12, 2, H("#3a2616"));
            p.rect(8, 28, 9, 3, H("#2a1c12"));
            p.rect(9, 28, 7, 1, H("#7a5636"));
            p.rect(23, 29, 8, 2, H("#2a1c12"));
            p.rect(24, 29, 6, 1, H("#5f4228"));
        } else if (v === 2) {
            for (const [x, y] of [[8, 8], [20, 8], [8, 21], [20, 21]]) {
                p.rect(x, y, 10, 7, INK);
                p.rect(x + 1, y + 1, 8, 5, H("#1b3a42"));
                p.rect(x + 2, y + 2, 6, 3, accent);
                p.rect(x + 2, y + 2, 3, 1, H("#d8ffff"));
                p.line(x + 2, y + 6, x + 7, y + 6, H("#0e2428"));
            }
            p.rect(9, 17, 2, 2, H("#101c22"));
            p.rect(30, 16, 2, 2, H("#101c22"));
        } else if (v === 3) {
            p.rect(19, 9, 2, 23, H("#48586c"));
            p.rect(20, 9, 1, 23, H("#a0b4c8"));
            p.rect(13, 14, 14, 1, H("#48586c"));
            p.rect(15, 20, 10, 1, H("#48586c"));
            p.rect(19, 8, 2, 2, RED);
            p.rect(19, 8, 1, 1, H("#ffd0c0"));
            p.rect(8, 25, 8, 5, INK);
            p.rect(9, 26, 6, 3, BLUE_D);
            p.rect(10, 27, 4, 1, BLUE);
            p.rect(24, 26, 8, 5, INK);
            p.rect(25, 27, 6, 3, BLUE_D);
            p.rect(26, 28, 4, 1, BLUE);
        } else {
            for (const [x, y] of [[8, 9], [21, 9], [8, 23], [21, 23]]) {
                p.rect(x, y, 9, 7, INK);
                p.rect(x + 1, y + 1, 7, 5, H("#4a5a3a"));
                p.rect(x + 2, y + 2, 5, 3, H("#222c18"));
                p.rect(x + 3, y + 3, 3, 1, H("#8a9a6a"));
                p.rect(x + 4, y + 3, 1, 1, H("#c8d8a8"));
            }
            p.rect(19, 17, 2, 12, H("#6a7a4a"));
            p.rect(14, 24, 4, 1, H("#3a4a2a"));
            p.rect(22, 24, 4, 1, H("#3a4a2a"));
        }
        p.rect(2, 2, 1, 1, WHITE_C);
        p.rect(37, 37, 1, 1, BLACK);
    }

    function drawCar(p) {
        p.rect(6, 7, 4, 8, BLACK);
        p.rect(22, 7, 4, 8, BLACK);
        p.rect(6, 19, 4, 8, BLACK);
        p.rect(22, 19, 4, 8, BLACK);
        p.rect(6, 8, 3, 6, H("#1a1d25"));
        p.rect(23, 8, 3, 6, H("#1a1d25"));
        p.rect(6, 20, 3, 6, H("#1a1d25"));
        p.rect(23, 20, 3, 6, H("#1a1d25"));

        p.rect(9, 4, 14, 24, INK);
        p.rect(10, 5, 12, 22, RED);
        p.rect(10, 5, 12, 2, H("#ff9a8a"));
        p.rect(10, 25, 12, 2, RED_D);
        p.rect(11, 8, 10, 5, H("#1a3a52"));
        p.rect(11, 8, 10, 1, GLASS);
        p.rect(11, 11, 10, 1, H("#3a7a9a"));
        p.rect(11, 14, 10, 7, H("#b71c1c"));
        p.rect(12, 15, 8, 2, H("#ff8a80"));
        p.rect(12, 20, 8, 3, INK);
        p.rect(13, 21, 6, 1, H("#1a3a52"));
        p.rect(11, 24, 10, 2, H("#7a0a0a"));
        p.rect(11, 4, 2, 2, H("#fff3a6"));
        p.rect(19, 4, 2, 2, H("#fff3a6"));
        p.rect(11, 27, 2, 1, RED);
        p.rect(19, 27, 2, 1, RED);
        p.rect(12, 6, 8, 1, WHITE_C);
    }

    function drawHeli(p, c, phase) {
        const base = H(c.base), dark = H(c.dark), light = H(c.light), glass = H(c.glass);
        if (phase === 0) {
            p.rect(1, 13, 28, 1, H("#3a465a"));
            p.rect(2, 12, 26, 1, H("#a8b8c8"));
            p.rect(3, 14, 24, 1, H("#3a465a"));
            p.rect(1, 13, 2, 1, H("#e8f4ff"));
            p.rect(27, 13, 2, 1, H("#e8f4ff"));
        } else {
            p.line(4, 4, 25, 25, H("#3a465a"));
            p.line(5, 4, 26, 25, H("#a8b8c8"));
            p.line(25, 4, 4, 25, H("#3a465a"));
            p.line(26, 4, 5, 25, H("#a8b8c8"));
            p.rect(4, 4, 2, 2, H("#e8f4ff"));
            p.rect(24, 4, 2, 2, H("#e8f4ff"));
        }
        p.rect(13, 21, 4, 7, INK);
        p.rect(14, 21, 2, 6, dark);
        p.rect(9, 28, 12, 1, INK);
        p.rect(10, 27, 10, 1, H("#a8b8c8"));
        p.ellipse(15, 14, 7, 9, INK);
        p.ellipse(15, 14, 6, 8, dark);
        p.ellipse(15, 13, 5, 6, base);
        p.ellipse(15, 12, 4, 3, light);
        p.rect(11, 11, 8, 5, INK);
        p.rect(12, 11, 6, 4, glass);
        p.rect(12, 11, 5, 1, H("#d8ffff"));
        p.rect(12, 14, 6, 1, CYAN_D);
        p.rect(8, 21, 2, 6, INK);
        p.rect(8, 22, 1, 4, H("#b8c8d8"));
        p.rect(20, 21, 2, 6, INK);
        p.rect(21, 22, 1, 4, H("#b8c8d8"));
        p.rect(17, 8, 2, 2, light);
        p.rect(14, 19, 2, 2, H("#ffe066"));
    }

    const HELI_PALETTES = {
        green: { base: "#4caf50", dark: "#1d5a22", light: "#9af0a0", glass: "#7ee8fa" },
        pink: { base: "#e91e63", dark: "#7a0a32", light: "#ff9ec7", glass: "#bff4ff" },
        yellow: { base: "#ffc107", dark: "#8a6200", light: "#ffe9a0", glass: "#fff4c8" },
    };

    function drawClue(p, c) {
        const dark = H(c.dark), base = H(c.base), light = H(c.light);
        p.poly([[8, 0], [15, 8], [8, 16], [1, 8]], INK);
        p.poly([[8, 2], [13, 8], [8, 14], [3, 8]], dark);
        p.poly([[8, 3], [12, 8], [8, 13], [4, 8]], base);
        p.poly([[8, 4], [11, 8], [8, 12], [5, 8]], light);
        p.rect(6, 6, 2, 2, WHITE_C);
        p.rect(8, 9, 1, 1, dark);
    }

    function drawSearchlight(p) {
        p.shade(0, 0, 64, 64, (x, y, o) => {
            const dx = (x - 31.5) / 32, dy = (y - 31.5) / 32;
            const d = Math.hypot(dx, dy);
            if (d > 1) return;
            const checker = ((x >> 1) + (y >> 1)) & 1;
            const core = d < 0.42;
            o.c = core ? H("#fff3b0") : d < 0.7 ? GOLD : GOLD_D;
            o.a = core ? Math.max(0.35, 1 - d * 0.8) : (0.55 * (1 - d) + 0.08) * (checker ? 1 : 0.65);
        });
        p.rect(30, 1, 2, 12, H("#fff8d0"));
        p.rect(1, 30, 12, 2, H("#fff8d0"));
        p.rect(51, 30, 12, 2, H("#fff8d0"));
        p.rect(30, 51, 2, 12, H("#fff8d0"));
    }

    function drawAsphalt(p) {
        p.rect(0, 0, 32, 32, H("#2b3340"));
        let s = 0x1a2b3c4d;
        const rnd = () => {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
        for (let i = 0; i < 70; i++) {
            const x = Math.floor(rnd() * 32), y = Math.floor(rnd() * 32);
            const v = rnd();
            p.px(x, y, v < 0.45 ? H("#232a35") : v < 0.8 ? H("#343d4b") : H("#3f4a5a"));
        }
        p.line(3, 25, 8, 29, H("#1d232c"));
        p.line(21, 4, 26, 9, H("#1d232c"));
        p.rect(0, 15, 32, 1, H("#252c37"));
    }

    function drawIntersection(p, target) {
        p.rect(0, 0, 32, 32, H("#10161f"));
        p.rect(1, 1, 30, 30, H("#2d3644"));
        p.rect(2, 2, 28, 2, H("#3a4656"));
        p.rect(2, 28, 28, 2, H("#202834"));
        p.rect(2, 2, 2, 28, H("#354252"));
        p.rect(28, 2, 2, 28, H("#1d2530"));
        p.rect(7, 15, 4, 1, H("#d8c070"));
        p.rect(13, 15, 4, 1, H("#d8c070"));
        p.rect(19, 15, 4, 1, H("#d8c070"));
        p.rect(6, 6, 2, 2, H("#4a586a"));
        p.rect(24, 24, 2, 2, H("#1b222c"));
        if (target) {
            p.rect(0, 0, 32, 1, GOLD);
            p.rect(0, 31, 32, 1, GOLD);
            p.rect(0, 1, 1, 30, GOLD);
            p.rect(31, 1, 1, 30, GOLD);
            p.poly([[16, 5], [25, 15], [20, 15], [20, 25], [12, 25], [12, 15], [7, 15]], GOLD);
            p.poly([[16, 8], [22, 15], [18, 15], [18, 22], [14, 22], [14, 15], [10, 15]], GOLD_L);
        }
    }

    function drawStars(p) {
        let s = 0x5eed1234;
        const rnd = () => {
            s = (s * 1103515245 + 12345) >>> 0;
            return s / 4294967296;
        };
        for (let i = 0; i < 90; i++) {
            const x = Math.floor(rnd() * 128), y = Math.floor(rnd() * 128);
            const v = rnd();
            const c = v < 0.6 ? H("#cfe8ff") : v < 0.85 ? H("#ffffff") : v < 0.95 ? CYAN : GOLD;
            if (v > 0.82) {
                p.rect(x, y, 1, 1, c);
                p.rect(x - 1, y, 1, 1, c);
                p.rect(x + 1, y, 1, 1, c);
                p.rect(x, y - 1, 1, 1, c);
                p.rect(x, y + 1, 1, 1, c);
            } else {
                p.rect(x, y, 1, 1, c);
                if (v < 0.12) p.rect(x + 1, y + 1, 1, 1, H("#8fb8d8"));
            }
        }
    }

    function drawSkyline(p) {
        p.rect(0, 116, 512, 12, H("#060b14"));
        let x = 0;
        let s = 0x0c17a5e;
        const rnd = () => {
            s = (s * 22695477 + 1) >>> 0;
            return s / 4294967296;
        };
        while (x < 512) {
            const w = 16 + Math.floor(rnd() * 34);
            const h = 22 + Math.floor(rnd() * 78);
            const top = 128 - h;
            p.rect(x, top, w, h, H("#080f1c"));
            p.rect(x, top, w, 2, H("#15243a"));
            p.rect(x, top + 2, 1, h - 2, H("#0d1728"));
            if (rnd() > 0.45) {
                p.rect(x + Math.floor(w / 2), top - 5, 1, 5, H("#15243a"));
                p.rect(x + Math.floor(w / 2), top - 6, 1, 1, RED);
            }
            for (let wy = top + 6; wy < 124; wy += 7) {
                for (let wx = x + 4; wx < x + w - 3; wx += 5) {
                    if (rnd() > 0.42) p.rect(wx, wy, 2, 2, rnd() > 0.75 ? GOLD : H("#3c7a9a"));
                }
            }
            x += w + 2 + Math.floor(rnd() * 5);
        }
    }

    /* ==========================================================
       16x16 icons
       ========================================================== */
    function pad16(rows) {
        return rows.map((r) => (r + "................").slice(0, 16));
    }

    const IP = {
        k: "#0b1020", w: "#f4fbff", g: "#8fa3b8", d: "#2a3a50",
        y: "#ffd166", o: "#9a6208", c: "#7ee8fa", u: "#5aa0f0",
        e: "#67e077", r: "#ff5a5a", m: "#ff8fc0", p: "#c58bff", t: "#ff9a2a",
    };

    const MATRIX_ICONS = {
        heli: [
            "................",
            "......kkkk......",
            "....kkggggkk....",
            "..kkggggggggkk..",
            "....kkggggkk....",
            "......kddk......",
            ".....kddddk.....",
            "....kdccccdk....",
            "....kdccccdk....",
            "....kddddddk....",
            ".....kddddk.....",
            "......kddk......",
            ".....kkddkk.....",
            "....kggggggk....",
            ".....kkkkkk.....",
        ],
        car: [
            "................",
            ".....kkkkkk.....",
            "....kkrrrrkk....",
            "...kkrrrrrrkk...",
            "..kkgrrrrrrgkk..",
            "..kkgrccccrgkk..",
            "..kkgrccccrgkk..",
            "..kkgrrrrrrgkk..",
            "..kkgrrrrrrgkk..",
            "..kkgrccccrgkk..",
            "..kkgrrrrrrgkk..",
            "...kkrrrrrrkk...",
            "....kkrrrrkk....",
            ".....kyyyyk.....",
            ".....kkkkkk.....",
        ],
        police: [
            "................",
            "....kkkkkkkk....",
            "...kuuuuuuuuk...",
            "..kuuuwwwwuuuk..",
            "..kuuuwwwwuuuk..",
            "..kuuuuwwuuuuk..",
            "..kuuuuwwuuuuk..",
            "..kuuuwwwwuuuk..",
            "..kuuwwwwwwuuk..",
            "..kuuuwwwwuuuk..",
            "..kuuuuwwuuuuk..",
            "...kuuuuuuuuk...",
            "....kuuuuuuk....",
            ".....kuuuuk.....",
            "......kuuk......",
            ".......kk.......",
        ],
        thief: [
            "................",
            "....kkkkkkkk....",
            "...kddddddddk...",
            "..kddddddddddk..",
            "..kddddddddddk..",
            "..kwwkddddkwwk..",
            "..kwkkddddkkwk..",
            "..kddddddddddk..",
            "..kddkkkkkkddk..",
            "..kddddddddddk..",
            "...kddddddddk...",
            "....kkkkkkkk....",
            "................",
        ],
        map: [
            "................",
            "................",
            "..kkkkkkkkkkkk..",
            "..kuuuukyggggk..",
            "..kuuuukgygggk..",
            "..kuuuukgggggk..",
            "..kkkkkkkkkkkk..",
            "..kggggkywwwwk..",
            "..kggggkwwwwwk..",
            "..kggggkwwwwwk..",
            "..kkkkkkkkkkkk..",
            "................",
        ],
        log: [
            "................",
            ".....kkkk.......",
            "....kwwwwk......",
            "..kkkkkkkkkkk...",
            "..kwwwwwwwwwk...",
            "..kwkkkkkkkwk...",
            "..kwkwwwwkkwk...",
            "..kwkkkkkkkwk...",
            "..kwkwwwwwkwk...",
            "..kwkkkkkkkwk...",
            "..kwkwwwwkkwk...",
            "..kwkkkkkkkwk...",
            "..kwwwwwwwwwk...",
            "..kkkkkkkkkkk...",
        ],
        pointer: [
            "................",
            "....kk..........",
            "....kwk.........",
            "....kwk.........",
            "....kwkkkk......",
            "....kwwwwwk.....",
            "....kwwwwwwk....",
            "....kwwwwwwwk...",
            "....kwwwwwwwk...",
            "....kwwwwwwwk...",
            "....kwwwwwwk....",
            ".....kwwwwk.....",
            ".....kwwwwk.....",
            "......kkkk......",
        ],
    };

    function matrixIcon(name) {
        return sprite(16, 16, (p) => p.sprite(pad16(MATRIX_ICONS[name]), IP, 0, 0));
    }

    function iconSearch() {
        return sprite(16, 16, (p) => {
            p.ring(6.5, 6.5, 5.2, 2.0, INK);
            p.ring(6.5, 6.5, 4.2, 1.2, CYAN);
            p.rect(4, 4, 2, 2, H("#e6fbff"));
            p.line(9.5, 10.5, 14, 15, INK);
            p.line(9.5, 10, 14, 14.5, GOLD);
            p.rect(13, 14, 2, 1, GOLD_D);
        });
    }

    function iconBlind() {
        return sprite(16, 16, (p) => {
            p.ellipse(8, 8, 7, 5, INK);
            p.ellipse(8, 8, 6, 4, WHITE_C);
            p.ellipse(8, 8, 3, 3, BLUE);
            p.ellipse(8, 8, 1.5, 1.5, INK);
            p.rect(7, 7, 1, 1, WHITE_C);
            p.line(2, 14, 14, 2, INK);
            p.line(3, 14, 15, 2, RED);
            p.line(2, 13, 13, 1, RED);
        });
    }

    function iconRotate(gold) {
        return sprite(16, 16, (p) => {
            p.ring(8, 8, 6.2, 2.0, INK);
            p.arc(8, 8, 5.2, 1.4, -0.35, Math.PI * 1.35, gold ? GOLD : CYAN);
            p.tri(10, 0, 15, 3, 11, 7, gold ? GOLD : CYAN);
            p.tri(11, 1, 14, 3, 11, 5, gold ? GOLD_L : H("#e6fbff"));
            p.rect(7, 7, 2, 2, gold ? GOLD_D : CYAN_D);
        });
    }

    function iconPlay() {
        return sprite(16, 16, (p) => {
            p.poly([[3, 1], [3, 15], [15, 8]], INK);
            p.poly([[5, 4], [5, 12], [12, 8]], GOLD);
            p.poly([[5, 4], [5, 8], [9, 8]], GOLD_L);
        });
    }

    function iconHome() {
        return sprite(16, 16, (p) => {
            p.poly([[8, 0], [16, 8], [13, 8], [13, 16], [3, 16], [3, 8], [0, 8]], INK);
            p.poly([[8, 2], [14, 8], [12, 8], [12, 14], [4, 14], [4, 8], [2, 8]], GOLD_D);
            p.rect(6, 9, 4, 5, H("#0b1020"));
            p.rect(7, 10, 2, 4, GOLD);
            p.rect(4, 8, 2, 1, GOLD);
            p.rect(10, 8, 2, 1, GOLD);
        });
    }

    function iconClose() {
        return sprite(16, 16, (p) => {
            p.line(3, 3, 13, 13, INK);
            p.line(4, 3, 14, 13, INK);
            p.line(13, 3, 3, 13, INK);
            p.line(12, 3, 2, 13, INK);
            p.line(4, 4, 12, 12, RED);
            p.line(12, 4, 4, 12, RED);
        });
    }

    function iconUsers(n) {
        return sprite(16, 16, (p) => {
            const people = n === 2
                ? [[5, 4, CYAN], [11, 5, GOLD]]
                : [[3, 5, CYAN], [8, 3, GOLD], [13, 5, PURPLE]];
            for (const [x, y, c] of people) {
                p.rect(x - 2, y, 4, 1, INK);
                p.rect(x - 1, y + 1, 2, 1, INK);
                p.rect(x - 2, y + 2, 2, 2, c);
                p.rect(x, y + 2, 2, 2, c);
            }
            for (const [x, y, c] of people) {
                p.rect(x - 3, y + 5, 6, 6, INK);
                p.rect(x - 2, y + 6, 4, 4, c);
                p.rect(x - 1, y + 6, 2, 1, WHITE_C);
            }
        });
    }

    function iconRobot() {
        return sprite(16, 16, (p) => {
            p.rect(7, 0, 2, 4, INK);
            p.rect(8, 0, 1, 3, CYAN);
            p.rect(8, 0, 1, 1, WHITE_C);
            p.rect(2, 4, 12, 10, INK);
            p.rect(3, 5, 10, 8, H("#5a6a7a"));
            p.rect(4, 6, 8, 3, H("#1a2a3a"));
            p.rect(5, 7, 2, 2, CYAN);
            p.rect(9, 7, 2, 2, CYAN);
            p.rect(5, 7, 1, 1, WHITE_C);
            p.rect(9, 7, 1, 1, WHITE_C);
            p.rect(5, 11, 6, 1, H("#2a3a4a"));
            p.rect(3, 3, 2, 2, GOLD);
            p.rect(11, 3, 2, 2, GOLD);
            p.rect(5, 14, 2, 2, INK);
            p.rect(9, 14, 2, 2, INK);
        });
    }

    function iconCheck() {
        return sprite(16, 16, (p) => {
            p.polyline([[2, 8], [6, 13], [14, 2]], INK, 1);
            p.line(2, 8, 6, 13, INK);
            p.line(3, 8, 6, 12, INK);
            p.line(6, 13, 14, 2, INK);
            p.line(6, 12, 13, 2, INK);
            p.line(3, 8, 6, 11, GOLD);
            p.line(6, 11, 13, 3, GOLD);
            p.line(4, 8, 6, 10, GOLD_L);
        });
    }

    function iconWarn() {
        return sprite(16, 16, (p) => {
            p.poly([[8, 0], [16, 15], [0, 15]], INK);
            p.poly([[8, 2], [14, 14], [2, 14]], GOLD);
            p.poly([[8, 3], [13, 13], [3, 13]], GOLD_D);
            p.rect(7, 5, 2, 5, WHITE_C);
            p.rect(7, 11, 2, 2, WHITE_C);
        });
    }

    function iconRoute() {
        return sprite(16, 16, (p) => {
            p.polyline([[3, 13], [3, 7], [8, 7], [8, 11], [13, 11], [13, 4]], INK);
            p.polyline([[3, 13], [3, 7], [8, 7], [8, 11], [13, 11], [13, 4]], GOLD);
            p.rect(1, 12, 4, 3, INK);
            p.rect(2, 13, 2, 1, CYAN);
            p.rect(11, 1, 4, 4, INK);
            p.rect(12, 2, 2, 2, RED);
            p.rect(6, 5, 4, 3, INK);
            p.rect(7, 6, 2, 1, CYAN);
        });
    }

    function iconTrophy() {
        return sprite(16, 16, (p) => {
            p.rect(4, 1, 8, 8, INK);
            p.rect(5, 2, 6, 6, GOLD);
            p.rect(5, 2, 6, 1, GOLD_L);
            p.rect(1, 2, 3, 5, INK);
            p.rect(2, 3, 1, 3, GOLD_D);
            p.rect(12, 2, 3, 5, INK);
            p.rect(13, 3, 1, 3, GOLD_D);
            p.rect(7, 8, 2, 3, GOLD_D);
            p.rect(4, 11, 8, 3, INK);
            p.rect(5, 12, 6, 1, GOLD);
            p.rect(6, 14, 4, 1, GOLD_D);
        });
    }

    /* ==========================================================
       Build & inject the CSS variables
       ========================================================== */
    function buildAssets() {
        setImage("frame-panel", panelFrame(FRAMES.panel));
        setImage("frame-modal", panelFrame(FRAMES.modal));
        setImage("frame-btn", buttonFrame(FRAMES.btn));
        setImage("frame-gold", buttonFrame(FRAMES.gold));
        setImage("frame-green", buttonFrame(FRAMES.green));
        setImage("frame-red", buttonFrame(FRAMES.red));
        setImage("frame-blue", buttonFrame(FRAMES.blue));
        setImage("frame-purple", buttonFrame(FRAMES.purple));

        setImage("logo-header", logoHeader());
        setImage("logo-splash", logoSplash());

        for (let i = 0; i < BUILDING_PALETTES.length; i++) {
            setImage("building-" + i, sprite(40, 40, (p) => drawBuilding(p, i)));
        }
        setImage("car", sprite(32, 32, drawCar));
        for (const id of Object.keys(HELI_PALETTES)) {
            setImage("heli-" + id + "-0", sprite(30, 30, (p) => drawHeli(p, HELI_PALETTES[id], 0)));
            setImage("heli-" + id + "-1", sprite(30, 30, (p) => drawHeli(p, HELI_PALETTES[id], 1)));
        }

        setImage("clue-yellow", sprite(16, 16, (p) => drawClue(p, { base: "#ffd54f", light: "#fff8c0", dark: "#8a6200" })));
        setImage("clue-red", sprite(16, 16, (p) => drawClue(p, { base: "#ef5350", light: "#ffb0a0", dark: "#6a0a0a" })));
        setImage("clue-blue", sprite(16, 16, (p) => drawClue(p, { base: "#42a5f5", light: "#b8e0ff", dark: "#0a2a5a" })));

        setImage("searchlight", sprite(64, 64, drawSearchlight));
        setImage("asphalt", sprite(32, 32, drawAsphalt));
        setImage("intersection", sprite(32, 32, (p) => drawIntersection(p, false)));
        setImage("intersection-target", sprite(32, 32, (p) => drawIntersection(p, true)));
        setImage("stars", sprite(128, 128, drawStars));
        setImage("skyline", sprite(512, 128, drawSkyline));
        setImage("dither", sprite(4, 4, (p) => {
            p.px(0, 0, H("#ffffff"));
            p.px(2, 2, H("#ffffff"));
        }));

        const icons = {
            heli: () => matrixIcon("heli"),
            car: () => matrixIcon("car"),
            police: () => matrixIcon("police"),
            thief: () => matrixIcon("thief"),
            map: () => matrixIcon("map"),
            log: () => matrixIcon("log"),
            pointer: () => matrixIcon("pointer"),
            search: iconSearch,
            blind: iconBlind,
            rotate: () => iconRotate(false),
            replay: () => iconRotate(true),
            play: iconPlay,
            home: iconHome,
            close: iconClose,
            users2: () => iconUsers(2),
            users3: () => iconUsers(3),
            robot: iconRobot,
            check: iconCheck,
            warn: iconWarn,
            route: iconRoute,
            trophy: iconTrophy,
        };
        for (const [name, make] of Object.entries(icons)) {
            setImage("ico-" + name, make());
        }
        setImage("ico-clue-yellow", sprite(16, 16, (p) => drawClue(p, { base: "#ffd54f", light: "#fff8c0", dark: "#8a6200" })));
        setImage("ico-clue-red", sprite(16, 16, (p) => drawClue(p, { base: "#ef5350", light: "#ffb0a0", dark: "#6a0a0a" })));
        setImage("ico-clue-blue", sprite(16, 16, (p) => drawClue(p, { base: "#42a5f5", light: "#b8e0ff", dark: "#0a2a5a" })));

        // The same heli sprite is handy as a favicon.
        try {
            const link = document.querySelector('link[rel="icon"]');
            if (link) link.href = "data:image/png;base64," + sprite(32, 32, (p) => drawHeli(p, HELI_PALETTES.green, 0)).split(",")[1];
        } catch (e) { /* favicon is optional */ }
    }

    /* ==========================================================
       Full-screen pixel VFX canvas
       ========================================================== */
    const FX = (function () {
        let canvas = null;
        let ctx = null;
        let frame = null;
        let image = null;
        let raf = null;
        let last = 0;
        let scale = 2;
        let effects = [];
        const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function ensureCanvas() {
            if (canvas) return true;
            canvas = document.createElement("canvas");
            canvas.id = "pixelfx-ui";
            canvas.setAttribute("aria-hidden", "true");
            document.body.appendChild(canvas);
            ctx = canvas.getContext("2d", { alpha: true });
            if (!ctx) return false;
            resize();
            return true;
        }

        function resize() {
            if (!canvas) return;
            scale = Math.max(1, Math.min(3, Math.round(window.innerWidth / 500)));
            const w = Math.max(160, Math.ceil(window.innerWidth / scale));
            const h = Math.max(120, Math.ceil(window.innerHeight / scale));
            canvas.width = w;
            canvas.height = h;
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            ctx = canvas.getContext("2d", { alpha: true });
            ctx.imageSmoothingEnabled = false;
            frame = createFrame(w, h);
            image = new ImageData(w, h);
            effects = [];
        }

        function play(mod, opts, durationPad) {
            if (reduced()) return;
            if (!ensureCanvas()) return;
            if (!frame) resize();
            try {
                effects.push({
                    fx: createFx(mod, opts),
                    pad: durationPad || 0,
                });
            } catch (e) {
                console.warn("pixelfx: could not start effect", e);
            }
            if (!raf) {
                last = 0;
                raf = requestAnimationFrame(tick);
            }
        }

        function tick(ts) {
            raf = null;
            if (!ctx || !frame) return;
            const dt = last ? Math.min(0.06, (ts - last) / 1000) : 0.016;
            last = ts;
            clearFrame(frame);
            let alive = false;
            for (const item of effects) {
                item.fx.update(dt);
                if (!item.fx.done()) alive = true;
                item.fx.draw(frame);
            }
            composite(frame, image.data, null);
            ctx.putImageData(image, 0, 0);
            effects = effects.filter((item) => !item.fx.done());
            if (alive || effects.length) raf = requestAnimationFrame(tick);
            else last = 0;
        }

        function clear() {
            effects = [];
            if (ctx && frame) {
                clearFrame(frame);
                composite(frame, image.data, null);
                ctx.putImageData(image, 0, 0);
            }
        }

        window.addEventListener("resize", () => {
            if (effects.length) clear();
            if (canvas) resize();
        });
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) clear();
        });

        return { play, clear, ensureCanvas, resize };
    })();

    /* ==========================================================
       Effects triggered by app.js
       ========================================================== */
    const PALETTES = {
        gold: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"],
        yellow: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"],
        red: ["#1a0508", "#4a0b12", "#8c1420", "#d42a2e", "#ff5a4a", "#ff9a86", "#ffd8cc", "#ffffff"],
        blue: ["#081830", "#0e2e5a", "#14508c", "#1c76bc", "#36a2e0", "#78ccf4", "#c4ecff", "#ffffff"],
        stone: ["#0e0e12", "#1c1c24", "#2c2c38", "#42424f", "#5c5c6b", "#7d7d8c", "#a4a4b2", "#ffffff"],
        neon: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
        candy: ["#ff4a5a", "#ff9a2a", "#ffe03c", "#5ad84a", "#3cc8ff", "#7a6cff", "#f53cd1", "#ffffff"],
    };

    function pxPoint(clientX, clientY) {
        const s = Math.max(1, Math.min(3, Math.round(window.innerWidth / 500)));
        return { x: Math.round(clientX / s), y: Math.round(clientY / s) };
    }

    function boardPoint(x, y, kind) {
        const sel = kind === "intersection"
            ? '.intersection[data-ix="' + x + '"][data-iy="' + y + '"]'
            : '.building[data-bx="' + x + '"][data-by="' + y + '"]';
        const el = document.querySelector(sel);
        if (!el) return pxPoint(window.innerWidth / 2, window.innerHeight / 2);
        const r = el.getBoundingClientRect();
        return pxPoint(r.left + r.width / 2, r.top + r.height / 2);
    }

    function boardCenter() {
        const el = document.querySelector("#board-container");
        if (!el) return pxPoint(window.innerWidth / 2, window.innerHeight / 2);
        const r = el.getBoundingClientRect();
        return pxPoint(r.left + r.width / 2, r.top + r.height / 2);
    }

    function topCenter() {
        return pxPoint(window.innerWidth / 2, Math.min(window.innerHeight * 0.16, 110));
    }

    function shakeBoard() {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const el = document.querySelector("#board-container");
        if (!el) return;
        el.classList.remove("px-shake");
        void el.offsetWidth;
        el.classList.add("px-shake");
        setTimeout(() => el.classList.remove("px-shake"), 340);
    }

    function onFx(e) {
        const d = (e && e.detail) || {};
        const type = d.type;
        if (!type) return;

        if (type === "round-start") {
            // ソロプレイはCPUの自動進行と重なるため、対人戦だけで開始演出を出す
            if (d.mode === "cpu" || d.mode === "cpu_police") return;
            const p = boardCenter();
            FX.ensureCanvas();
            FX.play(countdownFx, {
                x: p.x, y: p.y - 6,
                from: 3,
                word: "GO!",
                light: 1.2,
            });
            return;
        }

        if (type === "empty") {
            const p = boardPoint(d.x, d.y);
            FX.play(damageFx, {
                x: p.x, y: p.y + 12,
                text: "MISS!",
                palette: PALETTES.stone,
                seed: (d.x || 0) * 17 + (d.y || 0) * 31 + 3,
            });
            FX.play(hitFx, {
                x: p.x, y: p.y + 8,
                palette: PALETTES.blue,
                height: 12,
                aim: 0.2,
                light: 0.8,
            });
            return;
        }

        if (type === "clue") {
            const clue = d.clue === "RED" ? "red" : d.clue === "BLUE" ? "blue" : "yellow";
            const p = boardPoint(d.x, d.y);
            FX.play(collectFx, {
                x: p.x, y: p.y + 14,
                palette: PALETTES[clue],
                seed: (d.x || 0) * 11 + (d.y || 0) * 23 + 5,
            });
            FX.play(hitFx, {
                x: p.x, y: p.y + 6,
                palette: PALETTES[clue],
                height: 10,
                aim: 0.4,
                light: 1.1,
            });
            const t = topCenter();
            FX.play(achievementFx, {
                x: t.x, y: t.y,
                title: "CLUE FOUND",
                text: "ROUND " + (d.round || ""),
                palette: PALETTES[clue],
                ribbon: ["#0c1430", "#1f3a7a", "#2f66c4", "#5aa0f0", "#a6d4ff"],
                seed: 12,
                light: 1.2,
            });
            return;
        }

        if (type === "found") {
            const p = boardPoint(d.x, d.y);
            shakeBoard();
            FX.play(hitFx, {
                x: p.x, y: p.y + 8,
                palette: PALETTES.gold,
                height: 18,
                aim: 0.1,
                light: 1.4,
            });
            const c = boardCenter();
            FX.play(questFx, {
                x: c.x, y: c.y,
                text: "TARGET FOUND",
                palette: PALETTES.gold,
                ribbon: ["#1e0608", "#45101a", "#7a1a26", "#ad2632", "#d8433f", "#f27a5e", "#ffb79a"],
                seed: 18,
                light: 1.3,
            });
            return;
        }

        if (type === "gameover") {
            // 発見演出と勝利演出が重ならないよう、先に走っている演出を消す
            FX.clear();
            const c = boardCenter();
            shakeBoard();
            const police = d.winner === "POLICE";
            FX.play(questFx, {
                x: c.x, y: c.y,
                text: police ? "POLICE WIN" : "THIEF WIN",
                palette: police ? PALETTES.gold : PALETTES.neon,
                ribbon: police
                    ? ["#0c1430", "#1f3a7a", "#2f66c4", "#5aa0f0", "#a6d4ff", "#d8f0ff", "#ffffff"]
                    : ["#1e0608", "#45101a", "#7a1a26", "#ad2632", "#d8433f", "#f27a5e", "#ffb79a"],
                seed: 21,
                light: 1.4,
            });
            FX.play(confettiFx, {
                x: Math.round(window.innerWidth / (2 * Math.max(1, Math.min(3, Math.round(window.innerWidth / 500))))),
                y: Math.round(window.innerHeight / Math.max(1, Math.min(3, Math.round(window.innerWidth / 500)))) - 4,
                palette: police ? PALETTES.candy : PALETTES.neon,
                seed: 31,
                light: 1.1,
            });
            return;
        }

        if (type === "heli-move" || type === "heli-place") {
            const p = boardPoint(d.x, d.y, "intersection");
            FX.play(collectFx, {
                x: p.x, y: p.y + 10,
                palette: type === "heli-move" ? PALETTES.blue : PALETTES.stone,
                seed: 7,
                light: 0.9,
            });
        }
    }

    /* ==========================================================
       Boot
       ========================================================== */
    function boot() {
        try {
            buildAssets();
            document.body.classList.add("px-ready");
            FX.ensureCanvas();
            window.addEventListener("vspolice:fx", onFx);
            // Load the dot font before the first paint of the game UI, but
            // never block the app if the font is unavailable.
            if (document.fonts && document.fonts.load) {
                document.fonts.load('16px "DotGothic16"').catch(() => {});
            }
        } catch (e) {
            console.warn("pixelui: failed to build the pixel skin", e);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();

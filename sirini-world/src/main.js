/* ————————————————————————————————————————————————
   SIRINI · The Promise
   One continuous 3D world — vanilla Three.js r147 (inlined UMD).
   Structure: data → helpers → rig → world builders → ui → loop.
   Adapted from the SFJ "Golden Thread" engine; every photograph is a
   real product photo from sirinijewellery.com.
   ———————————————————————————————————————————————— */
(() => {
'use strict';

/* ————— 1 · Content (from the Sirini storefront + catalogue) ————— */

const SHOP = 'https://sirinijewellery.com/shop';

/* The Trousseau — twelve real pieces, dressed head to toe, bride then groom. */
const GALLERY = [
  { slug: 'maang-tikka',        caption: 'Floral Kundan Maang Tikka',     material: 'Maang Tikka · ₹1,800',  site: SHOP + '/floral-kundan-maang-tikka-with-ruby-bead-hanging-antique-gold-finish-10tk790' },
  { slug: 'chandbali',          caption: 'Kundan Chandbali Earrings',     material: 'Earrings · ₹1,350',     site: SHOP + '/navratri-kundan-chandbali-earrings-07er872-ruby' },
  { slug: 'meenakari-jhumki',   caption: 'Meenakari Jhumkis',             material: 'Earrings · ₹750',       site: SHOP + '/diwali-meenakari-jhumkis-10er926' },
  { slug: 'bridal-kundan-set',  caption: 'Bridal Kundan Choker Set',      material: 'Necklace Set · ₹9,000', site: SHOP + '/bridal-kundan-choker-set-01ns705' },
  { slug: 'royal-heritage-set', caption: 'Royal Heritage Necklace Set',   material: 'Necklace Set · ₹6,400', site: SHOP + '/royal-heritage-necklace-set' },
  { slug: 'kundan-haar',        caption: 'Shimmering Kundan Haar Set',    material: 'Bridal Haar · ₹12,000', site: SHOP + '/bridal-kundan-haar-set-10ns714' },
  { slug: 'dulhan-long-haar',   caption: 'Dulhan Antique Kundan Long Haar', material: 'Long Set · ₹12,050', site: SHOP + '/long-set-30lg203' },
  { slug: 'kundan-bangles',     caption: 'Festive Kundan Bangles',        material: 'Bangles · ₹4,500',      site: SHOP + '/festive-kundan-bangles-10bg705' },
  { slug: 'peacock-kada',       caption: 'Peacock Charm Statement Kada',  material: 'Kada · ₹2,100',         site: SHOP + '/peacock-charm-statement-kada' },
  { slug: 'kundan-ring',        caption: 'Festive Kundan Ring',           material: 'Finger Ring · ₹450',    site: SHOP + '/festive-kundan-ring-07fr252' },
  { slug: 'kundan-payal',       caption: 'Festive Kundan Payal',          material: 'Payal · ₹4,750',        site: SHOP + '/festive-kundan-payal-01pl256' },
  { slug: 'groom-mala',         caption: 'Classic Pearl Groom Mala',      material: 'For the Groom · ₹5,300', site: SHOP + '/classic-pearl-groom-mala-10lg356' },
];

/* Campaign + workshop photography walks with the visitor between chambers. */
const EDITORIAL_ITEMS = [
  { slug: 'editorial-hero',   caption: 'The Sirini Bride',              material: 'Heritage Campaign' },
  { slug: 'white-statement',  caption: 'Elegant White Statement Set',   material: 'Necklace Set · ₹4,500',  site: SHOP + '/elegant-white-statement-set' },
  { slug: 'artisan-craft',    caption: 'Hand-Set, Stone by Stone',      material: 'Inside the Mumbai Atelier' },
  { slug: 'polki-set',        caption: 'Navratri Polki Necklace Set',   material: 'Necklace Set · ₹4,200',  site: SHOP + '/navratri-polki-necklace-set-01ns708' },
  { slug: 'green-long-haar',  caption: 'Bridal Kundan Long Haar',       material: 'Long Set · ₹13,550',     site: SHOP + '/long-set-10lg277-green-10lg277' },
  { slug: 'artisan-workshop', caption: 'The Family Workshop',           material: 'Where Every Piece Begins' },
];

/* Every framed photograph in the world — gallery first, editorials after.
   One shared index space drives hover, click, and the lightbox. */
const PIECES = [...GALLERY, ...EDITORIAL_ITEMS];

const CATEGORIES = [
  ['Necklace Sets', 'Complete sets — choker, earrings and tikka, matched and ready for the occasion.'],
  ['Chokers & Short Necklaces', 'Statement collars in kundan, polki and antique-gold finishes.'],
  ['Long Sets & Malas', 'Dulhan haars and layered malas for the grand bridal look.'],
  ['Earrings', 'Jhumkis, chandbalis, danglers and studs — festive through everyday.'],
  ['Bangles & Kadas', 'Kundan choodiyan, bracelets, pair bangles and statement kadas.'],
  ['Maang Tikka & Passa', 'Forehead ornaments — the first piece a bride puts on.'],
  ['Sheeshphool & Kalira', 'Hair ornaments and kaliras for the bridal hairstyle.'],
  ['Nath', 'Classic nose rings in every size, with and without the chain.'],
  ['Finger Rings', 'Kundan cocktail rings and adjustable everyday designs.'],
  ['Payal & Anklets', 'Kundan payals and ghungroo anklets that announce her arrival.'],
  ['Mangalsutra & Pendant Sets', 'Daily-wear mangalsutras and pendant sets with matching earrings.'],
  ['Groom Accessories', 'Pearl malas and jotas — so he matches her grandeur.'],
];

const PROMISES = [
  ['Crafted Like Fine Gold', 'Fine brass, 22kt gold plating, hand-set kundan and hand-painted meenakari — the same artistry as fine jewellery.'],
  ['Bridal-First Design', 'Bold, traditional designs inspired by India’s heritage — made for the woman at the heart of the celebration.'],
  ['Honest Prices', 'Manufacturer roots, no middlemen — the look of gold without the weight of its price.'],
  ['Free Pan-India Shipping', 'Free delivery on every order in 3–7 days, tracked on WhatsApp. Cash on delivery available.'],
  ['7-Day Easy Exchange', 'Hassle-free exchange for defects or wrong items — message us a photo and we make it right.'],
  ['A Family Business', 'Founded by Nishit Savla in 2017 — every piece passes through the family’s hands before it ships.'],
];

const STATS = [
  ['Since 2017', 'MUMBAI · FAMILY-FOUNDED'],
  ['300+', 'DESIGNS · LIVE CATALOGUE'],
  ['22KT', 'GOLD PLATING · FINE BRASS'],
  ['Pan-India', 'FREE SHIPPING · COD'],
];

/* Zones defined by world-space z ranges; converted to scroll t after the
   camera curve is built, so scroll, world and DOM stay in lockstep. */
const ZONE_Z = [
  ['threshold', 22,   -6,  'Beginning'],
  ['prologue',  -6,   -26, null],
  ['house',     -26,  -56, 'Our Story'],
  ['glance',    -56,  -94, 'At a Glance'],
  ['atelier',   -94,  -140,'The Craft'],
  ['catalogue', -140, -180,'Collections'],
  ['gallery',   -180, -310,'The Trousseau'],
  ['journey',   -310, -342,'To Your Door'],
  ['vows',      -342, -374,'Six Promises'],
  ['ascent',    -374, -428, null],
  ['ring',      -428, -447,'Say Yes'],
];

/* ————— 2 · Small helpers ————— */

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const $ = (sel) => document.querySelector(sel);
const veil = $('#veil');
const canvas = $('#scene');
const scroller = $('#scroller');
const hint = $('#hint');
const progressBar = $('#progress i');
const tooltip = $('#tooltip');

const compactQuery = matchMedia('(max-width: 860px)');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const coarseQuery = matchMedia('(pointer: coarse)');
let compact = compactQuery.matches;
const reduced = reducedQuery.matches;
const coarse = coarseQuery.matches;

/* Veil logo — the real storefront wordmark, inlined. */
(() => {
  const img = $('#veilLogo');
  const logo = window.SIRINI_ASSETS && window.SIRINI_ASSETS.logo;
  if (img && logo) {
    img.addEventListener('error', () => veil.classList.add('no-logo'));
    img.src = logo;
  } else if (veil) {
    veil.classList.add('no-logo');
  }
})();

/* ————— 3 · Editorial fallback (also feeds the a11y lists) ————— */

function fillLists() {
  const cat = $('#catalogueList');
  if (cat) {
    cat.innerHTML = CATEGORIES.map(([n, d]) =>
      `<li><span class="fl-name">${n}</span><span class="fl-desc">${d}</span></li>`).join('');
  }
  const vow = $('#vowsList');
  if (vow) {
    vow.innerHTML = PROMISES.map(([n, d]) =>
      `<li><span class="fl-name">${n}</span><span class="fl-desc">${d}</span></li>`).join('');
  }
}

function enterFallback(reason) {
  console.warn('[SIRINI] falling back to editorial mode:', reason);
  document.body.classList.add('no3d');
  fillLists();
  const extras = $('#fallbackExtras');
  if (extras) {
    extras.hidden = false;
    const logo = $('#fbLogo');
    if (logo && window.SIRINI_ASSETS) logo.src = window.SIRINI_ASSETS.logo;
    const grid = $('#fbGrid');
    if (grid && window.SIRINI_ASSETS) {
      grid.innerHTML = PIECES.map((g) => {
        const fig = `<figure><img loading="lazy" src="${window.SIRINI_ASSETS[g.slug]}" alt="${g.caption}"><figcaption>${g.caption}${g.material ? ' · ' + g.material : ''}</figcaption></figure>`;
        return g.site ? `<a href="${g.site}" target="_blank" rel="noopener">${fig}</a>` : fig;
      }).join('');
    }
  }
  if (veil) veil.classList.add('gone');
}

/* ————— 4 · Boot guards ————— */

if (!window.THREE || !window.SIRINI_ASSETS) { enterFallback('runtime payload missing'); return; }
const THREE = window.THREE;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (err) { enterFallback('WebGL unavailable'); return; }

const isWebGL2 = renderer.capabilities.isWebGL2;
const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.35 : 1.8));

/* GPU context loss: pause and give the driver a chance to hand the context
   back (tab switches, phones under memory pressure) before abandoning the 3D
   world for the editorial fallback. preventDefault() is what makes a restore
   possible at all. */
let restoreTimer = null;
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  running = false;
  restoreTimer = setTimeout(() => enterFallback('graphics context lost'), 4000);
});
canvas.addEventListener('webglcontextrestored', () => {
  if (restoreTimer) { clearTimeout(restoreTimer); restoreTimer = null; }
  if (document.body.classList.contains('no3d')) return; // already fell back
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
});

/* ————— 5 · Palette, scene, camera ————— */

/* Velvet vault: maroon darkness, gold jewellery light, rose-gold accents. */
const GOLD = 0xd9b263, GOLD_BRIGHT = 0xf0ce8c, ROSE = 0xb76e79, ROSE_BRIGHT = 0xe8a0a8, FOGCOL = 0x170b0f;

const scene = new THREE.Scene();
scene.background = new THREE.Color(FOGCOL);
scene.fog = new THREE.FogExp2(FOGCOL, 0.021);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 320);

/* Environment reflections: procedural warm "boudoir studio" equirect —
   maroon walls, champagne softboxes, one blush key light. */
function buildEnvironment() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#2b1016');
  grad.addColorStop(0.55, '#150a0d');
  grad.addColorStop(1, '#070203');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 512);
  const soft = (x, y, r, col, a) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col.replace('A', a));
    rg.addColorStop(1, col.replace('A', '0'));
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  soft(200, 150, 190, 'rgba(255,222,178,A)', '0.95');
  soft(700, 120, 240, 'rgba(255,238,216,A)', '0.8');
  soft(500, 320, 300, 'rgba(216,148,124,A)', '0.35');
  soft(900, 260, 150, 'rgba(255,196,170,A)', '0.5');
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose(); pmrem.dispose();
  return env;
}
scene.environment = buildEnvironment();

/* ————— 6 · Camera path + arc-length z lookup ————— */

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const CAM_PTS = [
  V3(0, 2.2, 22), V3(0, 2.2, 8), V3(0, 2.2, -8), V3(2.5, 2.3, -26), V3(5.5, 2.5, -44),
  V3(-1, 2.6, -62), V3(-6.5, 2.5, -80), V3(-2, 2.7, -100), V3(0, 2.8, -118), V3(3.5, 3.0, -136),
  V3(6.5, 3.2, -154), V3(2, 3.0, -172), V3(0, 2.6, -190), V3(-4.5, 2.55, -206), V3(0, 2.5, -222),
  V3(4.5, 2.5, -238), V3(0, 2.5, -254), V3(-4.5, 2.5, -270), V3(0, 2.5, -286), V3(4.5, 2.55, -302),
  V3(-2, 3.0, -322), V3(-4, 3.4, -338), V3(0, 3.2, -354), V3(0, 3.2, -368), V3(1.5, 5.0, -384),
  V3(2.5, 10.0, -402), V3(0.5, 15.5, -420), V3(0, 16.5, -438), V3(0, 16.5, -447),
];
const camPath = new THREE.CatmullRomCurve3(CAM_PTS, false, 'catmullrom', 0.5);

/* LUT: t → point (z strictly decreases along the path, so z is invertible). */
const LUT_N = 2400;
const lutPts = [];
for (let i = 0; i <= LUT_N; i++) lutPts.push(camPath.getPointAt(i / LUT_N));
function tOfZ(z) {
  let lo = 0, hi = LUT_N;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (lutPts[mid].z > z) lo = mid; else hi = mid;
  }
  const a = lutPts[lo].z, b = lutPts[hi].z;
  const f = a === b ? 0 : (a - z) / (a - b);
  return clamp((lo + f) / LUT_N, 0, 1);
}
const pointAtZ = (z) => camPath.getPointAt(tOfZ(z));

/* Zone table in t-space. */
const ZONES = ZONE_Z.map(([id, z0, z1, label]) => ({ id, z0, z1, label, t0: tOfZ(z0), t1: tOfZ(z1) }));
const zoneById = Object.fromEntries(ZONES.map((z) => [z.id, z]));
zoneById.threshold.t0 = 0;
zoneById.ring.t1 = 1;

/* ————— 7 · Shared textures & materials ————— */

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = Math.min(8, maxAniso);
  if (!isWebGL2) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}

const glowTex = canvasTexture(256, 256, (g) => {
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, 'rgba(255,236,200,1)');
  rg.addColorStop(0.28, 'rgba(255,220,160,0.55)');
  rg.addColorStop(0.65, 'rgba(230,180,110,0.14)');
  rg.addColorStop(1, 'rgba(210,160,90,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 256);
});

function makeGlow(scale, opacity, color = 0xffe0b0) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  m.scale.setScalar(scale);
  m.renderOrder = 20;
  return m;
}

const matGold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.3, envMapIntensity: 1.25 });
const matGoldBright = new THREE.MeshStandardMaterial({ color: GOLD_BRIGHT, metalness: 1, roughness: 0.18, envMapIntensity: 1.5, emissive: 0x2a1c08, emissiveIntensity: 0.4 });
const matRose = new THREE.MeshStandardMaterial({ color: ROSE, metalness: 1, roughness: 0.3, envMapIntensity: 1.3 });
const matRoseBright = new THREE.MeshStandardMaterial({ color: ROSE_BRIGHT, metalness: 1, roughness: 0.2, envMapIntensity: 1.5, emissive: 0x2a0e12, emissiveIntensity: 0.4 });
/* Velvet: the jewellery-box material — matte, deep maroon. */
const matVelvet = new THREE.MeshStandardMaterial({ color: 0x2a1218, metalness: 0.08, roughness: 0.86, envMapIntensity: 0.55 });
const matInk = new THREE.MeshStandardMaterial({ color: 0x160b0f, metalness: 0.6, roughness: 0.38, envMapIntensity: 0.7 });

const FONT_SERIF = '"EB Garamond", "Palatino Linotype", Georgia, serif';
const FONT_SANS = '"DM Sans", "Segoe UI", sans-serif';

/* Engraved plaque texture: velvet ground, hairline border, gold serif. */
function plaqueTexture({ w = 1024, h = 448, title, body, titleSize = 92, bodySize = 40, pad = 70, align = 'left' }) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = '#150a0d';
    g.fillRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(255,205,180,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.14)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(217,178,99,0.4)';
    g.lineWidth = 2;
    g.strokeRect(16, 16, w - 32, h - 32);
    const cx = align === 'center' ? w / 2 : pad;
    g.textAlign = align === 'center' ? 'center' : 'left';
    g.fillStyle = '#eac585';
    g.font = `600 ${titleSize}px ${FONT_SERIF}`;
    g.textBaseline = 'top';
    g.shadowColor = 'rgba(240,206,140,0.4)';
    g.shadowBlur = 22;
    g.fillText(title, cx, pad - 8, w - pad * 2);
    if (body) {
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(242,226,219,0.82)';
      g.font = `300 ${bodySize}px ${FONT_SANS}`;
      if (align === 'center') g.fillText(body, cx, pad + titleSize + 22, w - pad * 2);
      else wrapText(g, body, cx, pad + titleSize + 26, w - pad * 2, bodySize * 1.42);
    }
  });
}

function wrapText(g, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const probe = line ? line + ' ' + word : word;
    if (g.measureText(probe).width > maxW && line) {
      g.fillText(line, x, y);
      y += lineH;
      line = word;
    } else line = probe;
  }
  if (line) g.fillText(line, x, y);
}

/* Transparent gold text plane (titles, numerals). */
function textPlane(text, { size = 220, font = FONT_SERIF, weight = 500, color = '#eac98a', width = 1024, height = 512, letterSpacing = 0, planeH = 2 }) {
  const tex = canvasTexture(width, height, (g) => {
    g.fillStyle = color;
    g.font = `${weight} ${size}px ${font}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = 'rgba(240,206,140,0.55)';
    g.shadowBlur = 34;
    if (letterSpacing > 0) {
      const chars = [...text];
      const widths = chars.map((ch) => g.measureText(ch).width + letterSpacing);
      const total = widths.reduce((a, b) => a + b, 0) - letterSpacing;
      let cx = width / 2 - total / 2;
      for (let i = 0; i < chars.length; i++) {
        g.fillText(chars[i], cx + (widths[i] - letterSpacing) / 2, height / 2);
        cx += widths[i];
      }
    } else {
      g.fillText(text, width / 2, height / 2, width - 60);
    }
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.92 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeH * (width / height), planeH), mat);
  mesh.renderOrder = 10;
  return mesh;
}

/* ————— 8 · The Thread (rose gold — the promise) ————— */

const threadUniforms = {
  uTime: { value: 0 },
  uFogColor: { value: new THREE.Color(FOGCOL) },
  uFogDensity: { value: scene.fog.density },
  uPulse: { value: reduced ? 0 : 1 },
};

function threadMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: threadUniforms,
    vertexShader: `
      varying vec2 vUv; varying float vDepth; varying vec3 vNormalW;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mv.z;
        vNormalW = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uFogColor; uniform float uFogDensity; uniform float uPulse;
      varying vec2 vUv; varying float vDepth; varying vec3 vNormalW;
      void main() {
        vec3 base = vec3(0.60, 0.36, 0.29);   // rose gold core
        vec3 bright = vec3(1.0, 0.80, 0.64);  // blush-gold highlight
        float shade = 0.55 + 0.45 * max(0.0, vNormalW.y);
        float rim = pow(1.0 - abs(vNormalW.z), 2.0) * 0.35;
        vec3 col = base * shade + bright * rim;
        float band = exp(-pow((fract(vUv.x - uTime * 0.055) - 0.5) * 26.0, 2.0)) * uPulse;
        float band2 = exp(-pow((fract(vUv.x * 2.0 + uTime * 0.021) - 0.5) * 40.0, 2.0)) * 0.45 * uPulse;
        col += bright * (band * 1.6 + band2);
        col += bright * 0.22; // ember floor so the thread always reads
        float fogF = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
        col = mix(col, uFogColor, fogF);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

function threadGlowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: threadUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv; varying float vDepth; varying vec3 vN; varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mv.z;
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime; uniform float uFogDensity; uniform float uPulse;
      varying vec2 vUv; varying float vDepth; varying vec3 vN; varying vec3 vV;
      void main() {
        float fres = pow(1.0 - abs(dot(vN, vV)), 2.2);
        float band = exp(-pow((fract(vUv.x - uTime * 0.055) - 0.5) * 26.0, 2.0)) * uPulse;
        float fade = exp(-uFogDensity * vDepth * 1.35);
        float a = (0.16 + 0.5 * band) * fres * fade;
        gl_FragColor = vec4(vec3(1.0, 0.76, 0.62), a);
      }`,
  });
}

/* ————— 9 · World state ————— */

const zoneGroups = []; // { group, t0, t1 }
const groupById = {};
function zoneGroup(id, margin = 0.1) {
  const z = zoneById[id];
  const g = new THREE.Group();
  g.userData.span = [Math.max(0, z.t0 - margin), Math.min(1, z.t1 + margin)];
  scene.add(g);
  zoneGroups.push(g);
  groupById[id] = g;
  return g;
}

const animated = []; // fns(time, dt, progress)
const focusFns = []; // { t0, t1, weight, getPoint }
const frameGroups = []; // trousseau frames for hover/click + light follow
const photoMeshes = [];

const right_ = new THREE.Vector3(), up_ = new THREE.Vector3(0, 1, 0), tmp_ = new THREE.Vector3();
function frameBasis(z) {
  const t = tOfZ(z);
  const p = camPath.getPointAt(t);
  const tan = camPath.getTangentAt(t);
  right_.crossVectors(tan, up_).normalize();
  return { p, tan, right: right_.clone() };
}

/* ————— 10 · Chamber builders ————— */

function addNumeral(group, numeral, z, side = 1) {
  const { p, right } = frameBasis(z);
  const mesh = textPlane(numeral, { size: 300, weight: 500, width: 512, height: 512, planeH: 1.7 });
  mesh.position.copy(p).addScaledVector(right, side * 3.1).add(V3(0, 1.9, 0));
  mesh.lookAt(pointAtZ(z + 10));
  mesh.material.opacity = 0.5;
  group.add(mesh);
}

function buildThreshold() {
  const g = zoneGroup('threshold', 0.16);
  // molten rose-gold droplet — the promise about to be made
  const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), matRoseBright.clone());
  droplet.material.emissive = new THREE.Color(0xff9d80);
  droplet.material.emissiveIntensity = 1.3;
  droplet.position.set(0, 1.9, -14);
  g.add(droplet);
  const halo = makeGlow(4.6, 0.5, 0xffc9b2);
  halo.position.copy(droplet.position);
  g.add(halo);
  const spark = makeGlow(1.1, 0.9, 0xfff2e0);
  spark.position.copy(droplet.position);
  g.add(spark);
  // ring setting — two fine orbits, one gold, one rose, like a jewel mount
  const setting = new THREE.Group();
  setting.position.copy(droplet.position);
  const orbitA = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.014, 8, 72), matGoldBright);
  const orbitB = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.011, 8, 84), matRose);
  setting.add(orbitA, orbitB);
  g.add(setting);
  animated.push((t) => {
    const s = 1 + Math.sin(t * 1.4) * 0.055;
    droplet.scale.setScalar(s);
    halo.material.opacity = 0.42 + Math.sin(t * 1.4) * 0.1;
    if (!reduced) {
      orbitA.rotation.set(t * 0.42, t * 0.31, 0);
      orbitB.rotation.set(-t * 0.27, 0, t * 0.19);
    }
  });
}

function buildThread() {
  // the promise wanders beside the camera path, then coils into the finale ring
  const pts = [];
  const t0 = tOfZ(-14), t1 = tOfZ(-436);
  const N = 46;
  for (let i = 0; i <= N; i++) {
    const t = lerp(t0, t1, i / N);
    const p = camPath.getPointAt(t);
    const tan = camPath.getTangentAt(t);
    const right = tmp_.copy(tan).cross(up_).normalize();
    const sway = Math.sin(i * 0.82) * 1.15;
    const lift = -0.85 + Math.sin(i * 0.47) * 0.22;
    pts.push(p.clone().addScaledVector(right, sway).add(V3(0, lift, 0)));
  }
  pts[0].set(0, 1.9, -14); // start exactly at the droplet
  // approach the ring, then coil into it
  const ringC = V3(0, 18.7, -452);
  pts.push(V3(0.9, 16.2, -444), V3(0.5, 15.9, -449));
  const coilTurns = 2.25, coilN = 64, rOuter = 3.3, rRing = 2.42;
  for (let i = 0; i <= coilN; i++) {
    const f = i / coilN;
    const a = -Math.PI / 2 + f * coilTurns * TAU;
    const r = lerp(rOuter, rRing, Math.pow(f, 0.8));
    pts.push(V3(
      ringC.x + Math.cos(a) * r,
      ringC.y + Math.sin(a) * r,
      lerp(-450.2, ringC.z, f)
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
  const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 900, 0.045, 8, false), threadMaterial());
  core.frustumCulled = false;
  scene.add(core);
  const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 450, 0.155, 8, false), threadGlowMaterial());
  glow.frustumCulled = false;
  glow.renderOrder = 15;
  scene.add(glow);
}

function buildHouse() {
  const g = zoneGroup('house');
  // velvet monoliths — the jewellery-box walls of the house
  const slabGeo = new THREE.BoxGeometry(3.1, 9.5, 0.7);
  const hairGeo = new THREE.BoxGeometry(0.03, 7.6, 0.03);
  const edgeGeo = new THREE.EdgesGeometry(slabGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.3 });
  // slabs keep to the left, behind the copy panel — the campaign portrait owns the right
  [[-34, -1], [-40, -1], [-47, -1], [-53, -1]].forEach(([z, side], i) => {
    const { p, right } = frameBasis(z);
    const slab = new THREE.Mesh(slabGeo, matVelvet);
    slab.position.copy(p).addScaledVector(right, side * (4.7 + (i % 2) * 1.2)).add(V3(0, 2.4, 0));
    slab.lookAt(pointAtZ(z + 12).setY(slab.position.y));
    slab.rotateY(side * 0.22);
    g.add(slab);
    const hair = new THREE.Mesh(hairGeo, matGoldBright);
    hair.position.set(side * -1.35, 0, 0.38);
    slab.add(hair);
    slab.add(new THREE.LineSegments(edgeGeo, edgeMat));
  });
  addNumeral(g, 'I', -30, -1);
}

function buildGlance() {
  const g = zoneGroup('glance');
  const ringGeo = new THREE.TorusGeometry(1.28, 0.05, 12, 64);
  const discGeo = new THREE.CircleGeometry(1.2, 48);
  const medallions = [];
  STATS.forEach(([num, label], i) => {
    const z = -63 - i * 8.5;
    const side = -1; // left colonnade — the copy panel owns the right
    const { p, right } = frameBasis(z);
    const grp = new THREE.Group();
    grp.position.copy(p).addScaledVector(right, side * (3.2 + (i % 2) * 1.3)).add(V3(0, 0.6, 0));
    const ring = new THREE.Mesh(ringGeo, i % 2 ? matRoseBright : matGoldBright);
    const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({
      map: canvasTexture(512, 512, (gc) => {
        gc.fillStyle = '#140a0d';
        gc.beginPath(); gc.arc(256, 256, 256, 0, TAU); gc.fill();
        gc.fillStyle = '#f0ce8c';
        gc.textAlign = 'center';
        gc.shadowColor = 'rgba(240,206,140,0.5)'; gc.shadowBlur = 26;
        gc.font = `600 ${num.length > 8 ? 92 : 110}px ${FONT_SERIF}`;
        gc.textBaseline = 'alphabetic';
        gc.fillText(num, 256, 268);
        gc.shadowBlur = 0;
        gc.fillStyle = 'rgba(242,226,219,0.85)';
        gc.font = `300 30px ${FONT_SANS}`;
        const words = label.split(' · ');
        words.forEach((wd, wi) => gc.fillText(wd, 256, 330 + wi * 42));
      }),
    }));
    disc.position.z = -0.015;
    grp.add(ring, disc);
    const halo = makeGlow(4.2, 0.2);
    grp.add(halo);
    grp.lookAt(pointAtZ(z + 9).setY(grp.position.y));
    g.add(grp);
    medallions.push({ grp, phase: i * 1.7, z });
  });
  animated.push((t) => {
    for (const m of medallions) {
      m.grp.position.y += Math.sin(t * 0.7 + m.phase) * 0.0012;
      m.grp.rotation.z = Math.sin(t * 0.4 + m.phase) * 0.03;
    }
  });
  const zz = zoneById.glance;
  focusFns.push({
    t0: zz.t0, t1: zz.t1, weight: 0.45,
    getPoint: (local, out) => {
      const idx = Math.round(clamp(local * 4 - 0.5, 0, 3));
      return out.copy(medallions[idx].grp.position);
    },
  });
  addNumeral(g, 'II', -59, -1);
}

function buildAtelier() {
  const g = zoneGroup('atelier');
  // a tunnel of slowly turning gates — gold and rose-gold platings the camera flies through
  const gateZs = [-106, -113, -120, -127, -134];
  const rings = [];
  gateZs.forEach((z, i) => {
    const t = tOfZ(z);
    const p = camPath.getPointAt(t);
    const tan = camPath.getTangentAt(t);
    const r = 4.5 + (i % 2) * 0.55;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 10, 110), i % 2 ? matRose : matGoldBright);
    ring.position.copy(p).add(V3(0, 0.45, 0));
    ring.quaternion.setFromUnitVectors(V3(0, 0, 1), tan);
    g.add(ring);
    rings.push({ ring, speed: (0.12 + i * 0.05) * (i % 2 ? -1 : 1) });
    if (i === 0 || i === 2) {
      const spark = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), matGoldBright);
      spark.position.set(r, 0, 0);
      spark.add(makeGlow(1.5, 0.75));
      ring.add(spark); // the gate's own turn carries the spark
    }
  });
  animated.push((t, dt) => {
    if (reduced) return;
    for (const r of rings) r.ring.rotateZ(dt * r.speed);
  });
  const center = pointAtZ(-120).add(V3(0, 0.45, 0));
  const zz = zoneById.atelier;
  focusFns.push({ t0: zz.t0, t1: zz.t1, weight: 0.32, getPoint: (l, out) => out.copy(center) });
  addNumeral(g, 'III', -98, 1);
}

function buildCatalogue() {
  const g = zoneGroup('catalogue');
  const plaqueGeo = new THREE.PlaneGeometry(3.3, 1.45);
  CATEGORIES.forEach(([name, desc], i) => {
    const z = -144 - i * 2.9;
    const side = i % 2 === 0 ? 1 : -1;
    const { p, right } = frameBasis(z);
    const plaque = new THREE.Mesh(plaqueGeo, new THREE.MeshBasicMaterial({
      map: plaqueTexture({ title: name, body: desc, titleSize: 78, bodySize: 36, h: 448 }),
    }));
    plaque.position.copy(p).addScaledVector(right, side * 4.7).add(V3(0, 0.35, 0));
    plaque.lookAt(pointAtZ(z + 9));
    g.add(plaque);
  });
  addNumeral(g, 'IV', -142, -1);
}

/* Shared museum frame: velvet backboard, photo, gold border, caption plinth, spotlight. */
let coneTex = null;
function createFrame(item, s = 1) {
  if (!coneTex) {
    coneTex = canvasTexture(256, 256, (gc) => {
      const grad = gc.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, 'rgba(255,232,190,0.55)');
      grad.addColorStop(1, 'rgba(255,232,190,0)');
      gc.fillStyle = grad;
      gc.beginPath();
      gc.moveTo(118, 0); gc.lineTo(138, 0); gc.lineTo(240, 256); gc.lineTo(16, 256);
      gc.closePath(); gc.fill();
    });
  }
  const index = PIECES.indexOf(item);
  const grp = new THREE.Group();
  const W = 3.0 * s, H = 3.6 * s, bd = 0.09 * s;

  const back = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.6 * s, H + 0.6 * s), matInk);
  back.position.z = -0.05;
  grp.add(back);

  const photo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: textures[item.slug] }));
  photo.position.z = 0.02;
  photo.userData.galleryIndex = index;
  grp.add(photo);

  const frameMat = matGold.clone();
  frameMat.emissive = new THREE.Color(0xc79a4e);
  frameMat.emissiveIntensity = 0;
  const hGeo = new THREE.BoxGeometry(W + 2 * bd, bd, 0.12 * s);
  const vGeo = new THREE.BoxGeometry(bd, H + 2 * bd, 0.12 * s);
  [[hGeo, 0, (H + bd) / 2], [hGeo, 0, -(H + bd) / 2], [vGeo, (W + bd) / 2, 0], [vGeo, -(W + bd) / 2, 0]]
    .forEach(([geo, x, y]) => {
      const b = new THREE.Mesh(geo, frameMat);
      b.position.set(x, y, 0.02);
      grp.add(b);
    });

  const plinth = new THREE.Mesh(new THREE.PlaneGeometry(2.6 * s, 0.6 * s), new THREE.MeshBasicMaterial({
    map: plaqueTexture({
      w: 1024, h: 236, pad: 48, titleSize: 58, bodySize: 34, align: 'center',
      title: item.caption, body: item.material || '',
    }),
  }));
  plinth.position.set(0, -(H / 2 + 0.62 * s), 0.02);
  grp.add(plinth);

  const cone = new THREE.Mesh(new THREE.PlaneGeometry(3.4 * s, 3.4 * s), new THREE.MeshBasicMaterial({
    map: coneTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.5,
  }));
  cone.position.set(0, H / 2 + 1.35 * s, 0.55 * s);
  cone.rotation.x = -0.28;
  cone.renderOrder = 18;
  grp.add(cone);

  const lamp = makeGlow(0.8 * s, 0.85, 0xfff0d0);
  lamp.position.set(0, H / 2 + 2.9 * s, 0.9 * s);
  grp.add(lamp);

  const aura = makeGlow(8.5 * s, 0.13);
  aura.position.set(0, 0, -0.6);
  grp.add(aura);

  // soft pool of light beneath the piece
  const pool = makeGlow(1, 0.15, 0xffdca8);
  pool.scale.set(3.6 * s, 1.15 * s, 1);
  pool.position.set(0, -(H / 2 + 1.25 * s), 0.5 * s);
  grp.add(pool);

  grp.userData = { index, hover: 0, frameMat };
  return { grp, photo };
}

/* Campaign photography walks with the visitor — one editorial frame per chamber. */
const EDITORIAL_SPOTS = [
  { slug: 'editorial-hero',   zone: 'house',     z: -45,    side: 1,  lateral: 5.6, y: 1.0,  s: 1.18 },
  { slug: 'white-statement',  zone: 'glance',    z: -91,    side: -1, lateral: 4.8, y: 0.75, s: 1.05 },
  { slug: 'artisan-craft',    zone: 'atelier',   z: -126,   side: 1,  lateral: 7.0, y: 1.0,  s: 1.15 },
  { slug: 'polki-set',        zone: 'catalogue', z: -178.5, side: -1, lateral: 5.0, y: 0.75, s: 1.1 },
  { slug: 'green-long-haar',  zone: 'journey',   z: -336,   side: 1,  lateral: 5.6, y: 0.9,  s: 1.1 },
  { slug: 'artisan-workshop', zone: 'vows',      z: -349,   side: 1,  lateral: 6.2, y: 0.85, s: 1.1 },
];
const editorialGroups = [];
function buildEditorials() {
  for (const ed of EDITORIAL_SPOTS) {
    const item = PIECES.find((gi) => gi.slug === ed.slug);
    const { p, right } = frameBasis(ed.z);
    const { grp, photo } = createFrame(item, ed.s);
    grp.position.copy(p).addScaledVector(right, ed.side * ed.lateral).add(V3(0, ed.y, 0));
    grp.lookAt(pointAtZ(ed.z + 9));
    groupById[ed.zone].add(grp);
    editorialGroups.push(grp);
    photoMeshes.push(photo);
  }
}

function buildGallery() {
  const g = zoneGroup('gallery', 0.08);
  GALLERY.forEach((item, i) => {
    const z = -192 - i * 9.8;
    const side = i % 2 === 0 ? 1 : -1;
    const { p, right } = frameBasis(z);
    const { grp, photo } = createFrame(item, 1);
    grp.position.copy(p).addScaledVector(right, side * 5.2).add(V3(0, 0.75, 0));
    grp.lookAt(pointAtZ(z + 9));
    g.add(grp);
    frameGroups.push(grp);
    photoMeshes.push(photo);
  });

  const zz = zoneById.gallery;
  focusFns.push({
    t0: zz.t0, t1: zz.t1, weight: 0.52,
    getPoint: (local, out) => {
      const idx = Math.round(clamp(local * GALLERY.length - 0.5, 0, GALLERY.length - 1));
      return out.copy(frameGroups[idx].position);
    },
  });
  addNumeral(g, 'V', -184, -1);
}

function buildJourney() {
  const g = zoneGroup('journey');
  // one bright node — the Mumbai atelier — radiating deliveries across India
  const origin = V3(-8, 4.6, -330);
  const nodeCount = 46;
  const positions = new Float32Array((nodeCount + 1) * 3);
  const seeds = new Float32Array(nodeCount + 1);
  const linePos = new Float32Array(nodeCount * 6);
  origin.toArray(positions, 0);
  seeds[0] = 0;
  for (let i = 0; i < nodeCount; i++) {
    const a = Math.random() * TAU;
    const rr = 4 + Math.random() * 12;
    const px = origin.x + Math.cos(a) * rr;
    const py = origin.y + (Math.random() - 0.35) * 7;
    const pz = origin.z - 4 - Math.random() * 16;
    positions.set([px, py, pz], (i + 1) * 3);
    seeds[i + 1] = Math.random() * TAU;
    linePos.set([origin.x, origin.y, origin.z, px, py, pz], i * 6);
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  nodeGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const nodeMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: `
      attribute float aSeed; varying float vTw;
      uniform float uTime;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float big = aSeed == 0.0 ? 3.2 : 1.0;
        gl_PointSize = clamp(big * 130.0 / -mv.z, 1.0, 42.0);
        vTw = 0.6 + 0.4 * sin(uTime * 1.3 + aSeed * 5.0);
        if (aSeed == 0.0) vTw = 1.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.06, d) * vTw;
        gl_FragColor = vec4(1.0, 0.80, 0.62, a * 0.9);
      }`,
  });
  const nodes = new THREE.Points(nodeGeo, nodeMat);
  g.add(nodes);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: GOLD, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  g.add(new THREE.LineSegments(lineGeo, lineMat));
  const beacon = makeGlow(5, 0.55);
  beacon.position.copy(origin);
  g.add(beacon);
  // parcels of light travelling outward from Mumbai along the filaments
  const pkGeo = new THREE.BufferGeometry();
  pkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodeCount * 3), 3));
  pkGeo.setAttribute('aTarget', new THREE.BufferAttribute(positions.slice(3), 3));
  pkGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds.slice(1), 1));
  const pkMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOrigin: { value: origin.clone() } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: `
      attribute vec3 aTarget; attribute float aSeed;
      uniform float uTime; uniform vec3 uOrigin; varying float vA;
      void main() {
        float f = fract(uTime * 0.07 + aSeed * 0.159);
        vec3 p = mix(uOrigin, aTarget, f);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(95.0 / -mv.z, 1.0, 10.0);
        vA = sin(3.14159 * f);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(1.0, 0.82, 0.66, smoothstep(0.5, 0.1, d) * vA * 0.8);
      }`,
  });
  const packets = new THREE.Points(pkGeo, pkMat);
  packets.frustumCulled = false;
  g.add(packets);
  animated.push((t) => {
    nodeMat.uniforms.uTime.value = t;
    pkMat.uniforms.uTime.value = reduced ? 20 : t;
    lineMat.opacity = 0.17 + Math.sin(t * 0.8) * 0.06;
  });
  const zz = zoneById.journey;
  focusFns.push({ t0: zz.t0, t1: zz.t1, weight: 0.55, getPoint: (l, out) => out.copy(origin) });
  addNumeral(g, 'VI', -314, 1);
}

function buildVows() {
  const g = zoneGroup('vows');
  const center = V3(0, 3.0, -361);
  const R = 8.6;
  const pillarGeo = new THREE.BoxGeometry(2.0, 6.4, 0.45);
  const capGeo = new THREE.BoxGeometry(2.18, 0.16, 0.6);
  const plaqueGeo = new THREE.PlaneGeometry(1.84, 2.46);
  PROMISES.forEach(([name, body], i) => {
    const a = -Math.PI / 2 + (i / PROMISES.length) * TAU;
    const pos = V3(center.x + Math.cos(a) * R, center.y + 0.5, center.z + Math.sin(a) * R);
    const grp = new THREE.Group();
    grp.position.copy(pos);
    grp.lookAt(center.x, pos.y, center.z);
    const pillar = new THREE.Mesh(pillarGeo, matInk);
    grp.add(pillar);
    [3.3, -3.3].forEach((y) => {
      const cap = new THREE.Mesh(capGeo, i % 2 ? matRoseBright : matGoldBright);
      cap.position.y = y;
      grp.add(cap);
    });
    // engraved face
    const plaque = new THREE.Mesh(plaqueGeo, new THREE.MeshBasicMaterial({
      map: canvasTexture(640, 856, (gc) => {
        gc.fillStyle = '#130a0d';
        gc.fillRect(0, 0, 640, 856);
        gc.strokeStyle = 'rgba(217,178,99,0.45)';
        gc.lineWidth = 3;
        gc.strokeRect(20, 20, 600, 816);
        gc.fillStyle = '#f0ce8c';
        gc.textAlign = 'left';
        gc.textBaseline = 'top';
        gc.font = `600 68px ${FONT_SERIF}`;
        gc.shadowColor = 'rgba(240,206,140,0.45)';
        gc.shadowBlur = 20;
        wrapText(gc, name, 52, 64, 536, 78);
        gc.shadowBlur = 0;
        gc.fillStyle = 'rgba(246,233,226,0.95)';
        gc.font = `300 46px ${FONT_SANS}`;
        wrapText(gc, body, 52, 330, 536, 66);
      }),
    }));
    plaque.position.z = 0.24;
    grp.add(plaque);
    g.add(grp);
  });
  const halo = makeGlow(9, 0.16);
  halo.position.copy(center).add(V3(0, 2, 0));
  g.add(halo);
  // a golden mandap ring binding the six promises together
  const stage = new THREE.Mesh(new THREE.TorusGeometry(R + 0.4, 0.035, 8, 140), matGold);
  stage.position.copy(center).add(V3(0, -2.6, 0));
  stage.rotation.x = Math.PI / 2;
  g.add(stage);
  const zz = zoneById.vows;
  focusFns.push({
    t0: zz.t0, t1: zz.t1, weight: 0.7,
    getPoint: (local, out) => {
      const sweep = -Math.PI / 2 + local * TAU * 0.85;
      return out.set(center.x + Math.cos(sweep) * (R - 1.6), center.y + 0.6, center.z + Math.sin(sweep) * (R - 1.6));
    },
  });
  addNumeral(g, 'VII', -346, -1);
}

function buildAscent() {
  const g = zoneGroup('ascent', 0.14);
  const dawn = makeGlow(70, 0.34, 0xffe0c8);
  dawn.position.set(0, 30, -486);
  g.add(dawn);
  const dawn2 = makeGlow(26, 0.4, 0xfff0e2);
  dawn2.position.set(0, 22, -474);
  g.add(dawn2);
  const zz = zoneById.ascent;
  focusFns.push({ t0: zz.t0, t1: zz.t1, weight: 0.35, getPoint: (l, out) => out.set(0, 24, -478) });
}

function buildRing() {
  const g = zoneGroup('ring', 0.16);
  const center = V3(0, 18.7, -452);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.1, 18, 120), matGoldBright.clone());
  ring.position.copy(center);
  ring.material.emissive = new THREE.Color(0x8a5e1e);
  ring.material.emissiveIntensity = 0.5;
  g.add(ring);

  // circular engraving orbiting the ring
  const engraving = new THREE.Mesh(
    new THREE.PlaneGeometry(7.4, 7.4),
    new THREE.MeshBasicMaterial({
      transparent: true, depthWrite: false, opacity: 0.85,
      map: canvasTexture(1024, 1024, (gc) => {
        gc.translate(512, 512);
        gc.fillStyle = '#eac98a';
        gc.font = `400 44px ${FONT_SANS}`;
        gc.textAlign = 'center';
        gc.textBaseline = 'middle';
        const msg = 'SIRINI JEWELLERY · MUMBAI · SINCE 2017 · ';
        const chars = [...msg];
        chars.forEach((ch, i) => {
          const a = (i / chars.length) * TAU;
          gc.save();
          gc.rotate(a);
          gc.translate(0, -455);
          gc.fillText(ch, 0, 0);
          gc.restore();
        });
      }),
    })
  );
  engraving.position.copy(center);
  engraving.renderOrder = 10;
  g.add(engraving);

  const halo = makeGlow(13, 0.4);
  halo.position.copy(center);
  g.add(halo);
  const heart = makeGlow(3.4, 0.5, 0xfff0d2);
  heart.position.copy(center);
  g.add(heart);
  // concentric echo halos — one gold, one rose — visible through the fog during the ascent
  [[4.8, 0.3, GOLD_BRIGHT], [7.0, 0.16, ROSE_BRIGHT]].forEach(([r, op, col]) => {
    const echo = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.02, 8, 100),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })
    );
    echo.position.copy(center);
    g.add(echo);
  });

  const orbiter = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), matGoldBright);
  const orbGlow = makeGlow(1.1, 0.8);
  orbiter.add(orbGlow);
  g.add(orbiter);

  animated.push((t) => {
    if (!reduced) engraving.rotation.z = -t * 0.06;
    ring.material.emissiveIntensity = 0.45 + Math.sin(t * 1.1) * 0.15;
    const a = t * 0.55;
    orbiter.position.set(center.x + Math.cos(a) * 2.42, center.y + Math.sin(a) * 2.42, center.z);
  });

  const zz = zoneById.ring;
  focusFns.push({ t0: zz.t0 - 0.01, t1: 1.01, weight: 0.85, getPoint: (l, out) => out.copy(center) });
}

/* ————— 11 · Gold dust & rose petals ————— */

function buildDust(count, sizeMul = 1, alphaMul = 1, driftMul = 1, tint = [1.0, 0.85, 0.58]) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const p = camPath.getPointAt(t);
    pos.set([
      p.x + (Math.random() - 0.5) * 26,
      p.y + (Math.random() - 0.35) * 15,
      p.z + (Math.random() - 0.5) * 26,
    ], i * 3);
    seed.set([Math.random() * TAU, 0.3 + Math.random() * 0.9, 0.5 + Math.random() * 1.7, Math.random() * TAU], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDrift: { value: (reduced ? 0.12 : 1) * driftMul },
      uSize: { value: sizeMul },
      uAlpha: { value: alphaMul },
      uTint: { value: new THREE.Vector3(...tint) },
    },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: `
      attribute vec4 aSeed; uniform float uTime; uniform float uDrift;
      uniform float uSize; uniform float uAlpha;
      varying float vA;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * aSeed.y + aSeed.x) * 0.55 * uDrift;
        p.y += sin(uTime * aSeed.y * 0.7 + aSeed.w) * 0.4 * uDrift;
        p.z += cos(uTime * aSeed.y * 0.5 + aSeed.x) * 0.5 * uDrift;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        gl_PointSize = clamp(aSeed.z * 46.0 * uSize / dist, 0.6, 7.0 * uSize);
        float tw = 0.45 + 0.55 * sin(uTime * (0.6 + aSeed.y) + aSeed.w * 7.0);
        vA = tw * exp(-0.0135 * dist) * uAlpha;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      uniform vec3 uTint;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.08, d) * vA;
        gl_FragColor = vec4(uTint, a * 0.8);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 25;
  scene.add(points);
  animated.push((t) => { mat.uniforms.uTime.value = t; });
}

/* ————— 12 · Lighting ————— */

const hemi = new THREE.HemisphereLight(0x331920, 0x0c0407, 0.85);
scene.add(hemi);

const roamers = [
  new THREE.PointLight(0xffd2b0, 0, 46, 2),
  new THREE.PointLight(0xffd2b0, 0, 46, 2),
];
roamers.forEach((l) => scene.add(l));

const LIGHT_ANCHORS = [
  { id: 'house', pos: () => pointAtZ(-44).add(V3(0, 4, 0)) },
  { id: 'glance', pos: () => pointAtZ(-76).add(V3(0, 3.5, 0)) },
  { id: 'atelier', pos: () => pointAtZ(-118).add(V3(0, 2, 0)) },
  { id: 'catalogue', pos: () => pointAtZ(-160).add(V3(0, 3, 0)) },
  { id: 'gallery', pos: null }, // follows the active frame
  { id: 'journey', pos: () => V3(-8, 6.5, -330) },
  { id: 'vows', pos: () => V3(0, 5.5, -361) },
  { id: 'ascent', pos: () => V3(1.5, 14, -410) },
  { id: 'ring', pos: () => V3(0, 18.5, -448) },
];

function lightAnchorFor(p) {
  // returns [position, strength]
  for (const a of LIGHT_ANCHORS) {
    const z = zoneById[a.id];
    if (p >= z.t0 - 0.04 && p <= z.t1 + 0.04) {
      if (a.id === 'gallery') {
        const local = clamp((p - z.t0) / (z.t1 - z.t0), 0, 1);
        const idx = Math.round(clamp(local * GALLERY.length - 0.5, 0, GALLERY.length - 1));
        return [frameGroups[idx].position.clone().add(V3(0, 3, 1)), 1.35];
      }
      return [a.pos(), 1.15];
    }
  }
  return [null, 0];
}

/* ————— 13 · Rig: scroll → progress → camera ————— */

let target = 0, progress = 0, running = true, booted = false;
let userMoved = false, attractOn = false, idleAt = performance.now();
let tweening = null;

function readScroll() {
  const max = scroller.offsetHeight - innerHeight;
  target = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
}

function setScrollFromT(t, instant) {
  const max = scroller.offsetHeight - innerHeight;
  const top = t * max;
  if (instant) {
    scrollTo(0, top);
    readScroll();
    progress = target;
  } else {
    tweenScrollTo(top);
  }
}

function tweenScrollTo(top) {
  const from = scrollY;
  const dist = Math.abs(top - from);
  if (dist < 2) return;
  const dur = reduced ? 350 : clamp(600 + dist * 0.55, 900, 3000);
  tweening = { from, to: top, start: performance.now(), dur };
}

const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', (e) => {
  if (coarse) return;
  parallax.tx = (e.clientX / innerWidth - 0.5) * 2;
  parallax.ty = (e.clientY / innerHeight - 0.5) * 2;
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  pointer.cx = e.clientX; pointer.cy = e.clientY;
  pointerDirty = true;
}, { passive: true });

const interacted = () => {
  userMoved = true;
  attractOn = false;
  idleAt = performance.now();
};
addEventListener('wheel', () => { interacted(); tweening = null; }, { passive: true });
addEventListener('touchstart', () => { interacted(); tweening = null; }, { passive: true });
addEventListener('keydown', (e) => {
  interacted();
  if (lightboxOpen) return; // lightbox handles its own keys
  const step = innerHeight * 0.9;
  if (e.key === ' ' || e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    tweenScrollTo(clamp(scrollY + step, 0, scroller.offsetHeight - innerHeight));
  } else if (e.key === 'PageUp' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    tweenScrollTo(clamp(scrollY - step, 0, scroller.offsetHeight - innerHeight));
  } else if (e.key === 'Home') { e.preventDefault(); setScrollFromT(0, false); }
  else if (e.key === 'End') { e.preventDefault(); setScrollFromT(1, false); }
});
addEventListener('scroll', readScroll, { passive: true });

/* ————— 14 · DOM overlay sync ————— */

const copyEls = [...document.querySelectorAll('.copy')].map((el) => ({
  el,
  zone: zoneById[el.dataset.zone],
  center: el.classList.contains('pos-center'),
  lastO: -1,
}));

function baseTransform(el, dy) {
  if (document.body.classList.contains('no3d')) return '';
  if (el.classList.contains('pos-center')) return `translate(-50%, calc(-50% + ${dy.toFixed(1)}px))`;
  if (compact) return `translateY(${dy.toFixed(1)}px)`;
  return `translateY(calc(-50% + ${dy.toFixed(1)}px))`;
}

function syncCopy(p) {
  for (const c of copyEls) {
    if (!c.zone) continue;
    const { t0, t1 } = c.zone;
    let oIn, oOut;
    if (c.zone.id === 'threshold') {
      oIn = 1;
      oOut = 1 - smooth(t1 * 0.45, t1 * 0.95, p);
    } else if (c.zone.id === 'ring') {
      oIn = smooth(t0 + 0.004, t0 + 0.016, p); // arrive fast — the invitation must be ready
      oOut = 1;
    } else if (c.zone.id === 'gallery' || c.zone.id === 'catalogue' || c.zone.id === 'vows') {
      // intro cards only — clear the stage for the installations
      const len = t1 - t0;
      const outAt = c.zone.id === 'gallery' ? [0.12, 0.2] : c.zone.id === 'catalogue' ? [0.18, 0.3] : [0.3, 0.46];
      oIn = smooth(t0 - len * 0.02, t0 + len * 0.06, p);
      oOut = 1 - smooth(t0 + len * outAt[0], t0 + len * outAt[1], p);
    } else {
      const len = t1 - t0;
      oIn = smooth(t0 + len * 0.1, t0 + len * 0.32, p);
      oOut = 1 - smooth(t1 - len * 0.28, t1 - len * 0.06, p);
    }
    const o = clamp(Math.min(oIn, oOut), 0, 1);
    if (Math.abs(o - c.lastO) < 0.003) continue;
    c.lastO = o;
    const dy = (1 - oIn) * 30 - (1 - oOut) * 22;
    c.el.style.opacity = o.toFixed(3);
    c.el.style.transform = baseTransform(c.el, dy);
    c.el.classList.toggle('live', o > 0.15);
  }
}

/* Chapter dots + hash */
let activeZoneId = null;
const dotsNav = $('#dots');
const dotButtons = {};
function buildDots() {
  for (const z of ZONES) {
    if (!z.label) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', z.label);
    b.innerHTML = `<span class="dot-label">${z.label}</span>`;
    b.addEventListener('click', () => {
      interacted();
      const t = z.id === 'threshold' ? 0 : z.id === 'ring' ? 0.985 : (z.t0 + z.t1) / 2;
      setScrollFromT(t, false);
    });
    dotsNav.appendChild(b);
    dotButtons[z.id] = b;
  }
  $('.hud-brand').addEventListener('click', (e) => {
    e.preventDefault();
    interacted();
    setScrollFromT(0, false);
  });
}

function syncZone(p) {
  let zone = ZONES[0];
  for (const z of ZONES) if (p >= z.t0) zone = z;
  if (zone.id !== activeZoneId) {
    activeZoneId = zone.id;
    for (const [id, b] of Object.entries(dotButtons)) b.classList.toggle('active', id === zone.id);
    try { history.replaceState(null, '', '#' + zone.id); } catch (err) { /* file:// may refuse */ }
  }
}

/* ————— 15 · Hover + lightbox ————— */

const raycaster = new THREE.Raycaster();
const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
let pointerDirty = false;
let hovered = -1;
let lastHoverP = -1;

/* Nearest visible photo under the pointer (culled chambers are ignored). */
function pickPhoto() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(photoMeshes, false);
  for (const h of hits) {
    if (h.distance > 42) break;
    let o = h.object, visible = true;
    while (o) { if (o.visible === false) { visible = false; break; } o = o.parent; }
    if (visible) return h.object.userData.galleryIndex;
  }
  return -1;
}

function updateHover() {
  if (coarse || !pointerDirty || lightboxOpen) return;
  pointerDirty = false;
  const idx = pickPhoto();
  if (idx !== hovered) setHover(idx);
  if (idx >= 0) {
    tooltip.style.left = pointer.cx + 'px';
    tooltip.style.top = (pointer.cy - 46) + 'px';
  }
}

function setHover(idx) {
  hovered = idx;
  canvas.style.cursor = idx >= 0 ? 'pointer' : '';
  if (idx >= 0) {
    const it = PIECES[idx];
    tooltip.textContent = it.caption + ' — view';
    tooltip.classList.add('show');
  } else {
    tooltip.classList.remove('show');
  }
}

let downX = 0, downY = 0, downSeen = false;
canvas.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; downSeen = true; });
canvas.addEventListener('click', (e) => {
  if (downSeen && Math.hypot(e.clientX - downX, e.clientY - downY) > 9) return; // drag, not a click
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  const idx = pickPhoto();
  if (idx >= 0) openLightbox(idx);
});

const lightbox = $('#lightbox');
const lbImg = $('#lbImg');
const lbCaption = $('#lbCaption');
const lbSub = $('#lbSub');
const lbLink = $('#lbLink');
let lightboxOpen = false, lbIndex = 0, lbReturnFocus = null;

function openLightbox(i) {
  lbIndex = i;
  fillLightbox();
  lightbox.hidden = false;
  requestAnimationFrame(() => lightbox.classList.add('show'));
  setTimeout(() => lightbox.classList.add('show'), 120); // rAF can be throttled (low-power mode, background)
  lightboxOpen = true;
  lbReturnFocus = document.activeElement;
  document.documentElement.style.overflow = 'hidden';
  $('.lb-close').focus({ preventScroll: true });
  chime();
}
function fillLightbox() {
  const it = PIECES[lbIndex];
  lbImg.src = window.SIRINI_ASSETS[it.slug];
  lbImg.alt = it.caption;
  lbCaption.textContent = it.caption;
  lbSub.textContent = (it.material ? it.material + ' · ' : '') + 'Sirini Jewellery';
  if (it.site) {
    lbLink.href = it.site;
    lbLink.hidden = false;
  } else {
    lbLink.hidden = true;
  }
}
function closeLightbox() {
  lightbox.classList.remove('show');
  lightboxOpen = false;
  document.documentElement.style.overflow = '';
  setTimeout(() => { lightbox.hidden = true; }, 360);
  if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus({ preventScroll: true });
}
function stepLightbox(d) {
  lbIndex = (lbIndex + d + PIECES.length) % PIECES.length;
  fillLightbox();
}
$('.lb-close').addEventListener('click', closeLightbox);
$('.lb-prev').addEventListener('click', () => stepLightbox(-1));
$('.lb-next').addEventListener('click', () => stepLightbox(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
addEventListener('keydown', (e) => {
  if (!lightboxOpen) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') stepLightbox(-1);
  else if (e.key === 'ArrowRight') stepLightbox(1);
});

/* ————— 16 · Ambient sound (procedural, opt-in) ————— */

let audio = null;
function buildAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 270;
  lp.connect(master);
  const oscA = ctx.createOscillator();
  oscA.frequency.value = 104;
  const gA = ctx.createGain(); gA.gain.value = 0.5;
  oscA.connect(gA).connect(lp);
  const oscB = ctx.createOscillator();
  oscB.type = 'triangle';
  oscB.frequency.value = 104.6;
  const gB = ctx.createGain(); gB.gain.value = 0.22;
  oscB.connect(gB).connect(lp);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoG = ctx.createGain(); lfoG.gain.value = 0.16;
  lfo.connect(lfoG).connect(master.gain);
  oscA.start(); oscB.start(); lfo.start();

  const scale = [392, 440, 523.25, 587.33, 659.25];
  let pluckTimer = null;
  function schedulePluck() {
    pluckTimer = setTimeout(() => {
      if (audio && audio.on) pluck();
      schedulePluck();
    }, 9000 + Math.random() * 11000);
  }
  function pluck() {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = scale[(Math.random() * scale.length) | 0] * (Math.random() < 0.4 ? 0.5 : 1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.4);
    o.connect(g).connect(master);
    o.start();
    o.stop(ctx.currentTime + 2.6);
  }
  schedulePluck();
  return {
    ctx, master, on: false,
    pluck,
    setOn(v) {
      this.on = v;
      if (v) ctx.resume();
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(v ? 0.12 : 0.0001, now + (v ? 2.2 : 0.6));
    },
  };
}
function chime() { if (audio && audio.on) audio.pluck(); }

$('#soundToggle').addEventListener('click', function () {
  if (!audio) {
    try { audio = buildAudio(); } catch (err) {
      console.warn('[SIRINI] audio unavailable:', err && err.message);
      this.disabled = true;
      return;
    }
  }
  const on = this.getAttribute('aria-pressed') !== 'true';
  this.setAttribute('aria-pressed', String(on));
  audio.setOn(on);
});

/* ————— 17 · Boot ————— */

const textures = {};
const veilSub = $('#veilSub');
function loadTextures() {
  const loader = new THREE.TextureLoader();
  let done = 0;
  const jobs = PIECES.map((g) => new Promise((res, rej) => {
    loader.load(window.SIRINI_ASSETS[g.slug], (tex) => {
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = Math.min(8, maxAniso);
      if (!isWebGL2) { tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; }
      textures[g.slug] = tex;
      done++;
      if (veilSub) veilSub.textContent = `The Promise · ${Math.round((done / PIECES.length) * 100)}%`;
      res();
    }, undefined, rej);
  }));
  return Promise.all(jobs).then(() => { if (veilSub) veilSub.textContent = 'The Promise'; });
}

function loadFonts() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const wanted = [
    '500 100px "EB Garamond"',
    '600 100px "EB Garamond"',
    'italic 500 100px "EB Garamond"',
    '300 100px "DM Sans"',
    '400 100px "DM Sans"',
  ];
  return Promise.race([
    Promise.all(wanted.map((f) => document.fonts.load(f))),
    new Promise((res) => setTimeout(res, 1600)),
  ]);
}

function resize() {
  compact = compactQuery.matches;
  const w = innerWidth, h = innerHeight;
  applyPixelRatio(); // devicePixelRatio changes with browser zoom / monitor moves
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.85 ? 68 : 55;
  camera.updateProjectionMatrix();
  // keep journey position stable if the scroll range changes
  const keep = progress;
  const wanted = (compact || coarse ? 820 : 1000) + 'vh';
  if (scroller.style.height !== wanted) {
    scroller.style.height = wanted;
    const max = scroller.offsetHeight - innerHeight;
    scrollTo(0, keep * max);
    readScroll();
  }
}
addEventListener('resize', resize);

/* ————— 18 · Frame loop ————— */

const lookAhead = new THREE.Vector3(), lookTarget = new THREE.Vector3(), focusPt = new THREE.Vector3();
const camPos = new THREE.Vector3(), rightVec = new THREE.Vector3();
const tanA_ = new THREE.Vector3(), tanB_ = new THREE.Vector3(), camLightOff = new THREE.Vector3(0, 1.5, 0);
let bank = 0;
let lastTime = performance.now();
const progressGem = document.querySelector('#progress b');

/* Adaptive resolution: keep the journey smooth on weaker GPUs by trading
   pixels for frame rate — and give the pixels back when there is headroom.
   Hysteresis (down below ~33 fps, up only above ~54 fps) prevents flapping. */
const RATIO_CAP = coarse ? 1.35 : 1.8;
let ratioScale = 1, emaDt = 1 / 60, lastQualityCheck = 0;
function applyPixelRatio() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, RATIO_CAP) * ratioScale);
}
function adaptQuality(dt, now) {
  if (document.hidden) return; // hidden-tab heartbeat ticks are not real frames
  emaDt = emaDt * 0.95 + dt * 0.05;
  if (now - lastQualityCheck < 2000) return;
  lastQualityCheck = now;
  if (emaDt > 0.030 && ratioScale > 0.6) {
    ratioScale = Math.max(0.6, ratioScale - 0.15);
    applyPixelRatio();
  } else if (emaDt < 0.0185 && ratioScale < 1) {
    ratioScale = Math.min(1, ratioScale + 0.1);
    applyPixelRatio();
  }
}

function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);
  tick(now);
}

// keep a slow heartbeat when the tab is hidden (rAF is paused there)
setInterval(() => { if (document.hidden && running && booted) tick(performance.now()); }, 500);

function tick(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const time = now / 1000;

  adaptQuality(dt, now);

  // tweened navigation
  if (tweening) {
    const f = clamp((now - tweening.start) / tweening.dur, 0, 1);
    scrollTo(0, lerp(tweening.from, tweening.to, easeInOutCubic(f)));
    readScroll();
    if (f >= 1) tweening = null;
  }

  // attract drift before first interaction
  if (!userMoved && !reduced && !attractOn && now - idleAt > 10000 && target < 0.02) attractOn = true;
  if (attractOn && target < zoneById.prologue.t1 * 0.55) {
    scrollTo(0, scrollY + dt * 30);
    readScroll();
  }

  // damped progress
  const rate = tweening ? 7 : reduced ? 8 : 4.2;
  progress += (target - progress) * (1 - Math.exp(-dt * rate));
  progress = clamp(progress, 0, 1);
  const p = progress;

  // camera on path
  camPath.getPointAt(p, camPos);
  camPath.getPointAt(Math.min(p + 0.03, 1), lookAhead);
  lookAhead.y += 0.1;

  // zone focus blending
  lookTarget.copy(lookAhead);
  for (const f of focusFns) {
    if (p < f.t0 - 0.02 || p > f.t1 + 0.02) continue;
    const local = clamp((p - f.t0) / (f.t1 - f.t0), 0, 1);
    const w = f.weight * smooth(-0.02, 0.14, local) * (1 - smooth(0.86, 1.02, local));
    if (w <= 0) continue;
    f.getPoint(local, focusPt);
    lookTarget.lerp(focusPt, w);
  }

  // parallax
  if (!reduced && !coarse) {
    parallax.x += (parallax.tx - parallax.x) * (1 - Math.exp(-dt * 3));
    parallax.y += (parallax.ty - parallax.y) * (1 - Math.exp(-dt * 3));
    const tan = camPath.getTangentAt(p);
    rightVec.crossVectors(tan, up_).normalize();
    camPos.addScaledVector(rightVec, parallax.x * 0.4);
    camPos.y += -parallax.y * 0.25;
  }

  camera.position.copy(camPos);
  if (lookTarget.distanceToSquared(camPos) < 1e-5) lookTarget.z -= 1;
  camera.lookAt(lookTarget);

  // gentle banking into the curves, like a glide
  if (!reduced) {
    camPath.getTangentAt(p, tanA_);
    camPath.getTangentAt(Math.min(p + 0.012, 1), tanB_);
    const turn = tanA_.z * tanB_.x - tanA_.x * tanB_.z;
    const bankTarget = clamp(-turn * 14, -0.07, 0.07);
    bank += (bankTarget - bank) * (1 - Math.exp(-dt * 2.5));
    camera.rotateZ(bank);
  }

  // zone visibility
  for (const g of zoneGroups) {
    const [a, b] = g.userData.span;
    g.visible = p >= a && p <= b;
  }

  // roaming lights
  const [anchor, strength] = lightAnchorFor(p);
  if (anchor) {
    roamers[0].position.lerp(anchor, 1 - Math.exp(-dt * 3.5));
    roamers[0].intensity = lerp(roamers[0].intensity, strength, 1 - Math.exp(-dt * 3));
  } else {
    roamers[0].intensity = lerp(roamers[0].intensity, 0, 1 - Math.exp(-dt * 3));
  }
  roamers[1].position.copy(camPos).add(camLightOff);
  roamers[1].intensity = 0.32;

  // frame hover ease (trousseau + chamber editorials)
  for (const set of [frameGroups, editorialGroups]) {
    for (const grp of set) {
      const targetH = grp.userData.index === hovered ? 1 : 0;
      grp.userData.hover = lerp(grp.userData.hover, targetH, 1 - Math.exp(-dt * 8));
      const s = 1 + grp.userData.hover * 0.03;
      grp.scale.setScalar(s);
      grp.userData.frameMat.emissiveIntensity = grp.userData.hover * 0.55;
    }
  }

  threadUniforms.uTime.value = time;
  for (const fn of animated) fn(time, dt, p);

  if (Math.abs(p - lastHoverP) > 0.0015) { pointerDirty = true; lastHoverP = p; }
  updateHover();
  syncCopy(p);
  syncZone(p);
  progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
  if (progressGem) progressGem.style.transform = `translateX(${(p * innerWidth).toFixed(1)}px) rotate(45deg)`;
  if ((userMoved || p > 0.08) && !hint.classList.contains('gone')) hint.classList.add('gone');

  renderer.render(scene, camera);
}

/* ————— 19 · Go ————— */

async function boot() {
  try {
    fillLists();
    buildDots();
    if (coarse) {
      const ht = document.querySelector('#hint .hint-text');
      if (ht) ht.textContent = 'Swipe to follow the promise';
    }
    const again = $('#againBtn');
    if (again) again.addEventListener('click', () => { interacted(); setScrollFromT(0, false); });
    scroller.style.height = (compact || coarse ? 820 : 1000) + 'vh';
    await Promise.all([loadTextures(), loadFonts()]);
    buildThreshold();
    buildThread();
    buildHouse();
    buildGlance();
    buildAtelier();
    buildCatalogue();
    buildGallery();
    buildJourney();
    buildVows();
    buildAscent();
    buildRing();
    buildEditorials();
    const dustBase = coarse || compact ? 1200 : 2400;
    buildDust(dustBase);                                            // fine gold motes
    buildDust(Math.round(dustBase / 3), 3.1, 0.32, 0.45, [1.0, 0.72, 0.66]); // rose-petal bokeh layer
    resize();
    // honour deep link
    const hash = location.hash.replace('#', '');
    if (hash && zoneById[hash]) {
      const z = zoneById[hash];
      setScrollFromT(hash === 'threshold' ? 0 : hash === 'ring' ? 0.985 : (z.t0 + z.t1) / 2, true);
    } else {
      readScroll();
      progress = target;
    }
    // debug/verification handle
    window.__SIRINI = {
      get progress() { return progress; },
      seek: (t) => setScrollFromT(t, true),
      tick: () => tick(performance.now()),
      zones: ZONES,
      probe: (x, y) => {
        pointer.x = (x / innerWidth) * 2 - 1;
        pointer.y = -(y / innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(photoMeshes, false);
        return hits.length ? hits[0].object.userData.galleryIndex : -1;
      },
      open: (i) => openLightbox(i),
    };
    booted = true;
    requestAnimationFrame(loop);
    veil.classList.add('gone');
  } catch (err) {
    console.error('[SIRINI] boot failed', err);
    enterFallback(err && err.message ? err.message : 'boot error');
  }
}

boot();

})();

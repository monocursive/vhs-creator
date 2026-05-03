/* global React, ReactDOM, VHS, VHSLayer, VHSLayerToolbar */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const {
  SLEEVE_W, SLEEVE_H,
  VERSO_W, TRANCHE_W, RECTO_W,
  VERSO_X, TRANCHE_X, RECTO_X,
  THEMES, LOGOS, RATINGS,
  txt, img, shape, newId, seedLayers,
} = VHS;

/* ─────────── Layouts ─────────── */
const LAYOUTS = {
  classic: { name: 'Classique', describe: 'Affiche grande, titre dessous' },
  bigtype: { name: 'Gros titre', describe: 'Titre énorme par-dessus' },
  poster:  { name: 'Affiche', describe: 'Image plein cadre' },
  split:   { name: 'Split', describe: 'Bandeau coloré + texte' },
};

function applyLayout(layoutKey, themeKey, currentLayers) {
  const t = THEMES[themeKey];
  // Keep verso (back) layers and spine; rebuild RECTO
  const keep = currentLayers.filter((l) => l.x < RECTO_X);
  const reuseTitle = currentLayers.find((l) => l.kind === 'text' && l.x >= RECTO_X && l.size > 60)?.text || 'TITRE\nDU FILM';
  const reuseTagline = currentLayers.find((l) => l.kind === 'text' && l.x >= RECTO_X && l.size <= 18 && l.size >= 14)?.text || 'UNE NUIT, TOUT BASCULE';
  const reusePoster = currentLayers.find((l) => l.kind === 'image' && l.x >= RECTO_X && l.src !== 'assets/template/jaquette.png');
  const posterSrc = reusePoster?.src || '__poster_placeholder';

  let next = [];
  if (layoutKey === 'classic') {
    next = [
      img({ x: RECTO_X + 30, y: 60, w: RECTO_W - 60, h: 460, src: posterSrc }),
      txt({ x: RECTO_X + 24, y: 540, w: RECTO_W - 48, h: 110, text: reuseTitle, size: 92, font: t.titleFont, color: t.titleColor, shadow: t.titleShadow, align: 'center', letterSpacing: 2, lineHeight: 0.92 }),
      txt({ x: RECTO_X + 40, y: 656, w: RECTO_W - 80, h: 30, text: reuseTagline, size: 16, font: t.bodyFont, color: t.accent, align: 'center', letterSpacing: 4 }),
      txt({ x: RECTO_X + 40, y: 716, w: RECTO_W - 80, h: 20, text: 'UN FILM DE  PRÉNOM NOM', size: 12, font: t.titleFont, color: t.bodyColor, align: 'center', letterSpacing: 3 }),
    ];
  } else if (layoutKey === 'bigtype') {
    next = [
      img({ x: RECTO_X + 20, y: 30, w: RECTO_W - 40, h: SLEEVE_H - 60, src: posterSrc }),
      shape({ x: RECTO_X, y: SLEEVE_H - 280, w: RECTO_W, h: 280, color: '#000000', opacity: 0.45 }),
      txt({ x: RECTO_X + 20, y: SLEEVE_H - 240, w: RECTO_W - 40, h: 180, text: reuseTitle, size: 132, font: t.titleFont, color: t.titleColor, shadow: t.titleShadow, align: 'center', letterSpacing: 4, lineHeight: 0.85 }),
      txt({ x: RECTO_X + 40, y: SLEEVE_H - 50, w: RECTO_W - 80, h: 22, text: reuseTagline, size: 14, font: t.bodyFont, color: t.accent, align: 'center', letterSpacing: 4 }),
    ];
  } else if (layoutKey === 'poster') {
    next = [
      img({ x: RECTO_X, y: 0, w: RECTO_W, h: SLEEVE_H, src: posterSrc }),
      txt({ x: RECTO_X + 20, y: 40, w: RECTO_W - 40, h: 120, text: reuseTitle, size: 78, font: t.titleFont, color: t.titleColor, shadow: t.titleShadow, align: 'center', letterSpacing: 2, lineHeight: 0.92 }),
      txt({ x: RECTO_X + 40, y: SLEEVE_H - 70, w: RECTO_W - 80, h: 22, text: reuseTagline, size: 14, font: t.bodyFont, color: t.accent, align: 'center', letterSpacing: 4 }),
    ];
  } else if (layoutKey === 'split') {
    next = [
      shape({ x: RECTO_X, y: 0, w: RECTO_W, h: 360, color: t.secondary, opacity: 1 }),
      img({ x: RECTO_X + 60, y: 50, w: RECTO_W - 120, h: 280, src: posterSrc }),
      txt({ x: RECTO_X + 20, y: 380, w: RECTO_W - 40, h: 220, text: reuseTitle, size: 120, font: t.titleFont, color: t.titleColor, shadow: t.titleShadow, align: 'center', letterSpacing: 2, lineHeight: 0.88 }),
      txt({ x: RECTO_X + 40, y: 620, w: RECTO_W - 80, h: 30, text: reuseTagline, size: 16, font: t.bodyFont, color: t.accent, align: 'center', letterSpacing: 4 }),
      txt({ x: RECTO_X + 40, y: 680, w: RECTO_W - 80, h: 20, text: 'UN FILM DE  PRÉNOM NOM', size: 12, font: t.titleFont, color: t.bodyColor, align: 'center', letterSpacing: 3 }),
    ];
  }
  return [...keep, ...next];
}

/* ─────────── Barcode SVG ─────────── */
function Barcode() {
  const bars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 50; i++) {
      arr.push(0.6 + Math.random() * 1.8);
    }
    return arr;
  }, []);
  return (
    <svg width="100%" height="100%" viewBox="0 0 110 50" preserveAspectRatio="none">
      <rect x="0" y="0" width="110" height="50" fill="#fff" />
      {(() => {
        let x = 4;
        return bars.map((w, i) => {
          const r = <rect key={i} x={x} y="4" width={w} height="36" fill="#000" />;
          x += w + 0.6;
          return r;
        });
      })()}
      <text x="55" y="48" fontSize="6" textAnchor="middle" fontFamily="VT323, monospace" fill="#000">3 661 234 567 891</text>
    </svg>
  );
}

/* ─────────── Decor (per-theme atmospheric backdrop) ─────────── */
function ThemeDecor({ theme, panel }) {
  /* ─── NEON: chrome sun + perspective grid + palm silhouettes ─── */
  if (theme.decor === 'grid' && panel === 'recto') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 456 776" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffae6" />
            <stop offset="0.35" stopColor="#ffd84a" />
            <stop offset="0.7" stopColor="#ff5d4a" />
            <stop offset="1" stopColor="#b91776" />
          </linearGradient>
          <linearGradient id="sunMask" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.66" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.76" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.8" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.86" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.9" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.96" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="sunSlice"><rect width="456" height="776" fill="url(#sunMask)" /></mask>
        </defs>
        {/* sun glow */}
        <ellipse cx="228" cy="440" rx="170" ry="60" fill="#ff2d8a" opacity="0.35" />
        {/* sun disk with horizontal slits */}
        <circle cx="228" cy="430" r="110" fill="url(#sunGrad)" mask="url(#sunSlice)" />
        {/* perspective grid */}
        <g style={{ mixBlendMode: 'screen' }}>
          {Array.from({ length: 11 }).map((_, i) => {
            const t = i / 10;
            const y = 540 + Math.pow(t, 1.7) * 236;
            return <line key={`h${i}`} x1="-100" x2="556" y1={y} y2={y} stroke="#ff2d8a" strokeWidth={0.6 + i * 0.18} opacity={0.55 + i * 0.04} />;
          })}
          {Array.from({ length: 25 }).map((_, i) => {
            const t = (i - 12) / 12;
            return <line key={`v${i}`} x1="228" y1="540" x2={228 + t * 1000} y2="780" stroke="#ff2d8a" strokeWidth="0.7" opacity="0.55" />;
          })}
        </g>
        {/* palm silhouettes (left + right) */}
        <g fill="#0a0014" opacity="0.95">
          <path d="M30 540 L36 540 L34 470 Q 14 460 4 470 Q 18 462 33 466 Q 12 446 0 452 Q 18 444 33 460 Q 16 426 6 432 Q 22 422 35 456 Q 36 426 40 422 Q 42 446 36 462 Q 50 440 64 442 Q 52 450 36 466 Q 56 458 70 466 Q 56 462 36 472 Z" />
          <path d="M420 540 L426 540 L424 470 Q 444 462 454 470 Q 440 462 425 466 Q 446 446 456 452 Q 440 444 425 460 Q 442 426 452 432 Q 436 422 423 456 Q 422 426 418 422 Q 416 446 422 462 Q 408 440 394 442 Q 406 450 422 466 Q 402 458 388 466 Q 402 462 422 472 Z" />
        </g>
      </svg>
    );
  }
  if (theme.decor === 'grid' && panel === 'verso') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 456 776" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <g style={{ mixBlendMode: 'screen' }} opacity="0.5">
          {Array.from({ length: 8 }).map((_, i) => {
            const t = i / 7;
            const y = 580 + Math.pow(t, 1.7) * 196;
            return <line key={`h${i}`} x1="0" x2="456" y1={y} y2={y} stroke="#1bf0ff" strokeWidth={0.5 + i * 0.15} opacity={0.45 + i * 0.05} />;
          })}
          {Array.from({ length: 17 }).map((_, i) => {
            const t = (i - 8) / 8;
            return <line key={`v${i}`} x1="228" y1="580" x2={228 + t * 700} y2="780" stroke="#1bf0ff" strokeWidth="0.5" opacity="0.4" />;
          })}
        </g>
      </svg>
    );
  }

  /* ─── SCI-FI: starfield + planet ring + nebula clouds ─── */
  if (theme.decor === 'stars') {
    const stars = useMemo(() => Array.from({ length: panel === 'recto' ? 110 : 80 }).map(() => ({
      x: Math.random() * 456,
      y: Math.random() * 776,
      r: Math.random() * 1.6 + 0.15,
      o: 0.35 + Math.random() * 0.65,
    })), [panel]);
    return (
      <svg width="100%" height="100%" viewBox="0 0 456 776" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* nebula puffs */}
        <defs>
          <radialGradient id={`nebA-${panel}`}><stop offset="0" stopColor="#ff7a3a" stopOpacity="0.45" /><stop offset="1" stopColor="#ff7a3a" stopOpacity="0" /></radialGradient>
          <radialGradient id={`nebB-${panel}`}><stop offset="0" stopColor="#7adfff" stopOpacity="0.35" /><stop offset="1" stopColor="#7adfff" stopOpacity="0" /></radialGradient>
          <radialGradient id={`nebC-${panel}`}><stop offset="0" stopColor="#c1396a" stopOpacity="0.5" /><stop offset="1" stopColor="#c1396a" stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse cx={panel === 'recto' ? 340 : 100} cy="200" rx="200" ry="140" fill={`url(#nebA-${panel})`} />
        <ellipse cx={panel === 'recto' ? 90 : 380} cy="600" rx="170" ry="120" fill={`url(#nebB-${panel})`} />
        <ellipse cx="228" cy="450" rx="220" ry="140" fill={`url(#nebC-${panel})`} />
        {/* stars */}
        {stars.map((s, i) => (<circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />))}
        {/* big star with cross flare */}
        {panel === 'recto' && (
          <g transform="translate(360,140)" opacity="0.95">
            <circle r="3" fill="#fffae6" />
            <line x1="-30" x2="30" y1="0" y2="0" stroke="#fffae6" strokeWidth="0.6" />
            <line x1="0" x2="0" y1="-30" y2="30" stroke="#fffae6" strokeWidth="0.6" />
          </g>
        )}
      </svg>
    );
  }

  /* ─── RENTAL: starburst banner + corner price tag ─── */
  if (theme.decor === 'sticker' && panel === 'recto') {
    return (
      <>
        <svg width="120" height="120" viewBox="0 0 100 100" style={{ position: 'absolute', top: 8, right: 8, transform: 'rotate(-12deg)', pointerEvents: 'none' }}>
          {/* 16-point starburst */}
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const r1 = 48, r2 = 36;
            return <path key={i}
              d={`M50 50 L ${50 + Math.cos(a) * r1} ${50 + Math.sin(a) * r1} L ${50 + Math.cos(a + Math.PI / 16) * r2} ${50 + Math.sin(a + Math.PI / 16) * r2} Z`}
              fill="#ffe357" stroke="#1a0a00" strokeWidth="0.8" />;
          })}
          <circle cx="50" cy="50" r="32" fill="#d23218" stroke="#1a0a00" strokeWidth="1.2" />
          <text x="50" y="44" textAnchor="middle" fontFamily="'Bungee Shade', sans-serif" fontSize="11" fill="#fffae6" fontWeight="700" letterSpacing="0.5">NOUVEAU</text>
          <text x="50" y="58" textAnchor="middle" fontFamily="'VT323', monospace" fontSize="9" fill="#fffae6" letterSpacing="2">EN VIDÉO</text>
          <text x="50" y="68" textAnchor="middle" fontFamily="'VT323', monospace" fontSize="6" fill="#ffe357" letterSpacing="1">★ ★ ★ ★ ★</text>
        </svg>
        {/* spine band of color at bottom */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 22,
          background: 'repeating-linear-gradient(90deg, #d23218 0 30px, #fff4d6 30px 32px, #0e5740 32px 62px, #fff4d6 62px 64px)',
          opacity: 0.85, pointerEvents: 'none' }} />
      </>
    );
  }
  if (theme.decor === 'sticker' && panel === 'verso') {
    return (
      <div style={{ position: 'absolute', left: 16, top: 14, pointerEvents: 'none', transform: 'rotate(-3deg)' }}>
        <div style={{
          background: '#fff4d6', color: '#1a0a00',
          padding: '4px 8px',
          fontFamily: 'Courier New, monospace',
          fontSize: 10, letterSpacing: 1.5,
          border: '1px dashed #1a0a00',
          boxShadow: '2px 2px 0 #d23218',
        }}>N° K-7384 · DURÉE 96 MIN · COULEUR · VOSTFR</div>
      </div>
    );
  }

  /* ─── HORROR: blood drips + claw scratches ─── */
  if (theme.decor === 'drips' && panel === 'recto') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 456 776" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* blood pooling at top, dripping down */}
        <path d="M0 0 L 456 0 L 456 50
          C 440 90 430 60 420 80 C 410 110 400 70 386 92
          C 376 132 366 84 348 100 C 338 150 326 92 312 112
          C 300 160 286 110 270 130 C 256 180 242 120 226 138
          C 214 178 198 110 182 130 C 168 178 154 118 138 138
          C 124 178 108 122 92 138 C 80 168 64 110 50 130
          C 38 158 22 100 8 122 L 0 100 Z"
          fill="#c8141a" />
        <path d="M0 0 L 456 0 L 456 30 L 0 25 Z" fill="#5a0a05" opacity="0.6" />
        {/* drip elongations */}
        {[60, 140, 230, 310, 390].map((x, i) => (
          <ellipse key={i} cx={x} cy={120 + i * 12} rx="6" ry="22" fill="#c8141a" opacity="0.85" />
        ))}
        {/* claw scratches */}
        <g stroke="#000" strokeWidth="2.5" opacity="0.55" fill="none">
          <path d="M30 320 Q 80 350 130 360" />
          <path d="M50 350 Q 100 380 160 388" />
          <path d="M70 380 Q 120 410 180 416" />
          <path d="M90 410 Q 140 440 200 444" />
        </g>
      </svg>
    );
  }
  if (theme.decor === 'drips' && panel === 'verso') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 456 776" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* splatter */}
        <g fill="#c8141a" opacity="0.7">
          <circle cx="380" cy="80" r="22" />
          <circle cx="410" cy="110" r="6" />
          <circle cx="356" cy="106" r="4" />
          <circle cx="396" cy="50" r="3" />
          <ellipse cx="420" cy="92" rx="3" ry="9" />
        </g>
        {/* edge tear */}
        <path d="M0 776 L 456 776 L 456 740 L 430 760 L 410 730 L 380 754 L 350 728 L 320 752 L 290 730 L 260 754 L 230 728 L 200 752 L 170 730 L 140 754 L 110 728 L 80 752 L 50 730 L 20 754 L 0 730 Z"
          fill="#0a0102" opacity="0.6" />
      </svg>
    );
  }
  return null;
}

/* Paper grain (cream flecks for rental, soft noise for horror) */
function PaperFlecks({ theme }) {
  if (!theme.paperFlecks) return null;
  const flecks = useMemo(() => Array.from({ length: 220 }).map(() => ({
    x: Math.random() * 1032, y: Math.random() * 776,
    r: Math.random() * 0.9 + 0.2,
    o: Math.random() * 0.5 + 0.1,
  })), []);
  const color = theme.label === 'VIDÉOCLUB' ? '#3a1a05' : '#000';
  return (
    <svg width="100%" height="100%" viewBox="0 0 1032 776" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply', opacity: 0.5 }}>
      {flecks.map((f, i) => (<circle key={i} cx={f.x} cy={f.y} r={f.r} fill={color} opacity={f.o} />))}
    </svg>
  );
}

/* Halftone overlay — magazine printing dots */
function Halftone({ kind }) {
  if (!kind || kind === 'none') return null;
  const palette = {
    warm:  { dot: '#d23218', size: 3, spacing: 8, blend: 'multiply', op: 0.18 },
    cool:  { dot: '#7adfff', size: 2, spacing: 7, blend: 'screen', op: 0.16 },
    blood: { dot: '#5a0a05', size: 2.5, spacing: 9, blend: 'multiply', op: 0.35 },
  }[kind];
  if (!palette) return null;
  const id = `ht-${kind}`;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1032 776" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: palette.blend, opacity: palette.op }}>
      <defs>
        <pattern id={id} x="0" y="0" width={palette.spacing} height={palette.spacing} patternUnits="userSpaceOnUse">
          <circle cx={palette.spacing / 2} cy={palette.spacing / 2} r={palette.size / 2} fill={palette.dot} />
        </pattern>
      </defs>
      <rect width="1032" height="776" fill={`url(#${id})`} />
    </svg>
  );
}

/* ─────────── Mini-preview SVGs for theme/layout pickers ─────────── */
function ThemePreview({ themeKey }) {
  const t = THEMES[themeKey];
  return (
    <div style={{ position: 'absolute', inset: 0, background: t.bg }}>
      <div style={{ position: 'absolute', left: '15%', top: '15%', right: '15%', bottom: '40%',
        background: t.posterPlaceholderBg, border: '1px solid rgba(0,0,0,.2)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '10%', textAlign: 'center',
        color: t.titleColor, fontFamily: t.titleFont, fontSize: 16, letterSpacing: 1,
        textShadow: t.titleShadow, fontWeight: 700 }}>TITRE</div>
    </div>
  );
}
function LayoutPreview({ layoutKey }) {
  const styles = {
    classic: (
      <>
        <div style={{ position: 'absolute', left: 6, right: 6, top: 6, height: '60%', background: '#3a1f5e' }} />
        <div style={{ position: 'absolute', left: 6, right: 6, bottom: '18%', height: 14, background: '#ffe357' }} />
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: '8%', height: 4, background: '#00e0ff' }} />
      </>
    ),
    bigtype: (
      <>
        <div style={{ position: 'absolute', inset: 6, background: '#3a1f5e' }} />
        <div style={{ position: 'absolute', left: 6, right: 6, bottom: 6, height: '40%', background: 'linear-gradient(180deg, transparent, #000a)' }} />
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: '20%', height: 22, background: '#ffe357' }} />
      </>
    ),
    poster: (
      <>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #ff2d8a, #00e0ff)' }} />
        <div style={{ position: 'absolute', left: 8, right: 8, top: 8, height: 14, background: '#ffe357' }} />
      </>
    ),
    split: (
      <>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50%', background: '#ff2d8a' }} />
        <div style={{ position: 'absolute', left: '20%', right: '20%', top: '12%', height: '32%', background: '#1a0e2a' }} />
        <div style={{ position: 'absolute', left: 6, right: 6, top: '58%', height: '20%', background: '#ffe357' }} />
      </>
    ),
  };
  return <div style={{ position: 'absolute', inset: 0 }}>{styles[layoutKey]}</div>;
}

/* ─────────── App ─────────── */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "scanlineIntensity": 0.35,
  "grainIntensity": 0.4,
  "aberration": true,
  "vignette": true,
  "accent": "#00f0ff",
  "titleFont": "'SF Movie Poster Cond', 'Impact', sans-serif",
  "density": "comfy"
}/*EDITMODE-END*/;

function App() {
  const [theme, setTheme] = useState('neon');
  const [layout, setLayout] = useState('classic');
  const [layers, setLayers] = useState(() => seedLayers('neon'));
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(null); // 'left' | 'right' | null
  const [showGuides, setShowGuides] = useState(false);

  /* enabled audio/age logos */
  const [enabledLogos, setEnabledLogos] = useState({ thx: true, hifi: true, cinemascope: true });
  const [rating, setRating] = useState('tous');
  const [showBarcode, setShowBarcode] = useState(true);

  /* effects */
  const [tweaks, setTweaks] = useState(() => ({ ...TWEAK_DEFAULTS }));

  const sleeveRef = useRef(null);
  const stageRef = useRef(null);

  const T = THEMES[theme];

  /* ─── Theme switch: re-color text layers ─── */
  useEffect(() => {
    setLayers((prev) => prev.map((l) => {
      if (l.kind !== 'text') return l;
      // Heuristic: title = big, accent = letter-spaced small accent-colored
      const isTitle = l.size >= 60;
      const isAccent = !isTitle && l.size <= 20 && (l.letterSpacing >= 4);
      return {
        ...l,
        font: isTitle ? T.titleFont : l.font.includes('SF Movie Poster') && !isTitle ? l.font : (isAccent ? T.bodyFont : l.font),
        color: isTitle ? T.titleColor : isAccent ? T.accent : T.bodyColor,
        shadow: isTitle ? T.titleShadow : '',
      };
    }));
  }, [theme]);

  /* ─── History ─── */
  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-30), layers]);
    setFuture([]);
  }, [layers]);

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [layers, ...f]);
      setLayers(prev);
      return h.slice(0, -1);
    });
  };
  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setHistory((h) => [...h, layers]);
      setLayers(next);
      return f.slice(1);
    });
  };

  /* ─── Auto-fit zoom ─── */
  useEffect(() => {
    if (!autoFit) return;
    const fit = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      const margin = 40;
      const sx = (r.width - margin) / SLEEVE_W;
      const sy = (r.height - margin) / SLEEVE_H;
      setZoom(Math.max(0.15, Math.min(1.5, Math.min(sx, sy))));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [autoFit]);

  /* ─── Layer ops ─── */
  const updateLayer = (id, patch) => {
    setLayers((ls) => ls.map((l) => l.id === id ? { ...l, ...patch } : l));
  };
  const commit = () => {
    // Only committed; we already updated layers live. Push current as new history entry.
    setHistory((h) => [...h.slice(-30), layers]);
    setFuture([]);
  };
  const removeLayer = (id) => {
    pushHistory();
    setLayers((ls) => ls.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };
  const duplicateLayer = (id) => {
    pushHistory();
    setLayers((ls) => {
      const idx = ls.findIndex((l) => l.id === id);
      if (idx < 0) return ls;
      const copy = { ...ls[idx], id: newId(ls[idx].kind[0]), x: ls[idx].x + 20, y: ls[idx].y + 20 };
      return [...ls, copy];
    });
  };
  const moveLayerOrder = (id, dir) => {
    pushHistory();
    setLayers((ls) => {
      const idx = ls.findIndex((l) => l.id === id);
      if (idx < 0) return ls;
      const newIdx = Math.max(0, Math.min(ls.length - 1, idx + dir));
      const next = [...ls];
      const [item] = next.splice(idx, 1);
      next.splice(newIdx, 0, item);
      return next;
    });
  };

  const addText = () => {
    pushHistory();
    const l = txt({ x: VERSO_X + 60, y: 200, w: 320, h: 60, text: 'NOUVEAU TEXTE', size: 36, font: T.titleFont, color: T.bodyColor, align: 'center', letterSpacing: 2 });
    setLayers((ls) => [...ls, l]);
    setSelectedId(l.id);
  };
  const addLogo = (key) => {
    pushHistory();
    const lg = LOGOS[key];
    const l = img({ x: VERSO_X + 40, y: SLEEVE_H - 200, w: 90, h: 60, src: lg.src });
    setLayers((ls) => [...ls, l]);
    setSelectedId(l.id);
  };

  /* ─── Image upload ─── */
  const fileInputRef = useRef(null);
  const onUploadImage = () => fileInputRef.current?.click();
  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      pushHistory();
      // Replace placeholder in selected RECTO image, otherwise add new layer
      setLayers((ls) => {
        const placeholder = ls.find((l) => l.kind === 'image' && l.src === '__poster_placeholder');
        if (placeholder) {
          return ls.map((l) => l.id === placeholder.id ? { ...l, src: dataUrl } : l);
        }
        const newL = img({ x: RECTO_X + 60, y: 100, w: 340, h: 340, src: dataUrl });
        return [...ls, newL];
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ─── Logo toggles → manage layers ─── */
  useEffect(() => {
    const logoLayerKey = (key) => `__logo_${key}`;
    setLayers((ls) => {
      let next = ls.filter((l) => !l.tag || !l.tag.startsWith('__logo_'));
      const enabled = Object.entries(enabledLogos).filter(([, v]) => v).map(([k]) => k);
      // bottom-right corner of recto, in a row
      const rectoRight = RECTO_X + RECTO_W - 16;
      const baseY = SLEEVE_H - 64;
      enabled.forEach((key, i) => {
        const lg = LOGOS[key];
        const w = 70, h = 30;
        const x = rectoRight - (i + 1) * (w + 8);
        next = [...next, { ...img({ x, y: baseY, w, h, src: lg.src }), tag: logoLayerKey(key), opacity: 0.95 }];
      });
      return next;
    });
  }, [enabledLogos]);

  /* ─── Rating layer ─── */
  useEffect(() => {
    setLayers((ls) => {
      const next = ls.filter((l) => !l.tag || l.tag !== '__rating');
      const r = RATINGS.find((x) => x.key === rating);
      if (!r) return next;
      const layer = { ...img({ x: VERSO_X + 30, y: SLEEVE_H - 230, w: 90, h: 90, src: r.src }), tag: '__rating' };
      return [...next, layer];
    });
  }, [rating]);

  /* ─── Barcode layer (SVG → use a special layer with src='__barcode') ─── */
  useEffect(() => {
    setLayers((ls) => {
      const filtered = ls.filter((l) => !l.tag || l.tag !== '__barcode');
      if (!showBarcode) return filtered;
      const layer = { id: newId('bc'), kind: 'barcode', tag: '__barcode',
        x: VERSO_X + VERSO_W - 130, y: SLEEVE_H - 100, w: 110, h: 50, rotation: 0, opacity: 1 };
      return [...filtered, layer];
    });
  }, [showBarcode]);

  /* ─── Layout switch ─── */
  const onSelectLayout = (key) => {
    pushHistory();
    setLayout(key);
    setLayers((ls) => applyLayout(key, theme, ls));
  };

  const selected = layers.find((l) => l.id === selectedId);

  /* ─── Keyboard ─── */
  useEffect(() => {
    const onKey = (e) => {
      if (editingId) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) { e.preventDefault(); removeLayer(selectedId); }
      }
      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        updateLayer(selectedId, { x: selected.x + dx, y: selected.y + dy });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, selected, editingId, layers]);

  /* ─── Export PNG ─── */
  const exportPNG = async () => {
    const node = sleeveRef.current;
    if (!node) return;
    setSelectedId(null);
    setEditingId(null);
    await new Promise((r) => setTimeout(r, 30));
    // Use html2canvas if available
    if (typeof window.html2canvas === 'function') {
      const c = await window.html2canvas(node, { scale: 2, backgroundColor: null, useCORS: true });
      const link = document.createElement('a');
      link.download = 'jaquette-vhs.png';
      link.href = c.toDataURL('image/png');
      link.click();
    } else {
      alert('Module export en cours de chargement, réessayez dans une seconde.');
    }
  };

  /* ─── Export PDF (via jsPDF if available) ─── */
  const exportPDF = async () => {
    const node = sleeveRef.current;
    if (!node) return;
    setSelectedId(null);
    setEditingId(null);
    await new Promise((r) => setTimeout(r, 30));
    if (typeof window.html2canvas !== 'function' || !window.jspdf) {
      alert('Module export en cours de chargement, réessayez dans une seconde.');
      return;
    }
    const c = await window.html2canvas(node, { scale: 3, backgroundColor: null, useCORS: true });
    const { jsPDF } = window.jspdf;
    // 258 × 194 mm
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [258, 194] });
    pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 258, 194);
    pdf.save('jaquette-vhs.pdf');
  };

  /* ─── Render layers (special-case barcode) ─── */
  const renderLayer = (l) => {
    if (l.kind === 'barcode') {
      return (
        <div
          key={l.id}
          className="layer"
          data-selected={selectedId === l.id}
          style={{ position: 'absolute', left: l.x, top: l.y, width: l.w, height: l.h, transform: l.rotation ? `rotate(${l.rotation}deg)` : undefined, background: '#fff' }}
          onPointerDown={(e) => {
            e.stopPropagation(); e.preventDefault();
            setSelectedId(l.id);
            const start = { x: e.clientX, y: e.clientY, ox: l.x, oy: l.y };
            const move = (ev) => {
              updateLayer(l.id, { x: start.ox + (ev.clientX - start.x) / zoom, y: start.oy + (ev.clientY - start.y) / zoom });
            };
            const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); commit(); };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
          }}
        >
          <Barcode />
        </div>
      );
    }
    return (
      <VHSLayer
        key={l.id}
        layer={l}
        selected={selectedId === l.id}
        editing={editingId === l.id}
        onSelect={(id) => { setSelectedId(id); }}
        onChange={(patch) => updateLayer(l.id, patch)}
        onCommit={commit}
        onStartEdit={(id) => setEditingId(id)}
        onEndEdit={() => setEditingId(null)}
        scale={zoom}
      />
    );
  };

  /* ─── Tweaks Panel ─── */
  const TweaksPanel = window.TweaksPanel;
  const TweakSection = window.TweakSection;
  const TweakSlider = window.TweakSlider;
  const TweakToggle = window.TweakToggle;
  const TweakSelect = window.TweakSelect;
  const TweakColor = window.TweakColor;
  const TweakRadio = window.TweakRadio;
  const useTweaks = window.useTweaks;

  const tweaksHook = useTweaks ? useTweaks(TWEAK_DEFAULTS) : null;
  useEffect(() => { if (tweaksHook) setTweaks(tweaksHook[0]); }, [tweaksHook?.[0]]);
  const setTweak = tweaksHook?.[1];

  return (
    <div className={`app density-${tweaks.density}`}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFile} hidden />

      {/* TOP BAR */}
      <header className="topbar">
        <div className="brand">
          <span className="brand__logo">VHS STUDIO</span>
          <span className="brand__sub">REC ●</span>
        </div>
        <div className="topbar__festival">
          <small>Concours 2026</small>
          <strong>CONTRE-FICTIONS · BOSKOP · LES INTERGALACTIQUES</strong>
        </div>
        <div className="topbar__spacer" />
        <button className="topbar__action topbar__action--secondary" onClick={undo} title="Annuler (⌘Z)">↺ Annuler</button>
        <button className="topbar__action topbar__action--secondary" onClick={redo} title="Refaire (⇧⌘Z)">↻ Refaire</button>
        <button className="topbar__action topbar__action--secondary" onClick={() => setShowGuides((s) => !s)}>
          {showGuides ? '◉' : '○'} Repères
        </button>
        <button className="topbar__action" onClick={exportPNG}>↓ PNG</button>
        <button className="topbar__action topbar__action--primary" onClick={exportPDF}>↓ PDF impression</button>
      </header>

      {/* LEFT RAIL */}
      <aside className="rail rail--left" data-open={mobileOpen === 'left'}>
        <div className="section">
          <div className="section__head"><span className="section__dot" /><span className="section__title">Thème</span></div>
          <div className="themes">
            {Object.keys(THEMES).map((k) => (
              <button key={k} className="theme" data-active={theme === k} onClick={() => { pushHistory(); setTheme(k); }}>
                <ThemePreview themeKey={k} />
                <span className="theme__label">{THEMES[k].label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section__head"><span className="section__dot" /><span className="section__title">Mise en page</span></div>
          <div className="layouts">
            {Object.keys(LAYOUTS).map((k) => (
              <button key={k} className="layout" data-active={layout === k} onClick={() => onSelectLayout(k)}>
                <LayoutPreview layoutKey={k} />
                <span className="layout__name">{LAYOUTS[k].name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section__head"><span className="section__dot" /><span className="section__title">Affiche</span></div>
          <button className="btn btn--neon" onClick={onUploadImage}>↥ Importer une image</button>
          <div style={{ height: 8 }} />
          <button className="btn btn--ghost" onClick={addText}>+ Ajouter du texte</button>
        </div>

        <div className="section">
          <div className="section__head"><span className="section__dot" /><span className="section__title">Logos audio / vidéo</span></div>
          <div className="toggles">
            {[['thx', 'THX'], ['dolby', 'Dolby'], ['hifi', 'HiFi'], ['cinemascope', 'Scope'], ['vhsHifi', 'VHS HiFi'], ['vhsNoir', 'VHS']].map(([k, label]) => (
              <button key={k} className="toggle" data-on={!!enabledLogos[k]}
                onClick={() => setEnabledLogos((m) => ({ ...m, [k]: !m[k] }))}>
                <span className="toggle__led" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section__head"><span className="section__dot" /><span className="section__title">Classification</span></div>
          <div className="ratings">
            {RATINGS.map((r) => (
              <button key={r.key} className="rating" data-active={rating === r.key} title={r.label}
                onClick={() => setRating(r.key === rating ? null : r.key)}>
                <img src={r.src} alt={r.label} />
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section__head"><span className="section__dot" /><span className="section__title">Étiquette</span></div>
          <button className="toggle" data-on={showBarcode} onClick={() => setShowBarcode((b) => !b)} style={{ width: '100%' }}>
            <span className="toggle__led" />
            <span>Code-barres</span>
          </button>
        </div>
      </aside>

      {/* STAGE */}
      <main className="stage" ref={stageRef} onPointerDown={() => { setSelectedId(null); setEditingId(null); }}>
        <div className="stage__hint">Cliquez sur un élément pour l'éditer · Double-clic pour modifier le texte</div>

        <div className="sleeve-wrap" style={{ transform: `scale(${zoom})` }} onPointerDown={(e) => e.stopPropagation()}>
          <div
            ref={sleeveRef}
            className="sleeve"
            data-show-guides={showGuides}
            style={{
              background: T.bg,
            }}
          >
            {/* Per-panel decor backdrops */}
            <div style={{ position: 'absolute', left: VERSO_X, top: 0, width: VERSO_W, height: SLEEVE_H, overflow: 'hidden' }}>
              <ThemeDecor theme={T} panel="verso" />
            </div>
            <div style={{ position: 'absolute', left: TRANCHE_X, top: 0, width: TRANCHE_W, height: SLEEVE_H, background: T.spineBg, overflow: 'hidden' }}>
              {/* Spine VHS-tape striping */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '8%', height: 2, background: T.spineColor, opacity: 0.6 }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: '8%', height: 2, background: T.spineColor, opacity: 0.6 }} />
            </div>
            <div style={{ position: 'absolute', left: RECTO_X, top: 0, width: RECTO_W, height: SLEEVE_H, overflow: 'hidden' }}>
              <ThemeDecor theme={T} panel="recto" />
            </div>

            {/* Sleeve-wide texture overlays */}
            <Halftone kind={T.halftone} />
            <PaperFlecks theme={T} />

            {/* Layers */}
            {layers.map(renderLayer)}

            {/* Guides */}
            <div className="sleeve__guide" style={{ left: TRANCHE_X, width: 0 }}>
              <span className="sleeve__guide-label">VERSO</span>
            </div>
            <div className="sleeve__guide" style={{ left: RECTO_X, width: 0 }}>
              <span className="sleeve__guide-label">RECTO</span>
            </div>

            {/* Effects overlays */}
            {tweaks.aberration && <div className="fx-layer fx-aberration" />}
            {tweaks.scanlineIntensity > 0 && (
              <div className="fx-layer fx-scanlines" style={{ opacity: tweaks.scanlineIntensity }} />
            )}
            {tweaks.grainIntensity > 0 && (
              <div className="fx-layer fx-grain" style={{ opacity: tweaks.grainIntensity }} />
            )}
            {tweaks.vignette && <div className="fx-layer fx-vignette" />}
          </div>
        </div>

        {/* Floating layer toolbar */}
        {selected && !editingId && (
          <div style={{ position: 'absolute', left: '50%', top: 0, transform: `translate(calc(-50% + ${(selected.x + selected.w / 2 - SLEEVE_W / 2) * zoom}px), ${selected.y * zoom + 20}px)` }}>
            <VHSLayerToolbar
              layer={selected}
              onChange={(patch) => updateLayer(selected.id, patch)}
              onDelete={() => removeLayer(selected.id)}
              onDuplicate={() => duplicateLayer(selected.id)}
              onForward={() => moveLayerOrder(selected.id, 1)}
              onBackward={() => moveLayerOrder(selected.id, -1)}
              scale={zoom}
            />
          </div>
        )}

        <div className="stage__zoom">
          <button onClick={() => { setAutoFit(false); setZoom((z) => Math.max(0.15, z - 0.1)); }}>−</button>
          <div className="zoomVal">{Math.round(zoom * 100)}%</div>
          <button onClick={() => { setAutoFit(false); setZoom((z) => Math.min(2, z + 0.1)); }}>+</button>
          <button onClick={() => setAutoFit(true)} title="Ajuster">⤢</button>
        </div>
      </main>

      {/* RIGHT RAIL — inspector */}
      <aside className="rail rail--right" data-open={mobileOpen === 'right'}>
        <div className="section">
          <div className="section__head"><span className="section__dot" /><span className="section__title">Inspecteur</span></div>
          {!selected && <div className="inspector-empty">Sélectionnez un élément sur la jaquette</div>}
          {selected && selected.kind === 'text' && (
            <>
              <div className="field">
                <label className="label">Contenu</label>
                <textarea className="textarea" value={selected.text} onChange={(e) => updateLayer(selected.id, { text: e.target.value })} />
              </div>
              <div className="slider-row">
                <label>Taille</label>
                <input type="range" min="8" max="180" value={selected.size} onChange={(e) => updateLayer(selected.id, { size: +e.target.value })} />
                <span className="val">{selected.size}</span>
              </div>
              <div className="slider-row">
                <label>Espace.</label>
                <input type="range" min="0" max="20" value={selected.letterSpacing || 0} onChange={(e) => updateLayer(selected.id, { letterSpacing: +e.target.value })} />
                <span className="val">{selected.letterSpacing || 0}</span>
              </div>
              <div className="slider-row">
                <label>Interlig.</label>
                <input type="range" min="0.7" max="2" step="0.05" value={selected.lineHeight || 1} onChange={(e) => updateLayer(selected.id, { lineHeight: +e.target.value })} />
                <span className="val">{(selected.lineHeight || 1).toFixed(2)}</span>
              </div>
              <div className="slider-row">
                <label>Rotation</label>
                <input type="range" min="-180" max="180" value={selected.rotation || 0} onChange={(e) => updateLayer(selected.id, { rotation: +e.target.value })} />
                <span className="val">{selected.rotation || 0}°</span>
              </div>
            </>
          )}
          {selected && selected.kind === 'image' && (
            <>
              <div className="slider-row">
                <label>Largeur</label>
                <input type="range" min="40" max={SLEEVE_W} value={selected.w} onChange={(e) => updateLayer(selected.id, { w: +e.target.value })} />
                <span className="val">{Math.round(selected.w)}</span>
              </div>
              <div className="slider-row">
                <label>Hauteur</label>
                <input type="range" min="40" max={SLEEVE_H} value={selected.h} onChange={(e) => updateLayer(selected.id, { h: +e.target.value })} />
                <span className="val">{Math.round(selected.h)}</span>
              </div>
              <div className="slider-row">
                <label>Rotation</label>
                <input type="range" min="-180" max="180" value={selected.rotation || 0} onChange={(e) => updateLayer(selected.id, { rotation: +e.target.value })} />
                <span className="val">{selected.rotation || 0}°</span>
              </div>
              <div className="slider-row">
                <label>Opacité</label>
                <input type="range" min="0" max="1" step="0.05" value={selected.opacity ?? 1} onChange={(e) => updateLayer(selected.id, { opacity: +e.target.value })} />
                <span className="val">{Math.round((selected.opacity ?? 1) * 100)}%</span>
              </div>
              <button className="btn btn--ghost" onClick={onUploadImage}>↥ Remplacer l'image</button>
            </>
          )}
          {selected && (
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button className="btn" onClick={() => duplicateLayer(selected.id)}>Dupliquer</button>
              <button className="btn" onClick={() => removeLayer(selected.id)} style={{ color: '#ff5577' }}>Supprimer</button>
            </div>
          )}
        </div>

        <div className="section">
          <div className="section__head"><span className="section__dot" /><span className="section__title">Aide</span></div>
          <div style={{ fontSize: 11, color: '#c8b8e0aa', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 8px' }}>· <b>Cliquer</b> un élément pour le sélectionner</p>
            <p style={{ margin: '0 0 8px' }}>· <b>Double-cliquer</b> un texte pour le modifier</p>
            <p style={{ margin: '0 0 8px' }}>· Faire glisser pour <b>déplacer</b>, coins jaunes pour <b>redimensionner</b></p>
            <p style={{ margin: '0 0 8px' }}>· Pastille bleue au-dessus pour <b>tourner</b></p>
            <p style={{ margin: 0 }}>· <b>⌘Z / ⇧⌘Z</b> Annuler / Refaire</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="mobile-tabs">
        <button className="mobile-tab" data-active={mobileOpen === 'left'} onClick={() => setMobileOpen(mobileOpen === 'left' ? null : 'left')}>Outils</button>
        <button className="mobile-tab" data-active={!mobileOpen} onClick={() => setMobileOpen(null)}>Jaquette</button>
        <button className="mobile-tab" data-active={mobileOpen === 'right'} onClick={() => setMobileOpen(mobileOpen === 'right' ? null : 'right')}>Inspecteur</button>
      </nav>

      {/* Tweaks panel */}
      {TweaksPanel && setTweak && (
        <TweaksPanel title="Tweaks">
          <TweakSection label="Effets VHS">
            <TweakSlider label="Scanlines" value={tweaks.scanlineIntensity} min={0} max={1} step={0.05}
              onChange={(v) => setTweak('scanlineIntensity', v)} />
            <TweakSlider label="Grain" value={tweaks.grainIntensity} min={0} max={1} step={0.05}
              onChange={(v) => setTweak('grainIntensity', v)} />
            <TweakToggle label="Aberration chromatique" value={tweaks.aberration}
              onChange={(v) => setTweak('aberration', v)} />
            <TweakToggle label="Vignettage" value={tweaks.vignette}
              onChange={(v) => setTweak('vignette', v)} />
          </TweakSection>
          <TweakSection label="Densité">
            <TweakRadio label="Contrôles" value={tweaks.density} options={[{ value: 'comfy', label: 'Confort' }, { value: 'compact', label: 'Compact' }]}
              onChange={(v) => setTweak('density', v)} />
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

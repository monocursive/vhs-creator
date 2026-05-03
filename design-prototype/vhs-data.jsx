/* global React */
// Themes, layouts, asset registry, and seed cover content.
// Coordinates are in sleeve-pixel space (1032 × 776).

const SLEEVE_W = 1032;
const SLEEVE_H = 776;
const VERSO_W = 456;
const TRANCHE_W = 120;
const RECTO_W = 456;
const VERSO_X = 0;
const TRANCHE_X = 456;
const RECTO_X = 576;

/* ─────── Themes ─────── */
const THEMES = {
	neon: {
		label: "NÉON",
		sub: "Vapor / Miami",
		/* Sunset gradient with horizon halo + atmospheric haze */
		bg: [
			"radial-gradient(ellipse 70% 35% at 50% 62%, #ffd86b 0%, #ff7a3a 24%, transparent 55%)",
			"radial-gradient(ellipse 90% 55% at 50% 100%, #2a0a4a 0%, transparent 70%)",
			"linear-gradient(180deg, #1b0540 0%, #4a0a6e 28%, #b91776 52%, #ff5d4a 72%, #ffb04a 86%, #ffe48a 100%)",
		].join(", "),
		accent: "#1bf0ff",
		secondary: "#ff2d8a",
		titleColor: "#fffbe9",
		titleShadow:
			"0 0 10px #1bf0ff, 0 0 22px #1bf0ff, 5px 5px 0 #ff2d8a, 6px 6px 0 #5a0099",
		titleFont: "'Audiowide', 'SF Movie Poster Cond', sans-serif",
		bodyColor: "#ffeacc",
		bodyFont: "'VT323', monospace",
		spineBg: "linear-gradient(180deg, #ff2d8a 0%, #b71776 50%, #2a0050 100%)",
		spineColor: "#ffe357",
		decor: "grid",
		chip: "#ffe357",
		posterPlaceholderBg: "linear-gradient(135deg, #00f0ff30, #ff2d8a40)",
		paperFlecks: false,
		halftone: "none",
	},
	rental: {
		label: "VIDÉOCLUB",
		sub: "Pulpe / sticker",
		/* Cream paper with warm spotlight, edge tint */
		bg: [
			"radial-gradient(ellipse 60% 50% at 35% 35%, #fff4d6 0%, transparent 65%)",
			"radial-gradient(ellipse 70% 60% at 80% 90%, #d6a05a40 0%, transparent 70%)",
			"linear-gradient(170deg, #f4e3b6 0%, #e6c98a 60%, #c8a05a 100%)",
		].join(", "),
		accent: "#d23218",
		secondary: "#0e5740",
		titleColor: "#1a0a00",
		titleShadow: "4px 4px 0 #d23218, 5px 5px 0 #1a0a00",
		titleFont: "'Bungee Shade', 'SF Movie Poster Cond', sans-serif",
		bodyColor: "#2a1a0a",
		bodyFont: "'Courier New', 'VT323', monospace",
		spineBg: "linear-gradient(180deg, #d23218 0%, #8a2410 100%)",
		spineColor: "#fff4d6",
		decor: "sticker",
		chip: "#d23218",
		posterPlaceholderBg: "linear-gradient(135deg, #d4b886, #b89860)",
		paperFlecks: true,
		halftone: "warm",
	},
	scifi: {
		label: "SCI-FI",
		sub: "Pulp space-opera",
		/* Cosmic gradient — Foss / Dean-Ellis paperback feel */
		bg: [
			"radial-gradient(circle 280px at 70% 25%, #ffe89a 0%, #ff8a3a 25%, #c1396a 55%, transparent 80%)",
			"radial-gradient(ellipse 90% 80% at 30% 90%, #1a3aa8 0%, transparent 70%)",
			"linear-gradient(165deg, #02030c 0%, #0a1238 30%, #2c1a6e 60%, #5e1a78 85%, #2c0828 100%)",
		].join(", "),
		accent: "#ffd84a",
		secondary: "#7adfff",
		titleColor: "#fff4d6",
		titleShadow: "0 0 18px #ffd84a, 0 0 32px #ff7a3a, 3px 3px 0 #1a0a40",
		titleFont: "'Monoton', 'SF Movie Poster', sans-serif",
		bodyColor: "#d8e2f6",
		bodyFont: "'VT323', monospace",
		spineBg: "linear-gradient(180deg, #2c1a6e 0%, #5e1a78 50%, #02030c 100%)",
		spineColor: "#ffd84a",
		decor: "stars",
		chip: "#ffd84a",
		posterPlaceholderBg: "radial-gradient(circle, #2c1a6e, #02030c)",
		paperFlecks: false,
		halftone: "cool",
	},
	horror: {
		label: "HORREUR",
		sub: "Giallo / slasher",
		/* Deep blood-red with film grain hints */
		bg: [
			"radial-gradient(ellipse 50% 40% at 50% 30%, #2a0a08 0%, transparent 60%)",
			"radial-gradient(ellipse 80% 60% at 50% 110%, #8a1a10 0%, transparent 70%)",
			"linear-gradient(175deg, #0a0102 0%, #1c0506 35%, #3a0a08 70%, #0a0102 100%)",
		].join(", "),
		accent: "#e8c860",
		secondary: "#c8141a",
		titleColor: "#ff1a18",
		titleShadow:
			"0 0 4px #2a0a08, 4px 4px 0 #000, 6px 6px 0 #5a0a05, 0 0 24px #c8141a",
		titleFont: "'Bungee Shade', 'SF Movie Poster', sans-serif",
		bodyColor: "#e8d4a8",
		bodyFont: "'Courier New', 'VT323', monospace",
		spineBg: "linear-gradient(180deg, #c8141a 0%, #5a0a05 50%, #0a0102 100%)",
		spineColor: "#e8c860",
		decor: "drips",
		chip: "#c8141a",
		posterPlaceholderBg: "radial-gradient(circle, #2a0a08, #050000)",
		paperFlecks: true,
		halftone: "blood",
	},
};

/* ─────── Asset registry ─────── */
const LOGOS = {
	thx: { src: "assets/logos/thx.png", label: "THX" },
	dolby: { src: "assets/logos/dolby-surround.png", label: "Dolby Surround" },
	hifi: { src: "assets/logos/hifi.png", label: "HiFi Stereo" },
	vhsHifi: { src: "assets/logos/vhs-hifi-dolby.png", label: "VHS HiFi Dolby" },
	cinemascope: { src: "assets/logos/cinemascope.png", label: "CinemaScope" },
	vhsNoir: { src: "assets/logos/vhs-noir.png", label: "VHS" },
	vhsSecam: { src: "assets/logos/vhs-secam.png", label: "VHS Secam" },
	vhsOld: { src: "assets/logos/vhs-old.png", label: "VHS Old" },
};

const RATINGS = [
	{
		key: "tous",
		src: "assets/ratings/tous-publics.png",
		label: "Tous publics",
	},
	{
		key: "parental",
		src: "assets/ratings/accord-parental.png",
		label: "Accord parental",
	},
	{ key: "i12", src: "assets/ratings/interdit-12.png", label: "Interdit -12" },
	{ key: "i16", src: "assets/ratings/interdit-16.png", label: "Interdit -16" },
	{
		key: "iloc",
		src: "assets/ratings/interdit-location.png",
		label: "Interdit location",
	},
];

/* ─────── Layer factory helpers ─────── */
let _idCounter = 1;
const newId = (prefix) =>
	`${prefix}_${_idCounter++}_${Math.floor(Math.random() * 1e6).toString(36)}`;

function txt({
	x,
	y,
	w,
	h,
	text,
	size = 48,
	font,
	weight = 700,
	color,
	align = "center",
	shadow = "",
	italic = false,
	letterSpacing = 0,
	lineHeight = 1,
	rotation = 0,
}) {
	return {
		id: newId("t"),
		kind: "text",
		x,
		y,
		w,
		h,
		rotation,
		text,
		size,
		font,
		weight,
		color,
		align,
		shadow,
		italic,
		letterSpacing,
		lineHeight,
	};
}
function img({ x, y, w, h, src, rotation = 0, opacity = 1 }) {
	return { id: newId("i"), kind: "image", x, y, w, h, src, rotation, opacity };
}
function shape({
	x,
	y,
	w,
	h,
	color,
	rotation = 0,
	opacity = 1,
	kind = "rect",
}) {
	return {
		id: newId("s"),
		kind: "shape",
		shapeKind: kind,
		x,
		y,
		w,
		h,
		color,
		rotation,
		opacity,
	};
}

/* ─────── Seed sleeve content ─────── */
function seedLayers(themeKey) {
	const t = THEMES[themeKey];
	const titleFont = t.titleFont;
	const bodyFont = t.bodyFont;

	return [
		/* RECTO — front */
		img({
			x: RECTO_X + 30,
			y: 60,
			w: RECTO_W - 60,
			h: 460,
			src: "__poster_placeholder",
			opacity: 1,
		}),
		txt({
			x: RECTO_X + 24,
			y: 540,
			w: RECTO_W - 48,
			h: 110,
			text: "TITRE\nDU FILM",
			size: 92,
			font: titleFont,
			weight: 700,
			color: t.titleColor,
			shadow: t.titleShadow,
			align: "center",
			letterSpacing: 2,
			lineHeight: 0.92,
		}),
		txt({
			x: RECTO_X + 40,
			y: 656,
			w: RECTO_W - 80,
			h: 30,
			text: "UNE NUIT, TOUT BASCULE",
			size: 16,
			font: bodyFont,
			weight: 400,
			color: t.accent,
			align: "center",
			letterSpacing: 4,
		}),
		txt({
			x: RECTO_X + 40,
			y: 690,
			w: RECTO_W - 80,
			h: 22,
			text: "AVEC  ⋅  PRÉNOM NOM  ⋅  PRÉNOM NOM  ⋅  PRÉNOM NOM",
			size: 11,
			font: bodyFont,
			weight: 400,
			color: t.bodyColor,
			align: "center",
			letterSpacing: 2,
		}),
		txt({
			x: RECTO_X + 40,
			y: 716,
			w: RECTO_W - 80,
			h: 20,
			text: "UN FILM DE  PRÉNOM NOM",
			size: 12,
			font: titleFont,
			weight: 700,
			color: t.bodyColor,
			align: "center",
			letterSpacing: 3,
		}),

		/* TRANCHE — spine (rotated text) */
		txt({
			x: TRANCHE_X + 10,
			y: 60,
			w: 100,
			h: 36,
			text: "TITRE DU FILM",
			size: 26,
			font: titleFont,
			weight: 700,
			color: t.spineColor,
			align: "center",
			letterSpacing: 2,
			rotation: 90,
		}),
		txt({
			x: TRANCHE_X + 10,
			y: SLEEVE_H - 130,
			w: 100,
			h: 30,
			text: "NOM RÉAL.",
			size: 14,
			font: bodyFont,
			weight: 400,
			color: t.spineColor,
			align: "center",
			letterSpacing: 2,
			rotation: 90,
		}),

		/* VERSO — back */
		txt({
			x: VERSO_X + 30,
			y: 50,
			w: VERSO_W - 60,
			h: 50,
			text: "SYNOPSIS",
			size: 28,
			font: titleFont,
			weight: 700,
			color: t.accent,
			align: "left",
			letterSpacing: 4,
		}),
		txt({
			x: VERSO_X + 30,
			y: 100,
			w: VERSO_W - 60,
			h: 220,
			text: "Dans une métropole rongée par les pluies acides, une\narchiviste découvre une cassette qui ne devrait pas\nexister. Plus elle la regarde, plus la réalité se brouille.\n\nLe festival CONTRE-FICTIONS vous invite à imaginer\nle film qui se cache sur cette bande magnétique.",
			size: 16,
			font: bodyFont,
			weight: 400,
			color: t.bodyColor,
			align: "left",
			lineHeight: 1.35,
		}),
		img({
			x: VERSO_X + 30,
			y: 340,
			w: 180,
			h: 110,
			src: "assets/template/jaquette.png",
			opacity: 0.0,
		}) /* hidden seed */,
		/* Rating slot — set later */
		txt({
			x: VERSO_X + 30,
			y: SLEEVE_H - 90,
			w: 240,
			h: 30,
			text: "CONTRE-FICTIONS  ⋅  BOSKOP  ⋅  2026",
			size: 12,
			font: bodyFont,
			weight: 400,
			color: t.bodyColor,
			align: "left",
			letterSpacing: 2,
		}),
		txt({
			x: VERSO_X + 30,
			y: SLEEVE_H - 64,
			w: 240,
			h: 24,
			text: "© LES INTERGALACTIQUES",
			size: 10,
			font: bodyFont,
			weight: 400,
			color: t.bodyColor,
			align: "left",
			letterSpacing: 2,
		}),
	];
}

window.VHS = {
	SLEEVE_W,
	SLEEVE_H,
	VERSO_W,
	TRANCHE_W,
	RECTO_W,
	VERSO_X,
	TRANCHE_X,
	RECTO_X,
	THEMES,
	LOGOS,
	RATINGS,
	txt,
	img,
	shape,
	newId,
	seedLayers,
};

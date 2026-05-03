import type { Asset, Theme, ThemeKey, ZoneKey } from "./types";

export const COVER = { w: 258, h: 194 };
export const ZONES: Record<
	ZoneKey,
	{ x: number; y: number; w: number; h: number }
> = {
	back: { x: 0, y: 0, w: 114, h: 194 },
	spine: { x: 114, y: 0, w: 30, h: 194 },
	front: { x: 144, y: 0, w: 114, h: 194 },
};
export const A4 = { w: 297, h: 210 };
export const PRINT_SCALE = 300 / 25.4;
export const EXPORT_W = Math.round(COVER.w * PRINT_SCALE);
export const EXPORT_H = Math.round(COVER.h * PRINT_SCALE);
export const HISTORY_LIMIT = 50;

export const ASSETS: Asset[] = [
	{
		label: "VHS",
		kind: "av",
		src: "/VHS%20LOGO/vhs-2-logo-png-transparent.png",
	},
	{
		label: "VHS old",
		kind: "av",
		src: "/VHS%20LOGO/VHS%20old%20style%20%20-%20transparent.png",
	},
	{
		label: "VHS noir",
		kind: "av",
		src: "/VHS%20LOGO/VHS%20LOGO%20noir%20-%20transparent.png",
	},
	{
		label: "SECAM",
		kind: "av",
		src: "/VHS%20LOGO/Logo%20VHS%20SECAM%20-%20transparent.png",
	},
	{
		label: "Dolby",
		kind: "av",
		src: "/Logo%20AUDIO/Dolby_Surround_Logo-font-transparent.png",
	},
	{
		label: "Dolby long",
		kind: "av",
		src: "/Logo%20AUDIO/dolby_surround_stereo_logo__1985_2001__by_ulises21998_dgrr85n-fullview.png",
	},
	{
		label: "Hi-Fi",
		kind: "av",
		src: "/Logo%20AUDIO/Logo%20HIFI%20-%20transparent.png",
	},
	{ label: "THX", kind: "av", src: "/Logo%20AUDIO/THX_fond-transparent.png" },
	{
		label: "CinemaScope",
		kind: "av",
		src: "/Logo%20Cinemascope/cinemascope-logo-png_transparentpng.png",
	},
	{
		label: "Tous publics",
		kind: "rating",
		src: "/Logos%20Interdictions%20Ages/Tous%20publics.png",
	},
	{
		label: "-12",
		kind: "rating",
		src: "/Logos%20Interdictions%20Ages/Interdit-12ans.png",
	},
	{
		label: "-16",
		kind: "rating",
		src: "/Logos%20Interdictions%20Ages/Interdit-16ans.png",
	},
	{
		label: "Accord parental",
		kind: "rating",
		src: "/Logos%20Interdictions%20Ages/Accord%20Parental.png",
	},
	{
		label: "Interdit location",
		kind: "rating",
		src: "/Logos%20Interdictions%20Ages/Interdit%20a%CC%80%20la%20location.png",
	},
];

export const THEMES: Record<ThemeKey, Theme> = {
	neon: {
		back: "#0a0224",
		spine: "#ff1f8f",
		front: "#160535",
		accent: "#21f7ff",
		secondary: "#ff2dd4",
		title: "#ff2dd4",
		body: "#c9b3ff",
		shadow: "#21f7ff",
		titleFont: "Audiowide, SF Movie Poster Condensed, Impact, sans-serif",
		bodyFont: "VT323, Courier New, monospace",
	},
	rental: {
		back: "#efd9a3",
		spine: "#b5261a",
		front: "#f3e0b0",
		accent: "#b5261a",
		secondary: "#1a5a3a",
		title: "#1a0900",
		body: "#3a2614",
		shadow: "#f8eed1",
		titleFont: "Bungee Shade, SF Movie Poster Condensed, Impact, sans-serif",
		bodyFont: "Courier Prime, Courier New, monospace",
	},
	scifi: {
		back: "#050a2a",
		spine: "#241360",
		front: "#0a173f",
		accent: "#ffd54a",
		secondary: "#5cc5ff",
		title: "#fff4d6",
		body: "#bccae5",
		shadow: "#ff5a1f",
		titleFont: "Monoton, SF Movie Poster, Impact, sans-serif",
		bodyFont: "VT323, Courier New, monospace",
	},
	horror: {
		back: "#0a0203",
		spine: "#4a0608",
		front: "#080104",
		accent: "#d4a93a",
		secondary: "#a8060a",
		title: "#c8161c",
		body: "#b8a576",
		shadow: "#000000",
		titleFont: "Creepster, Bungee Shade, Impact, sans-serif",
		bodyFont: "Special Elite, Courier New, monospace",
	},
	action: {
		back: "#0e0f12",
		spine: "#a80c12",
		front: "#15131a",
		accent: "#e8b432",
		secondary: "#d34316",
		title: "#f4eedd",
		body: "#d2cab8",
		shadow: "#a80c12",
		titleFont: "Anton, Impact, sans-serif",
		bodyFont: "Oswald, Arial Narrow, sans-serif",
	},
	aventure: {
		back: "#dcc185",
		spine: "#5a2a12",
		front: "#e7d49a",
		accent: "#5a2a12",
		secondary: "#1c5234",
		title: "#2a1408",
		body: "#3a2814",
		shadow: "#f4e7c2",
		titleFont: "Cinzel, Bee Two, Georgia, serif",
		bodyFont: "Special Elite, Courier New, monospace",
	},
	cyber: {
		back: "#020308",
		spine: "#0d1f3c",
		front: "#04060e",
		accent: "#00ffe1",
		secondary: "#ff007a",
		title: "#00ffe1",
		body: "#9bc4ff",
		shadow: "#ff007a",
		titleFont: "Orbitron, Eurostile, sans-serif",
		bodyFont: "VT323, Courier New, monospace",
	},
	romance: {
		back: "#f1ddd1",
		spine: "#a85770",
		front: "#f7e6da",
		accent: "#a85770",
		secondary: "#8b7a4a",
		title: "#2a0e1a",
		body: "#4a2438",
		shadow: "#ffe0d2",
		titleFont: "Playfair Display, Bee Two, Georgia, serif",
		bodyFont: "Courier Prime, Courier New, monospace",
	},
	alien: {
		back: "#000000",
		spine: "#0a1408",
		front: "#000000",
		accent: "#a8c828",
		secondary: "#5a0a0a",
		title: "#e8eee0",
		body: "#9bcf6a",
		shadow: "#000000",
		titleFont: "Iceland, Michroma, Eurostile, sans-serif",
		bodyFont: "VT323, Courier New, monospace",
	},
};

export const GENERATED_FRONT_LAYER_NAMES = new Set([
	"Halo soleil",
	"Horizon VHS",
	"Liseré magenta",
	"Bande cyan",
	"Affiche placeholder",
	"Image plein recto",
	"Bande titre",
	"Image plein cadre",
	"Bande split",
	"Image split",
	"Titre",
	"Accroche",
	"Réalisateur",
]);

export const HELP_TEXT: Record<string, string> = {
	undoAction: "Annule la dernière modification.",
	redoAction: "Rétablit la modification annulée.",
	undoActionStage: "Annule la dernière modification.",
	redoActionStage: "Rétablit la modification annulée.",
	startTour: "Lance une visite guidée rapide de l'éditeur.",
	startTourStage: "Lance une visite guidée rapide de l'éditeur.",
	saveProject: "Télécharge le projet en JSON pour le reprendre plus tard.",
	exportPng: "Exporte une image PNG haute résolution.",
	exportPdf: "Crée un PDF A4 prêt pour l'impression.",
	contestLink: "Ouvre la page BosKop du concours pour déposer ta jaquette.",
	contestLinkStage:
		"Ouvre la page BosKop du concours pour déposer ta jaquette.",
	topbarMenu: "Ouvre les actions de projet et d'export.",
	toggleToolsRail: "Affiche les outils pour ajouter du contenu.",
	toggleInspectorRail: "Affiche les réglages du calque sélectionné.",
	imageUploadButton:
		"Importe ton affiche : JPG ou PNG · ou glisse-dépose directement sur la jaquette.",
	addText: "Ajoute un bloc de texte libre.",
	addTitle: "Ajoute un titre stylisé.",
	addBox: "Ajoute un bloc couleur décoratif.",
	fitZoom: "Recentre la jaquette dans la zone de travail.",
	quickAlign: "Change l'alignement du texte sélectionné.",
	quickFit: "Bascule l'image entre remplissage et image entière.",
	quickBackward: "Place le calque un cran derrière.",
	quickForward: "Place le calque un cran devant.",
	quickDuplicate: "Duplique l'élément sélectionné.",
	quickDelete: "Supprime l'élément sélectionné.",
	replaceImage: "Remplace l'image du calque sélectionné.",
	bringForward: "Place le calque un cran devant.",
	sendBackward: "Place le calque un cran derrière.",
	duplicateLayer: "Duplique le calque sélectionné.",
	deleteLayer: "Supprime le calque sélectionné.",
	tourSkip: "Ferme la visite guidée.",
	tourPrev: "Retourne à l'étape précédente.",
	tourNext: "Passe à l'étape suivante.",
};

export const THEME_HELP: Record<string, string> = {
	neon: "Synthwave, Drive, Miami Vice — magenta et cyan sur nuit profonde.",
	rental: "Jaquette de vidéoclub kraft : crème, rouge location, vert magnéto.",
	scifi:
		"Space opera façon Star Wars / Total Recall — cosmos, or et flare orange.",
	horror: "Giallo et slashers VHS — sang, encre noire et or vieilli.",
	action:
		"Buddy-cop 80s : Lethal Weapon, Die Hard — acier, écarlate et or cartouche.",
	aventure:
		"Indiana Jones, Le Tombeau, Goonies — parchemin, encre brune, jungle.",
	cyber: "Tron, Robocop, Akira — laser cyan, grille magenta sur noir profond.",
	romance:
		"Quand Harry rencontre Sally, Pretty Woman — blush, rose poussière, sépia.",
	alien:
		"Alien, Aliens — vide cosmique, titre fantôme et acide xénomorphe sur terminal MUTHER.",
};

export const LAYOUT_HELP: Record<string, string> = {
	classic: "Image principale au centre, titre en bas.",
	bigtype: "Grand titre dominant sur le recto.",
	poster: "Affiche plein cadre sur la face avant.",
	split: "Bandeau image en haut, titre en dessous.",
};

export const ZONE_HELP: Record<string, string> = {
	front: "Place les nouveaux éléments sur le recto.",
	back: "Place les nouveaux éléments sur le verso.",
	spine: "Place les nouveaux éléments sur la tranche.",
};

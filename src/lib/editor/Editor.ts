import { jsPDF } from "jspdf";
import {
	A4,
	ASSETS,
	COVER,
	EXPORT_H,
	EXPORT_W,
	GENERATED_FRONT_LAYER_NAMES,
	HELP_TEXT,
	HISTORY_LIMIT,
	LAYOUT_HELP,
	THEME_HELP,
	THEMES,
	ZONE_HELP,
	ZONES,
} from "./constants";
import { collectRefs, type EditorRefs } from "./dom";
import {
	clamp,
	degToRad,
	fixedAnchorForHandle,
	getHandles,
	localToWorld,
	normalizeAngle,
	objectCenter,
	radToDeg,
	rotatePoint,
	worldToLocal,
} from "./geometry";
import { ImageCache } from "./image-cache";
import { drawPdfTrimMarks, renderToCanvas } from "./render";
import { cleanColor, normalizeProjectObjects } from "./sanitize";
import type {
	Align,
	DragState,
	Fit,
	Handle,
	ImageObject,
	LayoutKey,
	MoveDrag,
	ProjectObject,
	ProjectState,
	RectObject,
	ResizeRotateDrag,
	Size,
	Snapshot,
	TextObject,
	ThemeKey,
	TourStep,
	Vec,
	ZoneKey,
} from "./types";

export class Editor {
	private refs: EditorRefs;
	private imageCache: ImageCache;
	private project: ProjectState;
	private activeTheme: ThemeKey = "neon";
	private activeLayout: LayoutKey = "classic";
	private activeZone: ZoneKey = "front";
	private selectedId: string | null = null;
	private pointerMode: "move" | "resize" | "rotate" | null = null;
	private dragState: DragState | null = null;
	private showGuides = true;
	private raf = 0;
	private currentScale = 1;
	private inspectorEditPrimed = false;
	private activeTourIndex = -1;
	private historyPast: Snapshot[] = [];
	private historyFuture: Snapshot[] = [];
	private tooltipAnchor: HTMLElement | null = null;
	private canvasDeleteConfirmTimer = 0;
	private tourSteps: TourStep[];

	constructor() {
		this.refs = collectRefs();
		this.imageCache = new ImageCache(() => this.scheduleRender());
		this.project = this.buildInitialProject();
		this.tourSteps = this.buildTourSteps();
	}

	init() {
		this.wireAssets();
		this.wireEvents();
		this.wireTooltips();
		this.project.objects
			.filter((object): object is ImageObject => object.type === "image")
			.forEach((object) => void this.imageCache.load(object.src));
		this.setupCanvasSize();
		this.updateInspector();
		this.updateHistoryButtons();
		document.fonts?.ready.then(() => this.scheduleRender());
	}

	// ---------- Project / factories ----------

	private makeId() {
		return `layer-${Math.random().toString(36).slice(2, 9)}`;
	}

	private rect(
		name: string,
		x: number,
		y: number,
		w: number,
		h: number,
		fill: string,
		locked = false,
	): RectObject {
		return {
			id: this.makeId(),
			type: "rect",
			name,
			x,
			y,
			w,
			h,
			fill,
			stroke: "transparent",
			opacity: 1,
			rotation: 0,
			locked,
		};
	}

	private text(
		name: string,
		content: string,
		x: number,
		y: number,
		w: number,
		h: number,
		fontSize: number,
		fill: string,
		align: Align,
		fontFamily: string,
		rotation = 0,
	): TextObject {
		return {
			id: this.makeId(),
			type: "text",
			name,
			content,
			x,
			y,
			w,
			h,
			fontSize,
			fill,
			align,
			fontFamily,
			opacity: 1,
			rotation,
			locked: false,
			shadow: "",
		};
	}

	private image(
		name: string,
		src: string,
		x: number,
		y: number,
		w: number,
		h: number,
	): ImageObject {
		void this.imageCache.load(src);
		return {
			id: this.makeId(),
			type: "image",
			name,
			src,
			x,
			y,
			w,
			h,
			opacity: 1,
			rotation: 0,
			fit: "contain",
			locked: false,
		};
	}

	private buildInitialProject(): ProjectState {
		const t = THEMES.neon;
		return {
			name: "contre-fictions-vhs",
			background: t.back,
			objects: [
				this.rect("Fond verso", 0, 0, 114, 194, t.back, true),
				this.rect("Fond tranche", 114, 0, 30, 194, t.spine, true),
				this.rect("Fond recto", 144, 0, 114, 194, t.front, true),
				this.rect("Halo soleil", 165, 34, 72, 58, "#ff5a1f"),
				this.rect("Horizon VHS", 144, 132, 114, 62, "#0a0118"),
				this.rect("Liseré magenta", 151, 10, 100, 4, t.secondary),
				this.rect("Bande cyan", 151, 16, 100, 2.5, t.accent),
				this.text(
					"Titre",
					"TITRE\nDU FILM",
					150,
					132,
					102,
					30,
					18,
					t.title,
					"center",
					t.titleFont,
				),
				this.text(
					"Accroche",
					"UNE NUIT, TOUT BASCULE",
					154,
					165,
					94,
					7,
					4,
					t.accent,
					"center",
					t.bodyFont,
				),
				this.text(
					"Réalisateur",
					"UN FILM DE  PRÉNOM NOM",
					154,
					179,
					94,
					6,
					3.3,
					t.body,
					"center",
					"SF Movie Poster Condensed, Impact, sans-serif",
				),
				this.text(
					"Synopsis titre",
					"SYNOPSIS",
					8,
					13,
					94,
					12,
					7,
					t.accent,
					"left",
					t.titleFont,
				),
				this.text(
					"Verso synopsis",
					"Dans une métropole rongée par les pluies acides, une archiviste découvre une cassette qui ne devrait pas exister. Plus elle la regarde, plus la réalité se brouille.\n\nLe festival CONTRE-FICTIONS vous invite à imaginer le film qui se cache sur cette bande magnétique.",
					8,
					29,
					94,
					55,
					4.3,
					t.body,
					"left",
					t.bodyFont,
				),
				this.rect("Photogramme A", 8, 91, 44, 30, "#2c1a6e"),
				this.rect("Photogramme B", 62, 91, 44, 30, t.secondary),
				this.text(
					"Critique",
					'"Le choc magnétique de l\'année." - VHS 3000',
					8,
					131,
					98,
					14,
					4.5,
					"#ffd84a",
					"center",
					"Georgia, serif",
				),
				this.text(
					"Crédits",
					"CONTRE-FICTIONS · BOSKOP · 2026 · COULEUR · STEREO · DUREE 96 MIN · © LES INTERGALACTIQUES",
					8,
					171,
					98,
					12,
					3,
					"#ffffff",
					"center",
					"SF Movie Poster Condensed, Impact, sans-serif",
				),
				this.text(
					"Tranche",
					"TITRE DU FILM",
					54,
					89.5,
					150,
					15,
					8.5,
					t.title,
					"center",
					t.titleFont,
					-90,
				),
			],
		};
	}

	// ---------- History ----------

	private projectSnapshot(): Snapshot {
		return {
			name: this.project.name,
			background: this.project.background,
			objects: structuredClone(this.project.objects),
			activeTheme: this.activeTheme,
			activeLayout: this.activeLayout,
			showGuides: this.showGuides,
		};
	}

	private restoreProjectSnapshot(snapshot: Snapshot) {
		this.project.name = snapshot.name || this.project.name;
		this.project.background = snapshot.background || this.project.background;
		this.project.objects = structuredClone(
			snapshot.objects || this.project.objects,
		);
		this.activeTheme = snapshot.activeTheme || this.activeTheme;
		this.activeLayout = snapshot.activeLayout || this.activeLayout;
		this.showGuides = snapshot.showGuides ?? this.showGuides;
		this.refs.toggleGuides.checked = this.showGuides;
		this.project.objects
			.filter((object): object is ImageObject => object.type === "image")
			.forEach(
				(object) => void this.imageCache.load(object.src).catch(() => null),
			);
		document.querySelectorAll<HTMLElement>("[data-theme]").forEach((button) => {
			button.dataset.active = String(button.dataset.theme === this.activeTheme);
		});
		document
			.querySelectorAll<HTMLElement>("[data-layout]")
			.forEach((button) => {
				button.dataset.active = String(
					button.dataset.layout === this.activeLayout,
				);
			});
		this.selectObject(null);
		this.updateHistoryButtons();
		this.scheduleRender();
	}

	private pushHistory() {
		this.historyPast.push(this.projectSnapshot());
		if (this.historyPast.length > HISTORY_LIMIT) this.historyPast.shift();
		this.historyFuture.length = 0;
		this.updateHistoryButtons();
	}

	private undoProject() {
		const previous = this.historyPast.pop();
		if (!previous) return;
		this.historyFuture.unshift(this.projectSnapshot());
		this.restoreProjectSnapshot(previous);
		this.setStatus("Modification annulée.");
	}

	private redoProject() {
		const next = this.historyFuture.shift();
		if (!next) return;
		this.historyPast.push(this.projectSnapshot());
		this.restoreProjectSnapshot(next);
		this.setStatus("Modification rétablie.");
	}

	private updateHistoryButtons() {
		for (const button of [this.refs.undoAction, this.refs.undoActionStage]) {
			button.disabled = this.historyPast.length === 0;
		}
		for (const button of [this.refs.redoAction, this.refs.redoActionStage]) {
			button.disabled = this.historyFuture.length === 0;
		}
	}

	// ---------- Selection & inspector ----------

	private getSelected(): ProjectObject | null {
		return (
			this.project.objects.find((object) => object.id === this.selectedId) ||
			null
		);
	}

	private selectObject(id: string | null) {
		if (id !== this.selectedId) this.resetCanvasDeleteConfirm();
		this.selectedId = id;
		this.updateInspector();
		this.updateCanvasDeleteButton();
		this.updateSelectionToolbar();
		this.scheduleRender();
	}

	private openInspectorDrawerIfMobile() {
		if (!window.matchMedia("(max-width: 900px)").matches) return;
		if (document.body.classList.contains("is-inspector-open")) return;
		document.querySelector<HTMLElement>("#toggleInspectorRail")?.click();
	}

	private resetCanvasDeleteConfirm() {
		if (this.canvasDeleteConfirmTimer) {
			clearTimeout(this.canvasDeleteConfirmTimer);
			this.canvasDeleteConfirmTimer = 0;
		}
		this.refs.canvasDelete.dataset.confirming = "false";
	}

	private updateCanvasDeleteButton() {
		this.refs.canvasDelete.hidden = true;
		this.resetCanvasDeleteConfirm();
	}

	private updateSelectionToolbar() {
		const { selectionToolbar, canvas, quickColor, quickFit } = this.refs;
		const object = this.getSelected();
		if (!object || object.locked) {
			selectionToolbar.hidden = true;
			return;
		}
		const parent = canvas.parentElement;
		if (!parent) return;
		const stageRect = parent.getBoundingClientRect();
		const canvasRect = canvas.getBoundingClientRect();
		if (!canvasRect.width) return;
		const offsetLeft = canvasRect.left - stageRect.left;
		const offsetTop = canvasRect.top - stageRect.top;
		const scale = canvasRect.width / COVER.w;
		const topCenter = localToWorld(object, { x: object.w / 2, y: 0 });
		const left = topCenter.x * scale + offsetLeft;
		const top = topCenter.y * scale + offsetTop;
		selectionToolbar.hidden = false;
		selectionToolbar.dataset.kind = object.type;
		selectionToolbar.style.left = `${left}px`;
		selectionToolbar.style.top = `${top}px`;
		quickColor.value = (object.type !== "image" && object.fill) || "#ffffff";
		quickFit.textContent =
			object.type === "image" && object.fit === "cover" ? "□" : "⛶";
	}

	private updateInspector() {
		const r = this.refs;
		const object = this.getSelected();
		r.selectedLabel.textContent = object ? object.name : "aucun";
		r.inspector.classList.toggle("empty", !object);
		const textControls = [r.textContent, r.fontFamily, r.fontSize, r.textAlign];
		textControls.forEach((control) => {
			control.disabled = !object || object.type !== "text";
		});
		r.imageFit.disabled = !object || object.type !== "image";
		const replaceDisabled = !object || object.type !== "image";
		r.replaceImage.disabled = replaceDisabled;
		r.replaceImageInput.disabled = replaceDisabled;
		r.replaceImage.setAttribute(
			"aria-disabled",
			replaceDisabled ? "true" : "false",
		);
		if (!object) return;
		r.textContent.value = object.type === "text" ? object.content : "";
		r.fontFamily.value =
			object.type === "text" ? object.fontFamily : "Arial, sans-serif";
		r.fontSize.value = String(object.type === "text" ? object.fontSize : 8);
		r.fillColor.value = object.type !== "image" ? object.fill : "#ffffff";
		r.opacity.value = String(object.opacity ?? 1);
		r.rotation.value = String(object.rotation || 0);
		r.textAlign.value = object.type === "text" ? object.align : "left";
		r.imageFit.value = object.type === "image" ? object.fit : "contain";
		r.posX.value = String(Math.round(object.x));
		r.posY.value = String(Math.round(object.y));
		r.posW.value = String(Math.round(object.w));
		r.posH.value = String(Math.round(object.h));
	}

	private updateSelected(mutator: (object: ProjectObject) => void) {
		const object = this.getSelected();
		if (!object) return;
		mutator(object);
		this.updateInspector();
		this.updateSelectionToolbar();
		this.scheduleRender();
	}

	// ---------- Layer creation ----------

	private addObject(object: ProjectObject) {
		this.pushHistory();
		this.project.objects.push(object);
		this.selectObject(object.id);
		this.setStatus(`${object.name} ajouté.`);
	}

	private zoneCenter(zoneName: ZoneKey, size: Size): Vec {
		const zone = ZONES[zoneName];
		return {
			x: zone.x + (zone.w - size.w) / 2,
			y: zone.y + (zone.h - size.h) / 2,
		};
	}

	private addTextLayer(kind: "title" | "body") {
		const t = THEMES[this.activeTheme];
		const size = kind === "title" ? { w: 88, h: 26 } : { w: 86, h: 36 };
		const pos = this.zoneCenter(this.activeZone, size);
		const layer = this.text(
			kind === "title" ? "Titre" : "Texte",
			kind === "title"
				? "TITRE DU FILM"
				: "Synopsis, casting, durée, copyright...",
			pos.x,
			pos.y,
			size.w,
			size.h,
			kind === "title" ? 13 : 5,
			kind === "title" ? t.title : t.body,
			kind === "title" ? "center" : "left",
			kind === "title" ? t.titleFont : t.bodyFont,
		);
		layer.shadow = kind === "title" ? t.shadow : "";
		this.addObject(layer);
	}

	private addTextAt(point: Vec) {
		const t = THEMES[this.activeTheme];
		const size = { w: 70, h: 26 };
		const layer = this.text(
			"Texte libre",
			"NOUVEAU TEXTE",
			clamp(point.x - size.w / 2, 0, COVER.w - size.w),
			clamp(point.y - size.h / 2, 0, COVER.h - size.h),
			size.w,
			size.h,
			7,
			t.title,
			"center",
			t.titleFont,
		);
		layer.shadow = t.shadow;
		this.addObject(layer);
		this.refs.textContent.focus();
		this.refs.textContent.select();
	}

	private addRect() {
		const t = THEMES[this.activeTheme];
		const size =
			this.activeZone === "spine" ? { w: 18, h: 52 } : { w: 54, h: 34 };
		const pos = this.zoneCenter(this.activeZone, size);
		this.addObject(
			this.rect("Bloc couleur", pos.x, pos.y, size.w, size.h, t.secondary),
		);
	}

	private addAsset(src: string, name = "Image", point: Vec | null = null) {
		const size =
			this.activeZone === "spine" ? { w: 18, h: 18 } : { w: 28, h: 16 };
		const pos = point
			? { x: point.x - size.w / 2, y: point.y - size.h / 2 }
			: this.zoneCenter(this.activeZone, size);
		this.addObject(
			this.image(
				name,
				src,
				clamp(pos.x, 0, COVER.w - size.w),
				clamp(pos.y, 0, COVER.h - size.h),
				size.w,
				size.h,
			),
		);
	}

	private addImportedImage(
		src: string,
		name = "Image importée",
		point: Vec | null = null,
	) {
		const zoneName = this.activeZone;
		const zone = ZONES[zoneName];
		const size =
			zoneName === "spine"
				? { w: 24, h: 32 }
				: { w: Math.min(86, zone.w - 12), h: 62 };
		const pos = point
			? { x: point.x - size.w / 2, y: point.y - size.h / 2 }
			: this.zoneCenter(this.activeZone, size);
		const object = this.image(
			name,
			src,
			clamp(pos.x, 0, COVER.w - size.w),
			clamp(pos.y, 0, COVER.h - size.h),
			size.w,
			size.h,
		);
		this.addObject(object);
		this.imageCache
			.load(src)
			.then((img) => {
				const ratio = img.naturalWidth / img.naturalHeight;
				const maxW = zoneName === "spine" ? 24 : Math.min(92, zone.w - 10);
				const maxH = zoneName === "spine" ? 130 : Math.min(130, zone.h - 16);
				const byWidth = { w: maxW, h: maxW / ratio };
				const next = byWidth.h <= maxH ? byWidth : { w: maxH * ratio, h: maxH };
				object.w = next.w;
				object.h = next.h;
				object.x = clamp(
					point ? point.x - object.w / 2 : zone.x + (zone.w - object.w) / 2,
					0,
					COVER.w - object.w,
				);
				object.y = clamp(
					point ? point.y - object.h / 2 : zone.y + (zone.h - object.h) / 2,
					0,
					COVER.h - object.h,
				);
				this.updateInspector();
				this.updateSelectionToolbar();
				this.scheduleRender();
			})
			.catch(() => this.setStatus("Image impossible à charger."));
	}

	// ---------- Layouts & themes ----------

	private frontObjects() {
		return this.project.objects.filter(
			(object) => object.x >= ZONES.front.x && !object.locked,
		);
	}

	private isGeneratedFrontObject(object: ProjectObject) {
		return (
			object.layoutGenerated === true ||
			GENERATED_FRONT_LAYER_NAMES.has(object.name)
		);
	}

	private rebuildFront(layoutKey: LayoutKey) {
		const t = THEMES[this.activeTheme];
		const previous = this.frontObjects();
		const findText = (
			predicate: (object: TextObject) => boolean,
		): TextObject | undefined =>
			previous.find(
				(object): object is TextObject =>
					object.type === "text" && predicate(object),
			);
		const oldTitle =
			findText(
				(object) =>
					object.name === "Titre" && this.isGeneratedFrontObject(object),
			)?.content ||
			findText((object) => object.fontSize >= 10)?.content ||
			"TITRE\nDU FILM";
		const oldTagline =
			findText(
				(object) =>
					object.name === "Accroche" && this.isGeneratedFrontObject(object),
			)?.content ||
			findText((object) => object.fontSize < 7)?.content ||
			"UNE NUIT, TOUT BASCULE";
		this.project.objects = this.project.objects.filter(
			(object, index) =>
				index < 3 ||
				object.x < ZONES.front.x ||
				!this.isGeneratedFrontObject(object),
		);

		const created: ProjectObject[] = [];
		const add = <T extends ProjectObject>(object: T): T => {
			created.push(object);
			return object;
		};
		if (layoutKey === "classic") {
			add(this.rect("Affiche placeholder", 163, 28, 76, 100, t.secondary));
			add(
				this.text(
					"Titre",
					oldTitle,
					150,
					132,
					102,
					30,
					18,
					t.title,
					"center",
					t.titleFont,
				),
			);
			add(
				this.text(
					"Accroche",
					oldTagline,
					154,
					165,
					94,
					7,
					4,
					t.accent,
					"center",
					t.bodyFont,
				),
			);
			add(
				this.text(
					"Réalisateur",
					"UN FILM DE  PRÉNOM NOM",
					154,
					179,
					94,
					6,
					3.3,
					t.body,
					"center",
					"SF Movie Poster Condensed, Impact, sans-serif",
				),
			);
		}
		if (layoutKey === "bigtype") {
			add(this.rect("Image plein recto", 150, 10, 102, 172, t.secondary));
			add(this.rect("Bande titre", 144, 118, 114, 64, "#000000"));
			add(
				this.text(
					"Titre",
					oldTitle,
					149,
					124,
					104,
					44,
					25,
					t.title,
					"center",
					t.titleFont,
				),
			);
			add(
				this.text(
					"Accroche",
					oldTagline,
					154,
					173,
					94,
					7,
					4,
					t.accent,
					"center",
					t.bodyFont,
				),
			);
		}
		if (layoutKey === "poster") {
			add(this.rect("Image plein cadre", 144, 0, 114, 194, t.secondary));
			add(
				this.text(
					"Titre",
					oldTitle,
					150,
					10,
					102,
					32,
					15,
					t.title,
					"center",
					t.titleFont,
				),
			);
			add(
				this.text(
					"Accroche",
					oldTagline,
					154,
					176,
					94,
					7,
					4,
					t.accent,
					"center",
					t.bodyFont,
				),
			);
		}
		if (layoutKey === "split") {
			add(this.rect("Bande split", 144, 0, 114, 88, t.secondary));
			add(this.rect("Image split", 159, 13, 84, 68, this.project.background));
			add(
				this.text(
					"Titre",
					oldTitle,
					150,
					96,
					102,
					54,
					22,
					t.title,
					"center",
					t.titleFont,
				),
			);
			add(
				this.text(
					"Accroche",
					oldTagline,
					154,
					158,
					94,
					8,
					4,
					t.accent,
					"center",
					t.bodyFont,
				),
			);
			add(
				this.text(
					"Réalisateur",
					"UN FILM DE  PRÉNOM NOM",
					154,
					178,
					94,
					6,
					3.3,
					t.body,
					"center",
					"SF Movie Poster Condensed, Impact, sans-serif",
				),
			);
		}
		created.forEach((object) => {
			object.layoutGenerated = true;
			if (object.type === "text" && object.fontSize >= 10)
				object.shadow = t.shadow;
			if (object.name?.includes("Bande titre")) object.opacity = 0.58;
		});
		this.project.objects.push(...created);
		this.selectObject(
			created.find((object) => object.type === "text")?.id || null,
		);
	}

	private applyTheme(theme: ThemeKey) {
		if (theme === this.activeTheme) return;
		this.pushHistory();
		const [back, spine, front] = this.project.objects.slice(0, 3) as [
			RectObject,
			RectObject,
			RectObject,
		];
		const t = THEMES[theme] || THEMES.neon;
		this.activeTheme = theme;
		back.fill = t.back;
		spine.fill = t.spine;
		front.fill = t.front;
		this.project.background = t.back;
		this.project.objects.forEach((object) => {
			if (object.locked) return;
			if (object.type === "text") {
				const isTitle = object.fontSize >= 10 || object.name === "Tranche";
				object.fill = isTitle
					? t.title
					: object.fontSize <= 4.5
						? t.accent
						: t.body;
				object.fontFamily = isTitle ? t.titleFont : t.bodyFont;
				object.shadow = isTitle ? t.shadow : "";
			}
			if (object.type === "rect" && object.name?.includes("Liseré"))
				object.fill = t.secondary;
			if (object.type === "rect" && object.name?.includes("Bande cyan"))
				object.fill = t.accent;
			if (object.type === "rect" && object.name === "Halo soleil")
				object.fill = t.secondary;
			if (object.type === "rect" && object.name === "Horizon VHS")
				object.fill = t.spine;
			if (object.type === "rect" && object.name === "Photogramme A")
				object.fill = t.spine;
			if (object.type === "rect" && object.name === "Photogramme B")
				object.fill = t.secondary;
		});
		document.querySelectorAll<HTMLElement>("[data-theme]").forEach((button) => {
			button.dataset.active = String(button.dataset.theme === theme);
		});
		this.setStatus(`Ambiance ${theme}.`);
		this.scheduleRender();
	}

	private applyLayout(layoutKey: LayoutKey) {
		if (layoutKey === this.activeLayout) return;
		this.pushHistory();
		this.activeLayout = layoutKey;
		this.rebuildFront(layoutKey);
		document
			.querySelectorAll<HTMLElement>("[data-layout]")
			.forEach((button) => {
				button.dataset.active = String(button.dataset.layout === layoutKey);
			});
		this.setStatus(`Mise en page ${layoutKey}.`);
		this.scheduleRender();
	}

	private setStatus(message: string) {
		const first = this.refs.statusbar.firstElementChild;
		if (first) first.textContent = message;
	}

	// ---------- Rendering ----------

	private scheduleRender() {
		if (this.raf) return;
		this.raf = requestAnimationFrame(() => {
			this.raf = 0;
			this.render();
		});
	}

	private render(
		targetCanvas: HTMLCanvasElement = this.refs.canvas,
		opts: { guides?: boolean } = {},
	) {
		renderToCanvas(targetCanvas, this.project, {
			showGuides: opts.guides !== false && this.showGuides,
			selectedId: this.selectedId,
			imageCache: this.imageCache,
			isInteractive: targetCanvas === this.refs.canvas,
		});
	}

	private setupCanvasSize() {
		const { canvas, stageScroller } = this.refs;
		const box = stageScroller.getBoundingClientRect();
		const isMobile = window.matchMedia("(max-width: 900px)").matches;
		const cssW = Math.min(Math.max(240, box.width - (isMobile ? 18 : 0)), 1180);
		const cssH = cssW * (COVER.h / COVER.w);
		const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
		canvas.style.width = `${cssW}px`;
		canvas.style.height = `${cssH}px`;
		canvas.width = Math.round(cssW * dpr);
		canvas.height = Math.round(cssH * dpr);
		this.currentScale = canvas.width / COVER.w;
		this.render();
		this.updateCanvasDeleteButton();
		this.updateSelectionToolbar();
	}

	// ---------- Pointer interactions ----------

	private canvasPoint(event: { clientX: number; clientY: number }): Vec {
		const rect = this.refs.canvas.getBoundingClientRect();
		return {
			x: ((event.clientX - rect.left) / rect.width) * COVER.w,
			y: ((event.clientY - rect.top) / rect.height) * COVER.h,
		};
	}

	private hitTest(point: Vec): ProjectObject | null {
		for (let i = this.project.objects.length - 1; i >= 0; i--) {
			const object = this.project.objects[i];
			if (object.locked) continue;
			const local = worldToLocal(point, object);
			if (
				local.x >= 0 &&
				local.x <= object.w &&
				local.y >= 0 &&
				local.y <= object.h
			)
				return object;
		}
		return null;
	}

	private hitHandle(point: Vec): Handle | undefined {
		const selected = this.getSelected();
		if (!selected) return undefined;
		const threshold = 13 / this.currentScale;
		return getHandles(selected).find(
			(handle) =>
				Math.hypot(point.x - handle.x, point.y - handle.y) < threshold,
		);
	}

	private onPointerDown(event: PointerEvent) {
		this.resetCanvasDeleteConfirm();
		this.refs.canvas.setPointerCapture(event.pointerId);
		const point = this.canvasPoint(event);
		const handle = this.hitHandle(point);
		if (handle) {
			const object = this.getSelected();
			if (!object || !this.selectedId) return;
			const center = objectCenter(object);
			this.pointerMode = handle.type;
			this.dragState = {
				id: this.selectedId,
				handle: handle.name,
				start: point,
				startAngle: Math.atan2(point.y - center.y, point.x - center.x),
				original: structuredClone(object),
				historyPushed: false,
			} satisfies ResizeRotateDrag;
			return;
		}
		const object = this.hitTest(point);
		this.selectObject(object?.id || null);
		if (object) {
			this.pointerMode = "move";
			this.dragState = {
				id: object.id,
				dx: point.x - object.x,
				dy: point.y - object.y,
				historyPushed: false,
			} satisfies MoveDrag;
		}
	}

	private onPointerMove(event: PointerEvent) {
		const point = this.canvasPoint(event);
		if (!this.pointerMode || !this.dragState) {
			const handle = this.hitHandle(point);
			this.refs.canvas.style.cursor = handle
				? handle.cursor
				: this.hitTest(point)
					? "move"
					: "crosshair";
			return;
		}
		const object = this.getSelected();
		if (!object) return;
		if (!this.dragState.historyPushed) {
			this.pushHistory();
			this.dragState.historyPushed = true;
		}
		if (this.pointerMode === "move" && "dx" in this.dragState) {
			object.x = clamp(point.x - this.dragState.dx, -object.w + 4, COVER.w - 4);
			object.y = clamp(point.y - this.dragState.dy, -object.h + 4, COVER.h - 4);
		}
		if (this.pointerMode === "resize" && "handle" in this.dragState)
			this.resizeObject(object, point, this.dragState);
		if (this.pointerMode === "rotate" && "startAngle" in this.dragState)
			this.rotateObject(object, point, this.dragState, event.shiftKey);
		this.updateInspector();
		this.updateCanvasDeleteButton();
		this.updateSelectionToolbar();
		this.scheduleRender();
	}

	private onPointerUp(event: PointerEvent) {
		try {
			this.refs.canvas.releasePointerCapture(event.pointerId);
		} catch (_) {
			// Pointer capture can already be released by the browser on touch cancel.
		}
		this.pointerMode = null;
		this.dragState = null;
	}

	private resizeObject(
		object: ProjectObject,
		point: Vec,
		state: ResizeRotateDrag,
	) {
		const original = state.original;
		const min = 5;
		const local = worldToLocal(point, original);
		const fixed = fixedAnchorForHandle(state.handle, original);
		let left = 0;
		let right = original.w;
		let top = 0;
		let bottom = original.h;

		if (state.handle.includes("w")) left = Math.min(local.x, original.w - min);
		if (state.handle.includes("e")) right = Math.max(local.x, min);
		if (state.handle.includes("n")) top = Math.min(local.y, original.h - min);
		if (state.handle.includes("s")) bottom = Math.max(local.y, min);

		const nextW = Math.max(min, right - left);
		const nextH = Math.max(min, bottom - top);
		const fixedWorld = localToWorld(original, fixed.originalLocal);
		const fixedOffset = rotatePoint(
			{
				x: fixed.nextLocal(nextW, nextH).x - nextW / 2,
				y: fixed.nextLocal(nextW, nextH).y - nextH / 2,
			},
			degToRad(original.rotation || 0),
		);
		const nextCenter = {
			x: fixedWorld.x - fixedOffset.x,
			y: fixedWorld.y - fixedOffset.y,
		};

		object.x = nextCenter.x - nextW / 2;
		object.y = nextCenter.y - nextH / 2;
		object.w = nextW;
		object.h = nextH;
		object.rotation = original.rotation;
	}

	private rotateObject(
		object: ProjectObject,
		point: Vec,
		state: ResizeRotateDrag,
		snap: boolean,
	) {
		const original = state.original;
		const center = objectCenter(original);
		const currentAngle = Math.atan2(point.y - center.y, point.x - center.x);
		let next = normalizeAngle(
			(original.rotation || 0) + radToDeg(currentAngle - state.startAngle),
		);
		if (snap) next = Math.round(next / 15) * 15;
		object.rotation = next;
	}

	private onDrop(event: DragEvent) {
		event.preventDefault();
		const point = this.canvasPoint(event);
		if (event.dataTransfer?.files?.length) {
			this.handleFiles(event.dataTransfer.files, point);
			return;
		}
		const src = event.dataTransfer?.getData("text/plain");
		if (src) this.addAsset(src, "Logo", point);
	}

	private handleFiles(files: FileList | null, point: Vec | null = null) {
		const list = Array.from(files || []);
		const accepted = list.filter(
			(file) =>
				file.type === "image/jpeg" ||
				file.type === "image/png" ||
				/\.(jpe?g|png)$/i.test(file.name),
		);
		const rejected = list.length - accepted.length;
		if (rejected > 0) {
			this.setStatus(
				rejected === list.length
					? "Format non supporté : utilise JPEG ou PNG."
					: `${rejected} fichier(s) ignoré(s) (JPEG ou PNG seulement).`,
			);
		}
		accepted.forEach((file) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result !== "string") return;
				this.addImportedImage(
					reader.result,
					file.name.replace(/\.[^.]+$/, ""),
					point,
				);
				this.setStatus(`Image « ${file.name} » ajoutée.`);
			};
			reader.onerror = () =>
				this.setStatus(`Impossible de lire « ${file.name} ».`);
			reader.readAsDataURL(file);
		});
	}

	private openImageUploadPicker() {
		this.refs.imageUpload.value = "";
		this.refs.imageUpload.click();
	}

	private prepareInspectorEdit() {
		if (this.inspectorEditPrimed || !this.getSelected()) return;
		this.pushHistory();
		this.inspectorEditPrimed = true;
	}

	private applyQuickColor() {
		this.prepareInspectorEdit();
		this.updateSelected((object) => {
			if (object.type !== "image") object.fill = this.refs.quickColor.value;
		});
	}

	private cycleTextAlign() {
		const object = this.getSelected();
		if (!object || object.type !== "text") return;
		this.pushHistory();
		const options: Align[] = ["left", "center", "right"];
		object.align =
			options[(options.indexOf(object.align || "left") + 1) % options.length];
		this.updateInspector();
		this.updateSelectionToolbar();
		this.scheduleRender();
		this.setStatus(`Alignement ${object.align}.`);
	}

	private toggleImageFit() {
		const object = this.getSelected();
		if (!object || object.type !== "image") return;
		this.pushHistory();
		object.fit = object.fit === "cover" ? "contain" : "cover";
		this.updateInspector();
		this.updateSelectionToolbar();
		this.scheduleRender();
		this.setStatus(
			object.fit === "cover" ? "Image remplie." : "Image entière visible.",
		);
	}

	private applyInspectorChange() {
		const r = this.refs;
		this.updateSelected((object) => {
			if (object.type === "text") {
				object.content = r.textContent.value;
				object.fontFamily = r.fontFamily.value;
				object.fontSize = Number(r.fontSize.value);
				object.align = r.textAlign.value as Align;
				object.fill = r.fillColor.value;
			}
			if (object.type === "image") object.fit = r.imageFit.value as Fit;
			if (object.type === "rect") object.fill = r.fillColor.value;
			object.opacity = Number(r.opacity.value);
			object.rotation = Number(r.rotation.value);
			object.x = Number(r.posX.value);
			object.y = Number(r.posY.value);
			object.w = Math.max(2, Number(r.posW.value));
			object.h = Math.max(2, Number(r.posH.value));
		});
	}

	private openReplaceImagePicker() {
		const object = this.getSelected();
		if (!object || object.type !== "image" || this.refs.replaceImage.disabled)
			return;
		this.refs.replaceImageInput.value = "";
		this.refs.replaceImageInput.click();
	}

	private replaceSelectedImage(event: Event) {
		const input = event.target as HTMLInputElement;
		const object = this.getSelected();
		const file = input.files?.[0];
		if (!object || object.type !== "image" || !file) return;
		this.pushHistory();
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result !== "string") return;
			object.src = reader.result;
			object.name = file.name.replace(/\.[^.]+$/, "");
			void this.imageCache.load(object.src);
			this.updateInspector();
			this.updateSelectionToolbar();
			this.scheduleRender();
			this.setStatus("Image remplacée.");
		};
		reader.readAsDataURL(file);
		input.value = "";
	}

	private moveLayer(direction: number) {
		const index = this.project.objects.findIndex(
			(object) => object.id === this.selectedId,
		);
		const next = index + direction;
		if (index < 3 || next < 3 || next >= this.project.objects.length) return;
		this.pushHistory();
		const [object] = this.project.objects.splice(index, 1);
		this.project.objects.splice(next, 0, object);
		this.updateSelectionToolbar();
		this.scheduleRender();
	}

	private duplicateSelected() {
		const object = this.getSelected();
		if (!object) return;
		this.pushHistory();
		const copy = structuredClone(object);
		copy.id = this.makeId();
		copy.name = `${object.name} copie`;
		copy.x += 5;
		copy.y += 5;
		copy.locked = false;
		this.project.objects.push(copy);
		this.selectObject(copy.id);
	}

	private deleteSelected() {
		const object = this.getSelected();
		if (!object || object.locked) return;
		this.pushHistory();
		this.project.objects = this.project.objects.filter(
			(item) => item.id !== object.id,
		);
		this.selectObject(null);
	}

	private onCanvasDeleteClick(event: Event) {
		event.stopPropagation();
		const object = this.getSelected();
		if (!object || object.locked) return;
		if (this.refs.canvasDelete.dataset.confirming === "true") {
			this.resetCanvasDeleteConfirm();
			this.deleteSelected();
			return;
		}
		this.refs.canvasDelete.dataset.confirming = "true";
		if (this.canvasDeleteConfirmTimer)
			clearTimeout(this.canvasDeleteConfirmTimer);
		this.canvasDeleteConfirmTimer = setTimeout(() => {
			this.resetCanvasDeleteConfirm();
		}, 3500);
	}

	private onKeyDown(event: KeyboardEvent) {
		if (this.activeTourIndex >= 0) {
			if (event.key === "Escape") {
				event.preventDefault();
				this.closeTour();
				return;
			}
			if (event.key === "ArrowRight") {
				event.preventDefault();
				this.nextTourStep();
				return;
			}
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				this.previousTourStep();
				return;
			}
		}
		const focusedTag = document.activeElement?.tagName ?? "";
		if (["INPUT", "TEXTAREA", "SELECT"].includes(focusedTag)) return;
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
			event.preventDefault();
			if (event.shiftKey) this.redoProject();
			else this.undoProject();
			return;
		}
		if (event.key === "Delete" || event.key === "Backspace")
			this.deleteSelected();
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
			event.preventDefault();
			this.duplicateSelected();
		}
	}

	// ---------- Tour ----------

	private buildTourSteps(): TourStep[] {
		const r = this.refs;
		return [
			{
				title: "Commence par la jaquette",
				body: "La zone centrale est ton espace de travail. Clique un élément pour le déplacer, le redimensionner ou le modifier.",
				target: () => r.canvas,
			},
			{
				title: "Outils rapides",
				body: "Ouvre les outils pour importer une image, ajouter du texte, changer de thème ou choisir une mise en page.",
				target: () =>
					window.matchMedia("(max-width: 900px)").matches
						? document.querySelector("#toggleToolsRail")
						: document.querySelector(".rail--left"),
			},
			{
				title: "Recto, verso, tranche",
				body: "Ce sélecteur décide où les nouveaux éléments sont placés. Garde Recto pour travailler sur la face avant.",
				target: () => document.querySelector(".segment"),
			},
			{
				title: "Édition directe",
				body: "Je sélectionne le titre pour montrer les poignées. Glisse l'élément, utilise les coins pour la taille, et double-clique pour modifier le texte.",
				target: () =>
					r.selectionToolbar.hidden ? r.canvas : r.selectionToolbar,
				prepare: () => this.selectTitleForTour(),
			},
			{
				title: "Barre flottante",
				body: "Les actions fréquentes restent près de l'objet : aligner, couleur, ordre des calques, dupliquer ou supprimer.",
				target: () => r.selectionToolbar,
				prepare: () => this.selectTitleForTour(),
			},
			{
				title: "Annuler sans stress",
				body: "Ces boutons annulent ou rétablissent tes actions. C'est le filet de sécurité pour essayer des idées vite.",
				target: () => document.querySelector(".stage__history"),
			},
			{
				title: "Réglages avancés",
				body: "Le panneau Calques garde les réglages précis. Les positions X/Y/L/H sont rangées dans Réglages avancés pour ne pas gêner le flux principal.",
				target: () =>
					window.matchMedia("(max-width: 900px)").matches
						? document.querySelector("#toggleInspectorRail")
						: document.querySelector(".rail--right"),
			},
			{
				title: "Exporter",
				body: "Quand la jaquette est prête, exporte en PDF impression ou PNG depuis le menu du haut.",
				target: () =>
					window.matchMedia("(max-width: 900px)").matches
						? document.querySelector("#topbarMenu")
						: r.exportPdf,
			},
		];
	}

	private selectTitleForTour() {
		const title = this.project.objects
			.slice()
			.reverse()
			.find(
				(object) =>
					object.type === "text" &&
					object.name === "Titre" &&
					object.x >= ZONES.front.x,
			);
		if (title) this.selectObject(title.id);
	}

	private startTourAt(index = 0) {
		this.hideTooltip();
		this.activeTourIndex = clamp(index, 0, this.tourSteps.length - 1);
		this.refs.tourOverlay.hidden = false;
		document.body.classList.add("is-tour-open");
		this.renderTourStep();
	}

	private closeTour() {
		this.activeTourIndex = -1;
		this.refs.tourOverlay.hidden = true;
		document.body.classList.remove("is-tour-open");
	}

	private nextTourStep() {
		if (this.activeTourIndex >= this.tourSteps.length - 1) {
			this.closeTour();
			return;
		}
		this.activeTourIndex += 1;
		this.renderTourStep();
	}

	private previousTourStep() {
		if (this.activeTourIndex <= 0) return;
		this.activeTourIndex -= 1;
		this.renderTourStep();
	}

	private renderTourStep() {
		const r = this.refs;
		const step = this.tourSteps[this.activeTourIndex];
		if (!step) return;
		step.prepare?.();
		r.tourMeta.textContent = `Étape ${this.activeTourIndex + 1} / ${this.tourSteps.length}`;
		r.tourTitle.textContent = step.title;
		r.tourBody.textContent = step.body;
		r.tourPrev.disabled = this.activeTourIndex === 0;
		r.tourNext.textContent =
			this.activeTourIndex === this.tourSteps.length - 1
				? "Terminer"
				: "Suivant";
		requestAnimationFrame(() => this.positionTourStep());
	}

	private positionTourStep() {
		const r = this.refs;
		if (this.activeTourIndex < 0 || r.tourOverlay.hidden) return;
		const step = this.tourSteps[this.activeTourIndex];
		const target = step?.target?.();
		const rect = target?.getBoundingClientRect?.();
		const fallback = r.canvas.getBoundingClientRect();
		const box = rect && rect.width > 0 && rect.height > 0 ? rect : fallback;
		const pad = 10;
		const left = Math.max(8, box.left - pad);
		const top = Math.max(8, box.top - pad);
		const width = Math.min(window.innerWidth - left - 8, box.width + pad * 2);
		const height = Math.min(window.innerHeight - top - 8, box.height + pad * 2);

		r.tourSpotlight.style.left = `${left}px`;
		r.tourSpotlight.style.top = `${top}px`;
		r.tourSpotlight.style.width = `${width}px`;
		r.tourSpotlight.style.height = `${height}px`;

		const cardRect = r.tourCard.getBoundingClientRect();
		const preferredBelow = top + height + 14;
		const preferredAbove = top - cardRect.height - 14;
		const cardTop =
			preferredBelow + cardRect.height < window.innerHeight - 10
				? preferredBelow
				: Math.max(10, preferredAbove);
		const cardLeft = clamp(
			left + width / 2 - cardRect.width / 2,
			10,
			window.innerWidth - cardRect.width - 10,
		);
		r.tourCard.style.left = `${cardLeft}px`;
		r.tourCard.style.top = `${cardTop}px`;
	}

	// ---------- Tooltips ----------

	private applyTooltipLabels() {
		for (const [id, help] of Object.entries(HELP_TEXT)) {
			document.querySelector(`#${id}`)?.setAttribute("data-help", help);
		}
		document
			.querySelector("#loadProject")
			?.closest("label")
			?.setAttribute("data-help", "Charge un projet VHS Studio sauvegardé.");
		this.refs.toggleGuides
			.closest("label")
			?.setAttribute(
				"data-help",
				"Affiche ou masque les repères d'impression.",
			);
		this.refs.quickColor
			.closest("label")
			?.setAttribute(
				"data-help",
				"Change la couleur de l'élément sélectionné.",
			);
		document.querySelectorAll<HTMLElement>("[data-theme]").forEach((button) => {
			const key = button.dataset.theme;
			button.dataset.help =
				(key && THEME_HELP[key]) || "Change le thème visuel.";
		});
		document
			.querySelectorAll<HTMLElement>("[data-layout]")
			.forEach((button) => {
				const key = button.dataset.layout;
				button.dataset.help =
					(key && LAYOUT_HELP[key]) || "Change la mise en page du recto.";
			});
		document.querySelectorAll<HTMLElement>("[data-zone]").forEach((button) => {
			const key = button.dataset.zone;
			button.dataset.help =
				(key && ZONE_HELP[key]) || "Choisit la zone active.";
		});
	}

	private tooltipTarget(target: EventTarget | null): HTMLElement | null {
		if (!(target instanceof Element)) return null;
		return target.closest<HTMLElement>(
			"[data-help], button[title], label[title], .asset[title], .rating[title]",
		);
	}

	private tooltipText(element: HTMLElement | null) {
		return (
			element?.dataset?.help ||
			element?.getAttribute("title") ||
			element?.getAttribute("aria-label") ||
			element?.textContent?.trim() ||
			""
		);
	}

	private showTooltip(event: Event) {
		const target = this.tooltipTarget(event.target);
		const textValue = this.tooltipText(target);
		if (
			!target ||
			!textValue ||
			(target as HTMLButtonElement).disabled ||
			this.refs.tourOverlay.hidden === false
		)
			return;
		this.tooltipAnchor = target;
		this.refs.uiTooltip.textContent = textValue;
		this.refs.uiTooltip.hidden = false;
		this.positionTooltip(event);
	}

	private positionTooltip(event: Event | null = null) {
		const tooltip = this.refs.uiTooltip;
		if (!this.tooltipAnchor || tooltip.hidden) return;
		const rect = this.tooltipAnchor.getBoundingClientRect();
		const tooltipRect = tooltip.getBoundingClientRect();
		const pointerEvent =
			event && "clientX" in event ? (event as MouseEvent | PointerEvent) : null;
		const fromPointer = pointerEvent?.clientX && pointerEvent?.clientY;
		const anchorX = fromPointer
			? pointerEvent.clientX
			: rect.left + rect.width / 2;
		const anchorY = fromPointer ? pointerEvent.clientY : rect.top;
		const left = clamp(
			anchorX - tooltipRect.width / 2,
			10,
			window.innerWidth - tooltipRect.width - 10,
		);
		const aboveTop = anchorY - tooltipRect.height - 14;
		const belowTop = rect.bottom + 12;
		const top =
			aboveTop > 10
				? aboveTop
				: Math.min(window.innerHeight - tooltipRect.height - 10, belowTop);
		tooltip.style.left = `${left}px`;
		tooltip.style.top = `${top}px`;
	}

	private hideTooltip() {
		this.tooltipAnchor = null;
		this.refs.uiTooltip.hidden = true;
	}

	private wireTooltips() {
		this.applyTooltipLabels();
		const isInTooltipTarget = (related: EventTarget | null) =>
			related instanceof Element &&
			related.closest(
				"[data-help], button[title], label[title], .asset[title], .rating[title]",
			);
		const show = (event: Event) => this.showTooltip(event);
		const move = (event: Event) => this.positionTooltip(event);
		const hide = () => this.hideTooltip();
		document.addEventListener("pointerover", show);
		document.addEventListener("pointermove", move);
		document.addEventListener("pointerout", (event) => {
			if (this.tooltipAnchor && !isInTooltipTarget(event.relatedTarget)) hide();
		});
		document.addEventListener("mouseover", show);
		document.addEventListener("mousemove", move);
		document.addEventListener("mouseout", (event) => {
			if (this.tooltipAnchor && !isInTooltipTarget(event.relatedTarget)) hide();
		});
		document.addEventListener("focusin", show);
		document.addEventListener("focusout", hide);
		window.addEventListener("scroll", hide, true);
		window.addEventListener("resize", hide);
	}

	// ---------- Export ----------

	private downloadBlob(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}

	private async renderExportCanvas() {
		await Promise.all(
			this.project.objects
				.filter((object): object is ImageObject => object.type === "image")
				.map((object) => this.imageCache.load(object.src).catch(() => null)),
		);
		const exportCanvas = document.createElement("canvas");
		exportCanvas.width = EXPORT_W;
		exportCanvas.height = EXPORT_H;
		this.render(exportCanvas, { guides: false });
		return exportCanvas;
	}

	private async exportPngFile() {
		this.setStatus("Export PNG en cours...");
		const exportCanvas = await this.renderExportCanvas();
		exportCanvas.toBlob((blob) => {
			if (blob) this.downloadBlob(blob, "jaquette-vhs-258x194mm-300dpi.png");
			this.setStatus("PNG 300 dpi exporté.");
		}, "image/png");
	}

	private async exportPdfFile() {
		this.setStatus("Préparation du PDF A4...");
		const exportCanvas = await this.renderExportCanvas();
		const pdf = new jsPDF({
			orientation: "landscape",
			unit: "mm",
			format: "a4",
			compress: true,
		});
		const x = (A4.w - COVER.w) / 2;
		const y = (A4.h - COVER.h) / 2;
		pdf.setFillColor(255, 255, 255);
		pdf.rect(0, 0, A4.w, A4.h, "F");
		pdf.addImage(
			exportCanvas.toDataURL("image/png"),
			"PNG",
			x,
			y,
			COVER.w,
			COVER.h,
		);
		drawPdfTrimMarks(pdf, x, y);
		pdf.save("jaquette-vhs-a4-print.pdf");
		this.setStatus("PDF A4 exporté.");
	}

	// ---------- Persistence ----------

	private saveProjectFile() {
		const payload = JSON.stringify(this.project, null, 2);
		this.downloadBlob(
			new Blob([payload], { type: "application/json" }),
			"vhs-studio-project.json",
		);
	}

	private loadProjectFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const data = JSON.parse(String(reader.result));
				if (!Array.isArray(data.objects))
					throw new Error("Missing project objects");
				const objects = normalizeProjectObjects(data.objects, () =>
					this.makeId(),
				);
				if (!objects.length) throw new Error("No valid project objects");
				this.pushHistory();
				this.project.name = data.name || this.project.name;
				this.project.background = cleanColor(
					data.background,
					this.project.background,
				);
				this.project.objects = objects;
				this.project.objects
					.filter((object): object is ImageObject => object.type === "image")
					.forEach((object) => void this.imageCache.load(object.src));
				this.selectObject(null);
				this.setStatus("Projet chargé.");
				this.scheduleRender();
			} catch (_) {
				this.setStatus("Fichier projet illisible.");
			}
		};
		reader.readAsText(file);
	}

	// ---------- Wiring ----------

	private wireAssets() {
		const r = this.refs;
		const av = ASSETS.filter((asset) => asset.kind !== "rating");
		const ratings = ASSETS.filter((asset) => asset.kind === "rating");
		r.assetTray.innerHTML = av
			.map(
				(asset) => `
					<button class="asset" type="button" draggable="true" data-src="${asset.src}" title="${asset.label}" data-help="Ajoute le logo ${asset.label} sur la zone active.">
						<img src="${asset.src}" alt="" loading="lazy" />
						<span>${asset.label}</span>
					</button>
				`,
			)
			.join("");
		r.ratingsTray.innerHTML = ratings
			.map(
				(asset) => `
					<button class="rating" type="button" draggable="true" data-src="${asset.src}" title="${asset.label}" aria-label="${asset.label}" data-help="Ajoute la classification ${asset.label}.">
						<img src="${asset.src}" alt="${asset.label}" loading="lazy" />
					</button>
				`,
			)
			.join("");
		r.assetCount.textContent = `${ASSETS.length} logos disponibles`;
		const wireButton = (button: HTMLElement) => {
			const src = button.dataset.src ?? "";
			button.addEventListener("click", () => this.addAsset(src, button.title));
			button.addEventListener("dragstart", (event) => {
				(event as DragEvent).dataTransfer?.setData("text/plain", src);
			});
		};
		r.assetTray.querySelectorAll<HTMLElement>(".asset").forEach(wireButton);
		r.ratingsTray.querySelectorAll<HTMLElement>(".rating").forEach(wireButton);
	}

	private wireEvents() {
		const r = this.refs;
		document
			.querySelectorAll<HTMLElement>(".segment button")
			.forEach((button) => {
				button.addEventListener("click", () => {
					document
						.querySelector(".segment .active")
						?.classList.remove("active");
					button.classList.add("active");
					if (button.dataset.zone)
						this.activeZone = button.dataset.zone as ZoneKey;
				});
			});

		document.querySelectorAll<HTMLElement>("[data-theme]").forEach((button) => {
			button.addEventListener("click", () => {
				if (button.dataset.theme)
					this.applyTheme(button.dataset.theme as ThemeKey);
			});
		});
		document
			.querySelectorAll<HTMLElement>("[data-layout]")
			.forEach((button) => {
				button.addEventListener("click", () => {
					if (button.dataset.layout)
						this.applyLayout(button.dataset.layout as LayoutKey);
				});
			});
		r.undoAction.addEventListener("click", () => this.undoProject());
		r.redoAction.addEventListener("click", () => this.redoProject());
		r.undoActionStage.addEventListener("click", () => this.undoProject());
		r.redoActionStage.addEventListener("click", () => this.redoProject());
		r.startTour.addEventListener("click", () => this.startTourAt(0));
		r.startTourStage.addEventListener("click", () => this.startTourAt(0));
		r.tourSkip.addEventListener("click", () => this.closeTour());
		r.tourPrev.addEventListener("click", () => this.previousTourStep());
		r.tourNext.addEventListener("click", () => this.nextTourStep());
		r.addTitle.addEventListener("click", () => this.addTextLayer("title"));
		r.addTextButton.addEventListener("click", () => this.addTextLayer("body"));
		r.addBox.addEventListener("click", () => this.addRect());
		r.imageUploadButton.addEventListener("click", () =>
			this.openImageUploadPicker(),
		);
		r.imageUpload.addEventListener("change", (event) =>
			this.handleFiles((event.target as HTMLInputElement).files),
		);
		r.toggleGuides.addEventListener("change", () => {
			this.pushHistory();
			this.showGuides = r.toggleGuides.checked;
			this.scheduleRender();
		});
		r.fitZoom.addEventListener("click", () => {
			const wrap = r.stageScroller;
			const target = r.canvas;
			if (!target || !wrap) return;
			const left = Math.max(0, (target.offsetWidth - wrap.clientWidth) / 2);
			const top = Math.max(0, (target.offsetHeight - wrap.clientHeight) / 2);
			wrap.scrollTo({ left, top, behavior: "smooth" });
		});
		r.exportPng.addEventListener("click", () => this.exportPngFile());
		r.exportPdf.addEventListener("click", () => this.exportPdfFile());
		r.saveProject.addEventListener("click", () => this.saveProjectFile());
		r.loadProject.addEventListener("change", (event) =>
			this.loadProjectFile(event),
		);

		const inspectorControls: (
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
		)[] = [
			r.textContent,
			r.fontFamily,
			r.fontSize,
			r.fillColor,
			r.opacity,
			r.rotation,
			r.textAlign,
			r.imageFit,
			r.posX,
			r.posY,
			r.posW,
			r.posH,
		];
		for (const control of inspectorControls) {
			control.addEventListener("focus", () => this.prepareInspectorEdit());
			control.addEventListener("pointerdown", () =>
				this.prepareInspectorEdit(),
			);
			control.addEventListener("input", () => this.applyInspectorChange());
			control.addEventListener("change", () => {
				this.inspectorEditPrimed = false;
			});
			control.addEventListener("blur", () => {
				this.inspectorEditPrimed = false;
			});
		}
		r.replaceImage.addEventListener("click", () =>
			this.openReplaceImagePicker(),
		);
		r.replaceImageInput.addEventListener("change", (event) =>
			this.replaceSelectedImage(event),
		);
		r.bringForward.addEventListener("click", () => this.moveLayer(1));
		r.sendBackward.addEventListener("click", () => this.moveLayer(-1));
		r.duplicateLayer.addEventListener("click", () => this.duplicateSelected());
		r.deleteLayer.addEventListener("click", () => this.deleteSelected());
		r.quickAlign.addEventListener("click", () => this.cycleTextAlign());
		r.quickColor.addEventListener("focus", () => this.prepareInspectorEdit());
		r.quickColor.addEventListener("pointerdown", () =>
			this.prepareInspectorEdit(),
		);
		r.quickColor.addEventListener("input", () => this.applyQuickColor());
		r.quickColor.addEventListener("change", () => {
			this.inspectorEditPrimed = false;
		});
		r.quickFit.addEventListener("click", () => this.toggleImageFit());
		r.quickBackward.addEventListener("click", () => this.moveLayer(-1));
		r.quickForward.addEventListener("click", () => this.moveLayer(1));
		r.quickDuplicate.addEventListener("click", () => this.duplicateSelected());
		r.quickDelete.addEventListener("click", () => this.deleteSelected());
		r.selectionToolbar.addEventListener("pointerdown", (event) =>
			event.stopPropagation(),
		);

		r.canvasDelete.addEventListener("click", (event) =>
			this.onCanvasDeleteClick(event),
		);
		r.canvasDelete.addEventListener("pointerdown", (event) =>
			event.stopPropagation(),
		);

		r.canvas.addEventListener("pointerdown", (event) =>
			this.onPointerDown(event),
		);
		r.canvas.addEventListener("pointermove", (event) =>
			this.onPointerMove(event),
		);
		r.canvas.addEventListener("pointerup", (event) => this.onPointerUp(event));
		r.canvas.addEventListener("pointercancel", (event) =>
			this.onPointerUp(event),
		);
		r.canvas.addEventListener("dblclick", (event) => {
			const point = this.canvasPoint(event);
			const object = this.hitTest(point);
			if (object) {
				this.selectObject(object.id);
				this.openInspectorDrawerIfMobile();
				if (object.type === "text") {
					this.refs.textContent.focus();
					this.refs.textContent.select();
				}
				return;
			}
			this.addTextAt(point);
		});
		r.stage.addEventListener("dragover", (event) => event.preventDefault());
		r.stage.addEventListener("drop", (event) => this.onDrop(event));
		window.addEventListener("resize", () => this.setupCanvasSize());
		window.addEventListener("scroll", () => this.positionTourStep(), true);
		window.addEventListener("keydown", (event) => this.onKeyDown(event));

		this.wireMobileChrome();
	}

	private wireMobileChrome() {
		const menuToggle = document.querySelector<HTMLElement>("#topbarMenu");
		const toolsToggle = document.querySelector<HTMLElement>("#toggleToolsRail");
		const inspectorToggle = document.querySelector<HTMLElement>(
			"#toggleInspectorRail",
		);
		const backdrop = document.querySelector<HTMLElement>("#mobileBackdrop");
		const body = document.body;

		type ChromeKey = "menu" | "tools" | "inspector";
		const states: Record<
			ChromeKey,
			{ className: string; toggle: HTMLElement | null; attr: string }
		> = {
			menu: {
				className: "is-menu-open",
				toggle: menuToggle,
				attr: "aria-expanded",
			},
			tools: {
				className: "is-tools-open",
				toggle: toolsToggle,
				attr: "aria-pressed",
			},
			inspector: {
				className: "is-inspector-open",
				toggle: inspectorToggle,
				attr: "aria-pressed",
			},
		};

		function closeAll(except: ChromeKey | null) {
			for (const [key, state] of Object.entries(states)) {
				if (key === except) continue;
				body.classList.remove(state.className);
				if (state.toggle) state.toggle.setAttribute(state.attr, "false");
			}
		}

		function toggle(key: ChromeKey) {
			const state = states[key];
			if (!state?.toggle) return;
			const willOpen = !body.classList.contains(state.className);
			closeAll(willOpen ? key : null);
			body.classList.toggle(state.className, willOpen);
			state.toggle.setAttribute(state.attr, willOpen ? "true" : "false");
		}

		menuToggle?.addEventListener("click", () => toggle("menu"));
		toolsToggle?.addEventListener("click", () => toggle("tools"));
		inspectorToggle?.addEventListener("click", () => toggle("inspector"));
		backdrop?.addEventListener("click", () => closeAll(null));

		document
			.querySelector(".rail--left")
			?.addEventListener("click", (event) => {
				if (
					event.target instanceof Element &&
					event.target.closest(
						"button, label, input, select, textarea, .asset, .rating",
					)
				) {
					body.classList.remove(states.tools.className);
					toolsToggle?.setAttribute(states.tools.attr, "false");
				}
			});

		document
			.querySelectorAll("#topbarActions .topbar__action")
			.forEach((node) => {
				node.addEventListener("click", () => {
					body.classList.remove(states.menu.className);
					menuToggle?.setAttribute(states.menu.attr, "false");
				});
			});

		const desktopQuery = window.matchMedia("(min-width: 901px)");
		const handleViewport = () => {
			if (desktopQuery.matches) closeAll(null);
		};
		desktopQuery.addEventListener?.("change", handleViewport);
	}
}

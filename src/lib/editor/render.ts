import type { jsPDF } from "jspdf";
import { COVER, ZONES } from "./constants";
import { degToRad, getHandles } from "./geometry";
import type { ImageCache } from "./image-cache";
import type { Fit, ProjectObject, ProjectState, TextObject } from "./types";

export function drawBackdrop(
	ctx: CanvasRenderingContext2D,
	scale: number,
	background: string,
) {
	ctx.save();
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, COVER.w * scale, COVER.h * scale);
	ctx.globalAlpha = 0.16;
	for (let y = 0; y < COVER.h; y += 2.2) {
		ctx.fillStyle = y % 4.4 < 2.2 ? "#ffffff" : "#000000";
		ctx.fillRect(0, y * scale, COVER.w * scale, 0.45 * scale);
	}
	ctx.restore();
}

export function drawObject(
	ctx: CanvasRenderingContext2D,
	object: ProjectObject,
	scale: number,
	imageCache: ImageCache,
) {
	ctx.save();
	ctx.globalAlpha = object.opacity ?? 1;
	const cx = (object.x + object.w / 2) * scale;
	const cy = (object.y + object.h / 2) * scale;
	ctx.translate(cx, cy);
	ctx.rotate(((object.rotation || 0) * Math.PI) / 180);
	ctx.translate((-object.w * scale) / 2, (-object.h * scale) / 2);

	if (object.type === "rect") {
		ctx.fillStyle = object.fill;
		ctx.fillRect(0, 0, object.w * scale, object.h * scale);
		if (object.stroke && object.stroke !== "transparent") {
			ctx.strokeStyle = object.stroke;
			ctx.lineWidth = Math.max(1, 0.4 * scale);
			ctx.strokeRect(0, 0, object.w * scale, object.h * scale);
		}
	}

	if (object.type === "image") {
		const img = imageCache.get(object.src);
		if (img?.complete) {
			drawFittedImage(
				ctx,
				img,
				object.w * scale,
				object.h * scale,
				object.fit || "contain",
			);
		} else {
			ctx.fillStyle = "#111";
			ctx.fillRect(0, 0, object.w * scale, object.h * scale);
			ctx.strokeStyle = "#ff2dd4";
			ctx.strokeRect(0, 0, object.w * scale, object.h * scale);
		}
	}

	if (object.type === "text") drawText(ctx, object, scale);
	ctx.restore();
}

function drawFittedImage(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	w: number,
	h: number,
	fit: Fit,
) {
	const imageRatio = img.naturalWidth / img.naturalHeight;
	const boxRatio = w / h;
	let dw = w;
	let dh = h;
	let dx = 0;
	let dy = 0;
	if (fit === "cover" ? imageRatio > boxRatio : imageRatio < boxRatio) {
		dh = fit === "cover" ? h : w / imageRatio;
		dw = fit === "cover" ? h * imageRatio : w;
		dx = (w - dw) / 2;
		dy = (h - dh) / 2;
	} else {
		dw = fit === "cover" ? w : h * imageRatio;
		dh = fit === "cover" ? w / imageRatio : h;
		dx = (w - dw) / 2;
		dy = (h - dh) / 2;
	}
	ctx.drawImage(img, dx, dy, dw, dh);
}

function drawText(
	ctx: CanvasRenderingContext2D,
	object: TextObject,
	scale: number,
) {
	const size = object.fontSize * scale;
	const lineHeight = size * 1.08;
	ctx.fillStyle = object.fill;
	ctx.font = `900 ${size}px ${object.fontFamily}`;
	ctx.textAlign = object.align || "left";
	ctx.textBaseline = "top";
	if (object.shadow) {
		ctx.shadowColor = object.shadow;
		ctx.shadowBlur = 2.2 * scale;
		ctx.shadowOffsetX = 1.2 * scale;
		ctx.shadowOffsetY = 1.2 * scale;
	}
	const maxWidth = object.w * scale;
	const x =
		object.align === "center"
			? maxWidth / 2
			: object.align === "right"
				? maxWidth
				: 0;
	const lines = wrapText(ctx, object.content || "", maxWidth);
	lines
		.slice(0, Math.max(1, Math.ceil((object.h * scale) / lineHeight)))
		.forEach((line, index) => {
			ctx.fillText(line, x, index * lineHeight);
		});
}

function wrapText(
	ctx: CanvasRenderingContext2D,
	textValue: string,
	maxWidth: number,
) {
	const hardLines = String(textValue).split("\n");
	const lines: string[] = [];
	for (const hardLine of hardLines) {
		const words = hardLine.split(/\s+/).filter(Boolean);
		if (!words.length) {
			lines.push("");
			continue;
		}
		let line = "";
		for (const word of words) {
			const next = line ? `${line} ${word}` : word;
			if (ctx.measureText(next).width <= maxWidth || !line) {
				line = next;
			} else {
				lines.push(line);
				line = word;
			}
		}
		lines.push(line);
	}
	return lines;
}

export function drawGuides(ctx: CanvasRenderingContext2D, scale: number) {
	ctx.save();
	ctx.strokeStyle = "#ff3434";
	ctx.lineWidth = Math.max(1, 0.35 * scale);
	ctx.strokeRect(
		0.4 * scale,
		0.4 * scale,
		(COVER.w - 0.8) * scale,
		(COVER.h - 0.8) * scale,
	);
	ctx.setLineDash([4 * scale, 2.5 * scale]);
	ctx.strokeStyle = "rgba(255,255,255,0.62)";
	ctx.beginPath();
	ctx.moveTo(ZONES.spine.x * scale, 0);
	ctx.lineTo(ZONES.spine.x * scale, COVER.h * scale);
	ctx.moveTo((ZONES.spine.x + ZONES.spine.w) * scale, 0);
	ctx.lineTo((ZONES.spine.x + ZONES.spine.w) * scale, COVER.h * scale);
	ctx.stroke();
	ctx.setLineDash([]);
	ctx.fillStyle = "rgba(255,255,255,0.84)";
	ctx.font = `700 ${Math.max(9, 2.8 * scale)}px Arial`;
	ctx.fillText("VERSO", 3 * scale, 5 * scale);
	ctx.fillText("TRANCHE", 116 * scale, 5 * scale);
	ctx.fillText("RECTO", 147 * scale, 5 * scale);
	ctx.restore();
}

export function drawSelection(
	ctx: CanvasRenderingContext2D,
	object: ProjectObject | null,
	scale: number,
) {
	if (!object) return;
	const cx = (object.x + object.w / 2) * scale;
	const cy = (object.y + object.h / 2) * scale;
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(degToRad(object.rotation || 0));
	ctx.translate((-object.w * scale) / 2, (-object.h * scale) / 2);
	ctx.strokeStyle = "#fff365";
	ctx.lineWidth = Math.max(1.5, 0.45 * scale);
	ctx.setLineDash([5, 4]);
	ctx.strokeRect(0, 0, object.w * scale, object.h * scale);
	ctx.setLineDash([]);
	ctx.restore();

	const handles = getHandles(object);
	const top = handles.find((handle) => handle.name === "n");
	const rotate = handles.find((handle) => handle.name === "rotate");
	if (!top || !rotate) return;
	ctx.save();
	ctx.lineWidth = 2;
	ctx.strokeStyle = "#fff365";
	ctx.beginPath();
	ctx.moveTo(top.x * scale, top.y * scale);
	ctx.lineTo(rotate.x * scale, rotate.y * scale);
	ctx.stroke();
	for (const handle of handles) {
		ctx.fillStyle = handle.type === "rotate" ? "#fff365" : "#0c0614";
		ctx.strokeStyle = handle.type === "rotate" ? "#160b22" : "#21f7ff";
		ctx.lineWidth = 2;
		ctx.beginPath();
		if (handle.type === "rotate") {
			ctx.arc(handle.x * scale, handle.y * scale, 7, 0, Math.PI * 2);
		} else {
			ctx.rect(handle.x * scale - 6, handle.y * scale - 6, 12, 12);
		}
		ctx.fill();
		ctx.stroke();
	}
	ctx.restore();
}

export function drawPdfTrimMarks(pdf: jsPDF, x: number, y: number) {
	pdf.setDrawColor(255, 52, 52);
	pdf.setLineWidth(0.25);
	pdf.rect(x, y, COVER.w, COVER.h);
	pdf.setDrawColor(0, 0, 0);
	pdf.setLineWidth(0.18);
	const mark = 6;
	const corners: [number, number, number, number][] = [
		[x, y, -1, -1],
		[x + COVER.w, y, 1, -1],
		[x, y + COVER.h, -1, 1],
		[x + COVER.w, y + COVER.h, 1, 1],
	];
	for (const [cx, cy, sx, sy] of corners) {
		pdf.line(cx, cy + sy * 2, cx, cy + sy * mark);
		pdf.line(cx + sx * 2, cy, cx + sx * mark, cy);
	}
	pdf.setDrawColor(40, 40, 40);
	pdf.setLineDashPattern([2, 1.5], 0);
	pdf.line(x + 114, y, x + 114, y + COVER.h);
	pdf.line(x + 144, y, x + 144, y + COVER.h);
	pdf.setLineDashPattern([], 0);
}

export function renderToCanvas(
	target: HTMLCanvasElement,
	project: ProjectState,
	options: {
		showGuides: boolean;
		selectedId: string | null;
		imageCache: ImageCache;
		isInteractive: boolean;
	},
) {
	const ctx = target.getContext("2d");
	if (!ctx) return;
	const scale = target.width / COVER.w;
	ctx.clearRect(0, 0, target.width, target.height);
	drawBackdrop(ctx, scale, project.background);
	for (const object of project.objects)
		drawObject(ctx, object, scale, options.imageCache);
	if (options.showGuides) drawGuides(ctx, scale);
	if (options.isInteractive && options.selectedId) {
		const selected =
			project.objects.find((object) => object.id === options.selectedId) ||
			null;
		drawSelection(ctx, selected, scale);
	}
}

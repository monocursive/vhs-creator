import { COVER } from "./constants";
import { clamp } from "./geometry";
import type { Align, BaseObject, ProjectObject } from "./types";

export function cleanString(value: unknown, fallback = "", maxLength = 4000) {
	return typeof value === "string" ? value.slice(0, maxLength) : fallback;
}

export function cleanNumber(
	value: unknown,
	fallback: number,
	min: number,
	max: number,
) {
	const number = Number(value);
	return Number.isFinite(number) ? clamp(number, min, max) : fallback;
}

export function cleanColor(value: unknown, fallback = "#ffffff") {
	return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
		? value
		: fallback;
}

export function cleanStroke(value: unknown) {
	if (value === "transparent") return value;
	return cleanColor(value, "transparent");
}

export function cleanImageSource(value: unknown): string | null {
	if (typeof value !== "string") return null;
	if (
		value.startsWith("/") ||
		/^data:image\/(?:png|jpe?g);base64,/i.test(value)
	)
		return value;
	return null;
}

export function normalizeProjectObject(
	raw: unknown,
	seenIds: Set<string>,
	makeId: () => string,
): ProjectObject | null {
	if (!raw || typeof raw !== "object") return null;
	const r = raw as Record<string, unknown>;
	if (typeof r.type !== "string" || !["rect", "text", "image"].includes(r.type))
		return null;

	const rawId = cleanString(r.id, "", 80);
	const id = rawId && !seenIds.has(rawId) ? rawId : makeId();
	seenIds.add(id);

	const base: BaseObject = {
		id,
		name: cleanString(r.name, "Calque", 80),
		x: cleanNumber(r.x, 0, -COVER.w, COVER.w * 2),
		y: cleanNumber(r.y, 0, -COVER.h, COVER.h * 2),
		w: cleanNumber(r.w, 20, 2, COVER.w * 2),
		h: cleanNumber(r.h, 20, 2, COVER.h * 2),
		opacity: cleanNumber(r.opacity, 1, 0, 1),
		rotation: cleanNumber(r.rotation, 0, -180, 180),
		locked: r.locked === true,
	};
	if (r.layoutGenerated === true) base.layoutGenerated = true;

	if (r.type === "rect") {
		return {
			...base,
			type: "rect",
			fill: cleanColor(r.fill, "#000000"),
			stroke: cleanStroke(r.stroke),
		};
	}

	if (r.type === "text") {
		const align: Align =
			r.align === "center" || r.align === "right" || r.align === "left"
				? r.align
				: "left";
		return {
			...base,
			type: "text",
			content: cleanString(r.content, "", 6000),
			fontSize: cleanNumber(r.fontSize, 8, 2, 180),
			fill: cleanColor(r.fill, "#ffffff"),
			align,
			fontFamily: cleanString(r.fontFamily, "Arial, sans-serif", 180),
			shadow: cleanString(r.shadow, "", 120),
		};
	}

	const src = cleanImageSource(r.src);
	if (!src) return null;
	return {
		...base,
		type: "image",
		src,
		fit: r.fit === "cover" ? "cover" : "contain",
	};
}

export function normalizeProjectObjects(
	objects: unknown[],
	makeId: () => string,
): ProjectObject[] {
	const seenIds = new Set<string>();
	return objects
		.map((object) => normalizeProjectObject(object, seenIds, makeId))
		.filter((object): object is ProjectObject => object !== null);
}

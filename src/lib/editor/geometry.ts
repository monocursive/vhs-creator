import type { Handle, ProjectObject, Vec } from "./types";

export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function degToRad(degrees: number) {
	return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number) {
	return (radians * 180) / Math.PI;
}

export function normalizeAngle(degrees: number) {
	let angle = ((degrees + 180) % 360) - 180;
	if (angle < -180) angle += 360;
	return angle;
}

export function rotatePoint(point: Vec, angle: number): Vec {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return {
		x: point.x * cos - point.y * sin,
		y: point.x * sin + point.y * cos,
	};
}

type Rectish = {
	x: number;
	y: number;
	w: number;
	h: number;
	rotation?: number;
};

export function objectCenter(object: {
	x: number;
	y: number;
	w: number;
	h: number;
}): Vec {
	return { x: object.x + object.w / 2, y: object.y + object.h / 2 };
}

export function localToWorld(object: Rectish, local: Vec): Vec {
	const center = objectCenter(object);
	const rotated = rotatePoint(
		{ x: local.x - object.w / 2, y: local.y - object.h / 2 },
		degToRad(object.rotation || 0),
	);
	return { x: center.x + rotated.x, y: center.y + rotated.y };
}

export function worldToLocal(point: Vec, object: Rectish): Vec {
	const center = objectCenter(object);
	const rotated = rotatePoint(
		{ x: point.x - center.x, y: point.y - center.y },
		-degToRad(object.rotation || 0),
	);
	return { x: rotated.x + object.w / 2, y: rotated.y + object.h / 2 };
}

export function getHandles(object: ProjectObject): Handle[] {
	const locals: Handle[] = [
		{ name: "nw", x: 0, y: 0, type: "resize", cursor: "nwse-resize" },
		{ name: "n", x: object.w / 2, y: 0, type: "resize", cursor: "ns-resize" },
		{ name: "ne", x: object.w, y: 0, type: "resize", cursor: "nesw-resize" },
		{
			name: "e",
			x: object.w,
			y: object.h / 2,
			type: "resize",
			cursor: "ew-resize",
		},
		{
			name: "se",
			x: object.w,
			y: object.h,
			type: "resize",
			cursor: "nwse-resize",
		},
		{
			name: "s",
			x: object.w / 2,
			y: object.h,
			type: "resize",
			cursor: "ns-resize",
		},
		{ name: "sw", x: 0, y: object.h, type: "resize", cursor: "nesw-resize" },
		{ name: "w", x: 0, y: object.h / 2, type: "resize", cursor: "ew-resize" },
		{ name: "rotate", x: object.w / 2, y: -14, type: "rotate", cursor: "grab" },
	];
	return locals.map((handle) => ({
		...handle,
		...localToWorld(object, handle),
	}));
}

export function fixedAnchorForHandle(
	handle: string,
	object: { w: number; h: number },
): { originalLocal: Vec; nextLocal: (w: number, h: number) => Vec } {
	if (handle === "n")
		return {
			originalLocal: { x: object.w / 2, y: object.h },
			nextLocal: (w, h) => ({ x: w / 2, y: h }),
		};
	if (handle === "s")
		return {
			originalLocal: { x: object.w / 2, y: 0 },
			nextLocal: (w) => ({ x: w / 2, y: 0 }),
		};
	if (handle === "e")
		return {
			originalLocal: { x: 0, y: object.h / 2 },
			nextLocal: (_w, h) => ({ x: 0, y: h / 2 }),
		};
	if (handle === "w")
		return {
			originalLocal: { x: object.w, y: object.h / 2 },
			nextLocal: (w, h) => ({ x: w, y: h / 2 }),
		};
	if (handle === "ne")
		return {
			originalLocal: { x: 0, y: object.h },
			nextLocal: (_w, h) => ({ x: 0, y: h }),
		};
	if (handle === "nw")
		return {
			originalLocal: { x: object.w, y: object.h },
			nextLocal: (w, h) => ({ x: w, y: h }),
		};
	if (handle === "se")
		return { originalLocal: { x: 0, y: 0 }, nextLocal: () => ({ x: 0, y: 0 }) };
	return {
		originalLocal: { x: object.w, y: 0 },
		nextLocal: (w) => ({ x: w, y: 0 }),
	};
}

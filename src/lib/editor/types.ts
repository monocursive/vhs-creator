export type Align = "left" | "center" | "right";
export type Fit = "contain" | "cover";
export type Vec = { x: number; y: number };
export type Size = { w: number; h: number };

export type BaseObject = {
	id: string;
	name: string;
	x: number;
	y: number;
	w: number;
	h: number;
	opacity: number;
	rotation: number;
	locked: boolean;
	layoutGenerated?: boolean;
};

export type RectObject = BaseObject & {
	type: "rect";
	fill: string;
	stroke: string;
};
export type TextObject = BaseObject & {
	type: "text";
	content: string;
	fontSize: number;
	fill: string;
	align: Align;
	fontFamily: string;
	shadow: string;
};
export type ImageObject = BaseObject & { type: "image"; src: string; fit: Fit };
export type ProjectObject = RectObject | TextObject | ImageObject;

export type ProjectState = {
	name: string;
	background: string;
	objects: ProjectObject[];
};

export type Theme = {
	back: string;
	spine: string;
	front: string;
	accent: string;
	secondary: string;
	title: string;
	body: string;
	shadow: string;
	titleFont: string;
	bodyFont: string;
};

export type ThemeKey =
	| "neon"
	| "rental"
	| "scifi"
	| "horror"
	| "action"
	| "aventure"
	| "cyber"
	| "romance"
	| "alien";
export type LayoutKey = "classic" | "bigtype" | "poster" | "split";
export type ZoneKey = "front" | "back" | "spine";

export type Snapshot = ProjectState & {
	activeTheme: ThemeKey;
	activeLayout: LayoutKey;
	showGuides: boolean;
};

export type Handle = {
	name: string;
	x: number;
	y: number;
	type: "resize" | "rotate";
	cursor: string;
};

export type ResizeRotateDrag = {
	id: string;
	handle: string;
	start: Vec;
	startAngle: number;
	original: ProjectObject;
	historyPushed: boolean;
};
export type MoveDrag = {
	id: string;
	dx: number;
	dy: number;
	historyPushed: boolean;
};
export type DragState = ResizeRotateDrag | MoveDrag;

export type TourStep = {
	title: string;
	body: string;
	target: () => Element | null;
	prepare?: () => void;
};

export type Asset = { label: string; kind: "av" | "rating"; src: string };

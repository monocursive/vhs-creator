export class ImageCache {
	private cache = new Map<string, HTMLImageElement>();
	private pending = new Map<string, Promise<HTMLImageElement>>();

	constructor(private onLoad: () => void) {}

	get(src: string): HTMLImageElement | undefined {
		return this.cache.get(src);
	}

	load(src: string): Promise<HTMLImageElement> {
		const cached = this.cache.get(src);
		if (cached) return Promise.resolve(cached);
		const inFlight = this.pending.get(src);
		if (inFlight) return inFlight;
		const promise = new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				this.cache.set(src, img);
				this.pending.delete(src);
				this.onLoad();
				resolve(img);
			};
			img.onerror = () => {
				this.pending.delete(src);
				reject(new Error(`Unable to load image: ${src}`));
			};
			img.src = src;
		});
		this.pending.set(src, promise);
		return promise;
	}
}

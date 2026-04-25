import type { BaseRepository } from "./BaseRepository.js";

export abstract class BaseService<T extends BaseRepository> {
	constructor(protected repo: T) {}
}

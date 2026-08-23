import type { BaseRepository } from "./BaseRepository.js";

export abstract class BaseService<T extends BaseRepository<object>> {
	constructor(protected repo: T) {}
}

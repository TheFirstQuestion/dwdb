export function parseRouteId(param?: string | string[]): number {
	const id = Number(param);
	if (Number.isNaN(id)) {
		throw createError({ statusCode: 404, statusMessage: "Not Found" });
	}
	return id;
}

export function useRouteId(): number {
	const route = useRoute();
	return parseRouteId(route.params.id);
}

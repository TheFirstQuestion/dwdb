import type { Era } from "@/types/eras.schema.js";

import { request } from "../utils/api-request";

export const getEras = () => request<Era[]>("/eras");

export const getEra = (id: number) => request<Era>(`/eras/${id}`);

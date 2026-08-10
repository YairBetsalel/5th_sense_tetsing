import { request } from "./client";

type GridCoord = [number, number];
type GridData = GridCoord[];

type ResponseMapsId = {
    "id":           number;
    "created_by":   string;
    "name":         string;
    "grid_data":    GridData;
    "cell_size":    number;
    "length":       number;
    "width":        number;
    "created_at":   string;
}

export async function request_MapsId(
    index: number
): Promise<ResponseMapsId> {
    return request<ResponseMapsId>(`/api/maps/${index}/`, {
        method: "GET"
    });
}
import { request } from "./client";

/*

HTTP 201 Created
Allow: GET, POST, HEAD, OPTIONS
Content-Type: application/json
Vary: Accept

{
    "id": 1,
    "created_by": "therustymate",
    "name": "test",
    "grid_data": {
        "test": "test grid data. REMOVE AFTER TESTING"
    },
    "cell_size": 32.0,
    "length": 32.0,
    "width": 32.0,
    "created_at": "2026-06-26T14:18:45.817908+12:00"
}

*/

export type ResponseMapListCreate = {
    "id"            : number;
    "created_by"    : string;
    "name"          : string;
    "grid_data"     : unknown;
    "cell_size"     : number;
    "length"        : number;
    "width"         : number;
    "created_at"    : string;
};

export type RequestMapListCreate = {
    "name"          : string;
    "grid_data"     : unknown;
    "cell_size"     : number;
    "length"        : number;
    "width"         : number;
};

export async function request_MapListCreate(
    payload: RequestMapListCreate
): Promise<ResponseMapListCreate> {
    return request<ResponseMapListCreate>("/api/maps/", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}
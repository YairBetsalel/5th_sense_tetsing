
/*
--- [REQ] ---

POST /api/maps/ HTTP/1.1
Host: 209.38.89.2:8000
Content-Length: 693
Cache-Control: max-age=0
Accept-Language: en-US,en;q=0.9
Upgrade-Insecure-Requests: 1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryALwGsxEMbAjz4qYG
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36
Origin: http://209.38.89.2:8000
Accept: application/json
Referer: http://209.38.89.2:8000/api/maps/
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Authorization: Token [TOKEN_HERE]

------WebKitFormBoundaryALwGsxEMbAjz4qYG
Content-Disposition: form-data; name="csrfmiddlewaretoken"

wlkmerDMqiQOWUGMxjf6UTxrN7F46yTexGOJMRdwKFNxfrXHecRc1nfJqvocROK4
------WebKitFormBoundaryALwGsxEMbAjz4qYG
Content-Disposition: form-data; name="name"

test_grid_data_map
------WebKitFormBoundaryALwGsxEMbAjz4qYG
Content-Disposition: form-data; name="grid_data"

[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[3,1],[3,2],[3,3],[3,4],[4,4],[5,4],[6,4],[7,4],[7,5],[7,6],[7,7],[7,8],[6,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],[0,5],[0,4],[0,3],[0,2],[0,1]]

------WebKitFormBoundaryALwGsxEMbAjz4qYG
Content-Disposition: form-data; name="cell_size"

27
------WebKitFormBoundaryALwGsxEMbAjz4qYG
Content-Disposition: form-data; name="length"

9
------WebKitFormBoundaryALwGsxEMbAjz4qYG
Content-Disposition: form-data; name="width"

9
------WebKitFormBoundaryALwGsxEMbAjz4qYG--









--- [RES] ---

HTTP 200 OK
Allow: GET, HEAD, OPTIONS
Content-Type: application/json
Vary: Accept

{
    "map_id": 2,
    "start": [
        0,
        0
    ],
    "end": [
        7,
        6
    ],
    "path": [
        [
            7,
            6
        ],
        [
            7,
            5
        ],
        [
            7,
            4
        ],
        [
            6,
            4
        ],
        [
            5,
            4
        ],
        [
            4,
            4
        ],
        [
            3,
            4
        ],
        [
            3,
            3
        ],
        [
            3,
            2
        ],
        [
            3,
            1
        ],
        [
            3,
            0
        ],
        [
            2,
            0
        ],
        [
            1,
            0
        ],
        [
            0,
            0
        ]
    ],
    "total_steps": 13
}


*/

import { request } from "./client";

type GridCoord = [number, number];
type GridData = GridCoord[];

type ResponseMapsIdPath = {
    "map_id":      number;
    "start":        number[];
    "end":          number[];
    "path":         GridData;
    "total_steps":  number;
}

export async function request_MapsIdPath(
    index: number,
    start_x: number,
    start_y: number,
    end_x: number,
    end_y: number
): Promise<ResponseMapsIdPath> {
    return request<ResponseMapsIdPath>(`/api/maps/${index}/path/?start_x=${start_x}&start_y=${start_y}&end_x=${end_x}&end_y=${end_y}`, {
        method: "GET"
    });
}
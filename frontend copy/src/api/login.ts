import { request, setToken, loadToken } from "./client";

/*

http://209.38.89.2:8000/api/users/login/

--- [REQ] ---

POST /api/users/login/ HTTP/1.1
Host: 209.38.89.2:8000
Content-Type: application/json
Accept: application/json
Cookie: csrftoken=Oj8SMAxop5fZKgCOI4hF8Od8USPx3EG8
Connection: keep-alive

{
  "username": "therustymate",
  "password": "1234"
}

--- [RES] ---

{"token":"2ef7fd8be3b02538aff093eebab72d55e8847b4c"}

--- [OTHER REQ] ---

...
Authorization: Token 2ef7fd8be3b02538aff093eebab72d55e8847b4c
...

*/

type LoginSuccess = {
    "token":                string;
    "user_role": string;
}

type LoginFailed = {
    "non_field_errors":     string[];
}

export type ResponseLogin = LoginSuccess | LoginFailed;

export type RequestLogin = {
    "username":     string;
    "password":     string;
};

export async function request_Login(
    payload: RequestLogin
): Promise<LoginSuccess> {
    const response = await request<ResponseLogin>("/api/users/login/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if ("token" in response) {
        setToken(response.token);
        return response;
    }

    throw new Error(response.non_field_errors?.[0] ?? "Login failed")
}
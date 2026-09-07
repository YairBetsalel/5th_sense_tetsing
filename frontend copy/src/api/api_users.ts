import {request} from "./client";

export type UserData = {
    id: number;
    username: string;
    email: string;
    user_role: string;
};

export type UserPayload = {
    username: string;
    email: string;
    user_role: string;
    password?: string;
};

export async function request_GetUsers(): Promise<UserData[]> {
    return await request<UserData[]>("/api/users/",{method: "GET",});
}

export async function request_CreateUser(payload: UserPayload): Promise<UserData> {
    return await request<UserData>("/api/users/register/",{method: "POST",body: JSON.stringify(payload),});
}

export async function request_UpdateUser(id: number, payload: Partial<UserPayload>): Promise<UserData> {
    return await request<UserData>(`/api/users/${id}/`,{method: "PATCH",body: JSON.stringify(payload),});
}

export async function request_DeleteUser(id: number): Promise<void> {
    return await request<void>(`/api/users/${id}/`,{method: "DELETE",});
}


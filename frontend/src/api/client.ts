import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const TOKEN_KEY = "access_token";

let token: string | null = null;

export async function loadToken(): Promise<string | null> {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token;
}

export async function setToken(
    newToken: string | null
): Promise<void> {
    token = newToken;

    if (newToken) {
        await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
}

export function getToken(): string | null {
    return token;
}

export async function clearToken(): Promise<void> {
    token = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    if (!API_BASE_URL) {
        throw new Error("EXPO_PUBLIC_API_BASE_URL is not defined");
    }

    const endpointUri = `${API_BASE_URL}${endpoint}`;

    if (!token) {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }

    console.log("REQUEST:", {
        url: endpointUri,
        method: options.method ?? "GET",
        headers,
        body: options.body,
    });

    const res = await fetch(endpointUri, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const errorBody = await res.text();

        console.error("API ERROR:", {
            status: res.status,
            url: endpointUri,
            body: errorBody,
        });

        throw new Error(
            `API request failed: ${res.status} ${errorBody}`
        );
    }

    return (await res.json()) as T;
}
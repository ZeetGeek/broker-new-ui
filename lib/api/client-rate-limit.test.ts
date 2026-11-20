import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import assert from "node:assert/strict";
import test from "node:test";

import { api, ApiError, apiFetch, RATE_LIMITED_MESSAGE } from "@/lib/api/client";

function rejectWith(status: number, data: unknown, statusText: string) {
    return async (config: InternalAxiosRequestConfig) => {
        const response = {
            status,
            statusText,
            data,
            headers: {},
            config,
        } as AxiosResponse;
        throw new AxiosError(statusText, AxiosError.ERR_BAD_REQUEST, config, null, response);
    };
}

test("a 429 shows the rate-limit message, never the proxy's HTML page", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = rejectWith(
        429,
        "<html><head><title>429 Too Many Requests</title></head></html>",
        "Too Many Requests",
    );

    await assert.rejects(
        apiFetch("/auth/login", { method: "POST", body: "{}", skipAuth: true }),
        (error: unknown) =>
            error instanceof ApiError &&
            error.status === 429 &&
            error.message === RATE_LIMITED_MESSAGE,
    );
});

test("other errors keep the server's own message", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = rejectWith(
        400,
        { success: false, statusCode: 400, message: "Enter a valid email" },
        "Bad Request",
    );

    await assert.rejects(
        apiFetch("/auth/login", { method: "POST", body: "{}", skipAuth: true }),
        (error: unknown) =>
            error instanceof ApiError &&
            error.status === 400 &&
            error.message === "Enter a valid email",
    );
});

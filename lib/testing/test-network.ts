import { ApiError } from "@/lib/api/client";

import { getTestLabSettings, isTestLabReloading, isTestSampleMode } from "./test-lab";

export class TestNetworkError extends ApiError {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message, status);
        this.name = "TestNetworkError";
    }
}

export async function simulateTestRequest(signal?: AbortSignal): Promise<void> {
    if (isTestLabReloading())
        throw new TestNetworkError("Test setup is changing. Reload the page to continue.", 0);
    if (!isTestSampleMode()) return;
    signal?.throwIfAborted();
    const network = getTestLabSettings().network;
    if (network === "slow" || network === "loading") {
        await new Promise<void>((resolve, reject) => {
            const abort = () => {
                clearTimeout(timer);
                reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
            };
            const timer = setTimeout(
                () => {
                    signal?.removeEventListener("abort", abort);
                    resolve();
                },
                network === "slow" ? 2500 : 3_600_000,
            );
            signal?.addEventListener("abort", abort, { once: true });
        });
    }
    signal?.throwIfAborted();
    if (isTestLabReloading())
        throw new TestNetworkError("Test setup is changing. Reload the page to continue.", 0);
    if (network === "offline")
        throw new TestNetworkError("You're offline. Check your connection and try again.", 0);
    if (network === "error")
        throw new TestNetworkError("The server couldn't load your data. Please try again.", 500);
    if (network === "unauthorized")
        throw new TestNetworkError("Your session has expired. Sign in again to continue.", 401);
    if (network === "forbidden")
        throw new TestNetworkError("You don't have access to this data.", 403);
    if (network === "rate-limited")
        throw new TestNetworkError("Too many attempts. Wait a minute and try again.", 429);
}

/** Covers existing early-return mock branches as well as HTTP-backed adapters. */
export function withTestNetwork<T extends object>(
    adapter: T,
    localMethods: ReadonlyArray<keyof T> = [],
): T {
    const wrapped = new WeakMap<object, unknown>();
    const wrappers = new WeakSet<object>();
    return new Proxy(adapter, {
        get(target, property, receiver) {
            const method: unknown = Reflect.get(target, property, receiver);
            if (typeof method !== "function") return method;
            if (localMethods.includes(property as keyof T)) return method.bind(receiver);
            if (wrappers.has(method)) return method;
            if (!wrapped.has(method)) {
                const wrapper = (...args: unknown[]) => {
                    if (isTestLabReloading())
                        return Promise.reject(
                            new TestNetworkError(
                                "Test setup is changing. Reload the page to continue.",
                                0,
                            ),
                        );
                    if (!isTestSampleMode()) return Reflect.apply(method, receiver, args);
                    const signal = args.find(
                        (arg): arg is AbortSignal =>
                            typeof AbortSignal !== "undefined" && arg instanceof AbortSignal,
                    );
                    return simulateTestRequest(signal).then(() => {
                        if (isTestLabReloading())
                            throw new TestNetworkError(
                                "Test setup is changing. Reload the page to continue.",
                                0,
                            );
                        return Reflect.apply(method, receiver, args);
                    });
                };
                wrapped.set(method, wrapper);
                wrappers.add(wrapper);
            }
            return wrapped.get(method);
        },
    });
}

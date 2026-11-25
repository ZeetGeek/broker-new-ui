import { simulateTestRequest } from "./test-network";

/** No sample request may fall through to the backend or silently succeed with a wrong shape. */
export async function sampleApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    await simulateTestRequest(options.signal ?? undefined);
    const url = new URL(path, "https://sample.invalid");
    if (url.pathname.startsWith("/auth/") && url.pathname !== "/auth/profile")
        return { message: "Sample action completed. No email was sent." } as T;
    throw new Error(
        `Sample response is not available for ${options.method ?? "GET"} ${url.pathname}. Switch to Live API in Test lab to test this action.`,
    );
}

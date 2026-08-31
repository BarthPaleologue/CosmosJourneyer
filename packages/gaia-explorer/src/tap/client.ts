import { err, ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";

import { parseCsv } from "./csv";

export type TapError = Readonly<{
    kind: "aborted" | "http" | "network" | "timeout" | "protocol";
    message: string;
    status?: number;
}>;
export interface TapClient {
    query(
        adql: string,
        signal?: AbortSignal,
    ): Promise<Result<ReadonlyArray<Readonly<Record<string, string>>>, TapError>>;
}
export type Fetch = typeof fetch;
export type TapClientOptions = Readonly<{
    fetchImplementation?: Fetch;
    logger?: (message: string) => void;
    timeoutMs?: number;
}>;
export type AsyncTapClientOptions = TapClientOptions &
    Readonly<{
        pollIntervalMs?: number;
    }>;
const defaultLogger = (message: string): void => {
    console.info(`[gaia-explorer] ${message}`);
};
const requestBody = (adql: string): URLSearchParams =>
    new URLSearchParams({ REQUEST: "doQuery", LANG: "ADQL", FORMAT: "csv", QUERY: adql });
const errorFromException = (error: unknown, timeout: AbortSignal, signal?: AbortSignal): TapError => ({
    kind: timeout.aborted && signal?.aborted !== true ? "timeout" : signal?.aborted === true ? "aborted" : "network",
    message: error instanceof Error ? error.message : "TAP request failed",
});
const httpError = (response: Response): TapError => ({
    kind: "http",
    message: `TAP request failed: ${response.status} ${response.statusText}`,
    status: response.status,
});
const parseResponse = async (
    response: Response,
): Promise<Result<ReadonlyArray<Readonly<Record<string, string>>>, TapError>> => {
    if (!response.ok) {
        return err(httpError(response));
    }
    try {
        return ok(parseCsv(await response.text()));
    } catch (error) {
        return err({
            kind: "protocol",
            message: error instanceof Error ? error.message : "Invalid TAP response",
        });
    }
};
const logRowCount = (
    result: Result<ReadonlyArray<Readonly<Record<string, string>>>, TapError>,
    logger: (message: string) => void,
    prefix: string,
): void => {
    if (result.success) {
        logger(`${prefix} with ${result.value.length} rows`);
    }
};
export function createSyncTapClient(endpoint: string, options: TapClientOptions = {}): TapClient {
    const { fetchImplementation = fetch, logger = defaultLogger, timeoutMs = 30_000 } = options;
    return {
        async query(
            adql: string,
            signal?: AbortSignal,
        ): Promise<Result<ReadonlyArray<Readonly<Record<string, string>>>, TapError>> {
            const timeout = AbortSignal.timeout(timeoutMs);
            const combined = signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
            try {
                logger(`Submitting synchronous TAP query to ${endpoint}`);
                const response = await fetchImplementation(endpoint, {
                    method: "POST",
                    body: requestBody(adql),
                    signal: combined,
                });
                const result = await parseResponse(response);
                logRowCount(result, logger, "TAP query completed");
                return result;
            } catch (error) {
                return err(errorFromException(error, timeout, signal));
            }
        },
    };
}

const terminalPhases = new Set(["ABORTED", "COMPLETED", "ERROR"]);
const wait = async (milliseconds: number, signal: AbortSignal): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
        const onAbort = (): void => {
            clearTimeout(timeout);
            reject(signal.reason instanceof Error ? signal.reason : new Error("TAP request aborted"));
        };
        const timeout = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, milliseconds);
        signal.addEventListener("abort", onAbort, { once: true });
    });
};
const abortJob = async (fetchImplementation: Fetch, jobUrl: string): Promise<void> => {
    try {
        await fetchImplementation(`${jobUrl}/phase`, {
            method: "POST",
            body: new URLSearchParams({ PHASE: "ABORT" }),
            redirect: "manual",
        });
    } catch {
        // The original timeout or cancellation remains the actionable error.
    }
};
export function createAsyncTapClient(endpoint: string, options: AsyncTapClientOptions = {}): TapClient {
    const {
        fetchImplementation = fetch,
        logger = defaultLogger,
        pollIntervalMs = 1_000,
        timeoutMs = 10 * 60_000,
    } = options;
    return {
        async query(
            adql: string,
            signal?: AbortSignal,
        ): Promise<Result<ReadonlyArray<Readonly<Record<string, string>>>, TapError>> {
            const timeout = AbortSignal.timeout(timeoutMs);
            const combined = signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
            let jobUrl: string | undefined;
            try {
                logger(`Creating asynchronous TAP job at ${endpoint}`);
                const creation = await fetchImplementation(endpoint, {
                    method: "POST",
                    body: requestBody(adql),
                    redirect: "manual",
                    signal: combined,
                });
                const location = creation.headers.get("location");
                if (creation.status !== 303 || location === null) {
                    return err(
                        creation.ok
                            ? { kind: "protocol", message: "TAP async job creation did not return a job URL" }
                            : httpError(creation),
                    );
                }
                jobUrl = new URL(location, endpoint).toString().replace(/\/$/, "");
                logger(`TAP job created: ${jobUrl}`);
                const run = await fetchImplementation(`${jobUrl}/phase`, {
                    method: "POST",
                    body: new URLSearchParams({ PHASE: "RUN" }),
                    redirect: "manual",
                    signal: combined,
                });
                if (!run.ok && run.status !== 303) {
                    return err(httpError(run));
                }
                let previousPhase: string | undefined;
                let phase = "PENDING";
                while (!terminalPhases.has(phase)) {
                    await wait(pollIntervalMs, combined);
                    const phaseResponse = await fetchImplementation(`${jobUrl}/phase`, { signal: combined });
                    if (!phaseResponse.ok) {
                        return err(httpError(phaseResponse));
                    }
                    phase = (await phaseResponse.text()).trim().toUpperCase();
                    if (phase !== previousPhase) {
                        logger(`TAP job phase: ${phase}`);
                        previousPhase = phase;
                    }
                }
                if (phase !== "COMPLETED") {
                    const errorResponse = await fetchImplementation(`${jobUrl}/error`, { signal: combined });
                    const detail = errorResponse.ok ? (await errorResponse.text()).trim() : "No error detail available";
                    return err({ kind: "protocol", message: `TAP job ${phase.toLowerCase()}: ${detail}` });
                }
                const result = await parseResponse(
                    await fetchImplementation(`${jobUrl}/results/result`, { signal: combined }),
                );
                logRowCount(result, logger, "TAP job completed");
                return result;
            } catch (error) {
                if (jobUrl !== undefined && combined.aborted) {
                    await abortJob(fetchImplementation, jobUrl);
                }
                return err(errorFromException(error, timeout, signal));
            }
        },
    };
}

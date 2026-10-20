/**
 * Resolves after the requested timeout has elapsed.
 * @param nbMilliseconds Delay in milliseconds.
 * @returns A promise that resolves after the delay; it carries no value.
 */
export async function wait(nbMilliseconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, nbMilliseconds);
    });
}

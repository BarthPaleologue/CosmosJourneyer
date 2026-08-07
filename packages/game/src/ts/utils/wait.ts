export async function wait(nbMilliseconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, nbMilliseconds);
    });
}

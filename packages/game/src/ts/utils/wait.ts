export async function wait(nbMilliseconds: number) {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, nbMilliseconds);
    });
}

declare global {
    interface Navigator {
        keyboard:
            | {
                  getLayoutMap: (() => Promise<Map<string, string>>) | undefined;
              }
            | undefined;
    }
}

export async function getGlobalKeyboardLayoutMap(): Promise<Map<string, string> | null> {
    return (await navigator.keyboard?.getLayoutMap?.()) ?? null;
}

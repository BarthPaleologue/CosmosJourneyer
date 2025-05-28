declare global {
    interface Navigator {
        keyboard:
            | {
                  getLayoutMap: (() => Promise<Map<string, string>>) | undefined;
              }
            | undefined;
    }
}

/**
 * @returns A promise that resolves to a Map of keyboard layout keys and their corresponding characters, or null if the API is not available.
 */
export async function getGlobalKeyboardLayoutMap(): Promise<Map<string, string> | null> {
    return (await navigator.keyboard?.getLayoutMap?.()) ?? null;
}

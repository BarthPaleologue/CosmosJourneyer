declare global {
    interface Navigator {
        keyboard:
            | {
                  getLayoutMap: () => Promise<Map<string, string>>;
              }
            | undefined;
    }
}

export function getGlobalKeyboardLayoutMap(): Promise<Map<string, string>> {
    if (navigator.keyboard !== undefined) {
        return navigator.keyboard.getLayoutMap();
    }
    console.warn("navigator.keyboard is not available, returning an empty map");
    return Promise.resolve(new Map<string, string>());
}

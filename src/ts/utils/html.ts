export function clearAllEventListenersById(id: string): HTMLElement {
    const oldElement = document.getElementById(id);
    if (oldElement === null) throw new Error(`Could not find #${id} in document`);
    const newElement = oldElement.cloneNode(true);
    (oldElement.parentNode as HTMLElement).replaceChild(newElement, oldElement);
    return document.getElementById(id) as HTMLElement;
}

export function show(id: string, condition = true) {
    if (condition) (document.getElementById(id) as HTMLElement).hidden = false;
    else hide(id);
}

export function hide(id: string) {
    (document.getElementById(id) as HTMLElement).hidden = true;
}

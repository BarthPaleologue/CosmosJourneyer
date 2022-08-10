export function clearAllEventListenersById(id: string): HTMLElement {
    const oldElement = document.getElementById(id);
    if (oldElement == null) throw new Error(`Could not find #${id} in document`);
    const newElement = oldElement.cloneNode(true);
    oldElement.parentNode!.replaceChild(newElement, oldElement);
    return document.getElementById(id) as HTMLElement;
}

export function showPanel(id: string, condition = true) {
    if (condition) document.getElementById(id)!.style.zIndex = "15";
    else hidePanel(id);
}

export function hidePanel(id: string) {
    document.getElementById(id)!.style.zIndex = "-1";
}

export function show(id: string, condition = true) {
    if (condition) document.getElementById(id)!.hidden = false;
    else hide(id);
}

export function hide(id: string) {
    document.getElementById(id)!.hidden = true;
}

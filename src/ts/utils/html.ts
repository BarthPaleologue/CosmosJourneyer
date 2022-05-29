export function clearAllEventListenersById(id: string): HTMLElement {
    let oldElement = document.getElementById(id);
    if (oldElement == null) throw new Error(`Could not find #${id} in document`);
    let newElement = oldElement.cloneNode(true);
    oldElement.parentNode!.replaceChild(newElement, oldElement);
    return document.getElementById(id)!;
}

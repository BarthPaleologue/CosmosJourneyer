import { Sounds } from "../assets/sounds";

export function promptModalString(prompt: string, defaultValue: string = ""): Promise<string | null> {
    const modal = document.createElement("dialog");
    modal.innerHTML = `
        <form method="dialog">
            <p>${prompt}</p>
            <input type="text" value="${defaultValue}">
            <menu>
                <button type="reset" value="cancel">Cancel</button>
                <button type="submit" value="ok">OK</button>
            </menu>
        </form>
    `;
    document.body.appendChild(modal);
    modal.showModal();

    return new Promise((resolve) => {
        const input = modal.querySelector("input") as HTMLInputElement;
        input.focus();
        input.select();
        input.addEventListener("keydown", (e) => {
            e.stopPropagation();
        });

        // on reset, close the modal and resolve with null
        modal.addEventListener("reset", () => {
            Sounds.MENU_SELECT_SOUND.play();
            resolve(null);
            modal.remove();
        });

        modal.addEventListener("close", () => {
            Sounds.MENU_SELECT_SOUND.play();
            if (modal.returnValue === "ok") {
                resolve(input.value);
            } else {
                resolve(null);
            }
            modal.remove();
        });
    });
}


export function promptModalBoolean(prompt: string): Promise<boolean> {
    const modal = document.createElement("dialog");
    modal.innerHTML = `
        <form method="dialog">
            <p>${prompt}</p>
            <menu>
                <button value="cancel">Cancel</button>
                <button value="ok">Do it!</button>
            </menu>
        </form>
    `;
    document.body.appendChild(modal);
    modal.showModal();

    return new Promise((resolve) => {
        modal.addEventListener("close", () => {
            Sounds.MENU_SELECT_SOUND.play();
            resolve(modal.returnValue === "ok");
            modal.remove();
        });
    });
}
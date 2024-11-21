export function promptModal(prompt: string, defaultValue: string = ""): Promise<string | null> {
    const modal = document.createElement("dialog");
    modal.innerHTML = `
        <form method="dialog">
            <p>${prompt}</p>
            <input type="text" value="${defaultValue}">
            <menu>
                <button value="cancel">Cancel</button>
                <button value="ok">OK</button>
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
            if (e.key === "Enter") {
                modal.returnValue = "ok";
                modal.close();
                resolve(input.value);
            } else if (e.key === "Escape") {
                modal.returnValue = "cancel";
                modal.close();
                resolve(null);
            }
        });

        modal.addEventListener("close", () => {
            if (modal.returnValue === "ok") {
                resolve(input.value);
            } else {
                resolve(null);
            }
            modal.remove();
        });
    });
}
import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import i18n from "@/i18n";
import { Settings } from "@/settings";

export function radialChoiceModal<T>(
    choices: Array<T>,
    toString: (value: T) => string,
    soundPlayer: ISoundPlayer,
): Promise<T | null> {
    const defaultChoice = choices[0];
    if (defaultChoice === undefined) {
        return Promise.resolve(null);
    }

    let resolveChoice!: (value: T | null) => void;
    const promise = new Promise<T | null>((res) => {
        resolveChoice = res;
    });

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "1000";
    overlay.style.pointerEvents = "auto";
    overlay.style.backdropFilter = "blur(1px)";
    overlay.tabIndex = -1;

    const circleSize = 500;
    const center = circleSize / 2;
    const svgNamespace = "http://www.w3.org/2000/svg";
    const angleStep = (Math.PI * 2) / choices.length;
    const angleGap = Math.min(0.2, angleStep * 0.15);
    const startAngle = -Math.PI / 2;
    const outerRadius = center - 20;
    const innerRadius = outerRadius - 110;
    const labelRadius = (outerRadius + innerRadius) / 2;
    const baseSegmentColor = "rgba(255, 255, 255, 0.92)";
    const activeSegmentColor = "rgba(255, 196, 0, 0.9)";

    const circle = document.createElement("div");
    circle.style.position = "relative";
    circle.style.width = `${circleSize}px`;
    circle.style.height = `${circleSize}px`;
    circle.style.borderRadius = "50%";
    circle.style.boxShadow = "0 0 25px rgba(0, 0, 0, 0.6)";
    circle.style.display = "flex";
    circle.style.alignItems = "center";
    circle.style.justifyContent = "center";
    overlay.appendChild(circle);

    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("viewBox", `0 0 ${circleSize} ${circleSize}`);
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.position = "absolute";
    svg.style.inset = "0";
    circle.appendChild(svg);

    const currentLabel = document.createElement("div");
    currentLabel.style.color = "white";
    currentLabel.style.fontFamily = Settings.MAIN_FONT;
    currentLabel.style.fontSize = "2em";
    currentLabel.style.textAlign = "center";
    currentLabel.style.pointerEvents = "none";
    currentLabel.style.maxWidth = "60%";
    currentLabel.style.zIndex = "2";
    circle.appendChild(currentLabel);

    const segments: Array<{ path: SVGPathElement; label: SVGTextElement; center: { x: number; y: number } }> = [];
    let selectedIndex = 0;

    const getChoice = (index: number): T => choices[index] ?? defaultChoice;

    const setSelectedIndex = (index: number) => {
        selectedIndex = (index + choices.length) % choices.length;
        segments.forEach(({ path, label }, idx) => {
            const isActive = idx === selectedIndex;
            path.style.fill = isActive ? activeSegmentColor : baseSegmentColor;
            path.style.filter = isActive
                ? "drop-shadow(0 0 12px rgba(0,0,0,0.4))"
                : "drop-shadow(0 0 6px rgba(0,0,0,0.55))";
            label.style.fill = isActive ? "rgba(20, 20, 20, 0.95)" : "rgba(35, 35, 35, 0.85)";
            label.style.fontWeight = isActive ? "600" : "400";
        });
        currentLabel.textContent = toString(getChoice(selectedIndex));
    };

    const cleanup = () => {
        overlay.removeEventListener("keydown", handleKeydown);
        overlay.removeEventListener("click", handleOverlayClick);
        overlay.removeEventListener("mousemove", handleMouseMove);
        if (overlay.isConnected) {
            overlay.remove();
        }
    };

    let hasSettled = false;

    const finish = (result: T | null) => {
        if (hasSettled) {
            return;
        }
        hasSettled = true;
        cleanup();
        soundPlayer.playNow(SoundType.CLICK);
        resolveChoice(result);
    };

    const handleOverlayClick = () => {
        finish(getChoice(selectedIndex));
    };

    const handleKeydown = (event: KeyboardEvent) => {
        event.stopPropagation();
        if (event.key === "Escape") {
            event.preventDefault();
            finish(null);
        }
    };

    const handleMouseMove = (event: MouseEvent) => {
        const rect = circle.getBoundingClientRect();
        const pointerX = event.clientX - (rect.left + rect.width / 2);
        const pointerY = event.clientY - (rect.top + rect.height / 2);
        let closestIndex = selectedIndex;
        let closestDistanceSq = Number.POSITIVE_INFINITY;
        segments.forEach(({ center }, idx) => {
            const dx = pointerX - center.x;
            const dy = pointerY - center.y;
            const distanceSq = dx * dx + dy * dy;
            if (distanceSq < closestDistanceSq) {
                closestDistanceSq = distanceSq;
                closestIndex = idx;
            }
        });
        if (closestIndex !== selectedIndex) {
            setSelectedIndex(closestIndex);
        }
    };

    const polarToCartesian = (angle: number, radius: number) => ({
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
    });

    const segmentPath = (start: number, end: number) => {
        const outerStart = polarToCartesian(start, outerRadius);
        const outerEnd = polarToCartesian(end, outerRadius);
        const innerStart = polarToCartesian(end, innerRadius);
        const innerEnd = polarToCartesian(start, innerRadius);
        const largeArcFlag = end - start <= Math.PI ? "0" : "1";

        return [
            `M ${outerStart.x} ${outerStart.y}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
            `L ${innerStart.x} ${innerStart.y}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
            "Z",
        ].join(" ");
    };

    for (const [index, choice] of choices.entries()) {
        const rawStart = startAngle + angleStep * index;
        const start = rawStart + angleGap / 2;
        const end = rawStart + angleStep - angleGap / 2;
        const midAngle = (start + end) / 2;

        const group = document.createElementNS(svgNamespace, "g");
        group.style.cursor = "pointer";

        const path = document.createElementNS(svgNamespace, "path");
        path.setAttribute("d", segmentPath(start, end));
        path.style.fill = baseSegmentColor;
        path.style.stroke = "rgba(0, 0, 0, 0.5)";
        path.style.strokeWidth = "2";
        path.style.transition = "fill 0.12s ease, filter 0.12s ease";

        const text = document.createElementNS(svgNamespace, "text");
        const textPos = polarToCartesian(midAngle, labelRadius);
        const relativeCenter = {
            x: Math.cos(midAngle) * labelRadius,
            y: Math.sin(midAngle) * labelRadius,
        };
        text.setAttribute("x", textPos.x.toString());
        text.setAttribute("y", textPos.y.toString());
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.textContent = toString(choice);
        text.style.fontFamily = Settings.MAIN_FONT;
        text.style.fontSize = "24px";
        text.style.pointerEvents = "none";

        group.appendChild(path);
        group.appendChild(text);
        group.addEventListener("mouseenter", () => {
            setSelectedIndex(index);
        });
        group.addEventListener("click", (event) => {
            event.stopPropagation();
            finish(choice);
        });

        segments.push({ path, label: text, center: relativeCenter });
        svg.appendChild(group);
    }

    document.body.appendChild(overlay);
    overlay.focus({ preventScroll: true });
    overlay.addEventListener("click", handleOverlayClick);
    overlay.addEventListener("keydown", handleKeydown);
    overlay.addEventListener("mousemove", handleMouseMove);
    setSelectedIndex(0);

    return promise;
}

export function promptModalString(
    prompt: string,
    defaultValue: string,
    soundPlayer: ISoundPlayer,
): Promise<string | null> {
    const modal = document.createElement("dialog");
    modal.innerHTML = `
        <form method="dialog">
            <p>${prompt}</p>
            <input type="text" value="${defaultValue}">
            <menu>
                <button type="reset" value="cancel">${i18n.t("common:cancel")}</button>
                <button type="submit" value="ok">${i18n.t("common:ok")}</button>
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
            soundPlayer.playNow(SoundType.CLICK);
            resolve(null);
            modal.remove();
        });

        modal.addEventListener("close", () => {
            soundPlayer.playNow(SoundType.CLICK);
            if (modal.returnValue === "ok") {
                resolve(input.value);
            } else {
                resolve(null);
            }
            modal.remove();
        });
    });
}

export function promptModalBoolean(prompt: string, soundPlayer: ISoundPlayer): Promise<boolean> {
    const modal = document.createElement("dialog");
    modal.innerHTML = `
        <form method="dialog">
            <p>${prompt}</p>
            <menu>
                <button value="cancel">${i18n.t("common:cancel")}</button>
                <button value="ok">${i18n.t("common:confirm")}</button>
            </menu>
        </form>
    `;
    document.body.appendChild(modal);
    modal.showModal();

    return new Promise((resolve) => {
        modal.addEventListener("close", () => {
            soundPlayer.playNow(SoundType.CLICK);
            resolve(modal.returnValue === "ok");
            modal.remove();
        });
    });
}

export function alertModal(message: string, soundPlayer: ISoundPlayer): Promise<void> {
    const modal = document.createElement("dialog");
    modal.innerHTML = `
        <form method="dialog">
            <p>${message}</p>
            <menu>
                <button value="ok">${i18n.t("common:ok")}</button>
            </menu>
        </form>
    `;
    document.body.appendChild(modal);
    modal.showModal();

    return new Promise((resolve) => {
        modal.addEventListener("close", () => {
            soundPlayer.playNow(SoundType.CLICK);
            resolve();
            modal.remove();
        });
    });
}

export function connectEncyclopaediaGalacticaModal(soundPlayer: ISoundPlayer): Promise<{
    encyclopaediaUrlBase: string;
    accountId: string;
    password: string;
} | null> {
    const modal = document.createElement("dialog");
    document.body.appendChild(modal);

    const form = document.createElement("form");
    form.method = "dialog";
    form.classList.add("flex-column");
    modal.appendChild(form);

    const description = document.createElement("p");
    description.textContent = "Connect to an instance of the Encyclopaedia";
    form.appendChild(description);

    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.placeholder = "https://cosmosjourneyer.com/encyclopaediaTest/";
    urlInput.required = true;
    form.appendChild(urlInput);

    const accountIdInput = document.createElement("input");
    accountIdInput.type = "text";
    accountIdInput.placeholder = "accountId";
    form.appendChild(accountIdInput);

    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "password";
    form.appendChild(passwordInput);

    const menu = document.createElement("menu");
    form.appendChild(menu);

    const cancelButton = document.createElement("button");
    cancelButton.type = "reset";
    cancelButton.value = "cancel";
    cancelButton.textContent = i18n.t("common:cancel");
    menu.appendChild(cancelButton);

    const connectButton = document.createElement("button");
    connectButton.type = "submit";
    connectButton.value = "connect";
    connectButton.textContent = "Connect";
    menu.appendChild(connectButton);

    modal.showModal();

    urlInput.focus();
    urlInput.select();
    modal.querySelectorAll("input").forEach((input) => {
        input.addEventListener("keydown", (e) => {
            e.stopPropagation();
        });
    });

    return new Promise((resolve) => {
        // on reset, close the modal and resolve with null
        modal.addEventListener("reset", () => {
            soundPlayer.playNow(SoundType.CLICK);
            resolve(null);
            modal.remove();
        });

        modal.addEventListener("close", () => {
            soundPlayer.playNow(SoundType.CLICK);
            if (modal.returnValue === "connect") {
                resolve({
                    encyclopaediaUrlBase: urlInput.value,
                    accountId: accountIdInput.value,
                    password: passwordInput.value,
                });
            } else {
                resolve(null);
            }
            modal.remove();
        });
    });
}

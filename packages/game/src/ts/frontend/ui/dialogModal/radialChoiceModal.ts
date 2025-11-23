//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import { Settings } from "@/settings";

export function radialChoiceModal<T>(
    choices: ReadonlyArray<T>,
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
    overlay.style.background = "rgba(0, 0, 0, 0.2)";
    overlay.style.zIndex = "1000";
    overlay.style.pointerEvents = "auto";
    overlay.tabIndex = -1;

    const circleSize = 500;
    const center = circleSize / 2;
    const svgNamespace = "http://www.w3.org/2000/svg";
    const strokeColor = getComputedStyle(document.documentElement).getPropertyValue("--accent-color-dark").trim();
    const strokeWidth = 6;
    const angleStep = (Math.PI * 2) / choices.length;
    const angleGap = 0;
    const startAngle = -Math.PI / 2;
    const outerRadius = circleSize / 2 - strokeWidth / 2;
    const innerRadius = outerRadius - 110;
    const labelRadius = (outerRadius + innerRadius) / 2;
    const clipPathId = `radial-choice-${Math.random().toString(36).slice(2)}`;
    const baseSegmentColor = getComputedStyle(document.documentElement).getPropertyValue("--accent-color").trim();
    const activeSegmentColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-color-light")
        .trim();

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

    const clipPathDefs = document.createElementNS(svgNamespace, "defs");
    svg.appendChild(clipPathDefs);

    const currentLabel = document.createElement("div");
    currentLabel.style.color = "white";
    currentLabel.style.fontFamily = Settings.MAIN_FONT;
    currentLabel.style.fontSize = "2em";
    currentLabel.style.textAlign = "center";
    currentLabel.style.pointerEvents = "none";
    currentLabel.style.maxWidth = "60%";
    currentLabel.style.zIndex = "2";
    circle.appendChild(currentLabel);

    const segments: Array<{ path: SVGPathElement; label: HTMLDivElement; center: { x: number; y: number } }> = [];
    let selectedIndex = 0;

    const getChoice = (index: number): T => choices[index] ?? defaultChoice;

    const setSelectedIndex = (index: number) => {
        selectedIndex = (index + choices.length) % choices.length;
        segments.forEach(({ path, label }, idx) => {
            const isActive = idx === selectedIndex;
            path.style.fill = isActive ? activeSegmentColor : baseSegmentColor;
            label.style.color = "white";
            label.style.textShadow = isActive ? "0 0 8px rgba(255, 255, 255, 0.6)" : "none";
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
        segments.forEach(({ center: relativeCenter }, idx) => {
            const dx = pointerX - relativeCenter.x;
            const dy = pointerY - relativeCenter.y;
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

        const clipPath = document.createElementNS(svgNamespace, "clipPath");
        const clipPathPath = document.createElementNS(svgNamespace, "path");
        const clipPathName = `${clipPathId}-${index}`;
        clipPath.id = clipPathName;
        clipPath.setAttribute("clipPathUnits", "userSpaceOnUse");
        clipPathPath.setAttribute("d", segmentPath(start, end));
        clipPath.appendChild(clipPathPath);
        clipPathDefs.appendChild(clipPath);

        const path = document.createElementNS(svgNamespace, "path");
        path.setAttribute("d", segmentPath(start, end));
        path.setAttribute("clip-path", `url(#${clipPathName})`);
        path.style.fill = baseSegmentColor;
        path.style.transition = "fill 0.12s ease, filter 0.12s ease";

        const textPos = polarToCartesian(midAngle, labelRadius);
        const relativeCenter = {
            x: Math.cos(midAngle) * labelRadius,
            y: Math.sin(midAngle) * labelRadius,
        };
        const segmentArcLength = labelRadius * (end - start);
        const labelWidth = Math.max(Math.min(segmentArcLength * 0.75, 160), 70);
        const labelHeight = 70;
        const textForeignObject = document.createElementNS(svgNamespace, "foreignObject");
        textForeignObject.setAttribute("x", (textPos.x - labelWidth / 2).toString());
        textForeignObject.setAttribute("y", (textPos.y - labelHeight / 2).toString());
        textForeignObject.setAttribute("width", labelWidth.toString());
        textForeignObject.setAttribute("height", labelHeight.toString());
        textForeignObject.style.pointerEvents = "none";

        const text = document.createElement("div");
        text.textContent = toString(choice);
        text.style.fontFamily = Settings.MAIN_FONT;
        text.style.fontSize = "20px";
        text.style.lineHeight = "1.25";
        text.style.color = "rgba(35, 35, 35, 0.85)";
        text.style.fontWeight = "400";
        text.style.display = "flex";
        text.style.alignItems = "center";
        text.style.justifyContent = "center";
        text.style.textAlign = "center";
        text.style.width = "100%";
        text.style.height = "100%";
        text.style.boxSizing = "border-box";
        text.style.padding = "6px 10px";
        text.style.wordBreak = "break-word";
        text.style.overflowWrap = "anywhere";
        text.style.pointerEvents = "none";

        textForeignObject.appendChild(text);

        group.appendChild(path);
        group.appendChild(textForeignObject);
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

    const strokeOverlay = document.createElementNS(svgNamespace, "g");
    strokeOverlay.style.pointerEvents = "none";

    const outerRing = document.createElementNS(svgNamespace, "circle");
    outerRing.setAttribute("cx", center.toString());
    outerRing.setAttribute("cy", center.toString());
    outerRing.setAttribute("r", outerRadius.toString());
    outerRing.style.fill = "none";
    outerRing.style.stroke = strokeColor;
    outerRing.style.strokeWidth = strokeWidth.toString();
    outerRing.style.strokeLinejoin = "round";
    strokeOverlay.appendChild(outerRing);

    const innerRing = document.createElementNS(svgNamespace, "circle");
    innerRing.setAttribute("cx", center.toString());
    innerRing.setAttribute("cy", center.toString());
    innerRing.setAttribute("r", innerRadius.toString());
    innerRing.style.fill = "none";
    innerRing.style.stroke = strokeColor;
    innerRing.style.strokeWidth = strokeWidth.toString();
    innerRing.style.strokeLinejoin = "round";
    strokeOverlay.appendChild(innerRing);

    for (let index = 0; index < choices.length; index += 1) {
        const separatorAngle = startAngle + angleStep * index + angleGap / 2;
        const separatorOuter = polarToCartesian(separatorAngle, outerRadius);
        const separatorInner = polarToCartesian(separatorAngle, innerRadius);
        const separator = document.createElementNS(svgNamespace, "line");
        separator.setAttribute("x1", separatorOuter.x.toString());
        separator.setAttribute("y1", separatorOuter.y.toString());
        separator.setAttribute("x2", separatorInner.x.toString());
        separator.setAttribute("y2", separatorInner.y.toString());
        separator.style.stroke = strokeColor;
        separator.style.strokeWidth = strokeWidth.toString();
        separator.style.strokeLinecap = "round";
        strokeOverlay.appendChild(separator);
    }

    svg.appendChild(strokeOverlay);

    document.body.appendChild(overlay);
    overlay.focus({ preventScroll: true });
    overlay.addEventListener("click", handleOverlayClick);
    overlay.addEventListener("keydown", handleKeydown);
    overlay.addEventListener("mousemove", handleMouseMove);
    setSelectedIndex(0);

    return promise;
}

//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Slider } from "handle-sliderjs";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { CelestialBody } from "../../architecture/celestialBody";
import { Scene } from "@babylonjs/core/scene";

export abstract class EditorPanel {
    sliders: Slider[] = [];
    anchor: HTMLElement;
    panel: HTMLElement;
    isPanelVisible = false;

    protected constructor(id: string) {
        this.anchor = document.getElementById(id + "Link") as HTMLElement;
        this.panel = document.getElementById(id + "UI") as HTMLElement;
    }

    abstract init(body: CelestialBody, postProcess: PostProcess, scene: Scene): void;

    updateAllSliders() {
        for (const slider of this.sliders) slider.update(false);
    }

    show() {
        this.setVisibility(true);
    }

    hide() {
        this.setVisibility(false);
    }

    setVisibility(visible: boolean) {
        this.panel.style.zIndex = visible ? "15" : "-1";
        this.isPanelVisible = visible;
    }

    setEnabled(enabled: boolean) {
        this.anchor.hidden = !enabled;
        if (!enabled) this.hide();
    }

    disable() {
        this.setEnabled(false);
    }

    enable() {
        this.setEnabled(true);
    }
}

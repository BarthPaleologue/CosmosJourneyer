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

import { getComponentTypeI18n, type SerializedComponent } from "@/backend/spaceship/serializedComponents/component";
import {
    getDiscoveryScannerSpec,
    type SerializedDiscoveryScanner,
} from "@/backend/spaceship/serializedComponents/discoveryScanner";
import { getFuelScoopSpec, type SerializedFuelScoop } from "@/backend/spaceship/serializedComponents/fuelScoop";
import { getFuelTankSpecs, type SerializedFuelTank } from "@/backend/spaceship/serializedComponents/fuelTank";
import { getComponentValue } from "@/backend/spaceship/serializedComponents/pricing";
import { getThrustersSpec, type SerializedThrusters } from "@/backend/spaceship/serializedComponents/thrusters";
import { getWarpDriveSpec, type SerializedWarpDrive } from "@/backend/spaceship/serializedComponents/warpDrive";

import i18n from "@/i18n";
import { Settings } from "@/settings";

export class ComponentSpecUI {
    readonly root: HTMLElement;

    private placeHolderText: HTMLElement;

    constructor(placeHolderText: string) {
        this.root = document.createElement("div");
        this.root.className = "componentSpec";

        this.placeHolderText = document.createElement("p");
        this.placeHolderText.innerText = placeHolderText;
        this.placeHolderText.style.flexGrow = "1";
        this.placeHolderText.style.justifyContent = "center";
        this.placeHolderText.style.textAlign = "center";
        this.placeHolderText.style.display = "flex";
        this.placeHolderText.style.alignItems = "center";

        this.displayComponent(null);
    }

    public displayComponent(serializedComponent: SerializedComponent | null) {
        this.root.innerHTML = "";

        if (serializedComponent === null) {
            this.root.appendChild(this.placeHolderText);
            return;
        }

        const componentName = document.createElement("h3");
        const qualityString = Settings.QUALITY_CHARS.at(serializedComponent.quality) ?? "[ERROR]";
        componentName.textContent = `${getComponentTypeI18n(serializedComponent.type)} ${serializedComponent.size}${qualityString}`;
        this.root.appendChild(componentName);

        const componentValue = document.createElement("p");
        componentValue.innerText = `${i18n.t("spaceStation:value")}: ${getComponentValue(serializedComponent).toLocaleString()} ${Settings.CREDIT_SYMBOL}`;
        this.root.appendChild(componentValue);

        switch (serializedComponent.type) {
            case "warpDrive":
                this.root.appendChild(this.displayWarpDrive(serializedComponent));
                break;
            case "fuelScoop":
                this.root.appendChild(this.displayFuelScoop(serializedComponent));
                break;
            case "fuelTank":
                this.root.appendChild(this.displayFuelTank(serializedComponent));
                break;
            case "discoveryScanner":
                this.root.appendChild(this.displayDiscoveryScanner(serializedComponent));
                break;
            case "thrusters":
                this.root.appendChild(this.displayThrusters(serializedComponent));
                break;
        }
    }

    private displayWarpDrive(serializedWarpDrive: SerializedWarpDrive): HTMLDivElement {
        const spec = getWarpDriveSpec(serializedWarpDrive);
        const container = document.createElement("div");

        const range = document.createElement("p");
        range.innerText = `${i18n.t("spaceStation:range")}: ${i18n.t("units:shortLy", { value: spec.rangeLy.toLocaleString(undefined, { maximumSignificantDigits: 3 }) })}`;
        container.appendChild(range);

        return container;
    }

    private displayFuelScoop(serializedFuelScoop: SerializedFuelScoop): HTMLDivElement {
        const spec = getFuelScoopSpec(serializedFuelScoop);
        const container = document.createElement("div");

        const scoopRate = document.createElement("p");
        scoopRate.innerText = `${i18n.t("spaceStation:scoopRate")}: ${spec.fuelPerSecond.toLocaleString(undefined, { maximumSignificantDigits: 3 })} L/s`;
        container.appendChild(scoopRate);

        return container;
    }

    private displayFuelTank(serializedFuelTank: SerializedFuelTank) {
        const spec = getFuelTankSpecs(serializedFuelTank);
        const container = document.createElement("div");

        const capacity = document.createElement("p");
        capacity.innerText = `${i18n.t("spaceStation:capacity")}: ${spec.maxFuel.toLocaleString(undefined, { maximumSignificantDigits: 3 })} L`;
        container.appendChild(capacity);

        return container;
    }

    private displayDiscoveryScanner(serializedDiscoveryScanner: SerializedDiscoveryScanner): HTMLDivElement {
        const spec = getDiscoveryScannerSpec(serializedDiscoveryScanner);
        const container = document.createElement("div");

        const relativeRange = document.createElement("p");
        relativeRange.innerText = `${i18n.t("spaceStation:relativeRange")}: ${spec.relativeRange.toLocaleString(undefined, { maximumSignificantDigits: 3 })}`;
        container.appendChild(relativeRange);

        return container;
    }

    private displayThrusters(serializedThrusters: SerializedThrusters): HTMLDivElement {
        const spec = getThrustersSpec(serializedThrusters);
        const container = document.createElement("div");

        const maxSpeed = document.createElement("p");
        maxSpeed.innerText = `${i18n.t("spaceStation:maxSpeed")}: ${spec.maxSpeed.toLocaleString(undefined, { maximumSignificantDigits: 3 })} m/s`;
        container.appendChild(maxSpeed);

        return container;
    }
}

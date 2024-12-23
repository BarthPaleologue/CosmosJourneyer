import { Observable } from "@babylonjs/core";
import { Sounds } from "../../assets/sounds";
import { Player } from "../../player/player";
import { EncyclopaediaGalactica, SpaceDiscoveryData } from "../../society/encyclopaediaGalactica";
import { getObjectModelByUniverseId } from "../../utils/coordinates/orbitalObjectId";
import { getOrbitalObjectTypeToI18nString } from "../../utils/strings/orbitalObjectTypeToDisplay";
import { parseDistance, parseSecondsPrecise } from "../../utils/strings/parseToStrings";
import i18n from "../../i18n";

export class DiscoveryDetails {
    readonly htmlRoot: HTMLElement;

    readonly placeHolderText: HTMLParagraphElement;

    private currentDiscovery: SpaceDiscoveryData | null = null;

    readonly onSellDiscovery: Observable<SpaceDiscoveryData> = new Observable();

    readonly objectName: HTMLHeadingElement;

    readonly objectType: HTMLParagraphElement;

    readonly siderealDayDuration: HTMLParagraphElement;

    readonly orbitDuration: HTMLParagraphElement;

    readonly orbitRadius: HTMLParagraphElement;

    readonly sellDiscoveryButton: HTMLButtonElement;

    constructor(player: Player, encyclopaedia: EncyclopaediaGalactica) {
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("flex-column", "flex-3", "discoveryDetails");

        this.placeHolderText = document.createElement("p");
        this.placeHolderText.textContent = "Select a discovery to see more details.";

        this.objectName = document.createElement("h3");

        this.objectType = document.createElement("p");

        this.siderealDayDuration = document.createElement("p");

        this.orbitDuration = document.createElement("p");

        this.orbitRadius = document.createElement("p");

        this.sellDiscoveryButton = document.createElement("button");
        this.sellDiscoveryButton.textContent = "Sell";
        this.sellDiscoveryButton.addEventListener("click", async () => {
            if (this.currentDiscovery === null) {
                throw new Error("The sell button should not be displayed when currentDiscovery is null");
            }

            Sounds.ECHOED_BLIP_SOUND.play();
            const value = await encyclopaedia.estimateDiscovery(this.currentDiscovery.objectId);
            player.balance += value;
            player.discoveries.local = player.discoveries.local.filter((d) => d !== this.currentDiscovery);
            player.discoveries.uploaded.push(this.currentDiscovery);

            this.onSellDiscovery.notifyObservers(this.currentDiscovery);
            this.setDiscovery(null);
        });

        this.setDiscovery(null);
    }

    setDiscovery(discovery: SpaceDiscoveryData | null) {
        this.htmlRoot.innerHTML = "";
        this.htmlRoot.classList.toggle("empty", discovery === null);
        this.currentDiscovery = discovery;

        if (discovery === null) {
            this.htmlRoot.appendChild(this.placeHolderText);
            return;
        }

        const model = getObjectModelByUniverseId(discovery.objectId);

        this.objectName.innerText = model.name;
        this.htmlRoot.appendChild(this.objectName);

        this.objectType.innerText = i18n.t("orbitalObject:type", { value: getOrbitalObjectTypeToI18nString(model) });
        this.htmlRoot.appendChild(this.objectType);

        this.siderealDayDuration.innerText = i18n.t("orbitalObject:siderealDayDuration", { value: parseSecondsPrecise(model.physics.siderealDaySeconds) });
        this.htmlRoot.appendChild(this.siderealDayDuration);

        this.orbitDuration.innerText = i18n.t("orbit:period", { value: parseSecondsPrecise(model.orbit.period) });
        this.htmlRoot.appendChild(this.orbitDuration);

        this.orbitRadius.innerText = i18n.t("orbit:radius", { value: parseDistance(model.orbit.radius) });
        this.htmlRoot.appendChild(this.orbitRadius);

        this.htmlRoot.appendChild(this.sellDiscoveryButton);
    }
}

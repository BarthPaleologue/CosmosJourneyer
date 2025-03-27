import { Player } from "../../player/player";
import { OrbitalFacilityModel } from "../../architecture/orbitalObjectModel";
import { Sounds } from "../../assets/sounds";
import i18n from "../../i18n";
import { DeepReadonly } from "../../utils/types";
import { Spaceship } from "../../spaceship/spaceship";

export function generateOutfittingDom(spaceship: Spaceship, player: Player): HTMLDivElement {
    const rootHtml = document.createElement("div");
    rootHtml.style.display = "grid";
    rootHtml.style.gridTemplateColumns = "1fr 2fr 1fr";

    const componentList = document.createElement("div");
    rootHtml.appendChild(componentList);

    const primaryH2 = document.createElement("h2");
    primaryH2.innerText = i18n.t("spaceStation:primarySlots");
    componentList.appendChild(primaryH2);

    const warpDriveSlot = document.createElement("div");
    warpDriveSlot.textContent = spaceship.getWarpDrive() !== null ? "warp drive" : "no warp drive";
    warpDriveSlot.classList.add("componentSlot");
    componentList.appendChild(warpDriveSlot);

    const thrustersSlot = document.createElement("div");
    thrustersSlot.textContent = spaceship.components.primary.thrusters !== null ? "thrusters" : "no thrusters";
    thrustersSlot.classList.add("componentSlot");
    componentList.appendChild(thrustersSlot);

    const fuelTankSlot = document.createElement("div");
    fuelTankSlot.textContent = spaceship.components.primary.fuelTank !== null ? "fuel tank" : "no fuel tank";
    fuelTankSlot.classList.add("componentSlot");
    componentList.appendChild(fuelTankSlot);

    const optionalH2 = document.createElement("h2");
    optionalH2.innerText = i18n.t("spaceStation:optionalSlots");
    componentList.appendChild(optionalH2);

    for (const component of spaceship.components.optional) {
        const componentSlot = document.createElement("div");
        componentSlot.textContent = component !== null ? "component" : "no component";
        componentSlot.classList.add("componentSlot");
        componentList.appendChild(componentSlot);
    }

    const browseComponents = document.createElement("div");
    browseComponents.innerText = "no component selected";
    rootHtml.appendChild(browseComponents);

    const componentSpec = document.createElement("div");
    componentSpec.innerText = "no component selected";
    rootHtml.appendChild(componentSpec);

    return rootHtml;
}

export function generateSpaceshipDom(stationModel: DeepReadonly<OrbitalFacilityModel>, player: Player): HTMLDivElement {
    const mainContainer = document.createElement("div");

    const spaceshipH2 = document.createElement("h2");
    spaceshipH2.innerText = i18n.t("spaceStation:shipHangar");
    mainContainer.appendChild(spaceshipH2);

    const currentSpaceship = player.instancedSpaceships.at(0);

    if (currentSpaceship !== undefined) {
        const spaceshipContainer = document.createElement("div");
        spaceshipContainer.classList.add("spaceshipContainer");
        mainContainer.appendChild(spaceshipContainer);

        const spaceshipName = document.createElement("h3");
        spaceshipName.innerText = currentSpaceship.name;
        spaceshipContainer.appendChild(spaceshipName);

        const fuelManagementContainer = document.createElement("div");
        fuelManagementContainer.classList.add("fuelManagementContainer");
        spaceshipContainer.appendChild(fuelManagementContainer);

        const fuelText = document.createElement("p");
        fuelText.innerText = `Fuel: ${currentSpaceship.getRemainingFuel().toFixed(0)} / ${currentSpaceship.getTotalFuelCapacity()}`;
        fuelManagementContainer.appendChild(fuelText);

        const outfittingButton = document.createElement("button");
        outfittingButton.innerText = i18n.t("spaceStation:outfitting");
        fuelManagementContainer.appendChild(outfittingButton);

        outfittingButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
            const outfittingDom = generateOutfittingDom(currentSpaceship, player);
            spaceshipContainer.appendChild(outfittingDom);
        });

        const refuelButton = document.createElement("button");
        refuelButton.innerText = i18n.t("spaceStation:refuel");

        refuelButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
            const fuelAmount = currentSpaceship.getTotalFuelCapacity() - currentSpaceship.getRemainingFuel();
            const fuelUnitPrice = 10;
            player.pay(Math.round(fuelAmount * fuelUnitPrice));
            currentSpaceship.refuel(fuelAmount);
            fuelText.innerText = `Fuel: ${currentSpaceship.getRemainingFuel()} / ${currentSpaceship.getTotalFuelCapacity()}`;
        });
        fuelManagementContainer.appendChild(refuelButton);
    }

    const otherSpaceshipH2 = document.createElement("h2");
    otherSpaceshipH2.innerText = i18n.t("spaceStation:otherSpaceships");
    mainContainer.appendChild(otherSpaceshipH2);

    if (player.serializedSpaceships.length === 0) {
        const noSpaceshipP = document.createElement("p");
        noSpaceshipP.innerText = i18n.t("spaceStation:noOtherSpaceship");
        mainContainer.appendChild(noSpaceshipP);
    }

    player.serializedSpaceships.forEach((serializedSpaceship) => {
        const spaceshipContainer = document.createElement("div");
        mainContainer.appendChild(spaceshipContainer);

        const spaceshipName = document.createElement("p");
        spaceshipName.innerText = serializedSpaceship.name;
        spaceshipContainer.appendChild(spaceshipName);

        const switchSpaceshipButton = document.createElement("button");
        switchSpaceshipButton.innerText = "Switch to this spaceship";
        switchSpaceshipButton.addEventListener("click", () => {
            throw new Error("Not implemented");
        });
        spaceshipContainer.appendChild(switchSpaceshipButton);
    });

    return mainContainer;
}

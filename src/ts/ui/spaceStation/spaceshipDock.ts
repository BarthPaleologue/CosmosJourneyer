import { Player } from "../../player/player";
import { OrbitalFacilityModel } from "../../spacestation/orbitalFacility";
import { Sounds } from "../../assets/sounds";
import i18n from "../../i18n";

export function generateSpaceshipDom(stationModel: OrbitalFacilityModel, player: Player): HTMLDivElement {
    const mainContainer = document.createElement("div");

    const spaceshipH2 = document.createElement("h2");
    spaceshipH2.innerText = i18n.t("spaceStation:shipHangar");
    mainContainer.appendChild(spaceshipH2);

    const spaceship = player.instancedSpaceships[0];

    const spaceshipContainer = document.createElement("div");
    spaceshipContainer.classList.add("spaceshipContainer");
    mainContainer.appendChild(spaceshipContainer);

    const spaceshipName = document.createElement("h3");
    spaceshipName.innerText = spaceship.name;
    spaceshipContainer.appendChild(spaceshipName);

    const fuelManagementContainer = document.createElement("div");
    fuelManagementContainer.classList.add("fuelManagementContainer");
    spaceshipContainer.appendChild(fuelManagementContainer);

    const fuelText = document.createElement("p");
    fuelText.innerText = `Fuel: ${spaceship.getRemainingFuel().toFixed(0)} / ${spaceship.getTotalFuelCapacity()}`;
    fuelManagementContainer.appendChild(fuelText);

    const refuelButton = document.createElement("button");
    refuelButton.innerText = i18n.t("spaceStation:refuel");

    refuelButton.addEventListener("click", () => {
        Sounds.MENU_SELECT_SOUND.play();
        const fuelAmount = spaceship.getTotalFuelCapacity() - spaceship.getRemainingFuel();
        const fuelUnitPrice = 10;
        player.balance -= fuelAmount * fuelUnitPrice;
        spaceship.refuel(fuelAmount);
        fuelText.innerText = `Fuel: ${spaceship.getRemainingFuel()} / ${spaceship.getTotalFuelCapacity()}`;
    });
    fuelManagementContainer.appendChild(refuelButton);

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

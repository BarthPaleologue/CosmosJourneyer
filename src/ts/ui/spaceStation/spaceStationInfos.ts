import { SpaceStationModel } from "../../spacestation/spacestationModel";
import { cropTypeToString } from "../../utils/agriculture";

export function generateInfoHTML(model: SpaceStationModel): string {
    return `
        <p>${model.name} is orbiting ${model.parentBody} at a distance of ${(model.orbit.radius * 0.001).toLocaleString(undefined, { maximumSignificantDigits: 3 })}km</p>

        <p>It is the home to ${model.population.toLocaleString(undefined, { maximumSignificantDigits: 3 })} inhabitants, with a population density of ${model.populationDensity.toLocaleString(undefined, { maximumSignificantDigits: 3 })} per km²</p>

        ${model.agricultureMix.map(([proportion, crop]) => `<p>${(proportion * 100).toFixed(1)}% ${cropTypeToString(crop)}</p>`).join("")}
    `
}
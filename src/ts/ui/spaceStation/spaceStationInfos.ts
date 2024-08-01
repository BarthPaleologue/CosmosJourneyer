import { SpaceStationModel } from "../../spacestation/spacestationModel";
import { CropType, cropTypeToString } from "../../utils/agriculture";

import * as d3 from "d3";

export function generateInfoHTML(model: SpaceStationModel): string {
    const agricultureMix = model.agricultureMix;

    const pieGenerator = d3.pie<[number, CropType]>().value(([proportion, _]) => proportion);

    const parsedData = pieGenerator(agricultureMix);

    const arcGenerator = d3
        .arc<d3.PieArcDatum<[number, CropType]>>()
        .innerRadius(0)
        .outerRadius(200)

    const colorGenerator = d3
        .scaleSequential(d3.interpolateViridis)
        .domain([0, agricultureMix.length]);

    const arcs = parsedData.map((d, i) => ({
        path: arcGenerator(d),
        data: d.data,
        color: colorGenerator(i),
    }));

    return `
        <h2>General information</h2>
        
        <p>${model.name} is orbiting ${model.parentBody} at a distance of ${(model.orbit.radius * 0.001).toLocaleString(undefined, { maximumSignificantDigits: 3 })}km</p>

        <p>It is the home to ${model.population.toLocaleString(undefined, { maximumSignificantDigits: 3 })} inhabitants, with a population density of ${model.populationDensity.toLocaleString(undefined, { maximumSignificantDigits: 3 })} per km²</p>

        <h2>Agriculture mix</h2>

        <svg viewBox="-250 -250 700 500">
            ${arcs.map(({ path, data, color }, i) => `
            <g>
                <path d="${path}" fill="${color}" class="pie-slice" title="${cropTypeToString(data[1])}"></path>
            </g>

            <rect x="250" y="${(i - arcs.length / 2) * 40}" width="30" height="30" fill="${color}"></rect>
            <text x="290" y="${(i - arcs.length / 2) * 40 + 24}" font-size="24">${cropTypeToString(data[1])}</text>

            `).join("")}
        </svg>
    `;
}
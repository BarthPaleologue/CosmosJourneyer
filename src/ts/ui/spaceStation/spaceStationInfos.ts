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
  .scaleSequential(d3.interpolateWarm)
  .domain([0, agricultureMix.length]);

  const arcs = parsedData.map((d, i) => ({
    d: d,
    path: arcGenerator(d),
    data: d.data,
    color: colorGenerator(i),
  }))
    .map(({ d, path, data, color }) => `
    <g>
        <path d="${path}" fill="${color}"></path>
        <text transform="translate(${arcGenerator.centroid(d)})" text-anchor="middle">
            ${cropTypeToString(data[1])}
        </text>
    </g>
    `).join("")  



    return `
        <h2>General information</h2>
        
        <p>${model.name} is orbiting ${model.parentBody} at a distance of ${(model.orbit.radius * 0.001).toLocaleString(undefined, { maximumSignificantDigits: 3 })}km</p>

        <p>It is the home to ${model.population.toLocaleString(undefined, { maximumSignificantDigits: 3 })} inhabitants, with a population density of ${model.populationDensity.toLocaleString(undefined, { maximumSignificantDigits: 3 })} per km²</p>

        <h2>Agriculture mix</h2>

        <svg viewBox="-250 -250 500 500">
            ${arcs}
        </svg>

        
    `
}
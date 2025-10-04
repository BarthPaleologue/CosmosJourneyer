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

import { arc, interpolateViridis, pie, scaleSequential, type PieArcDatum } from "d3";

import { type DeepReadonly } from "@/utils/types";

export function makeD3PieChart<T>(
    data: DeepReadonly<T[]>,
    extractProportion: (d: DeepReadonly<T>) => number,
    extractLegend: (d: DeepReadonly<T>) => string,
): string {
    const pieGenerator = pie<DeepReadonly<T>>().value(extractProportion);

    const parsedData = pieGenerator([...data]);

    const arcGenerator = arc<PieArcDatum<DeepReadonly<T>>>().innerRadius(0).outerRadius(200);

    const colorGenerator = scaleSequential(interpolateViridis).domain([0, data.length]);

    const arcs = parsedData.map((d, i) => ({
        path: arcGenerator(d),
        data: d.data,
        color: colorGenerator(i),
    }));

    return `
    <svg viewBox="-250 -250 800 500">
        ${arcs
            .map(
                ({ path, data, color }, i) => `
        <g class="pie-slice-group">
            <path d="${path}" fill="${color}" class="pie-slice"></path>

            <rect x="250" y="${(i - arcs.length / 2) * 40}" width="30" height="30" fill="${color}"></rect>
            <text x="290" y="${(i - arcs.length / 2) * 40 + 24}" font-size="24">${extractLegend(data)}</text>
        </g>`,
            )
            .join("")}
    </svg>
    `;
}

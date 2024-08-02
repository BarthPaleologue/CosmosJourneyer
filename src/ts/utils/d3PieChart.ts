import * as d3 from 'd3';

export function makeD3PieChart<T>(data: T[], extractProportion: (d: T) => number, extractLegend: (d: T) => string): string {
    const pieGenerator = d3.pie<T>().value(extractProportion);

    const parsedData = pieGenerator(data);

    const arcGenerator = d3
        .arc<d3.PieArcDatum<T>>()
        .innerRadius(0)
        .outerRadius(200)

    const colorGenerator = d3
        .scaleSequential(d3.interpolateViridis)
        .domain([0, data.length]);

    const arcs = parsedData.map((d, i) => ({
        path: arcGenerator(d),
        data: d.data,
        color: colorGenerator(i),
    }));

    return `
    <svg viewBox="-250 -250 800 500">
        ${arcs.map(({ path, data, color }, i) => `
        <g class="pie-slice-group">
            <path d="${path}" fill="${color}" class="pie-slice"></path>

            <rect x="250" y="${(i - arcs.length / 2) * 40}" width="30" height="30" fill="${color}"></rect>
            <text x="290" y="${(i - arcs.length / 2) * 40 + 24}" font-size="24">${extractLegend(data)}</text>
        </g>


        `).join("")}
    </svg>
    `;
}
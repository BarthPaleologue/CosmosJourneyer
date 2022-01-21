import { Planet } from "../planet";

export class GazPlanet extends Planet {
    constructor(name: string, radius: number) {
        super(name, radius, {
            minTemperature: -50,
            maxTemperature: 50,
            pressure: 1
        });
    }
}
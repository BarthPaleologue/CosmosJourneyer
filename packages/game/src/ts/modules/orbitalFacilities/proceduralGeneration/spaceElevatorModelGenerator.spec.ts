import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getOrbitalPeriod } from "@cosmos-journeyer/physics";
import { describe, expect, it } from "vitest";

import { computeAbsoluteOrientation, getPointOnOrbitLocal } from "@/frontend/helpers/orbit";

import { getVestaModel } from "../../vesta/vesta";
import { generateSpaceElevatorModel } from "./spaceElevatorModelGenerator";

describe("space elevator synchronous attitude", () => {
    it.each([0, 0.6, -0.8])("keeps the tether radial on an orbit with inclination %s", (inclination) => {
        const { starSystem } = getVestaModel();
        const planet = starSystem.planets.find((body) => body.type === "telluricPlanet");
        if (planet === undefined) {
            throw new Error("Expected a telluric planet");
        }
        planet.orbit.inclination = inclination;
        planet.spin.axialTilt = 0.3;
        const model = generateSpaceElevatorModel("elevator", 42, planet, starSystem);
        const { orbit, attitude } = model.placement;
        const period = getOrbitalPeriod(orbit.semiMajorAxis, planet.mass);
        const local = attitude.localFrameOrientation;
        const modelOrientation = Quaternion.RotationYawPitchRoll(local.yaw, local.pitch, local.roll);
        for (const phase of [-1, 0, 0.125, 0.25, 0.5, 0.75, 1, 10]) {
            const time = phase * period;
            const position = getPointOnOrbitLocal(orbit, planet.mass, time);
            const orientation = computeAbsoluteOrientation(orbit, attitude.spin, time).multiply(modelOrientation);
            const tetherUp = Vector3.Up().applyRotationQuaternion(orientation);
            expect(Vector3.Dot(tetherUp, position.normalize())).toBeCloseTo(1, 6);
        }
    });
});

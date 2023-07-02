import { Matrix } from 'ml-matrix';
import { HoverThruster } from "./hoverThruster";

// the math behind this file is based on https://simblob.blogspot.com/2009/01/game-component-spaceship-editor-part-1.html

export function buildThrusterMatrix(hoverThrusters: HoverThruster[]) {
    const rowForceX = [];
    const rowForceY = [];
    const rowForceZ = [];
    const rowTorqueX = [];
    const rowTorqueY = [];
    const rowTorqueZ = [];

    for(const thruster of hoverThrusters) {
        const thrustDirection = thruster.getThrustDirection();
        rowForceX.push(thrustDirection.x);
        rowForceY.push(thrustDirection.y);
        rowForceZ.push(thrustDirection.z);

        const torque = thruster.getTorque();
        rowTorqueX.push(torque.x);
        rowTorqueY.push(torque.y);
        rowTorqueZ.push(torque.z);
    }

    return new Matrix([
        rowForceX,
        rowForceY,
        rowForceZ,
        rowTorqueX,
        rowTorqueY,
        rowTorqueZ
    ]);
}

export function getThrustAndTorque(thrusterConfiguration: number[], thrusterMatrix: Matrix): [number, number, number, number, number, number] {
    const thrustAndTorque: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
    if(thrusterMatrix.rows != 6) throw new Error("Thruster matrix must have 6 rows!");
    for(let i = 0; i < thrusterMatrix.rows; i++) {
        const row = thrusterMatrix.getRow(i);
        for(let j = 0; j < thrusterMatrix.columns; j++) {
            thrustAndTorque[i] += row[j] * thrusterConfiguration[j];
        }
    }
    return thrustAndTorque;
}
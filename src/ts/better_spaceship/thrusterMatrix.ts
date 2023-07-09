import { Matrix } from 'ml-matrix';
import { Thruster } from "./thruster";
import { Vector3 } from '@babylonjs/core/Maths/math';

// the math behind this file is based on https://simblob.blogspot.com/2009/01/game-component-spaceship-editor-part-1.html

export function buildThrusterMatrix(hoverThrusters: Thruster[]) {
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

        const torque = thruster.getBaseTorque();
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

export function getThrustAndTorque(thrusterConfiguration: number[], thrusterMatrix: Matrix): [Vector3, Vector3] {
    if(thrusterMatrix.rows != 6) throw new Error("Thruster matrix must have 6 rows!");
    const thrustAndTorque: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
    for(let i = 0; i < thrusterMatrix.rows; i++) {
        const row = thrusterMatrix.getRow(i);
        for(let j = 0; j < thrusterMatrix.columns; j++) {
            thrustAndTorque[i] += row[j] * thrusterConfiguration[j];
        }
    }
    return [
        new Vector3(thrustAndTorque[0], thrustAndTorque[1], thrustAndTorque[2]),
        new Vector3(thrustAndTorque[3], thrustAndTorque[4], thrustAndTorque[5])
    ];
}

export function getThrusterConfiguration(targetThrust: Vector3, targetTorque: Vector3, inverseThrusterMatrix: Matrix): number[] {
    if(inverseThrusterMatrix.columns != 6) throw new Error("Inverse thruster matrix must have 6 columns!");
    const targetThrustAndTorque = [
        targetThrust.x,
        targetThrust.y,
        targetThrust.z,
        targetTorque.x,
        targetTorque.y,
        targetTorque.z
    ]
    const nbThrusters = inverseThrusterMatrix.rows;
    const thrusterConfiguration = new Array(nbThrusters).fill(0);
    for(let i = 0; i < inverseThrusterMatrix.rows; i++) {
        const row = inverseThrusterMatrix.getRow(i);
        for(let j = 0; j < inverseThrusterMatrix.columns; j++) {
            thrusterConfiguration[i] += row[j] * targetThrustAndTorque[j];
        }
    }

    return thrusterConfiguration;
}
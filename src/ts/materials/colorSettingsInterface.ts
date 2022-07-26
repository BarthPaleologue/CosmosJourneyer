import { Color3 } from "@babylonjs/core";

export enum ColorMode {
    DEFAULT,
    MOISTURE,
    TEMPERATURE,
    NORMAL,
    HEIGHT
}

export interface ColorSettings {
    mode: number;

    snowColor: Color3;
    steepColor: Color3;
    plainColor: Color3;
    beachColor: Color3;
    desertColor: Color3;
    bottomColor: Color3;

    beachSize: number;
    steepSharpness: number;
    normalSharpness: number;
}

export interface GazColorSettings {
    color1: Color3;
    color2: Color3;
    color3: Color3;
    color4: Color3;
    colorSharpness: number;
}

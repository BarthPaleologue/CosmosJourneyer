import { Vector3 } from "./components/forge/algebra.js";
import { NoiseLayer } from "./components/forge/layers/noiseLayer.js";
let renderer = document.getElementById("renderer");
renderer.width = window.innerWidth;
renderer.height = window.innerHeight;
let ctx = renderer.getContext("2d");
ctx.fillStyle = "red";
ctx.fillRect(0, 0, renderer.width, renderer.height);
ctx.fill();
let noiseModifiers = {
    strengthModifier: 1,
    amplitudeModifier: 1,
    frequencyModifier: 1,
    offsetModifier: BABYLON.Vector3.Zero(),
    minValueModifier: 1,
};
let barrenBumpyLayer = new NoiseLayer({
    noiseStrength: 1,
    octaves: 10,
    baseAmplitude: 1000,
    baseFrequency: 1,
    decay: 1.7,
    minValue: 0,
    offset: [0, 0, 0],
    useCraterMask: false,
});
for (let x = 0; x < renderer.width; x++) {
    for (let y = 0; y < renderer.height; y++) {
        let noiseValue = barrenBumpyLayer.evaluate(new Vector3(x, y, 0), noiseModifiers);
        ctx.fillStyle = `rgba(${noiseValue}, ${noiseValue}, ${noiseValue}, 1.0)`;
        ctx.fillRect(x, y, 1, 1);
        ctx.fill();
    }
}

import "../babylon/babylon4.js";
import { Direction } from "./direction.js";
import { CraterLayer } from "./layers/craterLayer.js";
import { CraterModifiers } from "./layers/craterModifiers.js";
import { NoiseLayer } from "./layers/noiseLayer.js";
import { NoiseModifiers } from "./layers/noiseSettings.js";
import { NoiseEngine } from "../engine/perlin.js";

onerror = e => console.log(e);

onmessage = e => {
    let d = JSON.parse(e.data);

    //console.log(d);

    let noiseEngine = new NoiseEngine();
    noiseEngine.seed(69);

    let noiseLayers: NoiseLayer[] = [];
    /*for (let data of d.noiseLayers) {
        noiseLayers.push(new NoiseLayer(noiseEngine, data.settings, data.masks));
    }*/

    let barrenBumpyLayer = new NoiseLayer(noiseEngine, {
        noiseStrength: 1,
        octaves: 10,
        baseAmplitude: 0.5,
        baseFrequency: 1,
        decay: 1.9,
        minValue: 0,
        offset: BABYLON.Vector3.Zero()
    });

    let continentsLayer = new NoiseLayer(noiseEngine, {
        noiseStrength: 1,
        octaves: 10,
        baseAmplitude: 1,
        baseFrequency: 1,
        decay: 2,
        minValue: 0.1,
        offset: BABYLON.Vector3.Zero()
    });

    let moutainsLayer = new NoiseLayer(noiseEngine, {
        noiseStrength: 1,
        octaves: 7,
        baseAmplitude: 0.5,
        baseFrequency: 1,
        decay: 2,
        minValue: 0,
        offset: BABYLON.Vector3.Zero()
    }, [0]);

    noiseLayers.push(continentsLayer, moutainsLayer);


    //let noiseModifiers: NoiseModifiers = d.noiseModifiers;

    /*console.log(noiseLayers[0].filters[0].filterFunction(BABYLON.Vector3.Up(), {
        strengthModifier: 1,
        amplitudeModifier: 1,
        frequencyModifier: 1,
        offsetModifier: BABYLON.Vector3.Zero(),
        minValueModifier: 1,
    }));*/

    let craterLayers: CraterLayer[] = d.craterLayers;
    let craterModifiers: CraterModifiers = d.craterModifiers;

    let terrainFunction = (p: BABYLON.Vector3) => {
        let coords = p.normalizeToNew().scale(d.baseLength);


        let elevation = 0;
        for (let layer of noiseLayers) {
            let maskFactor = 1;
            for (let i = 0; i < layer.masks.length; i++) {
                maskFactor *= noiseLayers[i].evaluate(coords, {
                    strengthModifier: 1,
                    amplitudeModifier: 1,
                    frequencyModifier: 1,
                    offsetModifier: BABYLON.Vector3.Zero(),
                    minValueModifier: 1,
                });
            }
            elevation += layer.evaluate(coords, {
                strengthModifier: 1,
                amplitudeModifier: 1,
                frequencyModifier: 1,
                offsetModifier: BABYLON.Vector3.Zero(),
                minValueModifier: 1,
            }) * maskFactor;
        }
        for (let craterLayer of craterLayers) {
            //elevation += craterLayer.evaluate(coords.normalizeToNew(), craterModifiers);
        }

        //elevation = Math.max(0, elevation);



        let newPosition = p.add(coords.normalizeToNew().scale(elevation * 1 / 10));
        return newPosition;
    };

    let radius = d.baseLength;
    let subs = d.subdivisions;
    let depth = d.depth;
    let size = radius / (2 ** depth);
    let direction = d.direction;
    let offset = new BABYLON.Vector3(d.offsetX, d.offsetY, d.offsetZ);

    let vertices: number[] = [];
    let faces: number[][] = [];
    let uvs: number[] = [];
    let nbSubdivisions = subs + 1;

    let rotation = BABYLON.Matrix.Identity();

    switch (direction) {
        case Direction.Up:
            rotation = BABYLON.Matrix.RotationX(Math.PI / 2);
            break;
        case Direction.Down:
            rotation = BABYLON.Matrix.RotationX(-Math.PI / 2);
            break;
        case Direction.Forward:
            rotation = BABYLON.Matrix.Identity();
            break;
        case Direction.Backward:
            rotation = BABYLON.Matrix.RotationY(Math.PI);
            break;
        case Direction.Left:
            rotation = BABYLON.Matrix.RotationY(-Math.PI / 2);
            break;
        case Direction.Right:
            rotation = BABYLON.Matrix.RotationY(Math.PI / 2);
            break;
    }

    for (let x = 0; x < nbSubdivisions; x++) {
        for (let y = 0; y < nbSubdivisions; y++) {
            let vertex = new BABYLON.Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
            vertex = vertex.scale(size);
            vertex = vertex.add(offset);
            vertex = BABYLON.Vector3.TransformCoordinates(vertex, rotation);
            vertex = vertex.normalizeToNew().scale(radius);


            vertex = terrainFunction(vertex);

            vertices.push(vertex.x, vertex.y, vertex.z);

            uvs.push(x / nbSubdivisions, y / nbSubdivisions);

            if (x < nbSubdivisions - 1 && y < nbSubdivisions - 1) {
                faces.push([
                    x * nbSubdivisions + y,
                    x * nbSubdivisions + y + 1,
                    (x + 1) * nbSubdivisions + y + 1,
                    (x + 1) * nbSubdivisions + y,
                ]);
            }
        }
    }

    let positions = vertices;
    let indices: number[] = [];
    let normals: number[] = [];

    // indices from faces
    for (let face of faces) {
        for (let i = 0; i < face.length - 2; i++) {
            indices.push(face[0], face[i + 2], face[i + 1]);
        }
    }

    BABYLON.VertexData.ComputeNormals(positions, indices, normals);

    let vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    //@ts-ignore
    postMessage(vertexData);
};
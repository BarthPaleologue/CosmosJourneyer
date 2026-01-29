"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["3248"],{76851(e,o,r){r.r(o),r.d(o,{volumetricLightingRenderVolumeVertexShaderWGSL:()=>i});var t=r(56863);r(2384),r(40151);let s="volumetricLightingRenderVolumeVertexShader",n=`#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute position : vec3f;varying vWorldPos: vec4f;@vertex
fn main(input : VertexInputs)->FragmentInputs {let worldPos=mesh.world*vec4f(vertexInputs.position,1.0);vertexOutputs.vWorldPos=worldPos;vertexOutputs.position=scene.viewProjection*worldPos;}
`;t.l.ShadersStoreWGSL[s]||(t.l.ShadersStoreWGSL[s]=n);let i={name:s,shader:n}}}]);
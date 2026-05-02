import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./meshUboDeclaration-CbscdDj-.js";import{t as i}from"./sceneUboDeclaration-B56gRjPP.js";var a,o,s;e((()=>{t(),i(),r(),a=`volumetricLightingRenderVolumeVertexShader`,o=`#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute position : vec3f;varying vWorldPos: vec4f;@vertex
fn main(input : VertexInputs)->FragmentInputs {let worldPos=mesh.world*vec4f(vertexInputs.position,1.0);vertexOutputs.vWorldPos=worldPos;vertexOutputs.position=scene.viewProjection*worldPos;}
`,n.ShadersStoreWGSL[a]||(n.ShadersStoreWGSL[a]=o),s={name:a,shader:o}}))();export{s as volumetricLightingRenderVolumeVertexShaderWGSL};
import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{t as r}from"./bakedVertexAnimationDeclaration-BMimfX3V.js";import{t as i}from"./bakedVertexAnimation-DWGY78XM.js";import{t as a}from"./instancesDeclaration-CTHjAnjc.js";import{t as o}from"./instancesVertex-CRhqQq2d.js";import{n as s}from"./bonesDeclaration-DxY5l0BS.js";import{n as c}from"./bonesVertex-TJAdIMxB.js";import{t as l}from"./morphTargetsVertexGlobalDeclaration-CBpmTBC2.js";import{t as u}from"./morphTargetsVertexDeclaration-DokAJ01O.js";import{t as d}from"./morphTargetsVertexGlobal-BPqDDsxr.js";import{t as f}from"./morphTargetsVertex-BrnbtHox.js";var p,m,h,g=e((()=>{t(),s(),r(),l(),u(),a(),d(),f(),o(),c(),i(),p=`pickingVertexShader`,m=`attribute position: vec3f;
#if defined(INSTANCES)
attribute instanceMeshID: f32;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#if defined(INSTANCES)
flat varying vMeshID: f32;
#endif
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=input.position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld*vec4f(positionUpdated,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#if defined(INSTANCES)
vertexOutputs.vMeshID=input.instanceMeshID;
#endif
}
`,n.ShadersStoreWGSL[p]||(n.ShadersStoreWGSL[p]=m),h={name:p,shader:m}}));export{h as n,g as t};
//# sourceMappingURL=picking.vertex-CAMTawuh.js.map
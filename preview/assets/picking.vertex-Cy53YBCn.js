import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./bakedVertexAnimationDeclaration-C5lPXkc7.js";import{t as i}from"./bakedVertexAnimation-DpdUHLfA.js";import{t as a}from"./instancesDeclaration-B7ap1PGG.js";import{t as o}from"./instancesVertex-CRsVoSk9.js";import{n as s}from"./bonesDeclaration-geejcpom.js";import{n as c}from"./bonesVertex-Bh2kXNtN.js";import{t as l}from"./morphTargetsVertexGlobalDeclaration-DqRlq5QZ.js";import{t as u}from"./morphTargetsVertexDeclaration-Cbfc-DdP.js";import{t as d}from"./morphTargetsVertexGlobal-CUgEnb8G.js";import{t as f}from"./morphTargetsVertex-Cnr9SjvW.js";var p,m,h,g=e((()=>{t(),s(),r(),l(),u(),a(),d(),f(),o(),c(),i(),p=`pickingVertexShader`,m=`attribute position: vec3f;
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
//# sourceMappingURL=picking.vertex-Cy53YBCn.js.map
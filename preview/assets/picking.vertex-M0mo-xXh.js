import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{t as r}from"./bakedVertexAnimationDeclaration-DnQk_RwN.js";import{t as i}from"./bakedVertexAnimation-lgb0PhgU.js";import{t as a}from"./instancesDeclaration-CtpBEl3l.js";import{t as o}from"./instancesVertex-ClDDXdOt.js";import{n as s}from"./bonesDeclaration-Dc57N-id.js";import{n as c}from"./bonesVertex-CerndIZ3.js";import{t as l}from"./morphTargetsVertexGlobalDeclaration-BB6Sc7nW.js";import{t as u}from"./morphTargetsVertexDeclaration-Bj_e962I.js";import{t as d}from"./morphTargetsVertexGlobal-DBMPhAZf.js";import{t as f}from"./morphTargetsVertex-CYECtF7n.js";var p,m,h,g=e((()=>{t(),s(),r(),l(),u(),a(),d(),f(),o(),c(),i(),p=`pickingVertexShader`,m=`attribute position: vec3f;
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
//# sourceMappingURL=picking.vertex-M0mo-xXh.js.map
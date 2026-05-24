import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./bonesDeclaration-KbVj4Z08.js";import{n as i,t as a}from"./bakedVertexAnimation-3VHINEbi.js";import{t as o}from"./instancesDeclaration-DJuXVkmR.js";import{t as s}from"./instancesVertex-s7-lkAWF.js";import{n as c}from"./bonesVertex-B98woXHT.js";import{t as l}from"./morphTargetsVertexGlobalDeclaration-DbhpiVXJ.js";import{t as u}from"./morphTargetsVertexDeclaration-jUPyytMr.js";import{t as d}from"./morphTargetsVertexGlobal-DWuOh50D.js";import{t as f}from"./morphTargetsVertex-Cb9ka-e6.js";var p,m,h,g=e((()=>{t(),r(),i(),l(),u(),o(),d(),f(),s(),c(),a(),p=`pickingVertexShader`,m=`attribute vec3 position;
#if defined(INSTANCES)
attribute float instanceMeshID;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
uniform mat4 viewProjection;
#if defined(INSTANCES)
flat varying float vMeshID;
#endif
void main(void) {vec3 positionUpdated=position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);gl_Position=viewProjection*worldPos;
#if defined(INSTANCES)
vMeshID=instanceMeshID;
#endif
}
`,n.ShadersStore[p]||(n.ShadersStore[p]=m),h={name:p,shader:m}}));export{h as n,g as t};
//# sourceMappingURL=picking.vertex-DRv4u6Nh.js.map
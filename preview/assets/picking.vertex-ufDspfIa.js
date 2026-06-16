import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./bonesDeclaration-BSYLOweg.js";import{n as i,t as a}from"./bakedVertexAnimation-Bm-LDPsc.js";import{t as o}from"./instancesDeclaration-Cxg6I4qH.js";import{t as s}from"./instancesVertex-OLp9BSRz.js";import{n as c}from"./bonesVertex-DOdlsEEE.js";import{t as l}from"./morphTargetsVertexGlobalDeclaration-3Si55nG0.js";import{t as u}from"./morphTargetsVertexDeclaration-TfEs7Uyp.js";import{t as d}from"./morphTargetsVertexGlobal-Cb5nxawW.js";import{t as f}from"./morphTargetsVertex-DDTTJve4.js";var p,m,h,g=e((()=>{t(),r(),i(),l(),u(),o(),d(),f(),s(),c(),a(),p=`pickingVertexShader`,m=`attribute vec3 position;
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
//# sourceMappingURL=picking.vertex-ufDspfIa.js.map
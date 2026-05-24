import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./logDepthDeclaration-CBgNGOLC.js";import{t as i}from"./sceneUboDeclaration-gi2SMQ_g.js";import{t as a}from"./meshUboDeclaration-jmeVjD0-.js";import{n as o}from"./clipPlaneVertexDeclaration-CtNex3wB.js";import{n as s}from"./clipPlaneVertex-BW-PqQBf.js";import{t as c}from"./logDepthVertex-B8gDFpaz.js";import{t as l}from"./instancesDeclaration-DJuXVkmR.js";import{t as u}from"./instancesVertex-s7-lkAWF.js";var d,f,p=e((()=>{t(),d=`lineVertexDeclaration`,f=`uniform mat4 viewProjection;
#define ADDITIONAL_VERTEX_DECLARATION
`,n.IncludesShadersStore[d]||(n.IncludesShadersStore[d]=f)})),m,h,g=e((()=>{t(),i(),a(),m=`lineUboDeclaration`,h=`layout(std140,column_major) uniform;
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
`,n.IncludesShadersStore[m]||(n.IncludesShadersStore[m]=h)})),_,v,y,b=e((()=>{t(),p(),g(),l(),o(),r(),u(),s(),c(),_=`lineVertexShader`,v=`#include<__decl__lineVertex>
#include<instancesDeclaration>
#include<clipPlaneVertexDeclaration>
attribute vec3 position;attribute vec4 normal;uniform float width;uniform float aspectRatio;
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
mat4 worldViewProjection=viewProjection*finalWorld;vec4 viewPosition=worldViewProjection*vec4(position,1.0);vec4 viewPositionNext=worldViewProjection*vec4(normal.xyz,1.0);vec2 currentScreen=viewPosition.xy/viewPosition.w;vec2 nextScreen=viewPositionNext.xy/viewPositionNext.w;currentScreen.x*=aspectRatio;nextScreen.x*=aspectRatio;vec2 dir=normalize(nextScreen-currentScreen);vec2 normalDir=vec2(-dir.y,dir.x);normalDir*=width/2.0;normalDir.x/=aspectRatio;vec4 offset=vec4(normalDir*normal.w,0.0,0.0);gl_Position=viewPosition+offset;
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
vec4 worldPos=finalWorld*vec4(position,1.0);
#include<clipPlaneVertex>
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`,n.ShadersStore[_]||(n.ShadersStore[_]=v),y={name:_,shader:v}}));export{y as n,b as t};
//# sourceMappingURL=line.vertex-DhfeDyT5.js.map
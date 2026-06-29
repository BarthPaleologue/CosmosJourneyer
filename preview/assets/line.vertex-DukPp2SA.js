import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{t as r}from"./logDepthDeclaration-X9NIsbEa.js";import{t as i}from"./sceneUboDeclaration-G7ksVXA6.js";import{t as a}from"./meshUboDeclaration-Chr_G_wf.js";import{n as o}from"./clipPlaneVertexDeclaration-CXuTFBH0.js";import{n as s}from"./clipPlaneVertex-CLlIGee7.js";import{t as c}from"./logDepthVertex-JIWFOM0W.js";import{t as l}from"./instancesDeclaration-FhBu7Gor.js";import{t as u}from"./instancesVertex-DaMCjM5w.js";var d,f,p=e((()=>{t(),d=`lineVertexDeclaration`,f=`uniform mat4 viewProjection;
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
//# sourceMappingURL=line.vertex-DukPp2SA.js.map
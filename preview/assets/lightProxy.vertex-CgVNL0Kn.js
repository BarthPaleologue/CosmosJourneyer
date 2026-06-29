import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{t as r}from"./sceneUboDeclaration-G7ksVXA6.js";import{t as i}from"./sceneVertexDeclaration-BTHJr8ez.js";import{t as a}from"./clusteredLightingFunctions-DrvMBnxu.js";var o,s,c,l=e((()=>{t(),i(),r(),a(),o=`lightProxyVertexShader`,s=`attribute vec3 position;flat varying vec2 vLimits;flat varying highp uint vMask;
#include<__decl__sceneVertex>
uniform sampler2D lightDataTexture;uniform vec3 tileMaskResolution;
#include<clusteredLightingFunctions>
void main(void) {ClusteredLight light=getClusteredLight(lightDataTexture,gl_InstanceID);float range=light.vLightFalloff.x;vec4 viewPosition=view*vec4(light.vLightData.xyz,1);vec4 viewPositionSq=viewPosition*viewPosition;vec2 distSq=viewPositionSq.xy+viewPositionSq.z;vec2 sinSq=(range*range)/distSq;vec2 cosSq=max(1.0-sinSq,0.01);vec2 sinCos=position.xy*sqrt(sinSq*cosSq);
#ifdef RIGHT_HANDED
vec2 rotatedX=mat2(cosSq.x,sinCos.x,-sinCos.x,cosSq.x)*viewPosition.xz;vec2 rotatedY=mat2(cosSq.y,sinCos.y,-sinCos.y,cosSq.y)*viewPosition.yz;
#else
vec2 rotatedX=mat2(cosSq.x,-sinCos.x,sinCos.x,cosSq.x)*viewPosition.xz;vec2 rotatedY=mat2(cosSq.y,-sinCos.y,sinCos.y,cosSq.y)*viewPosition.yz;
#endif
vec4 projX=projection*vec4(rotatedX.x,0,rotatedX.y,1);vec4 projY=projection*vec4(0,rotatedY.x,rotatedY.y,1);vec2 projPosition=vec2(projX.x/max(projX.w,0.01),projY.y/max(projY.w,0.01));projPosition=mix(position.xy,projPosition,greaterThan(cosSq,vec2(0.01)));vec2 halfTileRes=tileMaskResolution.xy/2.0;vec2 tilePosition=(projPosition+1.0)*halfTileRes;tilePosition=mix(floor(tilePosition)-0.01,ceil(tilePosition)+0.01,greaterThan(position.xy,vec2(0)));float offset=float(gl_InstanceID/CLUSTLIGHT_BATCH)*tileMaskResolution.y;tilePosition.y=(tilePosition.y+offset)/tileMaskResolution.z;gl_Position=vec4(tilePosition/halfTileRes-1.0,0,1);vLimits=vec2(offset,offset+tileMaskResolution.y);vMask=1u<<(gl_InstanceID % CLUSTLIGHT_BATCH);}
`,n.ShadersStore[o]||(n.ShadersStore[o]=s),c={name:o,shader:s}}));export{c as n,l as t};
//# sourceMappingURL=lightProxy.vertex-CgVNL0Kn.js.map
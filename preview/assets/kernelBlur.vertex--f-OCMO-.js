import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{t as r}from"./kernelBlurVaryingDeclaration-CHPA6uSI.js";var i,a,o=e((()=>{t(),i=`kernelBlurVertex`,a=`sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};`,n.IncludesShadersStore[i]||(n.IncludesShadersStore[i]=a)})),s,c,l,u=e((()=>{t(),r(),o(),s=`kernelBlurVertexShader`,c=`attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`,n.ShadersStore[s]||(n.ShadersStore[s]=c),l={name:s,shader:c}}));export{l as n,u as t};
//# sourceMappingURL=kernelBlur.vertex--f-OCMO-.js.map
import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";var r,i,a,o=e((()=>{t(),r=`glowMapMergeVertexShader`,i=`attribute vec2 position;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`,n.ShadersStore[r]||(n.ShadersStore[r]=i),a={name:r,shader:i}}));export{o as n,a as t};
//# sourceMappingURL=glowMapMerge.vertex-CuSFGv7j.js.map
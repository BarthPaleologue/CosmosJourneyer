import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{n as r}from"./helperFunctions-CDM-F93Y.js";var i,a,o,s=e((()=>{t(),r(),i=`extractHighlightsPixelShader`,a=`#include<helperFunctions>
varying vec2 vUV;uniform sampler2D textureSampler;uniform float threshold;uniform float exposure;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);float luma=dot(LuminanceEncodeApprox,gl_FragColor.rgb*exposure);gl_FragColor.rgb=step(threshold,luma)*gl_FragColor.rgb;}`,n.ShadersStore[i]||(n.ShadersStore[i]=a),o={name:i,shader:a}}));export{s as n,o as t};
//# sourceMappingURL=extractHighlights.fragment-BD2Xk5TM.js.map
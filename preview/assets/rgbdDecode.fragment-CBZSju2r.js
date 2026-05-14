import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./helperFunctions-CwX7ufNs.js";var i,a,o,s=e((()=>{t(),r(),i=`rgbdDecodePixelShader`,a=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=vec4(fromRGBD(texture2D(textureSampler,vUV)),1.0);}`,n.ShadersStore[i]||(n.ShadersStore[i]=a),o={name:i,shader:a}}));export{o as n,s as t};
//# sourceMappingURL=rgbdDecode.fragment-CBZSju2r.js.map
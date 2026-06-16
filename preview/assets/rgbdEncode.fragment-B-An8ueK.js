import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./helperFunctions-Dv88wD2h.js";var i,a,o,s=e((()=>{t(),r(),i=`rgbdEncodePixelShader`,a=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}`,n.ShadersStore[i]||(n.ShadersStore[i]=a),o={name:i,shader:a}}));export{o as n,s as t};
//# sourceMappingURL=rgbdEncode.fragment-B-An8ueK.js.map
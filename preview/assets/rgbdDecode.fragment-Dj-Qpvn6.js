import{t as e}from"./shaderStore-D-XQlhUT.js";import"./helperFunctions-D4ODD7Nw.js";const t=`rgbdDecodePixelShader`;e.ShadersStore[t]||(e.ShadersStore[t]=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=vec4(fromRGBD(texture2D(textureSampler,vUV)),1.0);}`);
//# sourceMappingURL=rgbdDecode.fragment-Dj-Qpvn6.js.map
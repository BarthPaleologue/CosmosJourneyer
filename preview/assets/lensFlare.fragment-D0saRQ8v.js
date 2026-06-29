import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";var r,i,a,o=e((()=>{t(),r=`lensFlarePixelShader`,i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec4 color;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
vec4 baseColor=texture2D(textureSampler,vUV);gl_FragColor=baseColor*color;
#define CUSTOM_FRAGMENT_MAIN_END
}`,n.ShadersStore[r]||(n.ShadersStore[r]=i),a={name:r,shader:i}}));export{a as n,o as t};
//# sourceMappingURL=lensFlare.fragment-D0saRQ8v.js.map
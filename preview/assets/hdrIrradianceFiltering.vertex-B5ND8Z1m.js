import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";var r,i,a,o=e((()=>{t(),r=`hdrIrradianceFilteringVertexShader`,i=`attribute vec2 position;varying vec3 direction;uniform vec3 up;uniform vec3 right;uniform vec3 front;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
mat3 view=mat3(up,right,front);direction=view*vec3(position,1.0);gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`,n.ShadersStore[r]||(n.ShadersStore[r]=i),a={name:r,shader:i}}));export{o as n,a as t};
//# sourceMappingURL=hdrIrradianceFiltering.vertex-B5ND8Z1m.js.map
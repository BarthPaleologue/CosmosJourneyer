import{t as e}from"./shaderStore-DV7KRD9j.js";const t=`bonesDeclaration`;e.IncludesShadersStoreWGSL[t]||(e.IncludesShadersStoreWGSL[t]=`#if NUM_BONE_INFLUENCERS>0
attribute matricesIndices : vec4f;attribute matricesWeights : vec4f;
#if NUM_BONE_INFLUENCERS>4
attribute matricesIndicesExtra : vec4f;attribute matricesWeightsExtra : vec4f;
#endif
#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#ifdef BONETEXTURE
var boneSampler : texture_2d<f32>;uniform boneTextureWidth : f32;
#else
uniform mBones : array<mat4x4f,BonesPerMesh>;
#endif
#ifdef BONES_VELOCITY_ENABLED
uniform mPreviousBones : array<mat4x4f,BonesPerMesh>;
#endif
#ifdef BONETEXTURE
fn readMatrixFromRawSampler(smp : texture_2d<f32>,index : f32)->mat4x4f
{let offset=i32(index) *4; 
let m0=textureLoad(smp,vec2<i32>(offset+0,0),0);let m1=textureLoad(smp,vec2<i32>(offset+1,0),0);let m2=textureLoad(smp,vec2<i32>(offset+2,0),0);let m3=textureLoad(smp,vec2<i32>(offset+3,0),0);return mat4x4f(m0,m1,m2,m3);}
#endif
#endif
#endif
`);const n=`bakedVertexAnimationDeclaration`;e.IncludesShadersStoreWGSL[n]||(e.IncludesShadersStoreWGSL[n]=`#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
uniform bakedVertexAnimationTime: f32;uniform bakedVertexAnimationTextureSizeInverted: vec2<f32>;uniform bakedVertexAnimationSettings: vec4<f32>;var bakedVertexAnimationTexture : texture_2d<f32>;
#ifdef INSTANCES
attribute bakedVertexAnimationSettingsInstanced : vec4<f32>;
#endif
fn readMatrixFromRawSamplerVAT(smp : texture_2d<f32>,index : f32,frame : f32)->mat4x4<f32>
{let offset=i32(index)*4;let frameUV=i32(frame);let m0=textureLoad(smp,vec2<i32>(offset+0,frameUV),0);let m1=textureLoad(smp,vec2<i32>(offset+1,frameUV),0);let m2=textureLoad(smp,vec2<i32>(offset+2,frameUV),0);let m3=textureLoad(smp,vec2<i32>(offset+3,frameUV),0);return mat4x4<f32>(m0,m1,m2,m3);}
#endif
`);const r=`bonesVertex`;e.IncludesShadersStoreWGSL[r]||(e.IncludesShadersStoreWGSL[r]=`#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#if NUM_BONE_INFLUENCERS>0
var influence : mat4x4<f32>;
#ifdef BONETEXTURE
influence=readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndices[0])*vertexInputs.matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndices[1])*vertexInputs.matricesWeights[1];
#endif 
#if NUM_BONE_INFLUENCERS>2
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndices[2])*vertexInputs.matricesWeights[2];
#endif 
#if NUM_BONE_INFLUENCERS>3
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndices[3])*vertexInputs.matricesWeights[3];
#endif 
#if NUM_BONE_INFLUENCERS>4
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndicesExtra[0])*vertexInputs.matricesWeightsExtra[0];
#endif 
#if NUM_BONE_INFLUENCERS>5
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndicesExtra[1])*vertexInputs.matricesWeightsExtra[1];
#endif 
#if NUM_BONE_INFLUENCERS>6
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndicesExtra[2])*vertexInputs.matricesWeightsExtra[2];
#endif 
#if NUM_BONE_INFLUENCERS>7
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndicesExtra[3])*vertexInputs.matricesWeightsExtra[3];
#endif 
#else 
influence=uniforms.mBones[i32(vertexInputs.matricesIndices[0])]*vertexInputs.matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence=influence+uniforms.mBones[i32(vertexInputs.matricesIndices[1])]*vertexInputs.matricesWeights[1];
#endif 
#if NUM_BONE_INFLUENCERS>2
influence=influence+uniforms.mBones[i32(vertexInputs.matricesIndices[2])]*vertexInputs.matricesWeights[2];
#endif 
#if NUM_BONE_INFLUENCERS>3
influence=influence+uniforms.mBones[i32(vertexInputs.matricesIndices[3])]*vertexInputs.matricesWeights[3];
#endif 
#if NUM_BONE_INFLUENCERS>4
influence=influence+uniforms.mBones[i32(vertexInputs.matricesIndicesExtra[0])]*vertexInputs.matricesWeightsExtra[0];
#endif 
#if NUM_BONE_INFLUENCERS>5
influence=influence+uniforms.mBones[i32(vertexInputs.matricesIndicesExtra[1])]*vertexInputs.matricesWeightsExtra[1];
#endif 
#if NUM_BONE_INFLUENCERS>6
influence=influence+uniforms.mBones[i32(vertexInputs.matricesIndicesExtra[2])]*vertexInputs.matricesWeightsExtra[2];
#endif 
#if NUM_BONE_INFLUENCERS>7
influence=influence+uniforms.mBones[i32(vertexInputs.matricesIndicesExtra[3])]*vertexInputs.matricesWeightsExtra[3];
#endif 
#endif
finalWorld=finalWorld*influence;
#endif
#endif
`);const i=`bakedVertexAnimation`;e.IncludesShadersStoreWGSL[i]||(e.IncludesShadersStoreWGSL[i]=`#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
{
#ifdef INSTANCES
let VATStartFrame: f32=vertexInputs.bakedVertexAnimationSettingsInstanced.x;let VATEndFrame: f32=vertexInputs.bakedVertexAnimationSettingsInstanced.y;let VATOffsetFrame: f32=vertexInputs.bakedVertexAnimationSettingsInstanced.z;let VATSpeed: f32=vertexInputs.bakedVertexAnimationSettingsInstanced.w;
#else
let VATStartFrame: f32=uniforms.bakedVertexAnimationSettings.x;let VATEndFrame: f32=uniforms.bakedVertexAnimationSettings.y;let VATOffsetFrame: f32=uniforms.bakedVertexAnimationSettings.z;let VATSpeed: f32=uniforms.bakedVertexAnimationSettings.w;
#endif
let totalFrames: f32=VATEndFrame-VATStartFrame+1.0;let time: f32=uniforms.bakedVertexAnimationTime*VATSpeed/totalFrames;let frameCorrection: f32=select(1.0,0.0,time<1.0);let numOfFrames: f32=totalFrames-frameCorrection;var VATFrameNum: f32=fract(time)*numOfFrames;VATFrameNum=(VATFrameNum+VATOffsetFrame) % numOfFrames;VATFrameNum=floor(VATFrameNum);VATFrameNum=VATFrameNum+VATStartFrame+frameCorrection;var VATInfluence : mat4x4<f32>;VATInfluence=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndices[0],VATFrameNum)*vertexInputs.matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndices[1],VATFrameNum)*vertexInputs.matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndices[2],VATFrameNum)*vertexInputs.matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndices[3],VATFrameNum)*vertexInputs.matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndicesExtra[0],VATFrameNum)*vertexInputs.matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndicesExtra[1],VATFrameNum)*vertexInputs.matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndicesExtra[2],VATFrameNum)*vertexInputs.matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndicesExtra[3],VATFrameNum)*vertexInputs.matricesWeightsExtra[3];
#endif
finalWorld=finalWorld*VATInfluence;}
#endif
`);const a=`vertexColorMixing`;e.IncludesShadersStoreWGSL[a]||(e.IncludesShadersStoreWGSL[a]=`#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
vertexOutputs.vColor=vec4f(1.0);
#ifdef VERTEXCOLOR
#ifdef VERTEXALPHA
vertexOutputs.vColor*=vertexInputs.color;
#else
vertexOutputs.vColor=vec4f(vertexOutputs.vColor.rgb*vertexInputs.color.rgb,vertexOutputs.vColor.a);
#endif
#endif
#ifdef INSTANCESCOLOR
vertexOutputs.vColor*=vertexInputs.instanceColor;
#endif
#endif
`);
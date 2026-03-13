precision highp float;

varying vec3 vPositionW;

uniform mat4 view;
uniform mat4 inverseWorld;

uniform float elapsedSeconds;
uniform float exhaustPressureRatio;
uniform float exhaustRoundness;
uniform float throttle;
uniform float exhaustSpeed;
uniform float exhaustLength;
uniform float emissionIntensity;

#include "../utils/pi.glsl";

#include "../utils/rayIntersectsBox.glsl";

#include "../utils/circleSdf.glsl";

#include "../utils/roundedRectangleSdf.glsl";

#define ENVELOPE_GROWTH_FACTOR 0.4
#define ENVELOPE_EDGE_WIDTH 0.1
#define DIAMOND_PHASE_OFFSET (0.3 * PI)
#define DIAMOND_PHASE_WRAP_OFFSET (0.7 * PI)
#define DIAMOND_BACK_LENGTH_FACTOR 0.3
#define DIAMOND_DECAY_DISTANCE 1.0
#define DIAMOND_EDGE_WIDTH 0.05
#define DIAMOND_INTENSITY_SCALE 0.1
#define DENSITY_EDGE_WIDTH 0.05
#define DENSITY_NORMALIZATION_SCALE 8.0
#define SHOCK_DIAMOND_EMISSION_SCALE 10.0
#define SHOCK_DIAMOND_COLOR vec3(1.0)
#define HASH_Y_SCALE 37.0
#define HASH_Z_SCALE 521.0
#define HASH_INPUT_SCALE 1.333
#define HASH_OUTPUT_SCALE 100003.9
#define REFERENCE_RADIUS_SCALE 0.1
#define SHOCK_FREQUENCY_SCALE 0.5
#define SHOCK_PHASE_OFFSET (PI / 2.0)
#define THROTTLE_SHAPE_START 0.0
#define THROTTLE_SHAPE_END 1.0
#define MIN_THROTTLED_LENGTH_FACTOR 0.15
#define MIN_THROTTLED_LENGTH 1e-5
#define MIN_EXPANSION_STRENGTH 0.25
#define MAX_EXPANSION_STRENGTH 1.0
#define MIN_FLOW_SPEED_FACTOR 0.25
#define MAX_FLOW_SPEED_FACTOR 1.0
#define BOX_EPSILON 1e-6
#define END_FADE_START 0.3
#define END_FADE_END 1.0
#define EXHAUST_RADIUS_TRANSITION_FACTOR 0.5
#define NOISE_SCALE 20.0
#define NOISE_LONGITUDINAL_SCALE 0.1
#define ATTENUATION_BASE 0.7
#define ATTENUATION_NOISE_SCALE 0.3
#define EXTINCTION_COEFFICIENT 2.0
#define LOW_PRESSURE_BASE_COLOR vec3(0.6, 0.6, 1.0)
#define HIGH_PRESSURE_EDGE_COLOR vec3(0.90, 0.59, 0.80)
#define HIGH_PRESSURE_CORE_COLOR vec3(0.50, 0.50, 1.00)

float hash3d(vec3 coordinates) {
    float hashValue = coordinates.x + coordinates.y * HASH_Y_SCALE + coordinates.z * HASH_Z_SCALE;
    return fract(sin(hashValue * HASH_INPUT_SCALE) * HASH_OUTPUT_SCALE);
}

float interpolate_hermite(float value1, float value2, float factor) {
    return mix(value1, value2, factor * factor * (3.0 - 2.0 * factor));
}

const vec2 vector01 = vec2(0.0, 1.0);

float noise(vec3 coordinates) {
    vec3 fractional = fract(coordinates.xyz);
    vec3 integral = floor(coordinates.xyz);
    float hash000 = hash3d(integral);
    float hash100 = hash3d(integral + vector01.yxx);
    float hash010 = hash3d(integral + vector01.xyx);
    float hash110 = hash3d(integral + vector01.yyx);
    float hash001 = hash3d(integral + vector01.xxy);
    float hash101 = hash3d(integral + vector01.yxy);
    float hash011 = hash3d(integral + vector01.xyy);
    float hash111 = hash3d(integral + vector01.yyy);

    return interpolate_hermite(
        interpolate_hermite(
            interpolate_hermite(hash000, hash100, fractional.x),
            interpolate_hermite(hash010, hash110, fractional.x),
            fractional.y
        ),
        interpolate_hermite(
            interpolate_hermite(hash001, hash101, fractional.x),
            interpolate_hermite(hash011, hash111, fractional.x),
            fractional.y
        ),
        fractional.z
    );
}

float referenceRadius(float pressureRatioValue) {
    return REFERENCE_RADIUS_SCALE * sqrt(1.0 / pressureRatioValue);
}

float shockOmega() {
    float shockFrequency = SHOCK_FREQUENCY_SCALE * exhaustPressureRatio;
    return 2.0 * PI * shockFrequency;
}

float envelopeRadius(float x) {
    float targetRadius = referenceRadius(exhaustPressureRatio);
    if (CROSS_SECTION_EXTENT_X < targetRadius) {
        float start = log((targetRadius - CROSS_SECTION_EXTENT_X) / targetRadius) / log(ENVELOPE_GROWTH_FACTOR);
        return targetRadius - targetRadius * pow(ENVELOPE_GROWTH_FACTOR, start + x);
    } else {
        float envelopeBulge = CROSS_SECTION_EXTENT_X - targetRadius;
        float omega = shockOmega();
        float b = envelopeBulge * abs(cos(x * omega));
        return targetRadius + b;
    }
}

float envelopeEdgeMask(vec2 uv) {
    float radius = envelopeRadius(uv.x);
    float dist = abs(uv.y) - radius;
    return max(1.0 - abs(dist) / ENVELOPE_EDGE_WIDTH, 0.0);
}

float diamond(vec2 uv) {
    float referenceRadiusValue = referenceRadius(exhaustPressureRatio);
    float diamondValue;
    if (CROSS_SECTION_EXTENT_X > referenceRadiusValue) {
        float envelopeBulge = CROSS_SECTION_EXTENT_X - referenceRadiusValue;
        float omega = shockOmega();
        float phase = omega * uv.x + SHOCK_PHASE_OFFSET;
        float diamond_longitudinal = mod(phase - DIAMOND_PHASE_OFFSET, PI) - DIAMOND_PHASE_WRAP_OFFSET;
        float diamond_front_length = referenceRadiusValue / max(envelopeBulge * omega, BOX_EPSILON);
        float diamond_back_length = diamond_front_length * DIAMOND_BACK_LENGTH_FACTOR;
        float diamond_length = diamond_longitudinal > 0.0 ? diamond_back_length : diamond_front_length;
        float diamond_radius = referenceRadiusValue * max(0.0, 1.0 - abs(diamond_longitudinal / omega) / diamond_length);
        float decay = max(0.0, 1.0 - abs(diamond_longitudinal / DIAMOND_DECAY_DISTANCE));
        diamondValue = DIAMOND_INTENSITY_SCALE / diamond_front_length
            * (1.0 - smoothstep(diamond_radius - DIAMOND_EDGE_WIDTH, diamond_radius, abs(uv.y)))
            * decay;
    } else {
        diamondValue = 0.0;
    }
    return diamondValue;
}

vec3 cameraWorldPosFromView(mat4 V) {
    mat3 rotT = mat3(V);
    vec3 t = V[3].xyz;
    return -transpose(rotT) * t;
}

void main() {
    float throttleShape = smoothstep(THROTTLE_SHAPE_START, THROTTLE_SHAPE_END, throttle);
    float throttledLength = max(
        exhaustLength * mix(MIN_THROTTLED_LENGTH_FACTOR, 1.0, throttleShape),
        MIN_THROTTLED_LENGTH
    );
    float expansionStrength = mix(MIN_EXPANSION_STRENGTH, MAX_EXPANSION_STRENGTH, throttleShape);
    float flowSpeed = mix(MIN_FLOW_SPEED_FACTOR, MAX_FLOW_SPEED_FACTOR, throttleShape) * exhaustSpeed;
    float shockStrength = throttleShape * throttleShape;

    vec3 cameraPositionW = cameraWorldPosFromView(view);
    vec3 rayDirectionW = normalize(vPositionW - cameraPositionW);

    vec3 rayOrigin = (inverseWorld * vec4(cameraPositionW, 1.0)).xyz;
    vec3 rayDirection = normalize((inverseWorld * vec4(rayDirectionW, 0.0)).xyz);

    float boxSize = max(max(CROSS_SECTION_EXTENT_X, CROSS_SECTION_EXTENT_Z), referenceRadius(exhaustPressureRatio));

    float boxIntersectionNear;
    float boxIntersectionLength;
    if (
        !rayIntersectsBox(
            rayOrigin,
            rayDirection,
            vec3(-boxSize, -throttledLength, -boxSize),
            vec3(boxSize, 0.0, boxSize),
            boxIntersectionNear,
            boxIntersectionLength
        )
        || boxIntersectionLength <= 0.0
    ) {
        discard;
    }

    vec3 accumulatedColor = vec3(0.0);
    float opticalDepth = 0.0;
    float stepLength = boxIntersectionLength / float(RAY_MARCH_STEP_COUNT);

    for (int i = 0; i < RAY_MARCH_STEP_COUNT; i++) {
        float distanceAlongRay = boxIntersectionNear + float(i) * stepLength;
        vec3 samplePoint = rayOrigin + rayDirection * distanceAlongRay;
        float plumeDistance = -samplePoint.y;

        float longitudinalDecay = 1.0 - plumeDistance / throttledLength;
        float longitudinalPosition = clamp(plumeDistance / throttledLength, 0.0, 1.0);
        float endFade = 1.0 - smoothstep(END_FADE_START, END_FADE_END, longitudinalPosition);

        float expandedRadius = envelopeRadius(plumeDistance);
        float exhaustRadius = mix(CROSS_SECTION_EXTENT_X, expandedRadius, expansionStrength)
            * mix(
                EXHAUST_RADIUS_TRANSITION_FACTOR * (CROSS_SECTION_EXTENT_Z + CROSS_SECTION_EXTENT_X)
                    / CROSS_SECTION_EXTENT_X,
                1.0,
                longitudinalDecay
            );
        float corner = exhaustRoundness * CROSS_SECTION_EXTENT_X;
        float signedDistance = mix(
            circleSdf(samplePoint.xz, exhaustRadius) + exhaustRadius,
            roundedRectangleSdf(samplePoint.xz, vec2(CROSS_SECTION_EXTENT_X, CROSS_SECTION_EXTENT_Z), corner)
                + CROSS_SECTION_EXTENT_X,
            longitudinalDecay
        );

        float shapeMask = clamp((exhaustRadius - signedDistance) / DENSITY_EDGE_WIDTH, 0.0, 1.0);
        float sectionArea = mix(
            PI * exhaustRadius * exhaustRadius,
            4.0 * exhaustRadius * (exhaustRadius + float(CROSS_SECTION_EXTENT_Z - CROSS_SECTION_EXTENT_X)),
            longitudinalDecay
        );
        float densityNormalization =
            DENSITY_NORMALIZATION_SCALE * float(CROSS_SECTION_EXTENT_Z * CROSS_SECTION_EXTENT_X)
            / sectionArea;
        float densityAttenuation = endFade * throttle;
        float density = densityNormalization * shapeMask * densityAttenuation;

        vec2 exhaustUv = vec2(plumeDistance, signedDistance);
        vec3 noiseScale = NOISE_SCALE * vec3(
            CROSS_SECTION_EXTENT_X / exhaustRadius,
            NOISE_LONGITUDINAL_SCALE,
            CROSS_SECTION_EXTENT_X / exhaustRadius
        );
        float diamondValue = diamond(exhaustUv);
        float envelopeEdgeValue = envelopeEdgeMask(exhaustUv);

        vec3 flameColor = mix(
            LOW_PRESSURE_BASE_COLOR,
            mix(HIGH_PRESSURE_EDGE_COLOR, HIGH_PRESSURE_CORE_COLOR, envelopeEdgeValue),
            exhaustPressureRatio
        );

        if (signedDistance <= exhaustRadius) {
            float attenuation =
                ATTENUATION_BASE
                + ATTENUATION_NOISE_SCALE
                * noise(samplePoint * noiseScale + elapsedSeconds * vec3(0.0, flowSpeed, 0.0));

            accumulatedColor *= exp(-stepLength * density * EXTINCTION_COEFFICIENT);
            accumulatedColor += flameColor * emissionIntensity * density * stepLength * attenuation;
            accumulatedColor +=
                diamondValue
                * shockStrength
                * emissionIntensity
                * density
                * SHOCK_DIAMOND_EMISSION_SCALE
                * stepLength
                * SHOCK_DIAMOND_COLOR
                * attenuation;

            opticalDepth += stepLength * density * EXTINCTION_COEFFICIENT;
        }
    }

    float transmittance = exp(-opticalDepth);
    float alpha = 1.0 - transmittance;
    gl_FragColor = vec4(accumulatedColor, clamp(alpha, 0.0, 1.0));
}

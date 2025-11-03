use crate::landscape::constant_layers::zero_layer;
use crate::landscape::continent_layer::continent_layer;
use crate::landscape::simplex_noise_layer::simplex_noise_layer;
use crate::landscape::mountain_layer::mountain_layer;
use crate::terrain_settings::TerrainSettings;
use crate::utils::math::{multiply, smoothstep};
use crate::utils::vector3::Vector3;

pub type TerrainFunction = dyn Fn(&Vector3, f32, &mut Vector3, &mut Vector3);

pub fn make_terrain_function(settings: TerrainSettings) -> Box<TerrainFunction> {
    let continents = continent_layer(
        settings.continents_frequency,
        settings.continents_fragmentation,
    );
    let bumps = zero_layer(); //simplex_noise_layer(settings.bumps_frequency, 8, 1.7, 2.0, 1.0);
    let mountains = mountain_layer(settings.mountains_frequency, 7, 2.0, 2.0, 0.4);
    let mountain_mask = simplex_noise_layer(settings.mountains_frequency / 4.0, 1, 2.0, 2.0, 1.0);
    //let terraceMask = simplex_noise_layer(settings.mountainsFrequency / 20, 1, 2, 2, 1.0);

    /*return Box::new(
        move |unit_sample_point: &Vector3,
              seed: f32,
              out_position: &mut Vector3,
              out_gradient: &mut Vector3| {
            let mut gradient = Vector3::zero();
            let mut elevation = mountains(unit_sample_point, seed, &mut gradient);

            elevation *= 40e3;
            gradient *= 40e3;

            *out_position += unit_sample_point * elevation;
            *out_gradient += gradient;
        }
    );*/

    Box::new(
        move |unit_sample_point: &Vector3,
              seed: f32,
              out_position: &mut Vector3,
              out_gradient: &mut Vector3| {
            let mut elevation = 0.0;

            // Continent Generation

            let mut continent_mask_gradient = Vector3::zero();
            let mut continent_mask =
                continents(unit_sample_point, seed, &mut continent_mask_gradient);

            elevation += continent_mask * settings.continent_base_height;
            *out_gradient += &continent_mask_gradient * settings.continent_base_height;

            // Mountain Generation
            continent_mask = smoothstep(0.3, 0.5, continent_mask, &mut continent_mask_gradient);

            let mut mountain_gradient = Vector3::zero();
            let mut mountain_elevation = mountains(unit_sample_point, seed, &mut mountain_gradient);

            mountain_elevation = multiply(
                mountain_elevation,
                continent_mask,
                &mut mountain_gradient,
                &continent_mask_gradient,
            );

            // Mountain Mask
            let mut mountain_mask_gradient = Vector3::zero();
            let mountain_mask = mountain_mask(unit_sample_point, seed, &mut mountain_mask_gradient);

            mountain_elevation = multiply(
                mountain_elevation,
                mountain_mask,
                &mut mountain_gradient,
                &mountain_mask_gradient,
            );

            // Terrace Generation

            // terraces are interesting but require lots of polygons to look good
            /*const terraceGradient = mountain_gradient.clone();
            let terraceElevation = smoothstep(0.51, 0.52, mountain_elevation, terraceGradient);

            const terraceElevationMaskGradient = LVector3.Zero();
            let terraceElevationMask = terraceMask(samplePoint, seed, terraceElevationMaskGradient);
            terraceElevationMask = smoothstep(0.40, 0.41, terraceElevationMask, terraceGradient);

            terraceElevation = multiply(terraceElevation, terraceElevationMask, terraceGradient, terraceElevationMaskGradient);

            mountain_elevation += 0.1 * terraceElevation;
            mountain_gradient.addInPlace(terraceGradient.scaleInPlace(0.1));*/

            elevation += mountain_elevation * settings.max_mountain_height;
            *out_gradient += mountain_gradient * settings.max_mountain_height;

            // Bump Generation

            let mut bumpy_gradient = Vector3::zero();
            let bumpy_elevation = bumps(unit_sample_point, seed, &mut bumpy_gradient);

            elevation += bumpy_elevation * settings.max_bump_height;
            *out_gradient += bumpy_gradient * settings.max_bump_height;

            *out_position += unit_sample_point * elevation;
        },
    )
}

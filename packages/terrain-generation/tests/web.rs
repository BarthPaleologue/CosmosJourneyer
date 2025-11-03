//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

use terrain_generation;

extern crate image;
extern crate wasm_bindgen_test;

use image::{ImageBuffer, Rgb};
use rand::Rng;

use std::fmt;
use terrain_generation::landscape::make_terrain_function::make_terrain_function;
use terrain_generation::landscape::*;
use terrain_generation::terrain_settings::TerrainSettings;
use terrain_generation::utils::vector3::Vector3;
use terrain_generation::utils::*;
use terrain_generation::*;
use wasm_bindgen_test::__rt::log;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[test]
#[wasm_bindgen_test]
fn constant_layers() {
    let value = 0.5;
    let c_layer = constant_layers::constant_layer(value);
    assert_eq!(c_layer(0.0, 0.0, 0.0), value);
    assert_eq!(c_layer(10000.0, -5000.0, 12.0), value);

    let z_layer = constant_layers::zero_layer();
    assert_eq!(z_layer(0.0, 0.0, 0.0), 0.0);
    assert_eq!(z_layer(100.0, 600.0, -73.0), 0.0);

    let o_layer = constant_layers::one_layer();
    assert_eq!(o_layer(0.0, 0.0, 0.0), 1.0);
    assert_eq!(o_layer(-456.0, 5.0, -13.0), 1.0);
}

#[test]
#[wasm_bindgen_test]
fn gcd() {
    assert_eq!(math::gcd(8.0, 12.0), 4.0);
    assert_eq!(math::gcd(54.0, 24.0), 6.0);
}

#[test]
#[wasm_bindgen_test]
fn clamp() {
    assert_eq!(math::clamp(72.0, 0.0, 50.0), 50.0);
    assert_eq!(math::clamp(-13.0, -6.0, 6.0), -6.0);
    assert_eq!(math::clamp(5.6, 0.0, 20.0), 5.6);
}

#[test]
#[wasm_bindgen_test]
fn add_vector() {
    let v1 = Vector3::new(0.5, 12.0, -5.0);
    let v2 = Vector3::new(-0.2, 0.1, -18.0);
    assert!(Vector3::equals(&(v1 + v2), &Vector3::new(0.3, 12.1, -23.0)));
}

#[test]
#[wasm_bindgen_test]
fn dot_vector() {
    let v1 = Vector3::new(0.0, 1.0, 0.0);
    let v2 = Vector3::new(0.0, 0.0, 1.0);
    assert!(Vector3::dot(&v1, &v2) == 0.0);
}

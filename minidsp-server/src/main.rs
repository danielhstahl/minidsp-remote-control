#[macro_use]
extern crate rocket;
mod config;
mod error;
#[cfg(feature = "gpio")]
mod gpio;
#[cfg(feature = "gpio")]
use rppal::gpio::Gpio;
#[cfg(feature = "gpio")]
use rppal::gpio::OutputPin;
mod sslcert;
use crate::config::Config;
use crate::error::AppError;
use rocket::State;
use rocket::response::stream::ReaderStream;
use rocket::serde::{Serialize, json::Json};
use rocket::tokio::fs::File;
#[cfg(feature = "gpio")]
use std::sync::{Arc, Mutex};

struct GpioPin {
    #[cfg(feature = "gpio")]
    pin: Arc<Mutex<OutputPin>>,
    #[allow(dead_code)]
    #[cfg(not(feature = "gpio"))]
    pin: bool,
}

#[derive(Debug, Serialize)]
#[serde(crate = "rocket::serde")]
struct Success {
    success: bool,
}

#[launch]
fn rocket() -> _ {
    let config = match Config::from_env() {
        Ok(c) => c,
        Err(e) => panic!("Failed to load config: {}", e),
    };

    #[allow(unused_mut)]
    let mut base_routes = routes![root_pem, regenerate_cert, expiry];
    #[cfg(feature = "gpio")]
    let mut gpio_routes = routes![set_power, get_power];
    #[cfg(feature = "gpio")]
    base_routes.append(&mut gpio_routes);

    #[cfg(feature = "gpio")]
    let gpio_pin = if let Some(pin_num) = config.relay_pin {
        GpioPin {
            pin: Arc::new(Mutex::new(
                Gpio::new().unwrap().get(pin_num).unwrap().into_output(),
            )),
        }
    } else {
        panic!("Relay pin not configured but gpio feature enabled");
    };

    //hacky, but works...use a dummy GpioPin when not using the Gpio feature
    #[cfg(not(feature = "gpio"))]
    let gpio_pin = GpioPin { pin: false };

    rocket::build()
        .manage(sslcert::SSLPath {
            path: config.ssl_path.clone(),
            domain_name: config.domain.clone(),
        })
        .manage(config)
        .manage(gpio_pin)
        .mount("/api/", base_routes)
}

#[get("/cert")]
async fn root_pem(ssl_path: &State<sslcert::SSLPath>) -> std::io::Result<ReaderStream![File]> {
    let root_pem_path = format!("{}/{}", ssl_path.path, sslcert::ROOT_CA_NAME);
    let file = File::open(root_pem_path).await?;
    Ok(ReaderStream::one(file))
}

#[get("/cert/expiration")]
async fn expiry(ssl_path: &State<sslcert::SSLPath>) -> Result<Json<sslcert::CertExpiry>, AppError> {
    let expiry_date = sslcert::get_certificate_expiry_date_from_file(&ssl_path.path)
        .map_err(|e| AppError::Unknown(e.to_string()))?;
    Ok(Json(sslcert::CertExpiry {
        expiry: expiry_date,
    }))
}

#[post("/cert")]
async fn regenerate_cert(ssl_path: &State<sslcert::SSLPath>) -> Result<Json<Success>, AppError> {
    sslcert::generate_ca_and_entity(&ssl_path.domain_name, &ssl_path.path)
        .map_err(|e| AppError::Unknown(e.to_string()))?;
    #[cfg(target_os = "linux")]
    sslcert::reload_nginx().map_err(|e| AppError::Unknown(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[cfg(feature = "gpio")]
#[get("/power")]
async fn get_power(gpio: &State<GpioPin>) -> Result<Json<gpio::PowerStatus>, AppError> {
    let power_status = {
        let pin = match gpio.pin.lock() {
            Ok(pin) => Ok(pin),
            Err(e) => Err(AppError::Unknown(e.to_string())),
        }?;
        gpio::get_status(&pin)
    };
    Ok(Json(power_status))
}

#[cfg(feature = "gpio")]
#[post("/power/<power>")]
async fn set_power(
    gpio: &State<GpioPin>,
    power: gpio::PowerStatus,
) -> Result<Json<Success>, AppError> {
    let mut pin = match gpio.pin.lock() {
        Ok(pin) => Ok(pin),
        Err(e) => Err(AppError::Unknown(e.to_string())),
    }?;
    match power {
        gpio::PowerStatus::ON => gpio::power_on(&mut pin),
        gpio::PowerStatus::OFF => gpio::power_off(&mut pin),
    };
    Ok(Json(Success { success: true }))
}

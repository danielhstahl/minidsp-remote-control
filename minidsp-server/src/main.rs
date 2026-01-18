#[macro_use]
extern crate rocket;
mod basic_auth;
mod config;
mod db;
mod error;
#[cfg(feature = "gpio")]
mod gpio;
mod ip_auth;
#[cfg(feature = "gpio")]
use rppal::gpio::Gpio;
#[cfg(feature = "gpio")]
use rppal::gpio::OutputPin;
mod sslcert;
use crate::config::Config;
use crate::error::AppError;
#[cfg(feature = "gpio")]
use crate::ip_auth::IpAuth;
use rocket::fairing::{self, AdHoc};
use rocket::response::stream::ReaderStream;
use rocket::serde::{Serialize, json::Json};
use rocket::tokio::fs::File;
use rocket::{Build, Rocket, State};
use rocket_db_pools::Database;
use rocket_db_pools::sqlx;
use std::net::IpAddr;

#[cfg(feature = "gpio")]
use std::sync::{Arc, Mutex};
#[derive(Database)]
#[database("minidsp")]
struct MinidspDb(rocket_db_pools::sqlx::SqlitePool);

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

async fn run_migrations(rocket: Rocket<Build>) -> fairing::Result {
    match MinidspDb::fetch(&rocket) {
        Some(db) => match sqlx::migrate!("db/migrations").run(&**db).await {
            Ok(_) => Ok(rocket),
            Err(e) => {
                error!("Failed to initialize SQLx database: {}", e);
                Err(rocket)
            }
        },
        None => Err(rocket),
    }
}

#[launch]
fn rocket() -> _ {
    let config = match Config::from_env() {
        Ok(c) => c,
        Err(e) => panic!("Failed to load config: {}", e),
    };

    #[allow(unused_mut)]
    let mut base_routes = routes![
        root_pem,
        create_device,
        update_device,
        get_devices,
        regenerate_cert,
        expiry
    ];
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
        .attach(MinidspDb::init())
        .attach(AdHoc::try_on_ignite("DB Migrations", run_migrations))
        .manage(db::Domain {
            domain_name: config.domain.clone(),
        })
        .manage(sslcert::SSLPath {
            path: config.ssl_path.clone(),
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

// this is robust enough for local environments
// with (mostly) trusted users.
// IP spoofing isn't hard but it would require
// some effort to script.
// NOTE that most api calls now bypass this server and
// go directly to the minidsp http endpoint so that IP
// calls are not blocked for a large portion of the app.
#[post("/device", format = "application/json")]
async fn create_device(db: &MinidspDb, client_ip: IpAddr) -> Result<Json<db::Device>, AppError> {
    let user = db::upsert_device(&**db, client_ip.to_string()).await?;
    Ok(Json(user))
}

#[patch("/device", format = "application/json", data = "<device>")]
async fn update_device(
    db: &MinidspDb,
    device: Json<db::Device>,
    _basic: basic_auth::BasicAuth, //only admin can set this
) -> Result<Json<db::Device>, AppError> {
    db::update_device(&**db, &device.device_ip, device.is_allowed).await?;
    Ok(device)
}

#[get("/device", format = "application/json")]
async fn get_devices(
    db: &MinidspDb,
    _basic: basic_auth::BasicAuth, //only admin can get this
) -> Result<Json<Vec<db::Device>>, AppError> {
    let device = db::get_all_devices(&**db).await?;
    Ok(Json(device))
}

#[post("/cert")]
async fn regenerate_cert(
    _basic: basic_auth::BasicAuth, //only admin can set this
    domain: &State<db::Domain>,
    ssl_path: &State<sslcert::SSLPath>,
) -> Result<Json<Success>, AppError> {
    sslcert::generate_ca_and_entity(&domain.domain_name, &ssl_path.path)
        .map_err(|e| AppError::Unknown(e.to_string()))?;
    #[cfg(target_os = "linux")]
    sslcert::reload_nginx().map_err(|e| AppError::Unknown(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[cfg(feature = "gpio")]
#[get("/power")]
async fn get_power(
    _ip_filter: IpAuth,
    gpio: &State<GpioPin>,
) -> Result<Json<gpio::PowerStatus>, AppError> {
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
    _ip_filter: IpAuth,
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

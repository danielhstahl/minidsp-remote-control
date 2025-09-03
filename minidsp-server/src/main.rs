#[macro_use]
extern crate rocket;
mod basic_auth;
mod db;
#[cfg(feature = "gpio")]
mod gpio;
mod ip_auth;
#[cfg(feature = "gpio")]
use rppal::gpio::Gpio;
#[cfg(feature = "gpio")]
use rppal::gpio::OutputPin;
mod minidsp;
mod sslcert;
use crate::ip_auth::IpAuth;
use crate::minidsp::MinidspStatus;
use rocket::fairing::{self, AdHoc};
use rocket::response::status::BadRequest;
use rocket::response::stream::ReaderStream;
use rocket::serde::{Serialize, json::Json};
use rocket::tokio::fs::File;
use rocket::{Build, Rocket, State};
use rocket_db_pools::Database;
use rocket_db_pools::sqlx;
use std::env;
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

const VOLUME_INCREMENT: f32 = 0.5;

async fn run_migrations(rocket: Rocket<Build>) -> fairing::Result {
    match MinidspDb::fetch(&rocket) {
        Some(db) => match sqlx::migrate!("db/migrations").run(&**db).await {
            Ok(_) => {
                /*let domain = rocket.state::<db::Domain>().unwrap();
                db::set_default_settings(&**db, &domain.domain_name)
                    .await
                    .unwrap();*/
                Ok(rocket)
            }
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
    let domain = match env::var("DOMAIN") {
        Ok(v) => db::Domain { domain_name: v },
        Err(_e) => panic!("Env variable DOMAIN needs to be defined!"),
    };

    let ssl_path = match env::var("SSL_PATH") {
        Ok(v) => sslcert::SSLPath { path: v },
        Err(_e) => panic!("Env variable SSL_PATH needs to be defined!"),
    };
    #[allow(unused_mut)]
    let mut base_routes = routes![
        root_pem,
        create_device,
        update_device,
        get_devices,
        regenerate_cert,
        get_status,
        set_volume,
        set_volume_up,
        set_volume_down,
        set_preset,
        set_source,
        expiry
    ];
    #[cfg(feature = "gpio")]
    let mut gpio_routes = routes![set_power_anon, set_power_user];
    #[cfg(feature = "gpio")]
    base_routes.append(&mut gpio_routes);

    #[cfg(feature = "gpio")]
    let relay_pin_str = match env::var("RELAY_PIN") {
        Ok(v) => v,
        Err(_e) => panic!("Env variable RELAY_PIN needs to be defined if using Gpio!"),
    };

    #[cfg(feature = "gpio")]
    let relay_pin = match relay_pin_str.parse::<u8>() {
        Ok(v) => v,
        Err(_e) => panic!("RELAY_PIN needs to be parseable to u8!"),
    };
    #[cfg(feature = "gpio")]
    let gpio_pin = GpioPin {
        pin: Arc::new(Mutex::new(
            Gpio::new().unwrap().get(relay_pin).unwrap().into_output(),
        )),
    };
    //hacky, but works...use a dummy GpioPin when not using the Gpio feature
    #[cfg(not(feature = "gpio"))]
    let gpio_pin = GpioPin { pin: false };
    rocket::build()
        .attach(MinidspDb::init())
        .attach(AdHoc::try_on_ignite("DB Migrations", run_migrations))
        .manage(domain)
        .manage(ssl_path)
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
async fn expiry(
    ssl_path: &State<sslcert::SSLPath>,
) -> Result<Json<sslcert::CertExpiry>, BadRequest<String>> {
    let expiry_date = sslcert::get_certificate_expiry_date_from_file(&ssl_path.path)
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(sslcert::CertExpiry {
        expiry: expiry_date,
    }))
}

// this is robust enough for local environments
// with mostly trusted users.
// IP spoofing isn't hard but it would require
// some effort to script.
#[post("/device", format = "application/json")]
async fn create_device(
    db: &MinidspDb,
    client_ip: IpAddr,
) -> Result<Json<db::Device>, BadRequest<String>> {
    let user = db::upsert_device(&**db, client_ip.to_string())
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(user))
}

#[patch("/device", format = "application/json", data = "<device>")]
async fn update_device(
    db: &MinidspDb,
    device: Json<db::Device>,
    _basic: basic_auth::BasicAuth, //only admin can set this
) -> Result<Json<db::Device>, BadRequest<String>> {
    db::update_device(&**db, &device.device_ip, device.is_allowed)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(device)
}

#[get("/device", format = "application/json")]
async fn get_devices(
    db: &MinidspDb,
    _basic: basic_auth::BasicAuth, //only admin can get this
) -> Result<Json<Vec<db::Device>>, BadRequest<String>> {
    let device = db::get_all_devices(&**db)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(device))
}

#[post("/cert")]
async fn regenerate_cert(
    _basic: basic_auth::BasicAuth, //only admin can set this
    domain: &State<db::Domain>,
    ssl_path: &State<sslcert::SSLPath>,
) -> Result<Json<Success>, BadRequest<String>> {
    sslcert::generate_ca_and_entity(&domain.domain_name, &ssl_path.path)
        .map_err(|e| BadRequest(e.to_string()))?;
    #[cfg(target_os = "linux")]
    sslcert::reload_nginx().map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[cfg(feature = "gpio")]
#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct FullStatus {
    #[serde(flatten)]
    minidsp_status: MinidspStatus,
    power: gpio::PowerStatus,
}

#[cfg(feature = "gpio")]
#[get("/status")]
async fn get_status(
    _ip_filter: IpAuth,
    gpio: &State<GpioPin>,
) -> Result<Json<FullStatus>, BadRequest<String>> {
    let pin = match gpio.pin.lock() {
        Ok(pin) => Ok(pin),
        Err(e) => Err(BadRequest(e.to_string())),
    }?;
    let power_status = gpio::get_status(&pin);
    drop(pin);
    let minidsp_status = minidsp::get_minidsp_status().map_err(|e| BadRequest(e.to_string()))?;

    Ok(Json(FullStatus {
        minidsp_status,
        power: power_status,
    }))
}

#[cfg(not(feature = "gpio"))]
#[get("/status")]
async fn get_status(_ip_filter: IpAuth) -> Result<Json<MinidspStatus>, BadRequest<String>> {
    let minidsp_status = minidsp::get_minidsp_status().map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(minidsp_status))
}

#[post("/volume/up")]
async fn set_volume_up(_ip_filter: IpAuth) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/volume/down")]
async fn set_volume_down(_ip_filter: IpAuth) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(-VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/volume/<volume>", rank = 2)]
async fn set_volume(_ip_filter: IpAuth, volume: f32) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_vol(volume).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/preset/<preset>")]
async fn set_preset(_ip_filter: IpAuth, preset: &str) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_preset(preset).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/source/<source>")]
async fn set_source(_ip_filter: IpAuth, source: &str) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_source(source).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[cfg(feature = "gpio")]
#[post("/power/<power>")]
async fn set_power(
    _ip_filter: IpAuth,
    gpio: &State<GpioPin>,
    power: gpio::PowerStatus,
) -> Result<Json<Success>, BadRequest<String>> {
    let mut pin = match gpio.pin.lock() {
        Ok(pin) => Ok(pin),
        Err(e) => Err(BadRequest(e.to_string())),
    }?;
    match power {
        gpio::PowerStatus::ON => gpio::power_on(&mut pin),
        gpio::PowerStatus::OFF => gpio::power_off(&mut pin),
    };
    Ok(Json(Success { success: true }))
}

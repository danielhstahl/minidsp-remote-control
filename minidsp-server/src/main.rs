#[macro_use]
extern crate rocket;
mod anonymous;
mod basic;
mod db;
#[cfg(feature = "gpio")]
mod gpio;
#[cfg(feature = "gpio")]
use rppal::gpio::Gpio;
#[cfg(feature = "gpio")]
use rppal::gpio::OutputPin;
mod jwt;
mod minidsp;
mod sslcert;
use crate::anonymous::Anonymous;
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
                let domain = rocket.state::<db::Domain>().unwrap();
                db::set_default_settings(&**db, &domain.domain_name)
                    .await
                    .unwrap();
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
        auth_settings,
        update_settings_anon,
        update_settings_user,
        update_settings_basic,
        update_user_anon,
        update_user_user,
        create_user_anon,
        create_user_user,
        regenerate_cert_anon,
        regenerate_cert_user,
        get_status_anon,
        get_status_user,
        set_volume_anon,
        set_volume_user,
        set_volume_up_anon,
        set_volume_up_user,
        set_volume_down_anon,
        set_volume_down_user,
        set_preset_anon,
        set_preset_user,
        set_source_anon,
        set_source_user,
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

#[get("/auth/settings")]
async fn auth_settings(
    db: &MinidspDb,
    domain: &State<db::Domain>,
) -> Result<Json<db::Settings>, BadRequest<String>> {
    let settings = db::get_settings(&**db, &domain.domain_name)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(settings))
}

#[post("/auth/settings", format = "application/json", data = "<settings>")]
async fn update_settings_anon(
    db: &MinidspDb,
    settings: Json<db::ClientSettings>,
    domain: &State<db::Domain>,
    _anon: Anonymous,
) -> Result<Json<db::Settings>, BadRequest<String>> {
    let settings = db::update_settings(&**db, settings.require_auth, &domain.domain_name)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(settings))
}
#[post(
    "/auth/settings",
    rank = 2,
    format = "application/json",
    data = "<settings>"
)]
async fn update_settings_user(
    db: &MinidspDb,
    settings: Json<db::ClientSettings>,
    domain: &State<db::Domain>,
    _user: jwt::User,
) -> Result<Json<db::Settings>, BadRequest<String>> {
    let settings = db::update_settings(&**db, settings.require_auth, &domain.domain_name)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(settings))
}
#[post(
    "/auth/settings",
    rank = 3,
    format = "application/json",
    data = "<settings>"
)]
async fn update_settings_basic(
    db: &MinidspDb,
    settings: Json<db::ClientSettings>,
    domain: &State<db::Domain>,
    _basic: basic::Basic,
) -> Result<Json<db::Settings>, BadRequest<String>> {
    let settings = db::update_settings(&**db, settings.require_auth, &domain.domain_name)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(settings))
}

#[post("/user", format = "application/json", data = "<user>")]
async fn create_user_anon(
    db: &MinidspDb,
    user: Json<db::UserPublicKey>,
    _anon: Anonymous,
) -> Result<Json<db::DbUser>, BadRequest<String>> {
    let public_key = user.into_inner().public_key;
    let user = db::create_user(&**db, public_key)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(user))
}
#[post("/api/user", rank = 2, format = "application/json", data = "<user>")]
async fn create_user_user(
    db: &MinidspDb,
    user: Json<db::UserPublicKey>,
    _user: jwt::User,
) -> Result<Json<db::DbUser>, BadRequest<String>> {
    let public_key = user.into_inner().public_key;
    let user = db::create_user(&**db, public_key)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(user))
}

#[patch("/user/<user_id>", format = "application/json", data = "<user>")]
async fn update_user_anon(
    db: &MinidspDb,
    user_id: i64,
    user: Json<db::UserPublicKey>,
    _anon: Anonymous,
) -> Result<Json<db::DbUser>, BadRequest<String>> {
    let public_key = user.into_inner().public_key;
    let user = db::update_user(&**db, user_id, public_key)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(user))
}
#[patch(
    "/user/<user_id>",
    rank = 2,
    format = "application/json",
    data = "<user>"
)]
async fn update_user_user(
    db: &MinidspDb,
    user_id: i64,
    user: Json<db::UserPublicKey>,
    _user: jwt::User,
) -> Result<Json<db::DbUser>, BadRequest<String>> {
    let public_key = user.into_inner().public_key;
    let user = db::update_user(&**db, user_id, public_key)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(user))
}

#[post("/cert")]
async fn regenerate_cert_anon(
    _anon: anonymous::Anonymous,
    domain: &State<db::Domain>,
    ssl_path: &State<sslcert::SSLPath>,
) -> Result<Json<Success>, BadRequest<String>> {
    sslcert::generate_ca_and_entity(&domain.domain_name, &ssl_path.path)
        .map_err(|e| BadRequest(e.to_string()))?;
    #[cfg(target_os = "linux")]
    sslcert::reload_nginx().map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[post("/cert", rank = 2)]
async fn regenerate_cert_user(
    _user: jwt::User,
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
async fn get_status_anon(
    _anon: anonymous::Anonymous,
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
#[cfg(feature = "gpio")]
#[get("/status", rank = 2)]
async fn get_status_user(
    _user: jwt::User,
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
async fn get_status_anon(
    _anon: anonymous::Anonymous,
) -> Result<Json<MinidspStatus>, BadRequest<String>> {
    let minidsp_status = minidsp::get_minidsp_status().map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(minidsp_status))
}
#[cfg(not(feature = "gpio"))]
#[get("/status", rank = 2)]
async fn get_status_user(_user: jwt::User) -> Result<Json<MinidspStatus>, BadRequest<String>> {
    let minidsp_status = minidsp::get_minidsp_status().map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(minidsp_status))
}

#[post("/volume/up")]
async fn set_volume_up_anon(
    _anon: anonymous::Anonymous,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[post("/volume/up", rank = 2)]
async fn set_volume_up_user(_user: jwt::User) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/volume/down")]
async fn set_volume_down_anon(
    _anon: anonymous::Anonymous,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(-VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[post("/volume/down", rank = 2)]
async fn set_volume_down_user(_user: jwt::User) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(-VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/volume/<volume>", rank = 3)]
async fn set_volume_anon(
    _anon: anonymous::Anonymous,
    volume: f32,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_vol(volume).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[post("/volume/<volume>", rank = 4)]
async fn set_volume_user(
    _user: jwt::User,
    volume: f32,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_vol(volume).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/preset/<preset>")]
async fn set_preset_anon(
    _anon: anonymous::Anonymous,
    preset: u8,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_preset(preset).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[post("/preset/<preset>", rank = 2)]
async fn set_preset_user(
    _user: jwt::User,
    preset: u8,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_preset(preset).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/source/<source>")]
async fn set_source_anon(
    _anon: anonymous::Anonymous,
    source: &str,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_source(source).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[post("/source/<source>", rank = 2)]
async fn set_source_user(
    _user: jwt::User,
    source: &str,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_source(source).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[cfg(feature = "gpio")]
#[post("/power/<power>")]
async fn set_power_anon(
    _anon: anonymous::Anonymous,
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
#[cfg(feature = "gpio")]
#[post("/power/<power>", rank = 2)]
async fn set_power_user(
    _user: jwt::User,
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

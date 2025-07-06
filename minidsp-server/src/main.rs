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
use crate::db::{DbUser, Settings};
use crate::minidsp::MinidspStatus;
use rocket::fairing::{self, AdHoc};
use rocket::response::status::BadRequest;
use rocket::response::stream::ReaderStream;
use rocket::serde::{Serialize, json, json::Json};
use rocket::tokio::fs::File;
use rocket::{Build, Rocket, State};
use rocket_db_pools::sqlx;
use rocket_db_pools::{Connection, Database};
use std::env;

#[cfg(feature = "gpio")]
use std::sync::{Arc, Mutex};
#[derive(Database)]
#[database("minidsp")]
struct MinidspDb(rocket_db_pools::sqlx::SqlitePool);

#[cfg(feature = "gpio")]
struct GpioPin {
    pin: Arc<Mutex<OutputPin>>,
}

struct Domain {
    domain_name: String,
}

#[derive(Debug, Serialize)]
#[serde(crate = "rocket::serde")]
struct Success {
    success: bool,
}

const ROOT_PEM_PATH: &'static str = "/home/minidsp/ssl/rootCA.pem";
const VOLUME_INCREMENT: f32 = 0.5;

async fn run_migrations(rocket: Rocket<Build>) -> fairing::Result {
    match MinidspDb::fetch(&rocket) {
        Some(db) => match sqlx::migrate!("./migrations").run(&**db).await {
            Ok(_) => {
                db::set_default_settings(&**db).await.unwrap();
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
        Ok(v) => Domain { domain_name: v },
        Err(_e) => panic!("Env variable DOMAIN needs to be defined!"),
    };

    let rocket_build = rocket::build()
        .attach(MinidspDb::init())
        .attach(AdHoc::try_on_ignite("DB Migrations", run_migrations))
        .manage(domain)
        .mount(
            "/",
            routes![
                index,
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
                set_volume_up_anon,
                set_volume_up_user,
                set_volume_down_anon,
                set_volume_down_user,
                set_preset_anon,
                set_preset_user,
                set_source_anon,
                set_source_user,
            ],
        );

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
    rocket_build.manage(GpioPin {
        pin: Arc::new(Mutex::new(Gpio::new()?.get(relay_pin)?.into_output())),
    });
    #[cfg(feature = "gpio")]
    rocket_build.mount("/", routes![set_power_anon, set_power_user]);

    rocket_build
}

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[get("/api/cert")]
async fn root_pem() -> std::io::Result<ReaderStream![File]> {
    let file = File::open(ROOT_PEM_PATH).await?;
    Ok(ReaderStream::one(file))
}

#[get("/api/auth/settings")]
async fn auth_settings(db: &MinidspDb) -> Result<Json<db::Settings>, BadRequest<String>> {
    //need to get expiry as well somehow
    let settings = db::get_settings(&**db)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(settings))
}

#[post("/api/auth/settings", format = "application/json", data = "<settings>")]
async fn update_settings_anon(
    db: &MinidspDb,
    settings: Json<db::Settings>,
    _anon: Anonymous,
) -> Result<Json<db::Settings>, BadRequest<String>> {
    let settings = db::update_settings(&**db, settings.require_auth)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(settings))
}
#[post(
    "/api/auth/settings",
    rank = 2,
    format = "application/json",
    data = "<settings>"
)]
async fn update_settings_user(
    db: &MinidspDb,
    settings: Json<db::Settings>,
    _user: jwt::User,
) -> Result<Json<db::Settings>, BadRequest<String>> {
    let settings = db::update_settings(&**db, settings.require_auth)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(settings))
}
#[post(
    "/api/auth/settings",
    rank = 3,
    format = "application/json",
    data = "<settings>"
)]
async fn update_settings_basic(
    db: &MinidspDb,
    settings: Json<db::Settings>,
    _basic: basic::Basic,
) -> Result<Json<db::Settings>, BadRequest<String>> {
    let settings = db::update_settings(&**db, settings.require_auth)
        .await
        .map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(settings))
}

#[post("/api/user", format = "application/json", data = "<user>")]
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

#[patch("/api/user/<user_id>", format = "application/json", data = "<user>")]
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
    "/api/user/<user_id>",
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

#[post("/api/cert")]
async fn regenerate_cert_anon(
    _anon: anonymous::Anonymous,
    domain: &State<Domain>,
) -> Result<Json<Success>, BadRequest<String>> {
    sslcert::generate_ca_and_entity(&domain.domain_name).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[post("/api/cert", rank = 2)]
async fn regenerate_cert_user(
    _user: jwt::User,
    domain: &State<Domain>,
) -> Result<Json<Success>, BadRequest<String>> {
    sslcert::generate_ca_and_entity(&domain.domain_name).map_err(|e| BadRequest(e.to_string()))?;
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
#[post("/api/status")]
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
#[get("/api/status", rank = 2)]
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
#[post("/api/status")]
async fn get_status_anon(
    _anon: anonymous::Anonymous,
) -> Result<Json<MinidspStatus>, BadRequest<String>> {
    let minidsp_status = minidsp::get_minidsp_status().map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(minidsp_status))
}
#[cfg(not(feature = "gpio"))]
#[get("/api/status", rank = 2)]
async fn get_status_user(_user: jwt::User) -> Result<Json<MinidspStatus>, BadRequest<String>> {
    let minidsp_status = minidsp::get_minidsp_status().map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(minidsp_status))
}

#[post("/api/volume/up")]
async fn set_volume_up_anon(
    _anon: anonymous::Anonymous,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[get("/api/volume/up", rank = 2)]
async fn set_volume_up_user(_user: jwt::User) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/api/volume/down")]
async fn set_volume_down_anon(
    _anon: anonymous::Anonymous,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(-VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[get("/api/volume/down", rank = 2)]
async fn set_volume_down_user(_user: jwt::User) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::increment_minidsp_vol(-VOLUME_INCREMENT).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/api/preset/<preset>")]
async fn set_preset_anon(
    _anon: anonymous::Anonymous,
    preset: u8,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_preset(preset).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[get("/api/preset/<preset>", rank = 2)]
async fn set_preset_user(
    _user: jwt::User,
    preset: u8,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_preset(preset).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[post("/api/source/<source>")]
async fn set_source_anon(
    _anon: anonymous::Anonymous,
    source: &str,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_source(source).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}
#[get("/api/source/<source>", rank = 2)]
async fn set_source_user(
    _user: jwt::User,
    source: &str,
) -> Result<Json<Success>, BadRequest<String>> {
    minidsp::set_minidsp_source(source).map_err(|e| BadRequest(e.to_string()))?;
    Ok(Json(Success { success: true }))
}

#[cfg(feature = "gpio")]
#[post("/api/power/<power>")]
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
#[get("/api/power/<power>", rank = 2)]
async fn set_power_user(
    _user: jwt::User,
    gpio: &State<Gpio>,
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

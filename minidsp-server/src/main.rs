#[macro_use]
extern crate rocket;
mod anonymous;
mod basic;
mod db;
mod jwt;
mod sslcert;
use rocket::fairing::{self, AdHoc};
use rocket::response::status::BadRequest;
use rocket::response::stream::ReaderStream;
use rocket::serde::{Serialize, json, json::Json};
use rocket::tokio::fs::File;
use rocket::{Build, Rocket, State};
use rocket_db_pools::sqlx;
use rocket_db_pools::{Connection, Database};

use crate::anonymous::Anonymous;
use crate::db::{DbUser, Settings};
#[derive(Database)]
#[database("minidsp")]
struct MinidspDb(rocket_db_pools::sqlx::SqlitePool);
const ROOT_PEM_PATH: &'static str = "/home/minidsp/ssl/rootCA.pem";
const VOLUME_INCREMENT: f32 = 0.5;

async fn run_migrations(rocket: Rocket<Build>) -> fairing::Result {
    match MinidspDb::fetch(&rocket) {
        Some(db) => match sqlx::migrate!("./migrations").run(&**db).await {
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
    sslcert::generate_ca_and_entity("hello.world");
    rocket::build()
        .attach(MinidspDb::init())
        .attach(AdHoc::try_on_ignite("DB Migrations", run_migrations))
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
                regenerate_cert_user
            ],
        )
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
async fn regenerate_cert_anon(_anon: anonymous::Anonymous) -> Result<(), BadRequest<String>> {
    sslcert::generate_ca_and_entity("raspberrypi.local").map_err(|e| BadRequest(e.to_string()))?;
    Ok(())
}
#[post("/api/cert", rank = 2)]
async fn regenerate_cert_user(_user: jwt::User) -> Result<(), BadRequest<String>> {
    sslcert::generate_ca_and_entity("raspberrypi.local").map_err(|e| BadRequest(e.to_string()))?;
    Ok(())
}

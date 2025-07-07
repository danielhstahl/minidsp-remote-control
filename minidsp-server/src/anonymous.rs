use crate::MinidspDb;
use crate::db::get_settings;
use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};

/// A simple user struct that will be extracted by our request guard.
/// This represents the authenticated user's identity derived from the JWT
#[derive(Debug)]
pub struct Anonymous {}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Anonymous {
    type Error = (); // We'll handle specific errors internally or return a generic unit type.

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        //get public key from database to compare/validate JWT
        let db = match req.rocket().state::<MinidspDb>() {
            Some(db) => db,
            None => {
                return Outcome::Error((Status::Unauthorized, ()));
            }
        };

        let settings = match get_settings(&db).await {
            Ok(settings) => settings,
            Err(_e) => {
                return Outcome::Error((Status::Unauthorized, ()));
            }
        };

        //only "pass" if auth isn't required
        if !settings.require_auth {
            return Outcome::Success(Anonymous {});
        }

        Outcome::Error((Status::Unauthorized, ()))
    }
}

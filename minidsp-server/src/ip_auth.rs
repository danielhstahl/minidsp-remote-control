use crate::MinidspDb;
use crate::db::get_device;
use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};

/// A simple user struct that will be extracted by our request guard.
/// This represents the authenticated user's identity derived from the JWT
#[derive(Debug)]
pub struct IpAuth {}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for IpAuth {
    type Error = (); // We'll handle specific errors internally or return a generic unit type.

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let db = match req.rocket().state::<MinidspDb>() {
            Some(db) => db,
            None => {
                return Outcome::Error((Status::Unauthorized, ()));
            }
        };

        let device_ip = match req.client_ip() {
            Some(ip) => ip,
            None => {
                return Outcome::Error((Status::Unauthorized, ()));
            }
        };

        let device = match get_device(&db, &device_ip.to_string()).await {
            Ok(dev) => dev,
            Err(_e) => {
                return Outcome::Error((Status::Unauthorized, ()));
            }
        };

        let device = match device {
            Some(dev) => dev,
            None => {
                return Outcome::Error((Status::Unauthorized, ()));
            }
        };

        if device.is_allowed {
            return Outcome::Success(IpAuth {});
        }
        Outcome::Forward(Status::Unauthorized)
    }
}

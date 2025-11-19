use base64::engine::Engine as _;
use base64::engine::general_purpose::STANDARD as BASE64;
use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use rocket::request::{FromRequest, Outcome, Request};
use std::fmt;
#[derive(Debug)]
pub struct BasicAuth {}
fn basic_auth(auth_header: &str, compare_string: &str) -> Result<(), BasicAuthError> {
    let token = if auth_header.starts_with("Basic ") {
        &auth_header[6..] // Skip "Basic " prefix
    } else {
        return Err(BasicAuthError {
            msg: "Invalid Authorization".to_string(),
        });
    };
    let decoded_token = match BASE64.decode(token) {
        Ok(detok) => Ok(detok),
        Err(_e) => Err(BasicAuthError {
            msg: "Invalid Token".to_string(),
        }),
    }?;
    let mut full_compare_string = ":".to_string();
    full_compare_string.push_str(compare_string);
    if decoded_token == full_compare_string.as_bytes() {
        return Ok(());
    }
    Err(BasicAuthError {
        msg: "Invalid Token".to_string(),
    })
}
use crate::config::Config;

#[rocket::async_trait]
impl<'r> FromRequest<'r> for BasicAuth {
    type Error = (); // We'll handle specific errors internally or return a generic unit type.

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let auth_header = match req.headers().get_one("Authorization") {
            Some(header) => header,
            None => {
                // No Authorization header, so no token provided.
                return Outcome::Error((Status::Unauthorized, ()));
            }
        };
        
        let config = match req.rocket().state::<Config>() {
            Some(c) => c,
            None => return Outcome::Error((Status::InternalServerError, ())),
        };

        match basic_auth(auth_header, &config.compare_string) {
            Ok(()) => Outcome::Success(BasicAuth {}),
            Err(_e) => Outcome::Error((Status::Unauthorized, ())),
        }
    }
}

#[derive(Debug)]
struct BasicAuthError {
    msg: String,
}
impl fmt::Display for BasicAuthError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.msg)
    }
}
impl std::error::Error for BasicAuthError {}

#[cfg(test)]
mod tests {
    use super::basic_auth;
    use base64::engine::Engine as _;
    use base64::engine::general_purpose::STANDARD as BASE64;

    #[test]
    fn it_returns_err_if_header_does_not_start_with_basic() {
        let result = basic_auth("hello", "goodbye");
        assert!(result.is_err());
    }
    #[test]
    fn it_returns_err_if_header_does_not_match() {
        let header = format!("Basic {}", BASE64.encode(":notmymatchstring"));
        let match_string = "mymatchstring";
        let result = basic_auth(&header, match_string);
        assert!(result.is_err());
    }
    #[test]
    fn it_returns_ok_if_match() {
        let header = format!("Basic {}", BASE64.encode(":mymatchstring"));
        let match_string = "mymatchstring";
        let result = basic_auth(&header, match_string);
        assert!(result.is_ok());
    }
}

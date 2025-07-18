use crate::MinidspDb;
use crate::db::{Domain, get_user};
use base64::engine::Engine as _;
use base64::engine::general_purpose::STANDARD as BASE64;
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use rocket::serde::{Deserialize, Serialize};
use std::fmt;
#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Claims {
    pub sub: String, // Subject (typically the user ID)
    pub exp: i64,    // Expiration time (as Unix timestamp)
    pub iat: i64,    // Issued at (as Unix timestamp)
    pub aud: String, // Audience (e.g., the name of this resource server)
    pub iss: String, // Issuer (the URL of your Authorization Server)
    // Add any other custom claims here, e.g., roles: Vec<String>
    pub roles: Vec<String>, //likely optional, I don't need rols
}

/// A simple user struct that will be extracted by our request guard.
/// This represents the authenticated user's identity derived from the JWT
#[derive(Debug)]
pub struct User {
    #[allow(dead_code)]
    pub id: String,
    #[allow(dead_code)]
    pub roles: Vec<String>, //likely optional, I don't need rols
}

fn jwt_auth(
    auth_header: &str,
    public_key: &[u8],
    validate_exp: bool,
    audience: &str,
) -> Result<User, JwtAuthError> {
    let token = if auth_header.starts_with("Bearer ") {
        &auth_header[7..] // Skip "Bearer " prefix
    } else {
        // Invalid Authorization header format.
        return Err(JwtAuthError {
            msg: "Header does not start with Bearer".to_string(),
        });
    };
    let decoding_key = match DecodingKey::from_rsa_pem(public_key) {
        Ok(key) => key,
        Err(_e) => {
            return Err(JwtAuthError {
                msg: "JWT not decoded".to_string(),
            });
        }
    };

    let mut validation = Validation::new(Algorithm::RS256); // Use the algorithm your Auth Server uses
    validation.validate_exp = validate_exp; // Ensure token hasn't expired
    validation.leeway = 60; // Allow 60 seconds leeway for clock skew
    validation.set_audience(&[audience]);
    // Decode and verify the JWT.
    match decode::<Claims>(token, &decoding_key, &validation) {
        Ok(token_data) => {
            // JWT is valid. Extract claims and create a User instance.
            let claims = token_data.claims;
            Ok(User {
                id: claims.sub,
                roles: claims.roles, //or just Vec![]
            })
        }
        Err(_e) => Err(JwtAuthError {
            msg: "JWT not validated".to_string(),
        }),
    }
}

async fn extract_public_key(req: &Request<'_>) -> Result<Vec<u8>, JwtAuthError> {
    //get public key from database to compare/validate JWT
    let db = req.rocket().state::<MinidspDb>().ok_or(JwtAuthError {
        msg: "DB not available".to_string(),
    })?;
    let user_id_header = req.headers().get_one("x-user-id").ok_or(JwtAuthError {
        msg: "x-user-id not a header".to_string(),
    })?;

    let user_id = user_id_header.parse::<i64>().map_err(|_| JwtAuthError {
        msg: "user_id is not an int".to_string(),
    })?;
    let db_user = get_user(db, user_id).await.map_err(|_| JwtAuthError {
        msg: "user not in database".to_string(),
    })?;
    let public_key = match BASE64.decode(db_user.public_key) {
        Ok(key) => Ok(key),
        Err(_e) => Err(JwtAuthError {
            msg: "Invalid Key".to_string(),
        }),
    }?;
    Ok(public_key)
}
/// Rocket Request Guard for JWT authentication.
/// This guard will extract the JWT from the Authorization header,
/// decode it, verify its signature and claims, and if valid,
/// provide a `User` instance to the route handler.
#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = (); // We'll handle specific errors internally or return a generic unit type.

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let public_key = match extract_public_key(req).await {
            Ok(key) => key,
            Err(_e) => {
                return Outcome::Forward(Status::Unauthorized);
            }
        };

        let auth_header = match req.headers().get_one("Authorization") {
            Some(header) => header,
            None => {
                // No Authorization header, so no token provided.
                return Outcome::Forward(Status::Unauthorized);
            }
        };

        let audience = match req.rocket().state::<Domain>() {
            Some(domain) => format!("https://{}", &domain.domain_name),
            None => {
                return Outcome::Forward(Status::Unauthorized);
            }
        };
        match jwt_auth(auth_header, &public_key, true, &audience) {
            Ok(user) => Outcome::Success(user),
            Err(_e) => Outcome::Forward(Status::Unauthorized),
        }
    }
}

#[derive(Debug)]
struct JwtAuthError {
    msg: String,
}
impl fmt::Display for JwtAuthError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.msg)
    }
}
impl std::error::Error for JwtAuthError {}

#[cfg(test)]
mod tests {
    use super::jwt_auth;
    use base64::engine::Engine as _;
    use base64::engine::general_purpose::STANDARD as BASE64;
    #[test]
    fn it_returns_err_if_header_does_not_start_with_basic() {
        let public_key = BASE64
            .decode(BASE64.encode(
                r#"
Goodbye
        "#,
            ))
            .unwrap();
        let result = jwt_auth("hello", &public_key, false, "someidentity");
        assert!(result.is_err());
    }
    #[test]
    fn it_returns_err_if_header_does_not_match() {
        let public_key = BASE64
            .decode(BASE64.encode(
                r#"
Goodbye
        "#,
            ))
            .unwrap();
        let result = jwt_auth(
            "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9",
            &public_key,
            false,
            "someidentity",
        );
        assert!(result.is_err());
    }
    #[test]
    fn authorizes_with_valid_jwt() {
        let public_key = BASE64
            .decode(BASE64.encode(
                r#"
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8BJqygitI042dulB5ABY
vvQzFbA078pjJhl/0MQZTZcXGrPT5KYbtH2wpJKbzg9MocyUO5grmXOfIUGcIbYE
6+szyEviXgsN9r03wQczsY/PcytvJXpACx4n+FQ+TQAea6la/GzWBeD6dsl47yj1
2x5MG0Sm2MGPY07D5wiVNj3EHTwCFuE+MJkAHqCn0Kcp3ECaitatGOoU4X/jbjnl
S3D4/0WXWGALlLx7ayCCaypAXxRLgU+Wsf/0ENhvwR03SPYIA8nnRWvDgbL5U8/v
8DWaCxqe3DTs7jdVav2HfwS+XPD8UWSmEbDSYmrgQ2y31/rh+Z1WSwxnv/+kEFja
uQIDAQAB
-----END PUBLIC KEY-----
        "#,
            ))
            .unwrap();
        let jwt_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqc191c2VyXzQ1NiIsImV4cCI6MTc1MTczMTg1NywiaWF0IjoxNzUxNzMwOTU3LCJhdWQiOiJodHRwczovL3lvdXIucmVzb3VyY2Uuc2VydmVyLmNvbSIsImlzcyI6Imh0dHBzOi8veW91ci5hdXRoLnNlcnZlci5jb20iLCJyb2xlcyI6WyJ2aWV3ZXIiLCJhbmFseXN0Il19.6FixYb1T0ywOF6360cXQX8QR7LFotJoy9I6115ZZz5G3n8pU114VYovaV2BbVECF9DbuNZq5UiXd7p42C4eU35j9319ZQa3ARUU78hUSPd3L962uB5aIgRgFrLP4tYvZJBPN9ySCo07lCR4I_YX86kyirJuxJYVbGVPtfMlFLGSs14IdJnTY0DU1imSfOg8MKwRMMQ40oIQKckApnS5xFAzdAErwMBdU5FrbF5MzKD0vfpx6m-Rc0z5aSAT9paB9HkhHtEdC-yiq50mQEqGGB6rvJhlqAioDYOQbP8A-fanJ6lVTpEdOOI14J5SOM5tVIGmt5G6EJr9GvtbINd55ug";
        let auth_header = format!("Bearer {}", jwt_token);
        assert!(
            jwt_auth(
                &auth_header,
                &public_key,
                false, //ignore expiry for unit testing purposes
                "https://your.resource.server.com"
            )
            .is_ok()
        );
    }
}

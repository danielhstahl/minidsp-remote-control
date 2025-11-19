use rocket::http::Status;
use rocket::response::{self, Responder};
use rocket::{Request, Response};
use serde::Serialize;
use std::io::Cursor;

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rocket_db_pools::sqlx::Error),

    #[error("MiniDSP error: {0}")]
    MiniDsp(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

impl<'r> Responder<'r, 'static> for AppError {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        let status = match self {
            AppError::Database(_) => Status::InternalServerError,
            AppError::MiniDsp(_) => Status::InternalServerError,
            AppError::Io(_) => Status::InternalServerError,
            AppError::Config(_) => Status::InternalServerError,
            AppError::Unknown(_) => Status::InternalServerError,
        };

        let body = serde_json::to_string(&ErrorResponse {
            error: self.to_string(),
        })
        .unwrap_or_default();

        Response::build()
            .status(status)
            .header(rocket::http::ContentType::JSON)
            .sized_body(body.len(), Cursor::new(body))
            .ok()
    }
}

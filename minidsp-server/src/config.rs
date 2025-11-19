use std::env;
use crate::error::AppError;

#[derive(Debug, Clone)]
pub struct Config {
    pub domain: String,
    pub ssl_path: String,
    pub relay_pin: Option<u8>,
    pub compare_string: String,
}

impl Config {
    pub fn from_env() -> Result<Self, AppError> {
        let domain = env::var("DOMAIN")
            .map_err(|_| AppError::Config("Env variable DOMAIN needs to be defined!".to_string()))?;
        
        let ssl_path = env::var("SSL_PATH")
            .map_err(|_| AppError::Config("Env variable SSL_PATH needs to be defined!".to_string()))?;
        
        let compare_string = env::var("COMPARE_STRING")
            .map_err(|_| AppError::Config("Env variable COMPARE_STRING needs to be defined!".to_string()))?;

        let relay_pin = if cfg!(feature = "gpio") {
            let pin_str = env::var("RELAY_PIN")
                .map_err(|_| AppError::Config("Env variable RELAY_PIN needs to be defined if using Gpio!".to_string()))?;
            Some(pin_str.parse::<u8>()
                .map_err(|_| AppError::Config("RELAY_PIN needs to be parseable to u8!".to_string()))?)
        } else {
            None
        };

        Ok(Config {
            domain,
            ssl_path,
            relay_pin,
            compare_string,
        })
    }
}

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    // Helper to run code with env vars set, then unset them
    fn with_env_vars<F>(vars: Vec<(&str, &str)>, f: F)
    where
        F: FnOnce(),
    {
        unsafe {
            for (key, value) in &vars {
                env::set_var(key, value);
            }
            f();
            for (key, _) in vars {
                env::remove_var(key);
            }
        }
    }

    #[test]
    fn test_config_from_env_success() {
        with_env_vars(
            vec![
                ("DOMAIN", "example.com"),
                ("SSL_PATH", "/tmp"),
                ("COMPARE_STRING", "secret"),
                ("RELAY_PIN", "17"),
            ],
            || {
                let config = Config::from_env().unwrap();
                assert_eq!(config.domain, "example.com");
                assert_eq!(config.ssl_path, "/tmp");
                assert_eq!(config.compare_string, "secret");
                if cfg!(feature = "gpio") {
                    assert_eq!(config.relay_pin, Some(17));
                } else {
                    assert_eq!(config.relay_pin, None);
                }
            },
        );
    }

    #[test]
    fn test_config_missing_env() {
        // Ensure environment is clean for this test
        with_env_vars(vec![], || {
            let result = Config::from_env();
            assert!(result.is_err());
        });
    }
}

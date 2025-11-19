use rocket::serde::{Deserialize, Deserializer, Serialize, json};
use std::error;
use std::process::Command;
use std::str;
use rocket::tokio;
#[derive(Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct MinidspStatusWrapper {
    pub master: MinidspStatus,
}

// This function attempts to deserialize a value as an i32, then
// converts that i32 to a String.
fn deserialize_int_as_string<'a, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'a>,
{
    let number = i32::deserialize(deserializer)?;
    Ok(number.to_string())
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct MinidspStatus {
    source: String,
    volume: f32,
    #[serde(deserialize_with = "deserialize_int_as_string")]
    preset: String,
}
pub async fn get_minidsp_status() -> Result<MinidspStatus, Box<dyn error::Error + Send + Sync>> {
    let output = tokio::task::spawn_blocking(move || {
        Command::new("minidsp").arg("-o").arg("json").output()
    }).await??;

    let result_str = str::from_utf8(&output.stdout)?;
    let wrapper: MinidspStatusWrapper = json::from_str(result_str)?;
    Ok(wrapper.master)
}

pub async fn increment_minidsp_vol(gain: f32) -> Result<(), Box<dyn error::Error + Send + Sync>> {
    tokio::task::spawn_blocking(move || {
        Command::new("minidsp")
            .arg("gain")
            .arg("--relative")
            .arg("--")
            .arg(gain.to_string())
            .output()
    }).await??;
    Ok(())
}

pub async fn set_minidsp_vol(gain: f32) -> Result<(), Box<dyn error::Error + Send + Sync>> {
    tokio::task::spawn_blocking(move || {
        Command::new("minidsp")
            .arg("gain")
            .arg("--")
            .arg(gain.to_string())
            .output()
    }).await??;
    Ok(())
}

pub async fn set_minidsp_preset(preset: String) -> Result<(), Box<dyn error::Error + Send + Sync>> {
    tokio::task::spawn_blocking(move || {
        Command::new("minidsp").arg("config").arg(preset).output()
    }).await??;
    Ok(())
}

pub async fn set_minidsp_source(source: String) -> Result<(), Box<dyn error::Error + Send + Sync>> {
    // note that the source output from minidspStatus has first letter capitalized,
    // but setting the source requires lowercase
    // see https://minidsp-rs.pages.dev/cli/master/source
    tokio::task::spawn_blocking(move || {
        Command::new("minidsp")
            .arg("source")
            .arg(source.to_lowercase())
            .output()
    }).await??;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::MinidspStatus;
    use rocket::serde::json;
    #[test]
    fn it_deserializes_to_string() {
        let str_to_deser = r#"{
            "source": "Example",
            "volume": 12345,
            "preset": 1
        }"#;
        let wrapper: MinidspStatus = json::from_str(str_to_deser).unwrap();
        assert_eq!(wrapper.preset, "1".to_string());
    }
}

use rocket::serde::{Deserialize, Serialize};
use rocket_db_pools::sqlx;
use rocket_db_pools::sqlx::SqlitePool;
//use std::net::IpAddr;
pub struct Domain {
    pub domain_name: String,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
#[serde(crate = "rocket::serde", rename_all = "camelCase")]
pub struct Device {
    pub device_ip: String,
    pub is_allowed: bool,
}

/*
#[derive(Deserialize)]
#[serde(crate = "rocket::serde", rename_all = "camelCase")]
pub struct DeviceAllowed {
    pub is_allowed: bool,
}*/

pub async fn upsert_device(pool: &SqlitePool, device_ip: String) -> Result<Device, sqlx::Error> {
    match get_device(pool, &device_ip).await? {
        Some(device) => Ok(device),
        None => {
            //let device_ip_str = device_ip.to_string();
            sqlx::query!(
                r#"
        INSERT INTO devices (device_ip, is_allowed)
        VALUES ($1, $2)
                "#,
                device_ip,
                false
            )
            .execute(pool)
            .await?;
            Ok(Device {
                device_ip,
                is_allowed: false,
            })
        }
    }
}
pub async fn update_device(
    pool: &SqlitePool,
    device_ip: &String,
    is_allowed: bool,
) -> Result<(), sqlx::Error> {
    //let device_ip_str = device_ip.to_string();
    sqlx::query!(
        r#"
UPDATE devices
SET is_allowed = $1 WHERE device_ip = $2
        "#,
        is_allowed,
        device_ip
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_device(
    pool: &SqlitePool,
    device_ip: &String,
) -> Result<Option<Device>, sqlx::Error> {
    //let mut conn = pool.acquire().await?;
    //let device_ip_str = device_ip.to_string();
    let row = sqlx::query_as!(
        Device,
        r#"
SELECT device_ip as "device_ip: String",
is_allowed as "is_allowed: bool" from devices
WHERE device_ip = $1
        "#,
        device_ip
    )
    .fetch_optional(pool)
    .await?;
    Ok(row)
}

pub async fn get_all_devices(pool: &SqlitePool) -> Result<Vec<Device>, sqlx::Error> {
    let row = sqlx::query_as!(
        Device,
        r#"
SELECT device_ip as "device_ip: String",
is_allowed as "is_allowed: bool" from devices
        "#
    )
    .fetch_all(pool)
    .await?;
    Ok(row)
}

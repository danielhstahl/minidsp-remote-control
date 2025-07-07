use rocket::serde::{Deserialize, Serialize};
use rocket_db_pools::sqlx;
use rocket_db_pools::sqlx::SqlitePool;

#[derive(Serialize, Deserialize, sqlx::FromRow)]
#[serde(crate = "rocket::serde", rename_all = "camelCase")]
pub struct DbUser {
    pub key: i64,
    pub public_key: String,
}

#[derive(Deserialize, sqlx::FromRow)]
#[serde(crate = "rocket::serde", rename_all = "camelCase")]
pub struct UserPublicKey {
    pub public_key: String,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
#[serde(crate = "rocket::serde", rename_all = "camelCase")]
pub struct Settings {
    pub key: i64,
    pub require_auth: bool,
}
//public key should come in base64 encoded
pub async fn create_user(
    pool: &SqlitePool,
    public_key_base64: String,
) -> Result<DbUser, sqlx::Error> {
    // Insert the task, then obtain the ID of this row
    let id = sqlx::query!(
        r#"
INSERT INTO users (public_key)
VALUES (?1)
        "#,
        public_key_base64
    )
    .execute(pool)
    .await?
    .last_insert_rowid();

    Ok(DbUser {
        key: id,
        public_key: public_key_base64,
    })
}
pub async fn update_user(
    pool: &SqlitePool,
    user_id: i64,
    public_key_base64: String,
) -> Result<DbUser, sqlx::Error> {
    //let mut conn = pool.acquire().await?;

    // Insert the task, then obtain the ID of this row
    sqlx::query!(
        r#"
UPDATE users
SET public_key = ?1 WHERE key = ?2
        "#,
        public_key_base64,
        user_id
    )
    .execute(pool)
    .await?;
    Ok(DbUser {
        key: user_id,
        public_key: public_key_base64,
    })
}

pub async fn get_user(pool: &SqlitePool, user_id: i64) -> Result<DbUser, sqlx::Error> {
    //let mut conn = pool.acquire().await?;

    let row = sqlx::query_as!(
        DbUser,
        r#"
SELECT key as "key: i64", public_key as "public_key: String" from users
WHERE key = ?1
        "#,
        user_id
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn get_settings(pool: &SqlitePool) -> Result<Settings, sqlx::Error> {
    let row = sqlx::query_as!(
        Settings,
        r#"
SELECT key as "key: i64", require_auth as "require_auth: bool" from settings
        "#
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn update_settings(
    pool: &SqlitePool,
    require_auth: bool,
) -> Result<Settings, sqlx::Error> {
    let id = sqlx::query_as!(
        Settings,
        r#"
UPDATE settings SET require_auth=?1;
        "#,
        require_auth
    )
    .execute(pool)
    .await?
    .last_insert_rowid();
    Ok(Settings {
        key: id,
        require_auth,
    })
}

pub async fn set_default_settings(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    if get_settings(pool).await.is_err() {
        sqlx::query!(
            r#"
INSERT INTO settings (require_auth) VALUES (?1);
        "#,
            false
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

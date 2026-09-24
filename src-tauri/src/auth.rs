// src-tauri/src/auth.rs
// Login + JWT storage (encrypted)
use crate::store::{get_string, set_string};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthState {
    pub token: String,
    pub email: String,
    pub user_id: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
struct LoginResponse {
    token: Option<String>,
    user: Option<LoginUser>,
    error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct LoginUser {
    id: String,
    email: String,
    role: String,
}

#[tauri::command]
pub async fn login(
    hub_url: String,
    email: String,
    password: String,
) -> Result<AuthState, String> {
    // Call Hub NextAuth credentials endpoint
    let client = reqwest::Client::new();
    let res = client
        .post(format!("{}/api/auth/callback/credentials", hub_url))
        .json(&serde_json::json!({
            "email": email,
            "password": password,
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("HTTP {}", res.status()));
    }

    let body: LoginResponse = res.json().await.map_err(|e| e.to_string())?;

    let token = body.token.ok_or_else(|| body.error.unwrap_or_else(|| "Unknown error".to_string()))?;
    let user = body.user.ok_or("Missing user info")?;

    let state = AuthState {
        token: token.clone(),
        email: user.email,
        user_id: user.id,
        role: user.role,
    };

    // Save encrypted in OS keyring
    set_string("auth_state", &serde_json::to_string(&state).unwrap())?;

    Ok(state)
}

#[tauri::command]
pub fn get_cached_auth() -> Result<Option<AuthState>, String> {
    match get_string("auth_state")? {
        Some(json) => {
            let state: AuthState = serde_json::from_str(&json).map_err(|e| e.to_string())?;
            Ok(Some(state))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn logout() -> Result<(), String> {
    crate::store::delete("auth_state")?;
    Ok(())
}

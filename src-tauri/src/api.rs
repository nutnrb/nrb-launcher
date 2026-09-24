// src-tauri/src/api.rs
// HTTP client to NRB Hub API
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};

pub struct HubClient {
    base_url: String,
    token: Option<String>,
    client: reqwest::Client,
}

impl HubClient {
    pub fn new(base_url: String) -> Self {
        Self {
            base_url,
            token: None,
            client: reqwest::Client::new(),
        }
    }

    pub fn with_token(mut self, token: String) -> Self {
        self.token = Some(token);
        self
    }

    fn build_headers(&self) -> HeaderMap {
        let mut headers = HeaderMap::new();
        if let Some(t) = &self.token {
            if let Ok(v) = HeaderValue::from_str(&format!("Bearer {}", t)) {
                headers.insert(AUTHORIZATION, v);
            }
        }
        headers
    }

    pub async fn get<T: serde::de::DeserializeOwned>(&self, path: &str) -> Result<T, String> {
        let url = format!("{}{}", self.base_url, path);
        let res = self
            .client
            .get(&url)
            .headers(self.build_headers())
            .send()
            .await
            .map_err(|e| e.to_string())?;
        res.json().await.map_err(|e| e.to_string())
    }
}

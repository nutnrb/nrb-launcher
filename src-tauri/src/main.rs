#![allow(dead_code)]
mod api;
mod auth;
mod download;
mod hardware;
mod store;

fn main() {
    nrb_launcher_lib::run()
}

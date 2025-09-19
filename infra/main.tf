provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Data source for the zone
data "cloudflare_zone" "main" {
  zone_id = var.zone_id
}

# --- Storage Resources ---
resource "cloudflare_workers_kv_namespace" "published" {
  account_id = var.account_id
  title      = var.kv_namespace_name
}

resource "cloudflare_d1_database" "main" {
  account_id = var.account_id
  name       = var.database_name
}

resource "cloudflare_r2_bucket" "media" {
  account_id = var.account_id
  name       = var.r2_bucket_name
}

# --- DNS Records ---
resource "cloudflare_record" "root" {
  zone_id = var.zone_id
  name    = "@"
  type    = "A"
  content = "192.0.2.1"     # placeholder IP; proxied so origin is hidden
  proxied = true
  comment = "Root domain for ${var.project_name} frontend"
}

resource "cloudflare_record" "admin" {
  zone_id = var.zone_id
  name    = "admin"
  type    = "A"
  content = "192.0.2.1"
  proxied = true
  comment = "Admin subdomain for ${var.project_name} CMS"
}
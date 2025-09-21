# Resource IDs for Wrangler configuration
output "kv_namespace_id" {
  value       = cloudflare_workers_kv_namespace.published.id
  description = "KV namespace ID for content caching"
}

output "d1_database_id" {
  value       = cloudflare_d1_database.main.id
  description = "D1 database ID"
}

output "r2_bucket_name" {
  value       = cloudflare_r2_bucket.media.name
  description = "R2 bucket name for media storage"
}

# Configuration summary
output "project_info" {
  value = {
    project_name = var.project_name
    hostname     = var.hostname
    admin_url    = "https://${var.hostname}/admin"
    zone_name    = data.cloudflare_zone.main.name
  }
  description = "Project configuration summary"
}

output "resource_names" {
  value = {
    database     = var.database_name
    kv_namespace = var.kv_namespace_name
    r2_bucket    = var.r2_bucket_name
  }
  description = "Generated resource names"
}
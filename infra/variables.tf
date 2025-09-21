# Cloudflare Configuration
variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token with Worker, D1, R2, KV, and DNS permissions"
}

variable "account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "zone_id" {
  type        = string
  description = "Cloudflare zone ID for example.com"
}

# Project Configuration
variable "project_name" {
  type        = string
  default     = "example"
  description = "Base project name"
}

# Resource Names (auto-generated from project config)
variable "database_name" {
  type        = string
  default     = "example_db"
  description = "D1 database name"
}

variable "kv_namespace_name" {
  type        = string
  default     = "EXAMPLE_PUBLISHED"
  description = "KV namespace name"
}

variable "r2_bucket_name" {
  type        = string
  default     = "example-media"
  description = "R2 bucket name"
}

# Hostnames
variable "hostname" {
  type        = string
  default     = "example.com"
  description = "Domain hostname (admin at /admin route)"
}
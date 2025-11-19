variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "alert_email" {
  description = "Email for security alerts"
  type        = string
}

variable "firebase_api_key" {
  description = "Firebase API key"
  type        = string
  sensitive   = true
}

variable "firebase_auth_domain" {
  description = "Firebase auth domain"
  type        = string
}

variable "firebase_project_id" {
  description = "Firebase project ID"
  type        = string
}

variable "firebase_storage_bucket" {
  description = "Firebase storage bucket"
  type        = string
}

variable "firebase_messaging_sender_id" {
  description = "Firebase messaging sender ID"
  type        = string
}

variable "firebase_app_id" {
  description = "Firebase app ID"
  type        = string
}

variable "firebase_service_account" {
  description = "Firebase service account (base64)"
  type        = string
  sensitive   = true
}
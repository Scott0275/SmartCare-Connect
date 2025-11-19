variable "alert_email" {
  description = "Email for alerts"
  type        = string
}

variable "firebase_api_key" {
  description = "Firebase API key"
  type        = string
  sensitive   = true
}

variable "firebase_service_account" {
  description = "Firebase service account (base64)"
  type        = string
  sensitive   = true
}
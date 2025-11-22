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



variable "domain_name" {

  description = "The domain name for the application."

  type        = string

}



variable "environment" {

  description = "The deployment environment (e.g., dev, staging, prod)."

  type        = string

}

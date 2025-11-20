variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev/prod)"
  type        = string
}

variable "patients_table_name" {
  description = "DynamoDB patients table name"
  type        = string
}
# Patients Table
resource "aws_dynamodb_table" "patients" {
  name           = "${var.project_name}-${var.environment}-patients"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "doctorId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "DoctorIndex"
    hash_key        = "doctorId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-patients"
    Environment = var.environment
  }
}

# Prescriptions Table
resource "aws_dynamodb_table" "prescriptions" {
  name           = "${var.project_name}-${var.environment}-prescriptions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "patientId"
    type = "S"
  }

  attribute {
    name = "doctorId"
    type = "S"
  }

  global_secondary_index {
    name            = "PatientIndex"
    hash_key        = "patientId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "DoctorIndex"
    hash_key        = "doctorId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-prescriptions"
    Environment = var.environment
  }
}

# Appointments Table
resource "aws_dynamodb_table" "appointments" {
  name           = "${var.project_name}-${var.environment}-appointments"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "patientId"
    type = "S"
  }

  attribute {
    name = "doctorId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  global_secondary_index {
    name            = "PatientIndex"
    hash_key        = "patientId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "DoctorIndex"
    hash_key        = "doctorId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "DateIndex"
    hash_key        = "date"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-appointments"
    Environment = var.environment
  }
}

# Vitals Table
resource "aws_dynamodb_table" "vitals" {
  name           = "${var.project_name}-${var.environment}-vitals"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "patientId"
    type = "S"
  }

  global_secondary_index {
    name            = "PatientIndex"
    hash_key        = "patientId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-vitals"
    Environment = var.environment
  }
}

# Lab Results Table
resource "aws_dynamodb_table" "lab_results" {
  name           = "${var.project_name}-${var.environment}-lab-results"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "patientId"
    type = "S"
  }

  global_secondary_index {
    name            = "PatientIndex"
    hash_key        = "patientId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-lab-results"
    Environment = var.environment
  }
}

# Billing Table
resource "aws_dynamodb_table" "billing" {
  name           = "${var.project_name}-${var.environment}-billing"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "patientId"
    type = "S"
  }

  global_secondary_index {
    name            = "PatientIndex"
    hash_key        = "patientId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-billing"
    Environment = var.environment
  }
}
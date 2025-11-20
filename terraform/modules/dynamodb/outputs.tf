output "table_names" {
  description = "DynamoDB table names"
  value = {
    patients      = aws_dynamodb_table.patients.name
    prescriptions = aws_dynamodb_table.prescriptions.name
    appointments  = aws_dynamodb_table.appointments.name
    vitals        = aws_dynamodb_table.vitals.name
    lab_results   = aws_dynamodb_table.lab_results.name
    billing       = aws_dynamodb_table.billing.name
  }
}
output "table_names" {
  description = "The names of the DynamoDB tables"
  value = {
    patients      = aws_dynamodb_table.patients.name
    users         = aws_dynamodb_table.users.name
    prescriptions = aws_dynamodb_table.prescriptions.name
    appointments  = aws_dynamodb_table.appointments.name
    vitals        = aws_dynamodb_table.vitals.name
    triage        = aws_dynamodb_table.triage.name
    lab_results   = aws_dynamodb_table.lab_results.name
    billing       = aws_dynamodb_table.billing.name
  }
}

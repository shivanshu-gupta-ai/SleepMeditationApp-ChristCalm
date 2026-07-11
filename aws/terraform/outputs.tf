output "api_url" {
  description = "API Gateway URL — set as EXPO_PUBLIC_BACKEND_URL in frontend/.env"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "lambda_function_name" {
  description = "Lambda function name for code deploys"
  value       = aws_lambda_function.api.function_name
}

output "ssm_prefix" {
  description = "SSM Parameter Store path prefix"
  value       = local.ssm_prefix
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    users                = aws_dynamodb_table.users.name
    mood_logs            = aws_dynamodb_table.mood_logs.name
    journal_entries      = aws_dynamodb_table.journal_entries.name
    ai_prayers           = aws_dynamodb_table.ai_prayers.name
    payment_transactions = aws_dynamodb_table.payment_transactions.name
  }
}

output "build_bucket" {
  description = "S3 bucket for CodeBuild source uploads"
  value       = aws_s3_bucket.build.bucket
}

output "codebuild_project_name" {
  description = "CodeBuild project that builds and deploys Lambda on AWS"
  value       = aws_codebuild_project.lambda.name
}

output "voice_bucket" {
  description = "S3 bucket for temporary wisdom voice notes (Amazon Transcribe input)"
  value       = aws_s3_bucket.voice.bucket
}
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
    meditation_ratings   = aws_dynamodb_table.meditation_ratings.name
    user_feedback        = aws_dynamodb_table.user_feedback.name
    ai_prayers           = aws_dynamodb_table.ai_prayers.name
    payment_transactions = aws_dynamodb_table.payment_transactions.name
    rate_limits          = aws_dynamodb_table.rate_limits.name
    usage_events         = aws_dynamodb_table.usage_events.name
    usage_daily          = aws_dynamodb_table.usage_daily.name
  }
}

output "api_throttle" {
  description = "HTTP API stage throttle (DIY scale — no Support ticket for these defaults)"
  value = {
    rate_limit  = var.api_throttle_rate
    burst_limit = var.api_throttle_burst
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

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito app client ID (public / PKCE)"
  value       = aws_cognito_user_pool_client.app.id
}

output "cognito_domain" {
  description = "Cognito Hosted UI domain (no scheme)"
  value       = "${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "cognito_region" {
  description = "AWS region for Cognito"
  value       = var.aws_region
}
output "aws_account_id" {
  description = "AWS account where this stack is deployed"
  value       = data.aws_caller_identity.current.account_id
}

output "name_prefix" {
  description = "Resource name prefix (includes account suffix when set)"
  value       = local.name_prefix
}

output "dynamodb_table_prefix" {
  description = "DynamoDB table name prefix used by Lambda"
  value       = local.dynamodb_table_prefix
}

output "media_base_url" {
  description = "Public base URL for meditation audio and covers"
  value       = var.media_base_url
}

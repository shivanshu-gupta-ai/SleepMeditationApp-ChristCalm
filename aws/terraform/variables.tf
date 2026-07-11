variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "christcalm"
}

variable "environment" {
  type        = string
  description = "preview | staging | prod"
  default     = "preview"
}

variable "dynamodb_table_prefix" {
  type        = string
  description = "Prefix for DynamoDB table names (e.g. christcalm-preview)"
  default     = "christcalm"
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "google_client_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "google_client_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "google_redirect_uri" {
  type        = string
  description = "API Gateway OAuth callback — <api_url>/api/auth/google/callback"
  default     = ""
}

variable "lambda_zip_path" {
  type        = string
  description = "Path to the Lambda deployment zip (built by scripts/build-lambda.sh)"
  default     = "../../dist/lambda.zip"
}

variable "cors_origins" {
  type        = list(string)
  description = "Allowed frontend origins for CORS and OAuth redirect"
  default     = []
}

variable "llm_provider" {
  type        = string
  default     = "bedrock"
  description = "bedrock (default) | openai"
}

variable "openai_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "openai_model" {
  type    = string
  default = "gpt-4o"
}

variable "bedrock_model_id" {
  type        = string
  default     = "openai.gpt-oss-20b-1:0"
  description = "Bedrock model ID for wisdom chat (GPT-OSS 20B or Mistral — not Claude)"
}

variable "revenuecat_webhook_authorization" {
  type      = string
  sensitive = true
  default   = ""
  description = "Bearer token RevenueCat sends in webhook Authorization header"
}

variable "revenuecat_entitlement_id" {
  type    = string
  default = "christcalm_premium"
}
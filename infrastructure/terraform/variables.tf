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
  description = "Legacy API Gateway OAuth callback (deprecated — use Cognito)"
  default     = ""
}

variable "apple_services_id" {
  type        = string
  description = "Apple Services ID for Sign in with Apple (Cognito IdP)"
  sensitive   = true
  default     = ""
}

variable "apple_team_id" {
  type        = string
  description = "Apple Team ID"
  default     = ""
}

variable "apple_key_id" {
  type        = string
  description = "Apple Sign in with Apple key ID"
  default     = ""
}

variable "apple_private_key" {
  type        = string
  description = "Apple Sign in with Apple private key (.p8 contents)"
  sensitive   = true
  default     = ""
}

variable "cognito_auto_confirm_users" {
  type        = bool
  description = "Auto-confirm email sign-ups (preview/staging). Set false for production email verification."
  default     = false
}

variable "cognito_callback_urls" {
  type        = list(string)
  description = "OAuth redirect URIs for Cognito app client (mobile deep links)"
  default = [
    "frontend://oauth",
    "com.christcalm.app://oauth",
    "exp://127.0.0.1:8081/--/oauth",
    "exp://localhost:8081/--/oauth",
    "http://localhost:8081/oauth",
    "http://127.0.0.1:8081/oauth",
  ]
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
  description = "Primary Wisdom model (GPT-OSS 20B)"
}

variable "bedrock_inference_geo" {
  type        = string
  default     = "us"
  description = "Cross-region inference geo: us | eu | none"
}

variable "bedrock_model_ids" {
  type        = string
  # Cost→quality ladder of Converse-verified models (GPT-OSS primary; no Claude)
  default     = "openai.gpt-oss-20b-1:0,us.amazon.nova-micro-v1:0,us.amazon.nova-lite-v1:0,us.amazon.nova-2-lite-v1:0,us.meta.llama3-1-8b-instruct-v1:0,mistral.mistral-large-2402-v1:0,us.meta.llama3-1-70b-instruct-v1:0,us.meta.llama3-3-70b-instruct-v1:0,us.amazon.nova-pro-v1:0,us.deepseek.r1-v1:0,us.mistral.pixtral-large-2502-v1:0"
  description = "Comma-separated Bedrock chain: primary first, then cost-optimized fallbacks"
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

# --- DIY scale knobs (no AWS Support required for defaults) ---

variable "api_throttle_rate" {
  type        = number
  description = "API Gateway stage steady-state req/sec (raise if growing; Service Quotas only if still throttled)"
  default     = 2000
}

variable "api_throttle_burst" {
  type        = number
  description = "API Gateway stage burst capacity"
  default     = 1000
}

variable "lambda_provisioned_concurrency" {
  type        = number
  description = "Warm Lambda instances (0 = off / free of PC cost). Set 2–5 if cold starts hurt."
  default     = 0
}

variable "ai_monthly_limit" {
  type        = number
  description = "Default monthly AI/Wisdom actions per user (also overridable via env)"
  default     = 100
}
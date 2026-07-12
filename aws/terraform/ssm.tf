# SSM Parameter Store (replaces Secrets Manager)

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "${local.ssm_prefix}/JWT_SECRET"
  type  = "SecureString"
  value = var.jwt_secret
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "google_client_id" {
  name  = "${local.ssm_prefix}/GOOGLE_CLIENT_ID"
  type  = "SecureString"
  value = var.google_client_id
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "google_client_secret" {
  name  = "${local.ssm_prefix}/GOOGLE_CLIENT_SECRET"
  type  = "SecureString"
  value = var.google_client_secret
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "google_redirect_uri" {
  name  = "${local.ssm_prefix}/GOOGLE_REDIRECT_URI"
  type  = "String"
  value = var.google_redirect_uri
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "cors_origins" {
  name  = "${local.ssm_prefix}/CORS_ORIGINS"
  type  = "String"
  value = join(",", var.cors_origins)
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "llm_provider" {
  name  = "${local.ssm_prefix}/LLM_PROVIDER"
  type  = "String"
  value = var.llm_provider
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "openai_api_key" {
  name  = "${local.ssm_prefix}/OPENAI_API_KEY"
  type  = "SecureString"
  value = var.openai_api_key
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "openai_model" {
  name  = "${local.ssm_prefix}/OPENAI_MODEL"
  type  = "String"
  value = var.openai_model
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "bedrock_model_id" {
  name  = "${local.ssm_prefix}/BEDROCK_MODEL_ID"
  type  = "String"
  value = var.bedrock_model_id
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "bedrock_inference_geo" {
  name  = "${local.ssm_prefix}/BEDROCK_INFERENCE_GEO"
  type  = "String"
  value = var.bedrock_inference_geo
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "bedrock_model_ids" {
  name  = "${local.ssm_prefix}/BEDROCK_MODEL_IDS"
  type  = "String"
  value = var.bedrock_model_ids
  tags  = local.common_tags
}



resource "aws_ssm_parameter" "revenuecat_webhook_authorization" {
  name  = "${local.ssm_prefix}/REVENUECAT_WEBHOOK_AUTHORIZATION"
  type  = "SecureString"
  # SSM SecureString requires non-empty value; "unset" means webhooks skip auth check
  value = var.revenuecat_webhook_authorization != "" ? var.revenuecat_webhook_authorization : "unset"
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "revenuecat_entitlement_id" {
  name  = "${local.ssm_prefix}/REVENUECAT_ENTITLEMENT_ID"
  type  = "String"
  value = var.revenuecat_entitlement_id
  tags  = local.common_tags
}
# SSM Parameter Store (replaces Secrets Manager)

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "${local.ssm_prefix}/JWT_SECRET"
  type  = "SecureString"
  value = var.jwt_secret
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "cors_origins" {
  name  = "${local.ssm_prefix}/CORS_ORIGINS"
  type  = "String"
  value = join(",", var.cors_origins)
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name  = "${local.ssm_prefix}/COGNITO_USER_POOL_ID"
  type  = "String"
  value = aws_cognito_user_pool.main.id
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "cognito_client_id" {
  name  = "${local.ssm_prefix}/COGNITO_CLIENT_ID"
  type  = "String"
  value = aws_cognito_user_pool_client.app.id
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "cognito_domain" {
  name  = "${local.ssm_prefix}/COGNITO_DOMAIN"
  type  = "String"
  value = "${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
  tags  = local.common_tags
}

# --- Apple Sign-In secrets (source of truth: SSM, not local .env/tfvars) ---
# Seed placeholders on first create; real values are set with:
#   ./scripts/seed-apple-ssm-once.sh  (temp Lambda → SSM → delete)
# lifecycle ignore_changes keeps CLI/console updates from being overwritten.

resource "aws_ssm_parameter" "apple_services_id" {
  name  = "${local.ssm_prefix}/APPLE_SERVICES_ID"
  type  = "SecureString"
  value = "unset"
  tags  = local.common_tags

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "apple_team_id" {
  name  = "${local.ssm_prefix}/APPLE_TEAM_ID"
  type  = "SecureString"
  value = "unset"
  tags  = local.common_tags

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "apple_key_id" {
  name  = "${local.ssm_prefix}/APPLE_KEY_ID"
  type  = "SecureString"
  value = "unset"
  tags  = local.common_tags

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "apple_private_key" {
  name  = "${local.ssm_prefix}/APPLE_PRIVATE_KEY"
  type  = "SecureString"
  value = "unset"
  tags  = local.common_tags

  lifecycle {
    ignore_changes = [value]
  }
}

# Live values for Cognito IdP (read current SSM — not terraform state)
# Fixed names so count/planning does not depend on create-time resource attrs.
data "aws_ssm_parameter" "apple_services_id" {
  count           = var.enable_apple_sign_in ? 1 : 0
  name            = "${local.ssm_prefix}/APPLE_SERVICES_ID"
  with_decryption = true

  depends_on = [aws_ssm_parameter.apple_services_id]
}

data "aws_ssm_parameter" "apple_team_id" {
  count           = var.enable_apple_sign_in ? 1 : 0
  name            = "${local.ssm_prefix}/APPLE_TEAM_ID"
  with_decryption = true

  depends_on = [aws_ssm_parameter.apple_team_id]
}

data "aws_ssm_parameter" "apple_key_id" {
  count           = var.enable_apple_sign_in ? 1 : 0
  name            = "${local.ssm_prefix}/APPLE_KEY_ID"
  with_decryption = true

  depends_on = [aws_ssm_parameter.apple_key_id]
}

data "aws_ssm_parameter" "apple_private_key" {
  count           = var.enable_apple_sign_in ? 1 : 0
  name            = "${local.ssm_prefix}/APPLE_PRIVATE_KEY"
  with_decryption = true

  depends_on = [aws_ssm_parameter.apple_private_key]
}

resource "aws_ssm_parameter" "llm_provider" {
  name  = "${local.ssm_prefix}/LLM_PROVIDER"
  type  = "String"
  value = var.llm_provider
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
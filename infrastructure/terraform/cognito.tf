# Cognito User Pool — email/password + optional Apple Sign-In (from SSM)

locals {
  # Must be globally unique in the region; include account suffix when set
  cognito_domain_prefix = local.name_prefix

  # Apple IdP — credentials always from SSM when enable_apple_sign_in = true
  apple_services_id = var.enable_apple_sign_in ? data.aws_ssm_parameter.apple_services_id[0].value : "unset"
  apple_team_id     = var.enable_apple_sign_in ? data.aws_ssm_parameter.apple_team_id[0].value : "unset"
  apple_key_id      = var.enable_apple_sign_in ? data.aws_ssm_parameter.apple_key_id[0].value : "unset"
  apple_private_key = var.enable_apple_sign_in ? data.aws_ssm_parameter.apple_private_key[0].value : "unset"
  apple_idp_enabled = var.enable_apple_sign_in
  cognito_callback_urls = concat(
    var.cognito_callback_urls,
    [for o in var.cors_origins : o if startswith(o, "http")]
  )
}

resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your ChristCalm verification code"
    email_message        = "Welcome to ChristCalm. Your verification code is {####}."
  }

  dynamic "lambda_config" {
    for_each = var.cognito_auto_confirm_users ? [1] : []
    content {
      pre_sign_up = aws_lambda_function.cognito_pre_signup[0].arn
    }
  }

  lifecycle {
    ignore_changes = [schema]
  }

  tags = local.common_tags
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = local.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}


resource "aws_cognito_identity_provider" "apple" {
  count = local.apple_idp_enabled ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "SignInWithApple"
  provider_type = "SignInWithApple"

  # Fetched from SSM at apply time — never required in local .env
  provider_details = {
    client_id        = local.apple_services_id
    team_id          = local.apple_team_id
    key_id           = local.apple_key_id
    private_key      = local.apple_private_key
    authorize_scopes = "email name"
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "sub"
  }

  # AWS does not return private_key and injects authorize_url / oidc_issuer, etc.
  # That causes a permanent plan diff. Secrets live in SSM; re-seed + replace if keys change.
  lifecycle {
    ignore_changes = [provider_details]
  }
}

resource "aws_cognito_user_pool_client" "app" {
  name         = "${local.name_prefix}-mobile"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  supported_identity_providers = compact(concat(
    ["COGNITO"],
    local.apple_idp_enabled ? ["SignInWithApple"] : [],
  ))

  callback_urls = local.cognito_callback_urls
  logout_urls   = local.cognito_callback_urls

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client   = true
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  depends_on = [
    aws_cognito_identity_provider.apple,
  ]
}
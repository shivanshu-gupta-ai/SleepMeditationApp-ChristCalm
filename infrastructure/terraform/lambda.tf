resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_ssm" {
  name = "${local.name_prefix}-ssm-read"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
      Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${local.ssm_prefix}/*"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${local.name_prefix}-dynamodb"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
        "dynamodb:Query", "dynamodb:Scan", "dynamodb:DescribeTable",
      ]
      Resource = [
        aws_dynamodb_table.users.arn,
        "${aws_dynamodb_table.users.arn}/index/*",
        aws_dynamodb_table.mood_logs.arn,
        aws_dynamodb_table.journal_entries.arn,
        aws_dynamodb_table.ai_prayers.arn,
        aws_dynamodb_table.payment_transactions.arn,
        aws_dynamodb_table.rate_limits.arn,
        aws_dynamodb_table.usage_events.arn,
        "${aws_dynamodb_table.usage_events.arn}/index/*",
        aws_dynamodb_table.usage_daily.arn,
      ]
    }]
  })
}

resource "aws_iam_role_policy" "lambda_cognito" {
  name = "${local.name_prefix}-cognito"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "cognito-idp:GetUser",
        "cognito-idp:AdminGetUser",
      ]
      Resource = aws_cognito_user_pool.main.arn
    }]
  })
}

# Cross-region inference profiles need invoke on the profile + FMs in destination regions
resource "aws_iam_role_policy" "lambda_bedrock" {
  name = "${local.name_prefix}-bedrock"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockInvoke"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/*",
          # Destination regions for US/EU geo cross-region routing
          "arn:aws:bedrock:*::foundation-model/*",
          # System inference profiles (us.amazon.nova-2-lite-v1:0 etc.)
          "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:inference-profile/*",
          "arn:aws:bedrock:*:${data.aws_caller_identity.current.account_id}:inference-profile/*",
        ]
      },
      {
        Sid      = "BedrockInferenceProfileRead"
        Effect   = "Allow"
        Action   = ["bedrock:GetInferenceProfile", "bedrock:ListInferenceProfiles"]
        Resource = ["*"]
      },
    ]
  })
}

data "archive_file" "lambda_stub" {
  type        = "zip"
  source_file = "${path.module}/lambda_stub/handler.py"
  output_path = "${path.module}/.terraform/lambda_stub.zip"
}

resource "aws_lambda_function" "api" {
  function_name = "${local.name_prefix}-api"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.handler"
  runtime       = "python3.11"
  # Transcribe poll + Bedrock wisdom can exceed 30s
  timeout       = 90
  memory_size   = 1024

  filename         = data.archive_file.lambda_stub.output_path
  source_code_hash = data.archive_file.lambda_stub.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE_PREFIX = local.dynamodb_table_prefix
      SSM_PREFIX            = local.ssm_prefix
      VOICE_BUCKET          = aws_s3_bucket.voice.bucket
      # Meditation audio + covers (existing shared public media bucket)
      MEDIA_BASE_URL = var.media_base_url
      # DIY scale: shared rate limits across all Lambda instances
      RATE_LIMIT_BACKEND = "dynamo"
      AI_MONTHLY_LIMIT   = tostring(var.ai_monthly_limit)
    }
  }

  tags = local.common_tags

  # Real code is deployed via AWS CodeBuild — don't revert on terraform apply.
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# NOTE: Provisioned concurrency needs a published version/alias (not $LATEST).
# CodeBuild deploys to $LATEST — enable PC from Console after publish, or set
# lambda_provisioned_concurrency > 0 only when you wire alias deploys.
# See docs/scalability-diy.md

resource "aws_apigatewayv2_api" "http" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  tags          = local.common_tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
  tags        = local.common_tags

  # DIY scale: higher stage throttle (no AWS Support). Raise further via Service Quotas if 429s persist.
  default_route_settings {
    throttling_burst_limit = var.api_throttle_burst
    throttling_rate_limit  = var.api_throttle_rate
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
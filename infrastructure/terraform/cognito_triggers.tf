# Preview/staging: auto-confirm email sign-ups (no SES required).
# Production: set cognito_auto_confirm_users = false and rely on email verification in the app.

data "archive_file" "cognito_pre_signup" {
  count       = var.cognito_auto_confirm_users ? 1 : 0
  type        = "zip"
  output_path = "${path.module}/.terraform-cognito-pre-signup.zip"

  source {
    content  = <<-PY
def handler(event, context):
    event.setdefault("response", {})
    event["response"]["autoConfirmUser"] = True
    event["response"]["autoVerifyEmail"] = True
    return event
PY
    filename = "lambda_function.py"
  }
}

resource "aws_iam_role" "cognito_trigger" {
  count = var.cognito_auto_confirm_users ? 1 : 0
  name  = "${local.name_prefix}-cognito-trigger"

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

resource "aws_iam_role_policy_attachment" "cognito_trigger_basic" {
  count      = var.cognito_auto_confirm_users ? 1 : 0
  role       = aws_iam_role.cognito_trigger[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "cognito_pre_signup" {
  count         = var.cognito_auto_confirm_users ? 1 : 0
  function_name = "${local.name_prefix}-cognito-pre-signup"
  role          = aws_iam_role.cognito_trigger[0].arn
  handler       = "lambda_function.handler"
  runtime       = "python3.12"
  timeout       = 5

  filename         = data.archive_file.cognito_pre_signup[0].output_path
  source_code_hash = data.archive_file.cognito_pre_signup[0].output_base64sha256

  tags = local.common_tags
}

resource "aws_lambda_permission" "cognito_pre_signup" {
  count         = var.cognito_auto_confirm_users ? 1 : 0
  statement_id  = "AllowCognitoPreSignUp"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cognito_pre_signup[0].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
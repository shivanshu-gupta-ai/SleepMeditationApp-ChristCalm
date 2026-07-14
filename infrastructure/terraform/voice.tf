# Voice notes for Wisdom STT: S3 temporary audio + Amazon Transcribe

resource "aws_s3_bucket" "voice" {
  bucket = "${local.name_prefix}-voice-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "voice" {
  bucket                  = aws_s3_bucket.voice.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "voice" {
  bucket = aws_s3_bucket.voice.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "voice" {
  bucket = aws_s3_bucket.voice.id
  rule {
    id     = "expire-voice-notes"
    status = "Enabled"
    filter { prefix = "voice/" }
    expiration { days = 1 }
    noncurrent_version_expiration { noncurrent_days = 1 }
  }
}

resource "aws_s3_bucket_cors_configuration" "voice" {
  bucket = aws_s3_bucket.voice.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_origins = length(var.cors_origins) > 0 ? var.cors_origins : ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_iam_role_policy" "lambda_voice" {
  name = "${local.name_prefix}-voice"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.voice.arn,
          "${aws_s3_bucket.voice.arn}/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "transcribe:StartTranscriptionJob",
          "transcribe:GetTranscriptionJob",
          "transcribe:DeleteTranscriptionJob",
        ]
        Resource = "*"
      },
    ]
  })
}

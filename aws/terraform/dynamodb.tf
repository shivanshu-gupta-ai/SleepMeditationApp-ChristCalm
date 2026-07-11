resource "aws_dynamodb_table" "users" {
  name         = "${var.dynamodb_table_prefix}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "mood_logs" {
  name         = "${var.dynamodb_table_prefix}-mood-logs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "sk"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "journal_entries" {
  name         = "${var.dynamodb_table_prefix}-journal-entries"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "sk"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "ai_prayers" {
  name         = "${var.dynamodb_table_prefix}-ai-prayers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "sk"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "payment_transactions" {
  name         = "${var.dynamodb_table_prefix}-payment-transactions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_id"

  attribute {
    name = "session_id"
    type = "S"
  }

  tags = local.common_tags
}
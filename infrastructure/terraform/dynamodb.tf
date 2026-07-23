resource "aws_dynamodb_table" "users" {
  name         = "${local.dynamodb_table_prefix}-users"
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

  attribute {
    name = "cognito_sub"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "cognito-sub-index"
    hash_key        = "cognito_sub"
    projection_type = "ALL"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "mood_logs" {
  name         = "${local.dynamodb_table_prefix}-mood-logs"
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
  name         = "${local.dynamodb_table_prefix}-journal-entries"
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

# Per-user meditation session ratings (1–5 stars after each completed practice)
resource "aws_dynamodb_table" "meditation_ratings" {
  name         = "${local.dynamodb_table_prefix}-meditation-ratings"
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

# In-app product feedback from Me tab (durable; free-text kept out of usage-events)
resource "aws_dynamodb_table" "user_feedback" {
  name         = "${local.dynamodb_table_prefix}-user-feedback"
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
  name         = "${local.dynamodb_table_prefix}-ai-prayers"
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
  name         = "${local.dynamodb_table_prefix}-payment-transactions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_id"

  attribute {
    name = "session_id"
    type = "S"
  }

  tags = local.common_tags
}

/**
 * Distributed rate-limit counters (auth burst, AI hour window).
 * Fixed-window keys + TTL — works across all Lambda instances (unlike in-memory).
 */
resource "aws_dynamodb_table" "rate_limits" {
  name         = "${local.dynamodb_table_prefix}-rate-limits"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  attribute {
    name = "pk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = local.common_tags
}

/**
 * Product usage analytics for analysis.
 * pk = user_id | anon:{device_id}
 * sk = {iso_ts}#{event_id}
 * GSI day-index: all events on a calendar day (DAU / funnel)
 * GSI event-day-index: filter by event_name + day
 * TTL ~90 days (configurable via item ttl attribute)
 */
resource "aws_dynamodb_table" "usage_events" {
  name         = "${local.dynamodb_table_prefix}-usage-events"
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

  attribute {
    name = "day"
    type = "S"
  }

  attribute {
    name = "event_name"
    type = "S"
  }

  global_secondary_index {
    name            = "day-index"
    hash_key        = "day"
    range_key       = "sk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "event-day-index"
    hash_key        = "event_name"
    range_key       = "day"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = local.common_tags
}

/**
 * Daily rollup counters for cheap dashboards.
 * pk = day (YYYY-MM-DD)
 * sk = event#{name} | users#{user_id} | meta#totals
 */
resource "aws_dynamodb_table" "usage_daily" {
  name         = "${local.dynamodb_table_prefix}-usage-daily"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "day"
  range_key    = "sk"

  attribute {
    name = "day"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  tags = local.common_tags
}
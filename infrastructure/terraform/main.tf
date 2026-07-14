terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

locals {
  # Per-account isolation: set name_suffix = AWS account id (bootstrap does this).
  # Empty suffix keeps legacy single-tenant names (christcalm-preview).
  name_prefix = (
    var.name_suffix != ""
    ? "${var.project_name}-${var.environment}-${var.name_suffix}"
    : "${var.project_name}-${var.environment}"
  )
  # DynamoDB / Lambda table prefix — defaults to name_prefix for per-account isolation
  dynamodb_table_prefix = (
    var.dynamodb_table_prefix != ""
    ? var.dynamodb_table_prefix
    : local.name_prefix
  )
  ssm_prefix = "/${local.name_prefix}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    AccountId   = data.aws_caller_identity.current.account_id
    ManagedBy   = "terraform"
  }
}
# Scalability (DIY path)

ChristCalm scales with **Lambda + DynamoDB + API Gateway** — not Fargate/Docker by default.

What we implemented in-repo, what you run, and when to use Service Quotas only.

## Already in the codebase

| Item | Where | Status |
|------|--------|--------|
| Higher API Gateway throttle | `aws/terraform` → 2000 rps / 1000 burst | Apply Terraform |
| DynamoDB rate-limit table | `dynamodb.tf` → `*-rate-limits` | Apply Terraform |
| Distributed rate limits | `backend/services/rate_limit.py` | Deploy Lambda code |
| AI monthly cap (100) | Dynamo users + `AI_MONTHLY_LIMIT` | Already live |
| Catalog `Cache-Control` | `server.py` CatalogCacheMiddleware | Deploy Lambda code |
| Client catalog cache (5 min) | `frontend/src/utils/api-cache.ts` | Expo rebuild |
| Optional provisioned concurrency vars | `variables.tf` | Console later if needed |

## What you run (self-service)

### 1. Infra (throttle + rate-limits table)

```bash
cd aws/terraform
terraform plan
terraform apply
```

Defaults:

- `api_throttle_rate = 2000`
- `api_throttle_burst = 1000`
- `ai_monthly_limit = 100`
- `lambda_provisioned_concurrency = 0` (no warm cost)

Override example:

```bash
terraform apply -var='api_throttle_rate=5000' -var='api_throttle_burst=2000'
```

### 2. Deploy API code (rate limiter + cache headers)

```bash
./scripts/deploy-aws.sh code
```

### 3. Frontend

Restart Expo (cache is client-side; no extra env vars):

```bash
cd frontend && npx expo start --clear
```

### 4. Optional: warm Lambda (cold starts)

**Only if** first requests feel multi-second after idle:

1. Lambda console → your API function  
2. **Versions** → Publish new version  
3. **Aliases** → create `live` → point at version  
4. **Provisioned concurrency** on alias = `2` (start small)  
5. Point API Gateway integration at the alias ARN (advanced)

CodeBuild currently deploys `$LATEST`, so PC is optional and manual—skip until you feel cold starts.

### 5. Optional: own media on CloudFront

When meditation audio lives in **your** S3 (not Pixabay/Unsplash):

1. S3 private bucket  
2. CloudFront + OAC  
3. Put CF URLs in seed data  

No Support ticket.

## When to use Service Quotas (not Support chat)

Only if CloudWatch shows **429s** after raising stage throttle:

1. AWS Console → **Service Quotas**  
2. API Gateway / Lambda / Bedrock  
3. **Request increase** (form)

Contact **AWS Support** only if a quota request is denied or the account is blocked.

## What we did **not** do (not needed yet)

- Fargate / Docker  
- WAF (add in Console when you go public marketing)  
- Multi-region  
- Redis  

## Verify after deploy

```bash
# Stage throttle (console): API Gateway → Stages → $default
# Rate limit table exists: DynamoDB → christcalm-*-rate-limits
# Catalog headers: curl -I "$API_URL/api/emotions" | grep -i cache
# Client: open Home twice — second load should skip network for emotions (or be instant)
```

## AI cost guard (already on)

- Monthly: `AI_MONTHLY_LIMIT` (default 100)  
- Hourly burst: `AI_LIMIT` / `AI_WINDOW` in `rate_limit.py`  
- Watch **Cost Explorer → Bedrock**

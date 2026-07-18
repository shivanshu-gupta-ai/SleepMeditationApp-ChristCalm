"""
Apple Sign-In (Cognito federation) checks against live preview.

What we can automate without a real Apple ID interactive login:
  1. API /auth/config exposes apple_enabled
  2. Cognito app client lists SignInWithApple
  3. Cognito IdP exists with expected Services ID
  4. Hosted UI authorize → redirects to appleid.apple.com
  5. Optional: Apple client_secret JWT is accepted (invalid_grant on dummy code)

What still requires a human (Apple Developer Portal + device):
  - Tap "Sign in with Apple" in the app and complete Face ID / password
  - If authorize returns invalid_client, configure Services ID domains/return URLs
    (see config/auth/README.md)
"""

from __future__ import annotations

import os
import re
import time
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

import pytest
import requests
from dotenv import load_dotenv

from cognito_helpers import (
    BASE_URL,
    CLIENT_ID,
    POOL_ID,
    REGION,
    cognito_client,
    cognito_env_ready,
)

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / "frontend" / ".env")
load_dotenv(ROOT / "backend" / ".env")

DOMAIN = (os.environ.get("EXPO_PUBLIC_COGNITO_DOMAIN") or "").replace("https://", "").replace("http://", "")
EXPECTED_SERVICES_ID = "com.christcalm.app.signin"
COGNITO_RETURN_URL = (
    f"https://{DOMAIN}/oauth2/idpresponse" if DOMAIN else ""
)

pytestmark = pytest.mark.skipif(
    not cognito_env_ready() or not DOMAIN,
    reason="Set frontend env via ./scripts/sync-env-from-aws.sh",
)


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
            ),
            "Accept": "text/html,application/xhtml+xml,application/json",
        }
    )
    return s


class TestAppleConfigSurface:
    def test_api_reports_apple_enabled(self, session):
        r = session.get(f"{BASE_URL}/api/auth/config", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["provider"] == "cognito"
        assert data["apple_enabled"] is True, (
            "APPLE_SERVICES_ID missing/unset in SSM — seed with "
            "./scripts/seed-apple-ssm-once.sh"
        )
        assert data.get("domain") == DOMAIN or data.get("domain") == f"https://{DOMAIN}"
        assert data["client_id"] == CLIENT_ID
        assert data["user_pool_id"] == POOL_ID

    def test_cognito_client_supports_apple(self):
        client = cognito_client()
        resp = client.describe_user_pool_client(UserPoolId=POOL_ID, ClientId=CLIENT_ID)
        upc = resp["UserPoolClient"]
        providers = upc.get("SupportedIdentityProviders") or []
        assert "SignInWithApple" in providers
        assert "COGNITO" in providers
        callbacks = upc.get("CallbackURLs") or []
        assert any("oauth" in u for u in callbacks), callbacks

    def test_cognito_apple_idp_exists(self):
        client = cognito_client()
        resp = client.describe_identity_provider(
            UserPoolId=POOL_ID,
            ProviderName="SignInWithApple",
        )
        idp = resp["IdentityProvider"]
        details = idp.get("ProviderDetails") or {}
        assert details.get("client_id") == EXPECTED_SERVICES_ID
        assert details.get("team_id")
        assert details.get("key_id")
        mapping = idp.get("AttributeMapping") or {}
        assert mapping.get("email") == "email"
        assert mapping.get("username") == "sub"


class TestAppleHostedUiHandshake:
    def test_authorize_redirects_to_apple(self, session):
        """Cognito must hand off to Apple (not error before federation)."""
        redirect_uri = "http://localhost:8081/oauth"
        # Static S256 challenge (dummy — we only check the redirect hop)
        code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        url = (
            f"https://{DOMAIN}/oauth2/authorize"
            f"?client_id={CLIENT_ID}"
            f"&response_type=code"
            f"&scope=openid+email+profile"
            f"&redirect_uri={quote(redirect_uri, safe='')}"
            f"&identity_provider=SignInWithApple"
            f"&code_challenge={code_challenge}"
            f"&code_challenge_method=S256"
        )

        r = session.get(url, allow_redirects=False, timeout=20)
        assert r.status_code in (301, 302, 303, 307, 308), (
            f"Expected redirect, got {r.status_code}: {r.text[:400]}"
        )
        location = r.headers.get("Location") or ""
        assert "appleid.apple.com" in location, location
        parsed = urlparse(location)
        qs = parse_qs(parsed.query)
        assert qs.get("client_id", [None])[0] == EXPECTED_SERVICES_ID
        assert qs.get("redirect_uri", [None])[0] == COGNITO_RETURN_URL

    def test_apple_authorize_page_accepts_client(self, session):
        """
        Cognito → Apple authorize hop.

        Success: Apple serves a sign-in page without invalid_client.
        Failure modes (Apple Developer Portal, not AWS):
          - invalid_client in boot_args
          - redirect to apple.com/filenotfound
        """
        redirect_uri = "http://localhost:8081/oauth"
        code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        url = (
            f"https://{DOMAIN}/oauth2/authorize"
            f"?client_id={CLIENT_ID}"
            f"&response_type=code"
            f"&scope=openid+email+profile"
            f"&redirect_uri={quote(redirect_uri, safe='')}"
            f"&identity_provider=SignInWithApple"
            f"&code_challenge={code_challenge}"
            f"&code_challenge_method=S256"
        )

        # First hop must be Cognito → appleid.apple.com
        r0 = session.get(url, allow_redirects=False, timeout=20)
        loc = r0.headers.get("Location") or ""
        assert r0.status_code in (301, 302, 303, 307, 308), r0.status_code
        assert "appleid.apple.com/auth/authorize" in loc, loc

        # Fetch Apple authorize page without following further redirects
        # (failed clients sometimes bounce to apple.com/filenotfound)
        r = session.get(loc, allow_redirects=False, timeout=25)
        if r.status_code in (301, 302, 303, 307, 308):
            next_loc = r.headers.get("Location") or ""
            if "filenotfound" in next_loc or "invalid_client" in next_loc:
                pytest.fail(_apple_portal_fail_msg("redirect to " + next_loc))
            # Follow one hop only if still on appleid
            if "appleid.apple.com" in next_loc:
                r = session.get(next_loc, allow_redirects=False, timeout=25)

        body = r.text or ""
        final = str(r.url) if not r.is_redirect else (r.headers.get("Location") or "")

        if "filenotfound" in final or "filenotfound" in body.lower():
            pytest.fail(_apple_portal_fail_msg("filenotfound"))

        invalid = re.search(
            r'"errorCode"\s*:\s*"invalid_client"|errorMessage"\s*:\s*"Invalid client\."',
            body,
            re.I,
        )
        if invalid:
            pytest.fail(_apple_portal_fail_msg("invalid_client in authorize HTML"))

        # Success signals: Apple account sign-in shell without client error
        assert "Sign in to Apple" in body or "accountName" in body or "appleid" in body.lower()


def _apple_portal_fail_msg(detail: str) -> str:
    return (
        f"Apple authorize rejected client ({detail}). "
        "AWS Cognito + SSM credentials are OK (client_secret JWT works), "
        "but Apple Developer → Identifiers → Services ID must list:\n"
        f"  Services ID: {EXPECTED_SERVICES_ID}\n"
        f"  Domains: {DOMAIN}\n"
        f"  Return URLs: {COGNITO_RETURN_URL}\n"
        "Primary App ID must have Sign in with Apple enabled. "
        "See config/auth/README.md section A."
    )

class TestAppleClientSecretOptional:
    def test_client_secret_jwt_accepted_by_apple(self):
        """
        Uses SSM private key to mint a client_secret and call Apple's token endpoint.
        invalid_grant (bad code) = credentials good.
        invalid_client = key/team/services id mismatch.
        Skips if cryptography/PyJWT/AWS unavailable.
        """
        try:
            import boto3
            import jwt
            from cryptography.hazmat.primitives import serialization  # noqa: F401
        except ImportError:
            pytest.skip("cryptography + PyJWT required for client_secret check")

        ssm = boto3.client("ssm", region_name=REGION)
        prefix = os.environ.get("SSM_PREFIX", "/christcalm-preview").rstrip("/")

        def getp(key: str) -> str:
            return ssm.get_parameter(Name=f"{prefix}/{key}", WithDecryption=True)[
                "Parameter"
            ]["Value"]

        try:
            services_id = getp("APPLE_SERVICES_ID")
            team_id = getp("APPLE_TEAM_ID")
            key_id = getp("APPLE_KEY_ID")
            private_key = getp("APPLE_PRIVATE_KEY")
        except Exception as e:
            pytest.skip(f"Cannot read Apple SSM params: {e}")

        if services_id in ("", "unset") or private_key in ("", "unset"):
            pytest.skip("Apple SSM placeholders not seeded")

        now = int(time.time())
        token = jwt.encode(
            {
                "iss": team_id,
                "iat": now,
                "exp": now + 3600,
                "aud": "https://appleid.apple.com",
                "sub": services_id,
            },
            private_key,
            algorithm="ES256",
            headers={"kid": key_id, "alg": "ES256"},
        )

        resp = requests.post(
            "https://appleid.apple.com/auth/token",
            data={
                "client_id": services_id,
                "client_secret": token,
                "code": "e2e-invalid-code",
                "grant_type": "authorization_code",
                "redirect_uri": COGNITO_RETURN_URL,
            },
            timeout=20,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        body = resp.text
        assert resp.status_code == 400, body
        assert "invalid_client" not in body, (
            f"Apple rejected client_secret (team/key/services mismatch): {body}"
        )
        assert "invalid_grant" in body, body

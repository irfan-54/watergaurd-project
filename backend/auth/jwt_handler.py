from jose import jwt

def decode_access_token(token: str):
    return jwt.get_unverified_claims(token)
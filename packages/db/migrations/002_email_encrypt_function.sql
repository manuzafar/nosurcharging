-- Insert email signup with server-side encryption via pgcrypto.
-- Called from captureEmail server action.
-- The encryption key is passed from the app, never stored in DB.

CREATE OR REPLACE FUNCTION insert_email_signup(
  p_email text,
  p_encryption_key text,
  p_session_id uuid,
  p_country_code text,
  p_signup_source text,
  p_assessment_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO email_signups (
    email_encrypted,
    country_code,
    signup_source,
    assessment_id
  ) VALUES (
    pgp_sym_encrypt(p_email, p_encryption_key),
    p_country_code,
    p_signup_source,
    p_assessment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

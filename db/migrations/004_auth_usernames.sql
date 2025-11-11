ALTER TABLE auth_users ADD COLUMN username TEXT;

UPDATE auth_users
SET username = CASE
  WHEN email IS NULL OR trim(email) = '' THEN concat('user_', substr(id::text, 1, 8))
  ELSE split_part(lower(email), '@', 1)
END;

WITH duplicates AS (
  SELECT
    id,
    username,
    row_number() OVER (PARTITION BY lower(username) ORDER BY created_at, id) AS rn
  FROM auth_users
)
UPDATE auth_users AS u
SET username = concat(u.username, '_', d.rn - 1)
FROM duplicates AS d
WHERE u.id = d.id AND d.rn > 1;

UPDATE auth_users
SET username = regexp_replace(lower(username), '[^a-z0-9._-]', '-', 'g');

WITH duplicates AS (
  SELECT
    id,
    username,
    row_number() OVER (PARTITION BY lower(username) ORDER BY created_at, id) AS rn
  FROM auth_users
)
UPDATE auth_users AS u
SET username = concat(u.username, '_', d.rn - 1)
FROM duplicates AS d
WHERE u.id = d.id AND d.rn > 1;

ALTER TABLE auth_users
  ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX auth_users_username_lower_idx
  ON auth_users (lower(username));

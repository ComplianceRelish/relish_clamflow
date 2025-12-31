"""
Generate bcrypt hash for password: Phes0061
Run this to get the hash, then update Supabase
"""
import bcrypt

password = "Phes0061"
salt = bcrypt.gensalt(rounds=12)
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)

print("=" * 60)
print("Password:", password)
print("=" * 60)
print("Bcrypt Hash:")
print(hashed.decode('utf-8'))
print("=" * 60)
print("\nRun this SQL in Supabase:")
print(f"""
UPDATE users 
SET hashed_password = '{hashed.decode('utf-8')}'
WHERE username = 'SA_Motty';
""")
print("=" * 60)

# sync_to_supabase.py
import psycopg2
from supabase import create_client
import os
from datetime import datetime

# Supabase Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Local DB
LOCAL_DB_CONN = "dbname=clamflow user=pi host=localhost"

def sync_fp_forms():
    conn = psycopg2.connect(LOCAL_DB_CONN)
    cur = conn.cursor()
    cur.execute("SELECT * FROM fp_forms WHERE synced = false")
    rows = cur.fetchall()
    for row in rows:
        data = {
            "id": str(row[0]),
            "fp_process": row[1],
            "pack_size_kg": row[2],
            "final_weight_kg": row[3],
            "tray_rfid_tags": row[4],
            "status": row[10]
        }
        supabase.table("inventory").upsert(data).execute()
    cur.execute("UPDATE fp_forms SET synced = true WHERE synced = false")
    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    sync_fp_forms()
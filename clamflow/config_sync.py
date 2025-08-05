# config_sync.py
from datetime import datetime, timedelta  # <-- Add 'timedelta' here
import psycopg2
import requests

# HO (Admin) DB
HO_DB = "dbname=clamflow_ho user=admin host=ho-server"

# PPC (On-Premise) DB
PPC_DB = "dbname=clamflow_ppc user=pi host=ppc-server"

# Sync URL at PPC
PPC_SYNC_ENDPOINT = "http://ppc-server:8000/api/config/sync"

def fetch_config_from_ho():
    conn = psycopg2.connect(HO_DB)
    cur = conn.cursor()
    cur.execute("SELECT * FROM config_settings WHERE last_updated > %s", (datetime.utcnow() - timedelta(minutes=5),))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def push_to_ppc(config_data):
    try:
        response = requests.post(PPC_SYNC_ENDPOINT, json=config_data)
        return response.status_code == 200
    except:
        return False

if __name__ == "__main__":
    config = fetch_config_from_ho()
    if config:
        push_to_ppc(config)
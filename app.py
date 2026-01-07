from flask import Flask, request, jsonify
from flask_cors import CORS

from solana.rpc.api import Client
from solana.publickey import PublicKey

app = Flask(__name__)
CORS(app)

SOLANA_RPC = "https://api.devnet.solana.com"
client = Client(SOLANA_RPC)

TOKEN_MINT = PublicKey("8DwNAnxonWvdXRCE6AhsZvox1kJBYBMzpBJezAYc3aiQ")
MIN_REQUIRED = 100

@app.route("/healthz")
def health():
    return jsonify({"status": "ok"})

@app.route("/check-access", methods=["POST"])
def check_access():
    data = request.json
    wallet_address = data.get("wallet")

    if not wallet_address:
        return jsonify({"error": "Wallet missing"}), 400

    owner = PublicKey(wallet_address)

    try:
        resp = client.get_token_accounts_by_owner(
            owner,
            {"mint": TOKEN_MINT}
        )

        balance = 0
        for acc in resp["result"]["value"]:
            amount = int(acc["account"]["data"]["parsed"]["info"]["tokenAmount"]["amount"])
            decimals = acc["account"]["data"]["parsed"]["info"]["tokenAmount"]["decimals"]
            balance += amount / (10 ** decimals)

        return jsonify({
            "wallet": wallet_address,
            "balance": balance,
            "allowed": balance >= MIN_REQUIRED
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()

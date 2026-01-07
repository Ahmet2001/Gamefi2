from flask import Flask, request, jsonify
from flask_cors import CORS
from solana.rpc.api import Client
from solana.publickey import PublicKey

from config import SOLANA_RPC, TOKEN_MINT, MINIMUM_REQUIRED

app = Flask(__name__)
CORS(app)

solana_client = Client(SOLANA_RPC)

# -------------------------------------------------
# SAĞLIK KONTROLÜ
# -------------------------------------------------
@app.route("/")
def health():
    return "Gamefi2 backend is running!"

# -------------------------------------------------
# TOKEN ERİŞİM KONTROLÜ
# -------------------------------------------------
@app.route("/check-access", methods=["POST"])
def check_access():
    data = request.get_json()
    wallet = data.get("wallet")

    if not wallet:
        return jsonify({"error": "Wallet missing"}), 400

    try:
        owner = PublicKey(wallet)
        mint = PublicKey(TOKEN_MINT)

        response = solana_client.get_token_accounts_by_owner(
            owner,
            {"mint": mint}
        )

        balance = 0

        for acc in response["result"]["value"]:
            amount = int(
                acc["account"]["data"]["parsed"]["info"]
                ["tokenAmount"]["amount"]
            )
            decimals = int(
                acc["account"]["data"]["parsed"]["info"]
                ["tokenAmount"]["decimals"]
            )
            balance += amount / (10 ** decimals)

        allowed = balance >= MINIMUM_REQUIRED

        return jsonify({
            "allowed": allowed,
            "balance": balance,
            "required": MINIMUM_REQUIRED
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)

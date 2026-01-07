from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Gamefi2 backend is running!"

@app.route("/healthz")
def health():
    return {"status": "ok"}

from flask import Flask

app = Flask(__name__)

@app.route("/api/status")
def status():
    return {"status": "backend alive"}

if __name__ == "__main__":
    app.run()

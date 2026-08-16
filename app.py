from flask import Flask, jsonify, render_template
import requests
import random

app = Flask(__name__)

API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json"

def fetch_history():
    try:
        r = requests.get(
            API_URL,
            timeout=5,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        r.raise_for_status()
        return r.json().get("data", {}).get("list", [])
    except Exception:
        return []

def size_of(n):
    return "SMALL" if int(n) <= 4 else "BIG"

def color_of(n):
    return {
        0: "VIOLET", 1: "RED", 2: "GREEN", 3: "RED", 4: "GREEN",
        5: "VIOLET", 6: "RED", 7: "GREEN", 8: "RED", 9: "GREEN"
    }.get(int(n), "UNKNOWN")

def analyze(data):
    # Converted from the uploaded bot's LethalAI.analyze logic.
    # This is a heuristic, not a guaranteed prediction or a way to alter BDWIN.
    if not data:
        size = random.choice(["BIG", "SMALL"])
        num = random.randint(0, 9)
        conf = random.randint(85, 92)
    else:
        last_5 = [size_of(x["number"]) for x in data[:5]]
        if len(last_5) >= 3 and last_5[0] == last_5[1] == last_5[2]:
            size = last_5[0]
            conf = random.randint(95, 99)
            num = random.randint(5, 9) if size == "BIG" else random.randint(0, 4)
        elif len(last_5) >= 2 and last_5[0] != last_5[1]:
            size = "BIG" if last_5[0] == "SMALL" else "SMALL"
            conf = random.randint(88, 94)
            num = random.randint(5, 9) if size == "BIG" else random.randint(0, 4)
        else:
            big = last_5.count("BIG")
            small = last_5.count("SMALL")
            size = "SMALL" if big > small else "BIG"
            conf = random.randint(85, 90)
            num = random.randint(5, 9) if size == "BIG" else random.randint(0, 4)
    return {
        "size": size,
        "number": num,
        "color": color_of(num),
        "confidence": conf
    }

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/api/live")
def live():
    data = fetch_history()
    if not data:
        return jsonify({"ok": False, "error": "Game history is temporarily unavailable."}), 503

    latest = data[0]
    prediction = analyze(data)
    return jsonify({
        "ok": True,
        "period": str(latest["issueNumber"]),
        "latest_number": int(latest["number"]),
        "latest_size": size_of(latest["number"]),
        "latest_color": color_of(latest["number"]),
        "prediction": prediction,
        "history": [
            {
                "period": str(x["issueNumber"]),
                "number": int(x["number"]),
                "size": size_of(x["number"]),
                "color": color_of(x["number"])
            }
            for x in data[:10]
        ]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

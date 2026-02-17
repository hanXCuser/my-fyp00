import requests

# Example: Get demand forecast for a specific product
url = "http://localhost:5001/api/forecasting/demand"
params = {
    "product_id": "Electronic accessories",  # Change to your product name
    "days": 14
}

response = requests.get(url, params=params)

print("Status Code:", response.status_code)
print("Response JSON:")
print(response.json())

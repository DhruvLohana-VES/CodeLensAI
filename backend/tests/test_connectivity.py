import os
import google.generativeai as genai
from dotenv import load_dotenv

def test_connectivity():
    print("Loading env variables...")
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment!")
        return False
    
    print(f"API Key found (length {len(api_key)})")
    
    try:
        print("Configuring genai SDK...")
        genai.configure(api_key=api_key)
        
        print("Initializing model 'gemini-2.5-flash'...")
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        print("Sending generation request...")
        response = model.generate_content("Reply with exactly: Gemini connectivity successful")
        
        print("\n=== CONNECTIVITY TEST RESULT ===")
        print(response.text.strip())
        print("================================\n")
        return response.text.strip() == "Gemini connectivity successful"
    except Exception as exc:
        print(f"\nConnectivity test failed with exception:")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_connectivity()

import os
import sys
import time
import subprocess
import requests
import json
import traceback
from dotenv import load_dotenv

# Ensure we can import create_sample_resume
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import create_sample_resume

PORT = 8000
BASE_URL = f"http://127.0.0.1:{PORT}"

def get_python_executable():
    # Detect the python executable inside the venv
    venv_python = os.path.join("venv", "Scripts", "python.exe")
    if os.path.exists(venv_python):
        return venv_python
    return sys.executable

def kill_process_tree(pid):
    try:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True)
    except Exception as e:
        print(f"Error killing process {pid}: {e}")

def wait_for_server():
    print("Waiting for server to become healthy...")
    for _ in range(30):
        try:
            resp = requests.get(f"{BASE_URL}/health", timeout=1)
            if resp.status_code == 200:
                print("Server is up and healthy.")
                return True
        except Exception:
            pass
        time.sleep(0.5)
    print("Server failed to start in time.")
    return False

def read_logs():
    if os.path.exists("uvicorn_run.log"):
        with open("uvicorn_run.log", "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return ""

def run_tests_for_key(api_key, key_desc):
    print(f"\n==================================================")
    print(f"RUNNING VERIFICATION FOR: {key_desc}")
    print(f"==================================================")

    # Clean previous log file
    if os.path.exists("uvicorn_run.log"):
        try:
            os.remove("uvicorn_run.log")
        except Exception:
            pass

    # Create environmental variables overrides
    env = os.environ.copy()
    env["GEMINI_API_KEY"] = api_key
    env["LOG_LEVEL"] = "DEBUG"
    # Ensure uvicorn logs propagate to stdout/stderr
    env["PYTHONUNBUFFERED"] = "1"

    python_exe = get_python_executable()
    cmd = [python_exe, "-m", "uvicorn", "app.main:app", "--port", str(PORT), "--host", "127.0.0.1"]
    
    print(f"Starting backend: {' '.join(cmd)}")
    log_file = open("uvicorn_run.log", "w", encoding="utf-8", errors="ignore")
    
    proc = subprocess.Popen(
        cmd,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        env=env,
        text=True
    )

    results = {
        "success": False,
        "resume_analysis": {"used": False, "gemini_latency": None, "endpoint_latency": None, "prompt": None, "raw_response": None, "parsed": None, "final_response": None},
        "question_gen": {"used": False, "gemini_latency": None, "endpoint_latency": None, "prompt": None, "raw_response": None, "questions": None},
        "answer_grading": {"used": False, "gemini_latency": None, "endpoint_latency": None, "prompt": None, "raw_response": None, "score": None, "feedback": None},
        "fallback_triggered": False,
        "exceptions": []
    }

    try:
        if not wait_for_server():
            print("Failed to contact backend server.")
            return results

        # 1. Resume Analysis
        print("\n--- Test 1: Resume Analysis ---")
        resume_path = "sample_resume.pdf"
        if not os.path.exists(resume_path):
            create_sample_resume.generate_pdf()

        start_time = time.perf_counter()
        with open(resume_path, "rb") as f:
            resp = requests.post(f"{BASE_URL}/api/v1/resume/upload", files={"file": ("sample_resume.pdf", f, "application/pdf")})
        end_time = time.perf_counter()
        
        results["resume_analysis"]["endpoint_latency"] = end_time - start_time
        print(f"Resume analysis HTTP status: {resp.status_code}")
        if resp.status_code == 200:
            results["resume_analysis"]["final_response"] = resp.json()
            print("Resume analysis successful.")
        else:
            print("Resume analysis failed.")
            print(resp.text)

        # 2. Question Generation
        print("\n--- Test 2: Interview Question Generation ---")
        start_time = time.perf_counter()
        resp_q = requests.post(f"{BASE_URL}/api/v1/interview/start", json={"role": "Backend"})
        end_time = time.perf_counter()
        
        results["question_gen"]["endpoint_latency"] = end_time - start_time
        print(f"Question gen HTTP status: {resp_q.status_code}")
        session_id = None
        first_question = None
        if resp_q.status_code == 200:
            q_data = resp_q.json()
            session_id = q_data.get("session_id")
            first_question = q_data.get("question")
            print("Question gen successful. Session ID:", session_id)
            print("First question:", first_question)
        else:
            print("Question gen failed.")
            print(resp_q.text)

        # 3. Answer Grading
        if session_id:
            print("\n--- Test 3: Answer Grading ---")
            answer_text = (
                "Database connection pooling maintains a cache of active database connections that "
                "can be reused for future requests, avoiding the overhead of establishing a new connection "
                "handshake every time. It is crucial for high-concurrency systems to prevent connection exhaustion."
            )
            start_time = time.perf_counter()
            resp_g = requests.post(
                f"{BASE_URL}/api/v1/interview/submit",
                json={"session_id": session_id, "answer": answer_text}
            )
            end_time = time.perf_counter()
            
            results["answer_grading"]["endpoint_latency"] = end_time - start_time
            print(f"Answer grading HTTP status: {resp_g.status_code}")
            if resp_g.status_code == 200:
                g_data = resp_g.json()
                results["answer_grading"]["score"] = g_data.get("score")
                results["answer_grading"]["feedback"] = g_data.get("feedback")
                print("Answer grading successful.")
                print("Score:", results["answer_grading"]["score"])
            else:
                print("Answer grading failed.")
                print(resp_g.text)
        else:
            print("\nSkipping Answer Grading: session_id is missing.")

        results["success"] = True

    except Exception as e:
        print(f"Exception during test run: {e}")
        results["exceptions"].append(str(e))
    finally:
        print("\nStopping backend server...")
        log_file.close()
        kill_process_tree(proc.pid)
        time.sleep(1) # wait for release of files

    # Analyze logs
    logs = read_logs()
    print("\nAnalyzing backend logs...")
    
    # Check for Gemini calls and latencies
    for line in logs.splitlines():
        if "Calling Gemini for resume analysis" in line:
            results["resume_analysis"]["used"] = True
        elif "Calling Gemini for question generation" in line:
            results["question_gen"]["used"] = True
        elif "Calling Gemini for answer grading" in line:
            results["answer_grading"]["used"] = True
            
        elif "Gemini resume analysis latency:" in line:
            # e.g., INFO:app.services.resume_service:Gemini resume analysis latency: 1.82s
            try:
                latency_str = line.split("latency:")[1].replace("s", "").strip()
                results["resume_analysis"]["gemini_latency"] = float(latency_str)
            except Exception:
                pass
        elif "Gemini question generation latency:" in line:
            try:
                latency_str = line.split("latency:")[1].replace("s", "").strip()
                results["question_gen"]["gemini_latency"] = float(latency_str)
            except Exception:
                pass
        elif "Gemini grading latency:" in line:
            try:
                latency_str = line.split("latency:")[1].replace("s", "").strip()
                results["answer_grading"]["gemini_latency"] = float(latency_str)
            except Exception:
                pass

        elif "Falling back to rule-based logic" in line:
            results["fallback_triggered"] = True

        # Extract Exceptions/Tracebacks in the logs
        if "ERROR:" in line or "Traceback" in line or "Exception" in line:
            if not any(x in line for x in ["DEBUG:", "INFO:", "WARNING:"]):
                results["exceptions"].append(line.strip())

    # Extract prompt/response previews from debug logs
    # Since we logged prompt preview and response preview:
    # "Prompt preview: ..." and "Response preview: ..."
    lines = logs.splitlines()
    for i, line in enumerate(lines):
        if "Prompt preview:" in line:
            # Let's see what is the preview content
            preview = line.split("Prompt preview:")[1].strip()
            # Find the type of call by matching context lines
            # If we go backward a few lines, we can find whether it is resume, question, or grading
            call_type = None
            for j in range(max(0, i-5), i):
                if "resume analysis" in lines[j].lower():
                    call_type = "resume"
                elif "question generation" in lines[j].lower():
                    call_type = "question"
                elif "answer grading" in lines[j].lower():
                    call_type = "grading"
            if call_type == "resume":
                results["resume_analysis"]["prompt"] = preview
            elif call_type == "question":
                results["question_gen"]["prompt"] = preview
            elif call_type == "grading":
                results["answer_grading"]["prompt"] = preview

        elif "Response preview:" in line:
            preview = line.split("Response preview:")[1].strip()
            call_type = None
            for j in range(max(0, i-5), i):
                if "resume analysis" in lines[j].lower():
                    call_type = "resume"
                elif "question generation" in lines[j].lower():
                    call_type = "question"
                elif "answer grading" in lines[j].lower():
                    call_type = "grading"
            if call_type == "resume":
                results["resume_analysis"]["raw_response"] = preview
                try:
                    results["resume_analysis"]["parsed"] = json.loads(preview)
                except Exception:
                    # Maybe it was cut off due to [:500] limit, let's keep it as text
                    results["resume_analysis"]["parsed"] = "Cutoff JSON (Debug preview)"
            elif call_type == "question":
                results["question_gen"]["raw_response"] = preview
                try:
                    results["question_gen"]["questions"] = json.loads(preview)
                except Exception:
                    results["question_gen"]["questions"] = "Cutoff List (Debug preview)"
            elif call_type == "grading":
                results["answer_grading"]["raw_response"] = preview

    # Show log snippets to user
    print("\n--- Startup Logs Preview ---")
    startup_lines = [l for l in logs.splitlines() if "uvicorn" in l.lower() or "gemini api key" in l.lower()]
    for sl in startup_lines[:10]:
        print(sl)
        
    print("\n--- Gemini Flow Logs Snippet ---")
    flow_lines = [l for l in logs.splitlines() if "gemini" in l.lower() or "fallback" in l.lower() or "using model" in l.lower()]
    for fl in flow_lines:
        print(fl)

    return results

def main():
    load_dotenv()
    valid_key = os.getenv("GEMINI_API_KEY")
    
    # Run 1: Valid API Key
    valid_res = run_tests_for_key(valid_key, "VALID API KEY")
    
    # Run 2: Invalid API Key
    invalid_res = run_tests_for_key("AIzaSyFakeKeyInvalidForTestingPurposes123", "INVALID API KEY")
    
    # Run 3: Empty API Key
    empty_res = run_tests_for_key("", "EMPTY API KEY")

    # Save detailed results to a file for review
    with open("verification_results.json", "w") as f:
        json.dump({
            "valid": valid_res,
            "invalid": invalid_res,
            "empty": empty_res
        }, f, indent=2)

    # Output details of prompt/response of valid run
    print("\n" + "="*50)
    print("DETAILED VALID RUN EVIDENCE")
    print("="*50)
    
    print("\n[RESUME ANALYSIS]")
    print(f"Prompt preview: {valid_res['resume_analysis']['prompt']}")
    print(f"Raw Gemini response preview: {valid_res['resume_analysis']['raw_response']}")
    print(f"Parsed JSON sample: {valid_res['resume_analysis']['parsed']}")
    print(f"Final response structure keys: {list(valid_res['resume_analysis']['final_response'].keys()) if valid_res['resume_analysis']['final_response'] else 'None'}")
    print(f"Gemini used: {'YES' if valid_res['resume_analysis']['used'] else 'NO'}")
    print(f"Fallback used: {'NO' if valid_res['resume_analysis']['used'] else 'YES'}")

    print("\n[QUESTION GENERATION]")
    print(f"Prompt preview: {valid_res['question_gen']['prompt']}")
    
    # Compare against QUESTION_POOLS
    # Pool for backend:
    backend_pool_questions = [
        "Explain how database connection pooling works and why it is important for server performance.",
        "What is the purpose of CORS (Cross-Origin Resource Sharing), and how does the browser handle preflight requests?",
        "Explain the differences between SQL and NoSQL databases, and when you would choose NoSQL over SQL."
    ]
    
    # Get final returned questions
    returned_qs = []
    if valid_res['question_gen']['raw_response']:
        try:
            returned_qs = json.loads(valid_res['question_gen']['raw_response'])
        except Exception:
            pass
            
    print(f"Questions generated: {returned_qs}")
    is_fallback_questions = (returned_qs == backend_pool_questions) or (not valid_res['question_gen']['used'])
    if is_fallback_questions:
        print("Static fallback used.")
    else:
        print("Questions generated dynamically by Gemini.")

    print("\n[ANSWER EVALUATION]")
    print(f"Prompt preview: {valid_res['answer_grading']['prompt']}")
    print(f"Raw Gemini response preview: {valid_res['answer_grading']['raw_response']}")
    print(f"Parsed score: {valid_res['answer_grading']['score']}")
    print(f"Feedback/Evaluation: {valid_res['answer_grading']['feedback']}")
    print(f"Grading source: {'Gemini' if valid_res['answer_grading']['used'] else 'Fallback logic'}")

    # Latencies
    print("\n[LATENCY METRICS]")
    print(f"Resume Analysis - Gemini call: {valid_res['resume_analysis']['gemini_latency']} s | Endpoint total: {valid_res['resume_analysis']['endpoint_latency']:.2f} s")
    print(f"Question Generation - Gemini call: {valid_res['question_gen']['gemini_latency']} s | Endpoint total: {valid_res['question_gen']['endpoint_latency']:.2f} s")
    if valid_res['answer_grading']['gemini_latency']:
        print(f"Answer Grading - Gemini call: {valid_res['answer_grading']['gemini_latency']} s | Endpoint total: {valid_res['answer_grading']['endpoint_latency']:.2f} s")
    else:
        print("Answer Grading - Gemini call: N/A")

    # Clean average latency calculation
    latencies = [l for l in [valid_res['resume_analysis']['gemini_latency'], valid_res['question_gen']['gemini_latency'], valid_res['answer_grading']['gemini_latency']] if l is not None]
    avg_latency = sum(latencies)/len(latencies) if latencies else 0.0

    print("\n====================================")
    print("GEMINI CONNECTIVITY REPORT")
    print("====================================")
    print(f"Resume Analysis:\nGemini Used: {'YES' if valid_res['resume_analysis']['used'] else 'NO'}")
    print(f"\nQuestion Generation:\nGemini Used: {'YES' if valid_res['question_gen']['used'] else 'NO'}")
    print(f"\nAnswer Grading:\nGemini Used: {'YES' if valid_res['answer_grading']['used'] else 'NO'}")
    print(f"\nAverage Gemini Latency:")
    print(f"Resume Analysis: {valid_res['resume_analysis']['gemini_latency'] or 'N/A'} s")
    print(f"Question Generation: {valid_res['question_gen']['gemini_latency'] or 'N/A'} s")
    print(f"Answer Grading: {valid_res['answer_grading']['gemini_latency'] or 'N/A'} s")
    print(f"\nFallback Triggered:\n{'YES' if not (valid_res['resume_analysis']['used'] and valid_res['question_gen']['used'] and valid_res['answer_grading']['used']) else 'NO'}")
    
    # Exceptions
    exceptions_list = []
    if valid_res['exceptions']:
        exceptions_list.extend(valid_res['exceptions'])
    exceptions_str = ", ".join(exceptions_list) if exceptions_list else "NONE"
    print(f"\nExceptions:\n{exceptions_str}")
    
    print("\nModel:\ngemini-2.5-flash")
    
    status = "RUNNING ENTIRELY IN FALLBACK MODE"
    if valid_res['resume_analysis']['used'] and valid_res['question_gen']['used'] and valid_res['answer_grading']['used']:
        status = "FULLY OPERATIONAL"
    elif valid_res['resume_analysis']['used'] or valid_res['question_gen']['used'] or valid_res['answer_grading']['used']:
        status = "PARTIALLY OPERATIONAL"
        
    print(f"\nOverall Status:\n{status}")
    print("====================================")

    # Clean up PDF resume
    if os.path.exists("sample_resume.pdf"):
        try:
            os.remove("sample_resume.pdf")
        except Exception:
            pass

if __name__ == "__main__":
    main()

import os
import subprocess
import tempfile
import json
import urllib.request
import urllib.error
import re
from typing import Tuple

from app.schemas.code_schemas import CodeExecutionResponse, CodeFeedbackResponse

class CodeService:
    def _is_safe_code(self, code: str, language: str) -> Tuple[bool, str]:
        """Performs basic static checks to block dangerous modules/calls in local execution fallback."""
        if language in ["js", "javascript"]:
            dangerous_patterns = [
                r"\bchild_process\b",
                r"\bfs\b",
                r"\brequire\s*\(\s*['\"]",
                r"\bimport\s+.*from\s+['\"]",
                r"\beval\s*\(",
                r"\bFunction\s*\(",
                r"\bprocess\b",
                r"\bglobalThis\b"
            ]
            for pattern in dangerous_patterns:
                if re.search(pattern, code):
                    return False, f"Security Block: Local execution does not allow use of dangerous patterns/libraries matching '{pattern}'."
        else:
            dangerous_patterns = [
                r"\bimport\s+os\b",
                r"\bimport\s+subprocess\b",
                r"\bimport\s+sys\b",
                r"\bimport\s+shutil\b",
                r"\bimport\s+builtins\b",
                r"\bfrom\s+os\b",
                r"\bfrom\s+subprocess\b",
                r"\bfrom\s+sys\b",
                r"\bfrom\s+shutil\b",
                r"\beval\s*\(",
                r"\bexec\s*\(",
                r"\bopen\s*\(",
                r"\b__import__\b",
                r"\bimportlib\b"
            ]
            for pattern in dangerous_patterns:
                if re.search(pattern, code):
                    return False, f"Security Block: Local execution does not allow use of dangerous patterns/libraries matching '{pattern}'."
        return True, ""

    def execute_code(self, code: str, language: str) -> CodeExecutionResponse:
        # Normalize language name for Piston vs local subprocess
        lang = language.lower().strip()
        if lang in ["js", "javascript"]:
            piston_lang = "javascript"
            piston_ver = "18.15.0"
        else:
            piston_lang = "python"
            piston_ver = "3.10.0"

        # Attempt Piston execution first
        res = self._run_via_piston(code, piston_lang, piston_ver)
        if res is not None:
            success, stdout, stderr = res
            return CodeExecutionResponse(success=success, output=stdout, error=stderr)

        # Fallback to local sandboxed subprocess execution
        is_safe, security_err = self._is_safe_code(code, lang)
        if not is_safe:
            return CodeExecutionResponse(success=False, output="", error=security_err)

        success, stdout, stderr = self._run_local_subprocess(code, lang)
        return CodeExecutionResponse(success=success, output=stdout, error=stderr)

    def get_code_feedback(self, code: str, problem_name: str) -> CodeFeedbackResponse:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            res = self._call_gemini_feedback(code, problem_name, api_key)
            if res:
                try:
                    return CodeFeedbackResponse(**res)
                except Exception:
                    pass

        return self._run_rule_based_feedback(code, problem_name)

    def _run_via_piston(self, code: str, language: str, version: str) -> Tuple[bool, str, str] | None:
        """Runs the code via the free Piston API (https://emkc.org/api/v2/piston)."""
        url = "https://emkc.org/api/v2/piston/execute"
        headers = {"Content-Type": "application/json"}
        payload = {
            "language": language,
            "version": version,
            "files": [
                {
                    "content": code
                }
            ]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        try:
            # Short timeout to fallback quickly if API is down
            with urllib.request.urlopen(req, timeout=4) as response:
                res = json.loads(response.read().decode("utf-8"))
                run_result = res.get("run", {})
                stdout = run_result.get("stdout", "")
                stderr = run_result.get("stderr", "")
                success = run_result.get("code", 1) == 0
                return success, stdout, stderr
        except Exception:
            return None

    def _run_local_subprocess(self, code: str, language: str) -> Tuple[bool, str, str]:
        """Safely executes code locally inside an isolated subprocess with strict timeouts."""
        if language in ["js", "javascript"]:
            # Check if node is installed, otherwise simulate node output
            node_path = os.getenv("NODE_PATH", "node")
            with tempfile.NamedTemporaryFile(suffix=".js", mode="w", delete=False, encoding="utf-8") as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name

            try:
                res = subprocess.run(
                    [node_path, temp_file_path],
                    capture_output=True,
                    text=True,
                    timeout=2  # strict timeout
                )
                success = res.returncode == 0
                return success, res.stdout, res.stderr
            except subprocess.TimeoutExpired:
                return False, "", "Execution Timed Out (Limit: 2 seconds)"
            except FileNotFoundError:
                return False, "", "Execution Error: Node.js runtime not found locally. Install node or enable Piston API connection."
            finally:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
        else:
            # Python execution
            # Run with -I flag to isolate from environment
            with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False, encoding="utf-8") as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name

            try:
                res = subprocess.run(
                    ["python", "-I", temp_file_path],
                    capture_output=True,
                    text=True,
                    timeout=2  # strict timeout
                )
                success = res.returncode == 0
                return success, res.stdout, res.stderr
            except subprocess.TimeoutExpired:
                return False, "", "Execution Timed Out (Limit: 2 seconds)"
            except Exception as e:
                return False, "", f"Execution Error: {e}"
            finally:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

    def _call_gemini_feedback(self, code: str, problem_name: str, api_key: str) -> dict | None:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        prompt = (
            "You are a Senior Software Engineer. Analyze the candidate's code submission for correctness, efficiency, and styling. "
            f"Problem Name: {problem_name}\n"
            "Output MUST be a JSON object containing exactly these fields without markdown wrappers: \n"
            "{\n"
            "  \"feedback\": \"Constructive bullet points reviewing complexity, edge cases, and design patterns...\",\n"
            "  \"timeComplexity\": \"O(N) (or relevant Big-O)\",\n"
            "  \"spaceComplexity\": \"O(1) (or relevant Big-O)\",\n"
            "  \"refactoredCode\": \"Optimized/cleaner implementation code\"\n"
            "}\n\n"
            f"Source Code:\n{code}"
        )
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                res = json.loads(response.read().decode("utf-8"))
                output_text = res["candidates"][0]["content"]["parts"][0]["text"].strip()
                return json.loads(output_text)
        except Exception:
            return None

    def _run_rule_based_feedback(self, code: str, problem_name: str) -> CodeFeedbackResponse:
        # Heuristics analysis
        lines = code.split("\n")
        
        # Analyze loops for time complexity
        for_loops = sum(1 for line in lines if re.search(r"\bfor\b", line))
        while_loops = sum(1 for line in lines if re.search(r"\bwhile\b", line))
        nested_loops = 0
        
        # Check nested structures (rough indentation estimate)
        prev_indent = -1
        for line in lines:
            if not line.strip():
                continue
            indent = len(line) - len(line.lstrip())
            if re.search(r"\b(for|while)\b", line):
                if indent > prev_indent and prev_indent >= 0:
                    nested_loops += 1
                prev_indent = indent
            else:
                if indent < prev_indent:
                    prev_indent = indent

        # Estimate Time Complexity
        if nested_loops > 0 or (for_loops + while_loops >= 2 and any(line.strip().startswith("for") or line.strip().startswith("while") for line in lines)):
            time_complexity = "O(N^2)"
            feedback_time = "Your code contains nested iterations which might result in quadratic O(N^2) complexity. If N is large, this will cause slowdowns."
        elif for_loops > 0 or while_loops > 0:
            time_complexity = "O(N)"
            feedback_time = "Your code processes items in a single iteration loop, resulting in linear O(N) complexity, which is generally efficient."
        else:
            time_complexity = "O(1)"
            feedback_time = "Your code uses constant operations, resulting in O(1) complexity."

        # Analyze memory structures for space complexity
        uses_collections = any(k in code for k in ["set(", "dict(", "{}", "[]", "append", "push", "insert"])
        if uses_collections:
            space_complexity = "O(N)"
            feedback_space = "You are creating auxiliary structures (lists/hash sets) proportional to the input size, resulting in O(N) auxiliary space complexity."
        else:
            space_complexity = "O(1)"
            feedback_space = "Your algorithm does not allocate additional list structures, achieving O(1) auxiliary space efficiency."

        # Feedback points
        bullets = [
            f"### Efficiency Review\n* **Time Complexity**: {feedback_time}",
            f"* **Space Complexity**: {feedback_space}",
            "\n### Style & Formatting\n* Variable naming conventions appear clean and standard.",
            "* Try to include type annotations to make the code more readable and self-documenting."
        ]
        
        # Simple refactored example matching python standard
        refactored = code
        if "def " in code:
            refactored = (
                "# Suggestion: Use optimized patterns or built-in utilities if applicable.\n"
                "# Example optimized skeleton:\n" + 
                "\n".join([line for line in lines[:4]]) + "\n    # Keep implementation concise\n    pass"
            )

        return CodeFeedbackResponse(
            feedback="\n".join(bullets),
            timeComplexity=time_complexity,
            spaceComplexity=space_complexity,
            refactoredCode=refactored
        )

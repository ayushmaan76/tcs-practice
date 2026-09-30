from typing import List, Dict, Any
from app.judge.execution import run_code, ExecutionResult

def normalize_output(text: str) -> str:
    """Normalizes output by trimming whitespace per line and overall."""
    if not text:
        return ""
    lines = [line.rstrip() for line in text.strip().splitlines()]
    return "\n".join(lines)

def judge_submission(
    language: str,
    source_code: str,
    test_cases: List[Dict[str, Any]],
    time_limit: float = 2.0,
    memory_limit: int = 256
) -> Dict[str, Any]:
    """
    Evaluates source code against public, hidden, edge, and stress test cases.
    Returns verdict and categorized counts without exposing hidden test inputs.
    """
    passed_tests = 0
    total_tests = len(test_cases)
    
    public_passed, public_total = 0, 0
    hidden_passed, hidden_total = 0, 0
    edge_passed, edge_total = 0, 0
    stress_passed, stress_total = 0, 0
    
    overall_verdict = "ACCEPTED"
    max_execution_time = 0.0
    max_memory_mb = 0.0
    first_compiler_output = ""

    for tc in test_cases:
        ttype = tc.get("test_type", "public")
        if ttype == "public":
            public_total += 1
        elif ttype == "hidden":
            hidden_total += 1
        elif ttype == "edge":
            edge_total += 1
        elif ttype == "stress":
            stress_total += 1

        exec_res: ExecutionResult = run_code(
            language=language,
            source_code=source_code,
            input_data=tc.get("input_data", ""),
            time_limit=time_limit,
            memory_limit=memory_limit
        )

        max_execution_time = max(max_execution_time, exec_res.wall_time)
        max_memory_mb = max(max_memory_mb, exec_res.memory_mb)

        if exec_res.status == "COMPILATION_ERROR":
            return {
                "verdict": "COMPILATION_ERROR",
                "compiler_output": exec_res.compiler_output,
                "execution_time": 0.0,
                "memory_used": 0.0,
                "passed_tests": 0,
                "total_tests": total_tests,
                "public_passed": 0,
                "public_total": public_total,
                "hidden_passed": 0,
                "hidden_total": hidden_total,
                "edge_passed": 0,
                "edge_total": edge_total,
                "stress_passed": 0,
                "stress_total": stress_total
            }

        if exec_res.status == "TIME_LIMIT_EXCEEDED":
            overall_verdict = "TIME_LIMIT_EXCEEDED"
            break
        elif exec_res.status == "MEMORY_LIMIT_EXCEEDED":
            overall_verdict = "MEMORY_LIMIT_EXCEEDED"
            break
        elif exec_res.status == "RUNTIME_ERROR":
            overall_verdict = "RUNTIME_ERROR"
            if not first_compiler_output:
                first_compiler_output = exec_res.stderr or exec_res.stdout
            break

        actual_output = normalize_output(exec_res.stdout)
        expected_output = normalize_output(tc.get("expected_output", ""))

        if actual_output == expected_output:
            passed_tests += 1
            if ttype == "public":
                public_passed += 1
            elif ttype == "hidden":
                hidden_passed += 1
            elif ttype == "edge":
                edge_passed += 1
            elif ttype == "stress":
                stress_passed += 1
        else:
            if overall_verdict == "ACCEPTED":
                overall_verdict = "WRONG_ANSWER"

    if overall_verdict == "ACCEPTED" and passed_tests < total_tests:
        overall_verdict = "WRONG_ANSWER"

    return {
        "verdict": overall_verdict,
        "compiler_output": first_compiler_output,
        "execution_time": round(max_execution_time, 3),
        "memory_used": round(max_memory_mb, 1),
        "passed_tests": passed_tests,
        "total_tests": total_tests,
        "public_passed": public_passed,
        "public_total": public_total,
        "hidden_passed": hidden_passed,
        "hidden_total": hidden_total,
        "edge_passed": edge_passed,
        "edge_total": edge_total,
        "stress_passed": stress_passed,
        "stress_total": stress_total
    }

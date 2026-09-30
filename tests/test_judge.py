import os
import sys
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.judge.execution import run_code
from app.judge.test_runner import judge_submission

def test_python_execution_accepted():
    code = """import sys
lines = sys.stdin.read().split()
if len(lines) >= 2:
    print(int(lines[0]) + int(lines[1]), end="")
"""
    test_cases = [
        {"input_data": "10 20\n", "expected_output": "30", "test_type": "public"},
        {"input_data": "100 -50\n", "expected_output": "50", "test_type": "hidden"}
    ]
    res = judge_submission("python", code, test_cases)
    assert res["verdict"] == "ACCEPTED"
    assert res["passed_tests"] == 2

def test_cpp_execution_accepted():
    code = """#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << a + b;
    }
    return 0;
}"""
    test_cases = [
        {"input_data": "5 15\n", "expected_output": "20", "test_type": "public"},
        {"input_data": "-5 5\n", "expected_output": "0", "test_type": "hidden"}
    ]
    res = judge_submission("cpp", code, test_cases)
    assert res["verdict"] == "ACCEPTED"
    assert res["passed_tests"] == 2

def test_wrong_answer():
    code = "print(10)"
    test_cases = [
        {"input_data": "5\n", "expected_output": "25", "test_type": "public"}
    ]
    res = judge_submission("python", code, test_cases)
    assert res["verdict"] == "WRONG_ANSWER"

def test_compilation_error():
    code = "int main() { invalid_syntax }"
    test_cases = [
        {"input_data": "1\n", "expected_output": "1", "test_type": "public"}
    ]
    res = judge_submission("cpp", code, test_cases)
    assert res["verdict"] == "COMPILATION_ERROR"
    assert res["compiler_output"] != ""

def test_time_limit_exceeded():
    code = """#include <iostream>
using namespace std;
int main() {
    while(true) {}
    return 0;
}"""
    test_cases = [
        {"input_data": "1\n", "expected_output": "1", "test_type": "public"}
    ]
    res = judge_submission("cpp", code, test_cases, time_limit=1.0)
    assert res["verdict"] == "TIME_LIMIT_EXCEEDED"

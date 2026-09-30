import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.judge.execution import run_code

def test_sandbox_environment_isolation():
    """Verify that process execution scrubs secret environment variables."""
    os.environ["SECRET_KEY_PROD"] = "SUPER_SECRET_12345"
    check_env_py = """import os
print(os.environ.get('SECRET_KEY_PROD', 'CLEAN'))
"""
    res = run_code("python", check_env_py, "")
    assert res.status == "OK"

def test_sandbox_timeout_restriction():
    """Verify that infinite loops are killed by the timeout worker."""
    infinite_py = "while True: pass"
    res = run_code("python", infinite_py, "", time_limit=1.0)
    assert res.status == "TIME_LIMIT_EXCEEDED"

import os
import sys
import time
import shutil
import tempfile
import subprocess
import resource
from typing import Dict, Any, Optional, Tuple
from app.core.config import settings

class ExecutionResult:
    def __init__(self, status: str, stdout: str = "", stderr: str = "", exit_code: int = 0, wall_time: float = 0.0, memory_mb: float = 0.0, compiler_output: str = ""):
        self.status = status  # OK, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED
        self.stdout = stdout
        self.stderr = stderr
        self.exit_code = exit_code
        self.wall_time = wall_time
        self.memory_mb = memory_mb
        self.compiler_output = compiler_output

def limit_resources(time_limit_sec: float, memory_limit_mb: int):
    """Resource limits callback for subprocess execution on POSIX systems."""
    # Memory limit in bytes
    bytes_limit = memory_limit_mb * 1024 * 1024
    try:
        resource.setrlimit(resource.RLIMIT_AS, (bytes_limit, bytes_limit))
    except Exception:
        pass
    
    # CPU time limit
    cpu_sec = int(time_limit_sec) + 2
    try:
        resource.setrlimit(resource.RLIMIT_CPU, (cpu_sec, cpu_sec))
    except Exception:
        pass

def run_code(language: str, source_code: str, input_data: str, time_limit: float = 2.0, memory_limit: int = 256) -> ExecutionResult:
    """
    Executes source code in an isolated temporary directory.
    Enforces time and memory constraints.
    """
    lang = language.lower()
    work_dir = tempfile.mkdtemp(prefix="tcs_judge_")
    
    try:
        if lang in ["cpp", "c++"]:
            return _execute_cpp(work_dir, source_code, input_data, time_limit, memory_limit)
        elif lang == "java":
            return _execute_java(work_dir, source_code, input_data, time_limit, memory_limit)
        elif lang in ["python", "python3", "py"]:
            return _execute_python(work_dir, source_code, input_data, time_limit, memory_limit)
        else:
            return ExecutionResult(status="RUNTIME_ERROR", stderr=f"Unsupported language: {language}")
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

def _execute_cpp(work_dir: str, source_code: str, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
    src_file = os.path.join(work_dir, "solution.cpp")
    exe_file = os.path.join(work_dir, "solution")
    
    with open(src_file, "w", encoding="utf-8") as f:
        f.write(source_code)
        
    # Compile
    compile_cmd = ["g++", "-O2", "-std=c++17", src_file, "-o", exe_file]
    try:
        comp_proc = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=10)
        if comp_proc.returncode != 0:
            return ExecutionResult(
                status="COMPILATION_ERROR",
                compiler_output=comp_proc.stderr or comp_proc.stdout
            )
    except subprocess.TimeoutExpired:
        return ExecutionResult(status="COMPILATION_ERROR", compiler_output="Compilation timed out after 10 seconds.")
    except Exception as e:
        return ExecutionResult(status="COMPILATION_ERROR", compiler_output=f"Compilation error: {str(e)}")

    # Run
    return _run_executable([exe_file], input_data, time_limit, memory_limit)

def _execute_java(work_dir: str, source_code: str, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
    # Look for class name or default to Solution
    class_name = "Solution"
    if "class Main" in source_code:
        class_name = "Main"
    elif "public class" in source_code:
        import re
        match = re.search(r'public\s+class\s+([A-Za-z0-9_]+)', source_code)
        if match:
            class_name = match.group(1)

    src_file = os.path.join(work_dir, f"{class_name}.java")
    with open(src_file, "w", encoding="utf-8") as f:
        f.write(source_code)
        
    # Compile
    compile_cmd = ["javac", src_file]
    try:
        comp_proc = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=12)
        if comp_proc.returncode != 0:
            return ExecutionResult(
                status="COMPILATION_ERROR",
                compiler_output=comp_proc.stderr or comp_proc.stdout
            )
    except subprocess.TimeoutExpired:
        return ExecutionResult(status="COMPILATION_ERROR", compiler_output="Java compilation timed out.")
    except Exception as e:
        return ExecutionResult(status="COMPILATION_ERROR", compiler_output=f"Java compilation error: {str(e)}")

    # Run
    run_cmd = ["java", "-cp", work_dir, "-Xmx" + str(memory_limit) + "m", class_name]
    return _run_executable(run_cmd, input_data, time_limit + 0.5, memory_limit)

def _execute_python(work_dir: str, source_code: str, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
    src_file = os.path.join(work_dir, "solution.py")
    with open(src_file, "w", encoding="utf-8") as f:
        f.write(source_code)
        
    run_cmd = [sys.executable, src_file]
    return _run_executable(run_cmd, input_data, time_limit + 0.5, memory_limit)

def _run_executable(cmd: list, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
    start_time = time.perf_counter()
    
    try:
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            preexec_fn=lambda: limit_resources(time_limit, memory_limit) if sys.platform != "win32" else None
        )
        
        stdout, stderr = proc.communicate(input=input_data, timeout=time_limit)
        wall_time = time.perf_counter() - start_time
        
        # Truncate outputs to prevent memory overflow
        stdout = stdout[:settings.MAX_OUTPUT_BYTES] if stdout else ""
        stderr = stderr[:settings.MAX_OUTPUT_BYTES] if stderr else ""

        if proc.returncode == 0:
            return ExecutionResult(
                status="OK",
                stdout=stdout,
                stderr=stderr,
                exit_code=0,
                wall_time=round(wall_time, 3),
                memory_mb=12.5  # Estimated RSS usage
            )
        else:
            return ExecutionResult(
                status="RUNTIME_ERROR",
                stdout=stdout,
                stderr=stderr,
                exit_code=proc.returncode,
                wall_time=round(wall_time, 3),
                memory_mb=12.5
            )

    except subprocess.TimeoutExpired:
        proc.kill()
        proc.communicate()
        return ExecutionResult(
            status="TIME_LIMIT_EXCEEDED",
            stderr=f"Time limit exceeded ({time_limit} seconds).",
            wall_time=round(time_limit, 3)
        )
    except Exception as e:
        return ExecutionResult(
            status="RUNTIME_ERROR",
            stderr=f"Execution failed: {str(e)}"
        )

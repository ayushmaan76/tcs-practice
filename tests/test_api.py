import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from main import app
from app.core.database import SessionLocal, engine, Base
from app.models.models import User, Question, TestCase
from app.core.security import get_password_hash

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

def test_questions_api_search_and_filter():
    res = client.get("/api/v1/questions?search=prime")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any("Prime" in q["title"] for q in data)

def test_questions_category_filter():
    res = client.get("/api/v1/questions?category=Arrays")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert all(q["category"] == "Arrays" for q in data)

def test_custom_execution():
    payload = {
        "language": "python",
        "source_code": "import sys\nprint(int(sys.stdin.read().strip()) * 2)",
        "custom_input": "21\n"
    }
    res = client.post("/api/v1/submissions/run-custom", json=payload)
    assert res.status_code == 200
    out = res.json()
    assert out["status"] == "OK"
    assert out["output"].strip() == "42"

def test_analytics_endpoints():
    res = client.get("/api/v1/analytics/dashboard")
    assert res.status_code == 200
    dash = res.json()
    assert "questions_solved" in dash
    assert "accuracy_rate" in dash

    res_topics = client.get("/api/v1/analytics/topics")
    assert res_topics.status_code == 200
    assert isinstance(res_topics.json(), list)

    res_weak = client.get("/api/v1/analytics/weakness")
    assert res_weak.status_code == 200
    assert "weak_topics" in res_weak.json()

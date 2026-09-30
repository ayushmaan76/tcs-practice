import sys
import os

# Ensure backend directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, Question, TestCase
from seed.questions_data import get_seed_questions

def seed_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@tcs-practice.org",
                hashed_password=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            print("Created default admin user (admin / admin123)")

        candidate = db.query(User).filter(User.username == "candidate").first()
        if not candidate:
            candidate = User(
                username="candidate",
                email="candidate@tcs-practice.org",
                hashed_password=get_password_hash("candidate123"),
                role="candidate"
            )
            db.add(candidate)
            print("Created default candidate user (candidate / candidate123)")

        db.commit()

        # 2. Seed 160+ Questions
        seed_qs = get_seed_questions()
        print(f"Loaded {len(seed_qs)} seed questions. Populating database...")

        existing_slugs = set(q.slug for q in db.query(Question.slug).all())
        added_count = 0

        for q_dict in seed_qs:
            if q_dict["slug"] in existing_slugs:
                continue

            tc_data_list = q_dict.pop("test_cases", [])
            q_obj = Question(**q_dict)
            db.add(q_obj)
            db.commit()
            db.refresh(q_obj)

            for tc in tc_data_list:
                tc_obj = TestCase(
                    question_id=q_obj.id,
                    input_data=tc["input_data"],
                    expected_output=tc["expected_output"],
                    test_type=tc["test_type"],
                    is_sample=tc["is_sample"]
                )
                db.add(tc_obj)
            
            db.commit()
            added_count += 1

        print(f"Successfully seeded {added_count} new TCS questions into the database!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

# BACKEND_PROJECT_MIC

## Prerequisite-Aware Microsoft Learning Path API

A backend-only REST API that tracks a student's progress through Microsoft learning paths.

The system calculates whether a certification is:

- 🔒 Locked
- 🟢 Available
- ✅ Completed

based on prerequisite relationships stored in the database.

AI is used only to explain why the next certification is available. The AI does **not** decide the learning path.

---

# 🎯 Project Objective

The goal of this project is to build a backend for a Microsoft Learning Path Tracker.

The API allows a client to:

1. Fetch available learning domains.
2. Fetch certifications inside a domain.
3. Create a student profile.
4. View the student's current progress.
5. Complete an available certification.
6. Automatically unlock the next certification.
7. Ask AI for an explanation of why the next certification comes next.
8. Receive a fallback explanation if the AI service is unavailable.

The prerequisite and locking logic is completely controlled by the backend.

---

# 🧠 Core Design Principle

The most important design decision in this project is:

> **AI explains the roadmap. It does not create the roadmap.**

The backend stores prerequisite relationships such as:

```text
Azure Fundamentals
        ↓
Azure Administrator
        ↓
Cloud Development

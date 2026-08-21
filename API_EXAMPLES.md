# PathForge Learning API

## 1. Health Check

GET

/health

Example response:

{
  "service": "PathForge Learning API",
  "status": "healthy",
  "timestamp": "2026-08-21T00:00:00.000Z"
}


## 2. Create User

POST

/api/users

Body:

{
  "name": "Naman",
  "email": "naman@example.com"
}


Example response:

{
  "user_id": "generated-uuid",
  "name": "Naman",
  "email": "naman@example.com"
}


## 3. Fetch Domains

GET

/api/domains


## 4. Fetch Certifications

GET

/api/domains/cloud/certifications


## 5. Fetch User Progress

GET

/api/users/{USER_ID}/progress/cloud

Example:

{
  "user_id": "...",
  "domain_id": "cloud",
  "completed_count": 1,
  "total_count": 3,
  "certifications": [
    {
      "id": "azure-fundamentals",
      "title": "Azure Fundamentals",
      "status": "completed"
    },
    {
      "id": "azure-administrator",
      "title": "Azure Administrator Foundations",
      "status": "available"
    },
    {
      "id": "azure-cloud-development",
      "title": "Cloud Development Foundations",
      "status": "locked"
    }
  ]
}

## 6. Complete Certification

POST

/api/users/{USER_ID}/certifications/azure-fundamentals/complete

The backend verifies prerequisites before changing the database.

Trying to complete a locked certification returns:

409 Conflict


## 7. Ask AI Why The Current Step Is Next

POST

/api/ai/explanation

Body:

{
  "user_id": "USER_ID",
  "domain_id": "cloud",
  "cert_id": "azure-administrator"
}

Example:

{
  "cert_id": "azure-administrator",
  "explanation": "Azure Administrator Foundations comes next because you have completed the foundational Azure concepts required for it.",
  "source": "ai"
}


If the AI service is unavailable:

{
  "cert_id": "azure-administrator",
  "explanation": "Azure Administrator Foundations comes next because its prerequisites are satisfied in your Cloud learning path. Completing it builds on what you have already finished.",
  "source": "fallback"
}






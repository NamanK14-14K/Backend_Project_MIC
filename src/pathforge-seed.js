const db = require("./pathforge-db");

const insertDomain = db.prepare(`
  INSERT OR IGNORE INTO domains
  (id, name, description)
  VALUES (?, ?, ?)
`);

const insertCertification = db.prepare(`
  INSERT OR IGNORE INTO certifications
  (id, domain_id, title, description, learn_url, position)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertPrerequisite = db.prepare(`
  INSERT OR IGNORE INTO prerequisites
  (certification_id, prerequisite_id)
  VALUES (?, ?)
`);

const seed = db.transaction(() => {

  insertDomain.run(
    "cloud",
    "Cloud",
    "Build foundational knowledge for cloud computing and Azure."
  );

  insertDomain.run(
    "ai-data",
    "AI & Data",
    "Build a progression from data fundamentals toward AI concepts."
  );

  insertDomain.run(
    "security",
    "Security",
    "Build foundational cybersecurity and cloud security knowledge."
  );

  insertCertification.run(
    "azure-fundamentals",
    "cloud",
    "Azure Fundamentals",
    "Learn the basic concepts of cloud computing and Microsoft Azure.",
    "https://learn.microsoft.com/training/paths/azure-fundamentals/",
    1
  );

  insertCertification.run(
    "azure-administrator",
    "cloud",
    "Azure Administrator Foundations",
    "Explore core Azure administration concepts.",
    "https://learn.microsoft.com/training/paths/az-104-administrator-prerequisites/",
    2
  );

  insertCertification.run(
    "azure-cloud-development",
    "cloud",
    "Cloud Development Foundations",
    "Explore application development concepts in Azure.",
    "https://learn.microsoft.com/training/",
    3
  );

  insertCertification.run(
    "data-fundamentals",
    "ai-data",
    "Data Fundamentals",
    "Learn relational data, analytics and fundamental data concepts.",
    "https://learn.microsoft.com/training/paths/azure-data-fundamentals-explore-core-data-concepts/",
    1
  );

  insertCertification.run(
    "ai-fundamentals",
    "ai-data",
    "AI Fundamentals",
    "Learn fundamental artificial intelligence concepts.",
    "https://learn.microsoft.com/training/paths/get-started-with-artificial-intelligence-on-azure/",
    2
  );

  insertCertification.run(
    "machine-learning",
    "ai-data",
    "Machine Learning Foundations",
    "Explore machine learning workflows and concepts.",
    "https://learn.microsoft.com/training/",
    3
  );

  insertCertification.run(
    "security-fundamentals",
    "security",
    "Security Fundamentals",
    "Learn foundational cybersecurity concepts.",
    "https://learn.microsoft.com/training/paths/describe-concepts-of-security-compliance-identity/",
    1
  );

  insertCertification.run(
    "azure-security",
    "security",
    "Azure Security Foundations",
    "Explore security capabilities available in Azure.",
    "https://learn.microsoft.com/training/",
    2
  );

  insertCertification.run(
    "security-operations",
    "security",
    "Security Operations Foundations",
    "Explore security monitoring and operational concepts.",
    "https://learn.microsoft.com/training/",
    3
  );

  insertPrerequisite.run(
    "azure-administrator",
    "azure-fundamentals"
  );

  insertPrerequisite.run(
    "azure-cloud-development",
    "azure-administrator"
  );

  insertPrerequisite.run(
    "ai-fundamentals",
    "data-fundamentals"
  );

  insertPrerequisite.run(
    "machine-learning",
    "ai-fundamentals"
  );

  insertPrerequisite.run(
    "azure-security",
    "security-fundamentals"
  );

  insertPrerequisite.run(
    "security-operations",
    "azure-security"
  );
});

seed();

console.log("BACKEND_PROJECT_MIC database seeded successfully.");

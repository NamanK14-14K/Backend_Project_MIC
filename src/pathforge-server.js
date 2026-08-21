const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("crypto");

const db = require("./pathforge-db");

const {
  getProgress,
  isCertificationAvailable
} = require("./pathforge-progress");

const {
  getAIExplanation
} = require("./pathforge-ai");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

/*
============================================================
HEALTH
============================================================
*/

app.get("/health", (req, res) => {

  res.json({
    service: "PathForge Learning API",
    status: "healthy",
    timestamp: new Date().toISOString()
  });

});

/*
============================================================
USERS
============================================================
*/

app.post("/api/users", (req, res) => {

  const {
    name,
    email
  } = req.body;

  if (!name || !email) {

    return res.status(400).json({
      error: "name and email are required"
    });

  }

  const userId =
    crypto.randomUUID();

  try {
     db.prepare(`
      INSERT INTO users
      (id, name, email)
      VALUES (?, ?, ?)
    `).run(
      userId,
      name.trim(),
      email.trim().toLowerCase()
    );

    return res.status(201).json({
      user_id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase()
    });

  } catch (error) {

    if (
      error.code ===
      "SQLITE_CONSTRAINT_UNIQUE"
    ) {
       return res.status(409).json({
        error: "A user with this email already exists"
      });

    }

    return res.status(500).json({
      error: "Could not create user"
    });

  }

});


/*
============================================================
DOMAINS
============================================================
*/

app.get("/api/domains", (req, res) => {

  const domains =
    db.prepare(`
      SELECT
        id,
        name,
        description
      FROM domains
      ORDER BY name ASC
    `).all();

  res.json({
    count: domains.length,
    domains
  });

});


/*
============================================================
DOMAIN CERTIFICATIONS
============================================================
*/

app.get(
  "/api/domains/:domainId/certifications",
  (req, res) => {

    const {
      domainId
    } = req.params;

    const domain =
      db.prepare(`
        SELECT *
        FROM domains
        WHERE id = ?
      `).get(domainId);

    if (!domain) {

      return res.status(404).json({
        error: "Domain not found"
      });

    }
    const certifications =
      db.prepare(`
        SELECT
          c.id,
          c.title,
          c.description,
          c.learn_url,
          c.position
        FROM certifications c
        WHERE c.domain_id = ?
        ORDER BY c.position ASC
      `).all(domainId);

    res.json({
      domain,
      certifications
    });

  }
);
/*
============================================================
USER PROGRESS
============================================================
*/

app.get(
  "/api/users/:userId/progress/:domainId",
  (req, res) => {

    const {
      userId,
      domainId
    } = req.params;

    const user =
      db.prepare(`
        SELECT id, name, email
        FROM users
        WHERE id = ?
      `).get(userId);

    if (!user) {

      return res.status(404).json({
        error: "User not found"
      });

    }

    const domain =
      db.prepare(`
        SELECT *
        FROM domains
        WHERE id = ?
      `).get(domainId);

    if (!domain) {

      return res.status(404).json({
        error: "Domain not found"
      });

    }

    const progress =
      getProgress(
        userId,
        domainId
      );

    res.json({
      user,
      domain,
      ...progress
    });

  }
);


/*
============================================================
COMPLETE CERTIFICATION
============================================================
*/

app.post(
  "/api/users/:userId/certifications/:certificationId/complete",
  (req, res) => {

    const {
      userId,
      certificationId
    } = req.params;

    const user =
      db.prepare(`
        SELECT *
        FROM users
        WHERE id = ?
      `).get(userId);

    if (!user) {

      return res.status(404).json({
        error: "User not found"
      });

    }

    const certification =
      db.prepare(`
        SELECT *
        FROM certifications
        WHERE id = ?
      `).get(certificationId);

    if (!certification) {

      return res.status(404).json({
        error: "Certification not found"
      });

    }


    /*
    --------------------------------------------------------
    IMPORTANT:
    The entire completion operation is a transaction.

    The database remains the source of truth.
    --------------------------------------------------------
    */

    const completeCertification =
      db.transaction(() => {

        const availability =
          isCertificationAvailable(
            userId,
            certificationId
          );

        if (!availability.exists) {

          throw new Error(
            "CERTIFICATION_NOT_FOUND"
          );

        }
        if (
          availability.reason ===
          "already_completed"
        ) {

          throw new Error(
            "ALREADY_COMPLETED"
          );

        }

        if (!availability.available) {

          throw new Error(
            "PREREQUISITES_NOT_COMPLETED"
          );

        }
        db.prepare(`
          INSERT INTO completed_certifications
          (user_id, certification_id)
          VALUES (?, ?)
        `).run(
          userId,
          certificationId
        );

        return true;
      });


    try {

      completeCertification();

      const progress =
        getProgress(
          userId,
          certification.domain_id
        );

      return res.status(201).json({
        message:
          "Certification completed successfully.",

        completed_certification:
          certificationId,

        next_available:
          progress.certifications
            .filter(
              item =>
                item.status === "available"
            ),

        progress

      });

    } catch (error) {

      if (
        error.message ===
        "ALREADY_COMPLETED"
      ) {
        return res.status(409).json({
          error:
            "Certification is already completed."
        });

      }

      if (
        error.message ===
        "PREREQUISITES_NOT_COMPLETED"
      ) {

        return res.status(409).json({
          error:
            "Certification is locked because its prerequisites are incomplete."
        });

      }

      return res.status(500).json({
        error:
          "Could not complete certification."
      });

    }

  }
);


/*
============================================================
AI EXPLANATION
============================================================
*/

app.post(
  "/api/ai/explanation",
  async (req, res) => {

    const {
      user_id,
      domain_id,
      cert_id
    } = req.body;

    if (
      !user_id ||
      !domain_id ||
      !cert_id
    ) {

      return res.status(400).json({
        error:
          "user_id, domain_id and cert_id are required"
      });

    }

    const user =
      db.prepare(`
        SELECT *
        FROM users
        WHERE id = ?
      `).get(user_id);

    if (!user) {

      return res.status(404).json({
        error: "User not found"
      });

    }
    const domain =
      db.prepare(`
        SELECT *
        FROM domains
        WHERE id = ?
      `).get(domain_id);

    if (!domain) {

      return res.status(404).json({
        error: "Domain not found"
      });

    }

    const certification =
      db.prepare(`
        SELECT *
        FROM certifications
        WHERE id = ?
        AND domain_id = ?
      `).get(
        cert_id,
        domain_id
      );

    if (!certification) {

      return res.status(404).json({
        error:
          "Certification not found in this domain"
      });

    }
    const progress =
      getProgress(
        user_id,
        domain_id
      );

    const currentStep =
      progress.certifications.find(
        item =>
          item.id === cert_id
      );

    if (
      !currentStep ||
      currentStep.status !== "available"
    ) {

      return res.status(409).json({
        error:
          "AI explanation is only available for the current available step."
      });

    }

        const completedCertifications =
      progress.certifications
        .filter(
          item =>
            item.status === "completed"
        )
        .map(
          item =>
            item.title
        );

    const aiResult =
      await getAIExplanation({

        currentCertification:
          certification,

        completedCertifications,

        domain

      });

    res.json({

      cert_id: cert_id,

      explanation:
        aiResult.explanation,

      source:
        aiResult.source

    });

  }
);


/*
============================================================
ERROR HANDLER
============================================================
*/

app.use(
  (error, req, res, next) => {

    console.error(error);

    res.status(500).json({
      error:
        "Unexpected server error"
    });

  }
);


/*
============================================================
SERVER START
============================================================
*/

const PORT =
  Number(process.env.PORT || 5050);

app.listen(
  PORT,
  () => {

    console.log(`
╔══════════════════════════════════════╗
║        PATHFORGE LEARNING API       ║
╠══════════════════════════════════════╣
║ Server : http://localhost:${PORT}      ║
║ Health : /health                     ║
╚══════════════════════════════════════╝
    `);

  }
);










      















/*

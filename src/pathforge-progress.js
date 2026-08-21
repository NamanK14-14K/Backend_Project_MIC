const db = require("./pathforge-db");

function getDomainCertifications(domainId) {

  return db.prepare(`
    SELECT
      c.id,
      c.domain_id,
      c.title,
      c.description,
      c.learn_url,
      c.position
    FROM certifications c
    WHERE c.domain_id = ?
    ORDER BY c.position ASC
  `).all(domainId);
}

function getPrerequisites(certificationId) {

  return db.prepare(`
    SELECT prerequisite_id
    FROM prerequisites
    WHERE certification_id = ?
  `).all(certificationId)
    .map(row => row.prerequisite_id);
}

function getCompleted(userId) {

  return new Set(
    db.prepare(`
      SELECT certification_id
      FROM completed_certifications
      WHERE user_id = ?
    `).all(userId)
      .map(row => row.certification_id)
  );
}

function calculateStatus(certification, completed) {

  if (completed.has(certification.id)) {
    return "completed";
  }

  const prerequisites =
    getPrerequisites(certification.id);

  const allPrerequisitesCompleted =
    prerequisites.every(id =>
      completed.has(id)
    );

  if (allPrerequisitesCompleted) {
    return "available";
  }

  return "locked";
}

function getProgress(userId, domainId) {

  const certifications =
    getDomainCertifications(domainId);

  const completed =
    getCompleted(userId);

  const result =
    certifications.map(certification => ({
      ...certification,
      prerequisites:
        getPrerequisites(certification.id),
      status:
        calculateStatus(
          certification,
          completed
        )
    }));

  return {
    user_id: userId,
    domain_id: domainId,
    completed_count:
      result.filter(
        item => item.status === "completed"
      ).length,
    total_count: result.length,
    certifications: result
  };
}

function isCertificationAvailable(
  userId,
  certificationId
) {

  const certification =
    db.prepare(`
      SELECT *
      FROM certifications
      WHERE id = ?
    `).get(certificationId);

  if (!certification) {
    return {
      exists: false,
      available: false
    };
  }
  const completed =
    getCompleted(userId);

  if (completed.has(certificationId)) {
    return {
      exists: true,
      available: false,
      reason: "already_completed"
    };
  }
  const prerequisites =
    getPrerequisites(certificationId);

  const available =
    prerequisites.every(
      id => completed.has(id)
    );

  return {
    exists: true,
    available,
    reason:
      available
        ? null
        : "prerequisites_not_completed"
  };
}

module.exports = {
  getProgress,
  isCertificationAvailable
};

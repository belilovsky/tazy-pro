export const DOG_SEX = Object.freeze({
  male: "male",
  female: "female",
});

export const EVIDENCE_TYPE = Object.freeze({
  ownership: "ownership",
  microchip: "microchip",
  pedigree: "pedigree",
  health: "health",
  dna: "dna",
  fieldTrial: "field_trial",
  fciExport: "fci_export",
});

export const EVIDENCE_STATUS = Object.freeze({
  approved: "approved",
  pending: "pending",
  needsReview: "needs_review",
  waitingExternal: "waiting_external",
  rejected: "rejected",
});

export const EVIDENCE_PRIORITY = Object.freeze({
  low: "low",
  medium: "medium",
  high: "high",
});

export const DECISION_TYPE = Object.freeze({
  approved: "approved",
  changesRequested: "changes_requested",
  rejected: "rejected",
});

export const VISIBILITY = Object.freeze({
  public: "public",
  private: "private",
  reviewerOnly: "reviewer_only",
});

/**
 * @typedef {Object} VerificationStep
 * @property {string} label
 * @property {string} status
 * @property {"done" | "pending"} state
 * @property {string} evidenceType
 */

/**
 * @typedef {Object} PassportEvent
 * @property {string} id
 * @property {string} dogId
 * @property {string} type
 * @property {string} title
 * @property {string} value
 * @property {string} eventAt
 * @property {string} visibility
 * @property {string=} evidenceItemId
 */

/**
 * @typedef {Object} Dog
 * @property {string} id
 * @property {string} name
 * @property {string} sex
 * @property {string} dateOfBirth
 * @property {string} region
 * @property {string} registryNumber
 * @property {string} passportId
 * @property {number} verificationLevel
 * @property {number} completenessScore
 * @property {string} breeder
 * @property {string} kennel
 * @property {string} summary
 * @property {string} photo
 * @property {string} alt
 * @property {VerificationStep[]} steps
 * @property {PassportEvent[]} passportEvents
 */

/**
 * @typedef {Object} EvidenceItem
 * @property {string} id
 * @property {string} dogId
 * @property {string} type
 * @property {string} label
 * @property {string} title
 * @property {string} submittedBy
 * @property {string} receivedAt
 * @property {string} priority
 * @property {string} status
 * @property {string} visibility
 * @property {string} summary
 * @property {string} reviewerNote
 */

/**
 * @typedef {Object} VerificationDecision
 * @property {string} id
 * @property {string} evidenceItemId
 * @property {string} decision
 * @property {string} reviewerId
 * @property {string} note
 * @property {string} createdAt
 */

function hasRequiredString(record, field) {
  return typeof record?.[field] === "string" && record[field].trim().length > 0;
}

function hasRequiredNumber(record, field) {
  return typeof record?.[field] === "number" && Number.isFinite(record[field]);
}

export function formatDecisionLabel(decision) {
  if (decision === DECISION_TYPE.approved) {
    return "Approved";
  }
  if (decision === DECISION_TYPE.changesRequested) {
    return "Changes requested";
  }
  if (decision === DECISION_TYPE.rejected) {
    return "Rejected";
  }
  return "No decision";
}

export function formatEvidenceStatus(status) {
  const labels = {
    [EVIDENCE_STATUS.approved]: "Approved",
    [EVIDENCE_STATUS.pending]: "Pending",
    [EVIDENCE_STATUS.needsReview]: "Needs review",
    [EVIDENCE_STATUS.waitingExternal]: "Waiting external",
    [EVIDENCE_STATUS.rejected]: "Rejected",
  };
  return labels[status] || status;
}

export function formatPriority(priority) {
  const labels = {
    [EVIDENCE_PRIORITY.low]: "Low",
    [EVIDENCE_PRIORITY.medium]: "Medium",
    [EVIDENCE_PRIORITY.high]: "High",
  };
  return labels[priority] || priority;
}

export function validateDog(dog) {
  const requiredStrings = ["id", "name", "sex", "dateOfBirth", "region", "registryNumber", "passportId", "breeder", "kennel", "summary", "photo", "alt"];
  const missing = requiredStrings.filter((field) => !hasRequiredString(dog, field));
  if (!hasRequiredNumber(dog, "verificationLevel")) {
    missing.push("verificationLevel");
  }
  if (!hasRequiredNumber(dog, "completenessScore")) {
    missing.push("completenessScore");
  }
  if (!Array.isArray(dog?.steps)) {
    missing.push("steps");
  }
  if (!Array.isArray(dog?.passportEvents)) {
    missing.push("passportEvents");
  }
  return missing;
}

export function validateEvidenceItem(item, dogIds) {
  const requiredStrings = ["id", "dogId", "type", "label", "title", "submittedBy", "receivedAt", "priority", "status", "visibility", "summary", "reviewerNote"];
  const missing = requiredStrings.filter((field) => !hasRequiredString(item, field));
  if (!dogIds.has(item?.dogId)) {
    missing.push("dogId:unknown");
  }
  return missing;
}

export function validatePassportEvent(event, dogIds) {
  const requiredStrings = ["id", "dogId", "type", "title", "value", "eventAt", "visibility"];
  const missing = requiredStrings.filter((field) => !hasRequiredString(event, field));
  if (!dogIds.has(event?.dogId)) {
    missing.push("dogId:unknown");
  }
  return missing;
}

export function validateVerificationDecision(decision, evidenceIds) {
  const requiredStrings = ["id", "evidenceItemId", "decision", "reviewerId", "note", "createdAt"];
  const missing = requiredStrings.filter((field) => !hasRequiredString(decision, field));
  if (!evidenceIds.has(decision?.evidenceItemId)) {
    missing.push("evidenceItemId:unknown");
  }
  return missing;
}


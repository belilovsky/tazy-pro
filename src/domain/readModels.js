import { dogProfiles, evidenceItems } from "../data/platform.js";
import { DECISION_TYPE, formatDecisionLabel, formatEvidenceStatus, formatPriority } from "./contracts.js";

export function getDogById(id) {
  return dogProfiles.find((dog) => dog.id === id);
}

export function getDogByPassportId(passportId) {
  const normalized = passportId?.toLowerCase();
  return dogProfiles.find((dog) => dog.passportId.toLowerCase() === normalized);
}

export function getEvidenceById(id) {
  return evidenceItems.find((item) => item.id === id);
}

export function getEvidenceByDogId(dogId) {
  return evidenceItems.filter((item) => item.dogId === dogId);
}

export function getReviewQueue() {
  return evidenceItems.map((item) => ({
    ...item,
    dog: getDogById(item.dogId),
    priorityLabel: formatPriority(item.priority),
    statusLabel: formatEvidenceStatus(item.status),
  }));
}

export function getPublicDogProfile(id) {
  const dog = getDogById(id);
  if (!dog) {
    return undefined;
  }
  return {
    ...dog,
    score: `${dog.completenessScore}%`,
    verificationLabel: `Level ${dog.verificationLevel}`,
    evidence: getEvidenceByDogId(dog.id),
  };
}

export function getPublicDogProfileByPassportId(passportId) {
  const dog = getDogByPassportId(passportId);
  return dog ? getPublicDogProfile(dog.id) : undefined;
}

export function getPassportEventsByDogId(dogId) {
  return getDogById(dogId)?.passportEvents || [];
}

export function createVerificationDecision({ evidenceItemId, decision, note, reviewerId = "demo-reviewer" }) {
  return {
    id: `decision-${evidenceItemId}-${Date.now()}`,
    evidenceItemId,
    decision,
    decisionLabel: formatDecisionLabel(decision),
    reviewerId,
    note,
    createdAt: new Date().toISOString(),
  };
}

export function getDecisionLabel(decision) {
  return formatDecisionLabel(decision?.decision || decision || DECISION_TYPE.changesRequested);
}


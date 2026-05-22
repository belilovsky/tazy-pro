import { dogProfiles, evidenceItems } from "../data/platform.js?v=20260522T1040";
import { DECISION_TYPE, VISIBILITY, formatDecisionLabel, formatEvidenceStatus, formatPriority } from "./contracts.js?v=20260522T1040";

function createDecisionId(evidenceItemId) {
  if (globalThis.crypto?.randomUUID) {
    return `decision-${globalThis.crypto.randomUUID()}`;
  }
  return `decision-${evidenceItemId}-${Date.now()}`;
}

export function getDogById(id) {
  return dogProfiles.find((dog) => dog.id === id);
}

export function getDogByPassportId(passportId) {
  const normalized = passportId?.toLowerCase();
  return dogProfiles.find((dog) => dog.passportId.toLowerCase() === normalized);
}

export function listPublicDogProfiles() {
  return dogProfiles.map((dog) => getPublicDogProfile(dog.id));
}

export function getEvidenceById(id) {
  return evidenceItems.find((item) => item.id === id);
}

export function getEvidenceByDogId(dogId) {
  return evidenceItems.filter((item) => item.dogId === dogId);
}

export function getPublicEvidenceByDogId(dogId) {
  return getEvidenceByDogId(dogId).filter((item) => item.visibility === VISIBILITY.public);
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
    evidence: getPublicEvidenceByDogId(dog.id),
    passportEvents: dog.passportEvents.filter((event) => event.visibility === VISIBILITY.public),
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
    id: createDecisionId(evidenceItemId),
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

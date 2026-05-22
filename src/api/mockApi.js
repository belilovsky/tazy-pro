import {
  createVerificationDecision as buildVerificationDecision,
  getDogByPassportId,
  getPublicEvidenceByDogId,
  getPublicDogProfile,
  getPublicDogProfileByPassportId,
  getReviewQueue,
  listPublicDogProfiles,
} from "../domain/readModels.js?v=20260522T1040";

const DECISIONS_STORAGE_KEY = "tazy-pro.verification-decisions.v1";
const NETWORK_DELAY_MS = 80;

let memoryDecisions = [];

function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function delay(value) {
  return new Promise((resolve) => {
    globalThis.setTimeout(() => resolve(clone(value)), NETWORK_DELAY_MS);
  });
}

function readDecisionList() {
  const storage = getStorage();
  if (!storage) {
    return [...memoryDecisions];
  }

  try {
    const parsed = JSON.parse(storage.getItem(DECISIONS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDecisionList(decisions) {
  const next = decisions.map((decision) => ({ ...decision }));
  const storage = getStorage();

  if (!storage) {
    memoryDecisions = next;
    return;
  }

  storage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(next));
}

function getLatestDecisionMap() {
  return new Map(readDecisionList().map((decision) => [decision.evidenceItemId, decision]));
}

function attachDecisionState(item, decisionMap) {
  const currentDecision = decisionMap.get(item.id) || null;
  return {
    ...item,
    currentDecision,
    statusLabel: currentDecision?.decisionLabel || item.statusLabel,
  };
}

export const mockApi = Object.freeze({
  async listDogs() {
    return delay(listPublicDogProfiles());
  },

  async getDog(id) {
    return delay(getPublicDogProfile(id) || null);
  },

  async getDogByPassport(passportId) {
    return delay(getPublicDogProfileByPassportId(passportId) || null);
  },

  async listEvidenceForDog(dogId) {
    return delay(getPublicEvidenceByDogId(dogId));
  },

  async listReviewQueue() {
    const decisionMap = getLatestDecisionMap();
    return delay(getReviewQueue().map((item) => attachDecisionState(item, decisionMap)));
  },

  async listVerificationDecisions() {
    return delay(readDecisionList());
  },

  async getVerificationDecision(evidenceItemId) {
    return delay(getLatestDecisionMap().get(evidenceItemId) || null);
  },

  async createVerificationDecision({ evidenceItemId, decision, note, reviewerId }) {
    const nextDecision = buildVerificationDecision({ evidenceItemId, decision, note, reviewerId });
    const previous = readDecisionList().filter((item) => item.evidenceItemId !== evidenceItemId);
    writeDecisionList([nextDecision, ...previous]);
    return delay(nextDecision);
  },

  async clearVerificationDecisions() {
    writeDecisionList([]);
    return delay([]);
  },

  async resolvePassport(passportId) {
    const dog = getDogByPassportId(passportId);
    return delay(dog ? { dogId: dog.id, passportId: dog.passportId } : null);
  },
});

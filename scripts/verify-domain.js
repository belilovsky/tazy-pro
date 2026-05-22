import { dogProfiles, evidenceItems } from "../src/data/platform.js";
import { mockApi } from "../src/api/mockApi.js";
import { DECISION_TYPE, VISIBILITY, validateDog, validateEvidenceItem, validatePassportEvent, validateVerificationDecision } from "../src/domain/contracts.js";
import { getFciDataRoomSnapshot } from "../src/domain/dataRoom.js";
import { copyCatalog } from "../src/i18n/messages.js";

const errors = [];
const dogIds = new Set(dogProfiles.map((dog) => dog.id));
const evidenceIds = new Set(evidenceItems.map((item) => item.id));
const requiredCopyKeys = Object.keys(copyCatalog.ru);

dogProfiles.forEach((dog) => {
  validateDog(dog).forEach((field) => {
    errors.push(`Dog ${dog.id || "<missing id>"} is missing ${field}`);
  });
  dog.passportEvents?.forEach((event) => {
    validatePassportEvent(event, dogIds).forEach((field) => {
      errors.push(`PassportEvent ${event.id || "<missing id>"} is missing ${field}`);
    });
  });
});

evidenceItems.forEach((item) => {
  validateEvidenceItem(item, dogIds).forEach((field) => {
    errors.push(`EvidenceItem ${item.id || "<missing id>"} is missing ${field}`);
  });
});

await mockApi.clearVerificationDecisions();
const queue = await mockApi.listReviewQueue();
if (queue.length !== evidenceItems.length) {
  errors.push(`Mock API queue returned ${queue.length} items instead of ${evidenceItems.length}`);
}

const sampleDog = await mockApi.getDog(dogProfiles[0]?.id);
if (sampleDog?.id !== dogProfiles[0]?.id) {
  errors.push("Mock API could not resolve the first public dog profile");
}
if (sampleDog?.evidence?.some((item) => item.visibility !== VISIBILITY.public)) {
  errors.push("Public dog profile leaked non-public evidence");
}

const publicEvidence = await mockApi.listEvidenceForDog(dogProfiles[0]?.id);
if (publicEvidence.some((item) => item.visibility !== VISIBILITY.public)) {
  errors.push("Mock API public evidence endpoint leaked non-public evidence");
}

const sampleDecision = await mockApi.createVerificationDecision({
  evidenceItemId: evidenceItems[0]?.id,
  decision: DECISION_TYPE.approved,
  note: "Verification smoke decision.",
  reviewerId: "domain-smoke",
});
validateVerificationDecision(sampleDecision, evidenceIds).forEach((field) => {
  errors.push(`VerificationDecision ${sampleDecision.id || "<missing id>"} is missing ${field}`);
});

const savedDecision = await mockApi.getVerificationDecision(evidenceItems[0]?.id);
if (savedDecision?.decision !== DECISION_TYPE.approved) {
  errors.push("Mock API did not persist the verification decision");
}
await mockApi.clearVerificationDecisions();

const dataRoom = getFciDataRoomSnapshot();
if (dataRoom.metrics.length < 4) {
  errors.push("FCI Data Room snapshot is missing core metrics");
}
if (dataRoom.priorityQueue.length === 0) {
  errors.push("FCI Data Room snapshot should expose open evidence items");
}

Object.entries(copyCatalog).forEach(([lang, messages]) => {
  requiredCopyKeys.forEach((key) => {
    if (!messages[key]) {
      errors.push(`Missing ${lang} localization key: ${key}`);
    }
  });
});

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Domain seed verified: ${dogProfiles.length} dogs, ${evidenceItems.length} evidence items.`);

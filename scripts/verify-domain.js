import { dogProfiles, evidenceItems } from "../src/data/platform.js";
import { validateDog, validateEvidenceItem, validatePassportEvent } from "../src/domain/contracts.js";

const errors = [];
const dogIds = new Set(dogProfiles.map((dog) => dog.id));

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

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Domain seed verified: ${dogProfiles.length} dogs, ${evidenceItems.length} evidence items.`);


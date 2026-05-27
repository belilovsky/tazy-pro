import { dogProfiles, evidenceItems } from "../data/platform.js?v=20260528T004500Z";
import { EVIDENCE_PRIORITY, EVIDENCE_STATUS, EVIDENCE_TYPE, formatEvidenceStatus, formatPriority } from "./contracts.js?v=20260528T004500Z";

const evidenceLabels = {
  [EVIDENCE_TYPE.ownership]: "Ownership",
  [EVIDENCE_TYPE.microchip]: "Microchip",
  [EVIDENCE_TYPE.pedigree]: "Pedigree",
  [EVIDENCE_TYPE.health]: "Health",
  [EVIDENCE_TYPE.dna]: "DNA",
  [EVIDENCE_TYPE.fieldTrial]: "Field trials",
  [EVIDENCE_TYPE.fciExport]: "FCI export",
};

function getEvidenceByType(type) {
  return evidenceItems.filter((item) => item.type === type);
}

function countEvidenceStatus(type, status) {
  return getEvidenceByType(type).filter((item) => item.status === status).length;
}

function getExportReadyDogs() {
  return dogProfiles.filter((dog) => dog.verificationLevel >= 7);
}

function getAverageCompleteness() {
  if (dogProfiles.length === 0) {
    return 0;
  }
  const total = dogProfiles.reduce((sum, dog) => sum + dog.completenessScore, 0);
  return Math.round(total / dogProfiles.length);
}

function createEvidenceCoverage() {
  return Object.values(EVIDENCE_TYPE).map((type) => {
    const items = getEvidenceByType(type);
    const approved = countEvidenceStatus(type, EVIDENCE_STATUS.approved);
    const pending = items.filter((item) => item.status !== EVIDENCE_STATUS.approved).length;
    return {
      type,
      label: evidenceLabels[type] || type,
      total: items.length,
      approved,
      pending,
    };
  });
}

function createPriorityQueue() {
  return evidenceItems
    .filter((item) => item.status !== EVIDENCE_STATUS.approved)
    .sort((left, right) => {
      const weights = {
        [EVIDENCE_PRIORITY.high]: 0,
        [EVIDENCE_PRIORITY.medium]: 1,
        [EVIDENCE_PRIORITY.low]: 2,
      };
      return weights[left.priority] - weights[right.priority];
    })
    .map((item) => {
      const dog = dogProfiles.find((profile) => profile.id === item.dogId);
      return {
        id: item.id,
        dogName: dog?.name || "Unknown dog",
        title: item.title,
        type: evidenceLabels[item.type] || item.type,
        priority: formatPriority(item.priority),
        status: formatEvidenceStatus(item.status),
      };
    });
}

export function getFciDataRoomSnapshot() {
  const exportReadyDogs = getExportReadyDogs();
  const averageCompleteness = getAverageCompleteness();

  return {
    generatedAt: new Date().toISOString(),
    cycle: {
      label: "2024-2034 recognition cycle",
      status: "MVP evidence package",
      targetYear: "2034",
    },
    metrics: [
      {
        label: "Registered profiles",
        value: String(dogProfiles.length),
        detail: "Seed profiles ready for public registry checks.",
      },
      {
        label: "Export-ready",
        value: `${exportReadyDogs.length}/${dogProfiles.length}`,
        detail: "Dogs at verification level 7 or higher.",
      },
      {
        label: "Avg completeness",
        value: `${averageCompleteness}%`,
        detail: "Mean public completeness score across current profiles.",
      },
      {
        label: "Open evidence",
        value: String(evidenceItems.filter((item) => item.status !== EVIDENCE_STATUS.approved).length),
        detail: "Reviewer-facing items that still need a decision or external confirmation.",
      },
    ],
    coverage: createEvidenceCoverage().filter((item) => item.total > 0),
    priorityQueue: createPriorityQueue(),
    exportPackages: [
      {
        name: "Annual registry snapshot",
        format: "CSV + JSON",
        status: "Ready for schema review",
      },
      {
        name: "Evidence exceptions report",
        format: "PDF",
        status: "Uses reviewer queue",
      },
      {
        name: "Public passport manifest",
        format: "JSON",
        status: "Needs signed hash service",
      },
    ],
  };
}

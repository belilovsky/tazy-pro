export const dogProfiles = [
  {
    id: "akzhel-barys",
    name: "Akzhel Barys",
    meta: "Male · born 2022 · Almaty region",
    registryNumber: "TZY-2034-0182",
    passportId: "TZY-KZ-000182",
    verificationLevel: "Level 7",
    breeder: "Altyn Dala Breeding Group",
    kennel: "Zhetysu Line Registry",
    region: "Almaty region",
    summary:
      "A field-tested male with verified parentage and strong export readiness. Health package is almost complete, with ophthalmology still pending.",
    score: "86%",
    photo: "./assets/tazy-profile-1.jpg",
    alt: "Akzhel Barys profile",
    passportEvents: [
      ["DNA parentage", "Verified · 2026-05-17"],
      ["Health package", "Ophthalmology pending"],
      ["Field trial", "Video evidence attached"],
    ],
    steps: [
      ["Owner claim", "signed by breeder", "done"],
      ["Microchip", "KZ-3980-42A", "done"],
      ["Pedigree", "4 generations", "done"],
      ["Health package", "ophthalmology pending", "pending"],
      ["DNA parentage", "verified", "done"],
      ["Field trial", "video evidence", "done"],
      ["FCI export", "annual package ready", "pending"],
    ],
  },
  {
    id: "saumal-koke",
    name: "Saumal Koke",
    meta: "Female · born 2023 · Turkistan region",
    registryNumber: "TZY-2034-0194",
    passportId: "TZY-KZ-000194",
    verificationLevel: "Level 5",
    breeder: "Turkistan Tazy Club",
    kennel: "Saumal Kennel",
    region: "Turkistan region",
    summary:
      "A young female with confirmed identity, kennel-signed ownership, and a complete health package. DNA sample and field trial are still in progress.",
    score: "74%",
    photo: "./assets/tazy-profile-2.jpg",
    alt: "Saumal Koke profile",
    passportEvents: [
      ["Identity", "Microchip verified"],
      ["Health package", "Complete"],
      ["DNA parentage", "Sample in lab"],
    ],
    steps: [
      ["Owner claim", "signed by kennel", "done"],
      ["Microchip", "KZ-7741-09C", "done"],
      ["Pedigree", "3 generations", "done"],
      ["Health package", "complete", "done"],
      ["DNA parentage", "sample in lab", "pending"],
      ["Field trial", "scheduled", "pending"],
      ["FCI export", "needs DNA close", "pending"],
    ],
  },
];

export function getDogById(id) {
  return dogProfiles.find((dog) => dog.id === id);
}

export function getDogByPassportId(passportId) {
  const normalized = passportId?.toLowerCase();
  return dogProfiles.find((dog) => dog.passportId.toLowerCase() === normalized);
}

export const pairScores = {
  "barys-koke": {
    coi: "4.8%",
    coiMeter: "32%",
    sireRisk: "Low",
    sireMeter: "24%",
    diversity: "Stable",
    diversityMeter: "68%",
    title: "Recommended with monitoring",
    text: "Pair is acceptable for the 2034 FCI evidence cycle. Add ophthalmology and field-trial video before export-ready status.",
  },
  "barys-aiym": {
    coi: "7.1%",
    coiMeter: "49%",
    sireRisk: "Moderate",
    sireMeter: "52%",
    diversity: "Watch",
    diversityMeter: "48%",
    title: "Proceed only with curator review",
    text: "The pedigree overlap is manageable, but this line is already visible in the regional pool. Require DNA parentage and one unrelated backup sire.",
  },
  "barys-sulu": {
    coi: "3.2%",
    coiMeter: "22%",
    sireRisk: "Low",
    sireMeter: "28%",
    diversity: "Strong",
    diversityMeter: "78%",
    title: "Strong diversity signal",
    text: "This pair improves the regional diversity index and keeps the field-performance line intact. Good candidate for public breeder trust mark.",
  },
  "temir-koke": {
    coi: "9.4%",
    coiMeter: "66%",
    sireRisk: "High",
    sireMeter: "74%",
    diversity: "Risk",
    diversityMeter: "33%",
    title: "Avoid for the current cycle",
    text: "Popular sire pressure is high and the projected litter weakens effective population balance. Choose a less-used sire line.",
  },
  "temir-aiym": {
    coi: "5.6%",
    coiMeter: "39%",
    sireRisk: "Moderate",
    sireMeter: "44%",
    diversity: "Stable",
    diversityMeter: "62%",
    title: "Acceptable with health evidence",
    text: "The pairing is usable if both dogs close the health package before litter declaration and the breeder adds full temperament records.",
  },
  "temir-sulu": {
    coi: "6.3%",
    coiMeter: "43%",
    sireRisk: "Moderate",
    sireMeter: "47%",
    diversity: "Stable",
    diversityMeter: "59%",
    title: "Curator sign-off recommended",
    text: "This pair is not blocked, but it should be reviewed because the projected line repeats a common champion ancestor.",
  },
  "arkan-koke": {
    coi: "2.8%",
    coiMeter: "19%",
    sireRisk: "Low",
    sireMeter: "21%",
    diversity: "Strong",
    diversityMeter: "82%",
    title: "Priority pair for diversity",
    text: "Excellent population signal. This pair should be encouraged in the breeder network if health testing closes on schedule.",
  },
  "arkan-aiym": {
    coi: "4.1%",
    coiMeter: "29%",
    sireRisk: "Low",
    sireMeter: "26%",
    diversity: "Stable",
    diversityMeter: "72%",
    title: "Recommended",
    text: "Balanced pedigree and acceptable field-performance continuity. Suitable for FCI evidence export after litter declaration.",
  },
  "arkan-sulu": {
    coi: "8.2%",
    coiMeter: "58%",
    sireRisk: "Moderate",
    sireMeter: "56%",
    diversity: "Watch",
    diversityMeter: "45%",
    title: "Hold pending curator review",
    text: "Projected diversity is borderline. Require curator approval and a comparison with two alternative sires before proceeding.",
  },
};

export const heroCopy = {
  ru: {
    heroTitle: "TAZY.PRO",
    heroText:
      "Национальная цифровая платформа для доказательного реестра тазы: шежіре, здоровье, ДНК, полевые испытания, разведение и FCI Data Room к полному признанию в 2034 году.",
  },
  kk: {
    heroTitle: "TAZY.PRO",
    heroText:
      "Қазақ тазысына арналған ұлттық цифрлық платформа: шежіре, денсаулық, ДНҚ, дала сынақтары, өсіру жүйесі және 2034 жылға дейінгі FCI Data Room.",
  },
  en: {
    heroTitle: "TAZY.PRO",
    heroText:
      "A national digital platform for verified Tazy evidence: pedigree, health, DNA, field trials, breeding intelligence and the FCI Data Room for 2034 recognition.",
  },
};

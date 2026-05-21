const dogProfiles = [
  {
    name: "Akzhel Barys",
    meta: "Male · born 2022 · Almaty region",
    score: "86%",
    photo: "./assets/tazy-profile-1.jpg",
    alt: "Akzhel Barys profile",
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
    name: "Saumal Koke",
    meta: "Female · born 2023 · Turkistan region",
    score: "74%",
    photo: "./assets/tazy-profile-2.jpg",
    alt: "Saumal Koke profile",
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

const pairScores = {
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

const copy = {
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

const header = document.querySelector("[data-header]");
const html = document.documentElement;
const menu = document.querySelector("[data-mobile-menu]");
const menuToggle = document.querySelector("[data-menu-toggle]");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 18);
});

document.querySelector("[data-theme-toggle]").addEventListener("click", () => {
  const next = html.dataset.theme === "dark" ? "light" : "dark";
  html.dataset.theme = next;
});

menuToggle.addEventListener("click", () => {
  const open = !menu.classList.contains("open");
  menu.classList.toggle("open", open);
  document.body.classList.toggle("no-scroll", open);
  menuToggle.setAttribute("aria-expanded", String(open));
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menu.classList.remove("open");
    document.body.classList.remove("no-scroll");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    const lang = button.dataset.lang;
    document.querySelectorAll("[data-lang]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    document.documentElement.lang = lang === "kk" ? "kk" : lang;
    document.querySelectorAll("[data-copy]").forEach((node) => {
      const key = node.dataset.copy;
      node.textContent = copy[lang][key];
    });
  });
});

function renderDog(index) {
  const profile = dogProfiles[index];
  document.querySelector("[data-dog-photo]").src = profile.photo;
  document.querySelector("[data-dog-photo]").alt = profile.alt;
  document.querySelector("[data-dog-name]").textContent = profile.name;
  document.querySelector("[data-dog-meta]").textContent = profile.meta;
  document.querySelector("[data-dog-score]").textContent = profile.score;

  const list = document.querySelector("[data-verification-list]");
  list.innerHTML = profile.steps
    .map(([label, status, state]) => {
      const icon = state === "done" ? "✓" : "•";
      return `
        <div class="verification-row ${state === "pending" ? "pending" : ""}">
          <span class="verification-dot" aria-hidden="true">${icon}</span>
          <span><b>${label}</b><small>${status}</small></span>
          <b>${state}</b>
        </div>
      `;
    })
    .join("");
}

document.querySelectorAll("[data-dog]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-dog]").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });
    renderDog(Number(button.dataset.dog));
  });
});

function updateBreeding() {
  const sire = document.querySelector("[data-sire]").value;
  const dam = document.querySelector("[data-dam]").value;
  const data = pairScores[`${sire}-${dam}`] || pairScores["barys-koke"];

  document.querySelector("[data-coi]").textContent = data.coi;
  document.querySelector("[data-coi-meter]").style.width = data.coiMeter;
  document.querySelector("[data-sire-risk]").textContent = data.sireRisk;
  document.querySelector("[data-sire-meter]").style.width = data.sireMeter;
  document.querySelector("[data-diversity]").textContent = data.diversity;
  document.querySelector("[data-diversity-meter]").style.width = data.diversityMeter;
  document.querySelector("[data-recommendation-title]").textContent = data.title;
  document.querySelector("[data-recommendation]").textContent = data.text;
}

document.querySelector("[data-run-match]").addEventListener("click", updateBreeding);
document.querySelector("[data-sire]").addEventListener("change", updateBreeding);
document.querySelector("[data-dam]").addEventListener("change", updateBreeding);

renderDog(0);
updateBreeding();

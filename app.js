/* eslint-env browser */

// Clinical Frailty Scale levels
const CFS_LEVELS = [
  {
    level: 1,
    title: "Very Fit",
    description:
      "People who are robust, active, energetic and motivated. These people commonly exercise regularly. They are among the fittest for their age.",
  },
  {
    level: 2,
    title: "Fit",
    description:
      "People who have no active disease symptoms but are less fit than category 1. Often, they exercise or are very active occasionally, e.g. seasonally.",
  },
  {
    level: 3,
    title: "Managing Well",
    description:
      "Medical problems are well controlled, but are not regularly active beyond routine walking.",
  },
  {
    level: 4,
    title: "Living with Very Mild Frailty",
    description:
      "While not dependent on others for daily help, often symptoms limit activities. A common complaint is being 'slowed up', and/or being tired during the day.",
  },
  {
    level: 5,
    title: "Living with Mild Frailty",
    description:
      "These people often have more evident slowing, and need help in high order IADLs (finances, transportation, heavy housework, medications). Typically, mild frailty progressively impairs shopping and walking outside alone, meal preparation and housework.",
  },
  {
    level: 6,
    title: "Living with Moderate Frailty",
    description:
      "People need help with all outside activities and with keeping house. Inside, they often have problems with stairs and need help with bathing and might need minimal assistance (cuing) with dressing.",
  },
  {
    level: 7,
    title: "Living with Severe Frailty",
    description:
      "Completely dependent for personal care, from whatever cause (physical or cognitive). Even so, they seem stable and not at high risk of dying (within ~ 6 months).",
  },
  {
    level: 8,
    title: "Living with Very Severe Frailty",
    description:
      "Completely dependent, approaching the end of life. Typically, they could not recover even from a minor illness.",
  },
  {
    level: 9,
    title: "Terminally Ill",
    description:
      "Approaching the end of life. This category applies to people with a life expectancy <6 months, who are not otherwise evidently frail.",
  },
];

// Database setup
const DB_NAME = "MedicalSurvey";
const STORE_NAME = "assessments";
let db;

// Initialize IndexedDB
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      const objectStore = database.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });

      // Create indexes
      objectStore.createIndex("timestamp", "timestamp", { unique: false });
      objectStore.createIndex(
        "patientName",
        ["basicDetails.firstName", "basicDetails.lastName"],
        { unique: false }
      );
    };
  });
}

// Database operations
async function saveAssessment(assessment) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(assessment);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllAssessments() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteAssessment(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getAssessment(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateAssessment(assessment) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(assessment);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// DOM helpers
const qs = (selector) => document.querySelector(selector);
const qsAll = (selector) => document.querySelectorAll(selector);

// Section management
const sections = [
  "basicDetailsSection",
  "cfsSection",
  "resultsSection",
  "viewSection",
  "savedSection",
];

function showSection(sectionId) {
  sections.forEach((id) => {
    const section = qs(`#${id}`);
    section.classList.toggle("active", id === sectionId);
  });

  // Reset scroll position for the active section after a small delay
  setTimeout(() => {
    const activeSection = qs(`#${sectionId}`);
    if (activeSection) {
      activeSection.scrollTop = 0;
    }
  }, 10);
}

// Form validation
function validateForm(formId) {
  const form = qs(formId);

  if (formId === "#cfsForm") {
    // For CFS form, only validate visible sections
    return validateVisibleSections();
  }

  return form.checkValidity();
}

function validateVisibleSections() {
  const formData = new FormData(qs("#cfsForm"));
  const responses = Object.fromEntries(formData);

  // Always require terminally ill question
  if (!responses.terminally) {
    return false;
  }

  // If terminally ill is "yes", only require that field
  if (responses.terminally === "1") {
    return true;
  }

  // If terminally ill is "no", validate based on visible sections
  const badlsDiv = qs(".badls_div");
  const iadlsDiv = qs(".iadls_div");
  const chronicDiv = qs(".chronic_div");
  const selfCareDiv = qs(".self_care_div");

  // Validate BADLS if visible
  if (!badlsDiv.hidden) {
    const badlsFields = ["dress", "eat", "walk", "bed", "bath"];
    const hasAllBadls = badlsFields.every(
      (field) => responses[field] !== undefined
    );
    if (!hasAllBadls) return true;

    // If BADLS has any "yes" responses, validation is complete
    const badlsYesCount = badlsFields.reduce((count, field) => {
      return count + (responses[field] === "1" ? 1 : 0);
    }, 0);

    if (badlsYesCount > 0) return true;
  }

  // Validate IADLS if visible
  if (!iadlsDiv.hidden) {
    const iadlsFields = [
      "telephone",
      "shopping",
      "cooking",
      "housework",
      "medicine",
      "money",
    ];
    const hasAllIadls = iadlsFields.every(
      (field) => responses[field] !== undefined
    );
    if (!hasAllIadls) return true;

    // If IADLS has any "yes" responses, validation is complete
    const iadlsYesCount = iadlsFields.reduce((count, field) => {
      return count + (responses[field] === "1" ? 1 : 0);
    }, 0);

    if (iadlsYesCount > 0) return true;
  }

  // Validate chronic conditions if visible
  if (!chronicDiv.hidden) {
    const chronicFields = [
      "emphysema",
      "bp",
      "heart_disease",
      "angina",
      "cancer",
      "memory",
      "dementia",
      "osteoarthritis",
      "rheumatoid",
      "peripheral_vascular",
      "stroke",
      "mini_stroke",
      "parkinsons",
      "ulcers",
      "bowel_disorder",
      "glaucoma",
      "macular_degeneration",
      "osteoporosis",
      "back_problems",
      "thyroid_gland",
      "kidney_disease",
      "others",
    ];
    const hasAllChronic = chronicFields.every(
      (field) => responses[field] !== undefined
    );
    if (!hasAllChronic) return true;

    // Count chronic conditions
    const chronicYesCount = chronicFields.reduce((count, field) => {
      return count + (responses[field] === "1" ? 1 : 0);
    }, 0);

    if (chronicYesCount >= 10) return true;
  }

  return true;
}

function updateButtonState() {
  // Enable/disable Next button based on basicDetails form validity
  const nextBtn = qs("#nextToCfs");
  nextBtn.disabled = !validateForm("#basicDetailsForm");

  // Enable/disable Calculate Score button based on CFS form validity
  const calcBtn = qs("#calcScore");
  calcBtn.disabled = !validateForm("#cfsForm");

  // Update View Saved Assessments button state
  updateViewSavedButton();
}

// Update View Saved Assessments button state based on form content
function updateViewSavedButton() {
  const viewSavedButton = qs("#viewSavedAssessments");
  const basicDetailsForm = qs("#basicDetailsForm");

  if (!viewSavedButton || !basicDetailsForm) return;

  // Get all form inputs
  const formData = new FormData(basicDetailsForm);
  const formValues = Object.fromEntries(formData);

  // Check if any input has a value (excluding empty strings and null values)
  const hasAnyValue = Object.values(formValues).some(
    (value) => value && value.toString().trim() !== ""
  );

  // Also check radio buttons separately since FormData might not capture unchecked ones
  const radioInputs = basicDetailsForm.querySelectorAll(
    'input[type="radio"]:checked'
  );
  const hasCheckedRadio = radioInputs.length > 0;

  // Disable button if form has any data
  if (hasAnyValue || hasCheckedRadio) {
    viewSavedButton.disabled = true;
    viewSavedButton.style.opacity = "0.5";
    viewSavedButton.style.cursor = "not-allowed";
    viewSavedButton.title = "Clear the form to view saved assessments";
  } else {
    viewSavedButton.disabled = false;
    viewSavedButton.style.opacity = "1";
    viewSavedButton.style.cursor = "pointer";
    viewSavedButton.title = "View Saved Assessments";
  }
}

// Calculate CFS score
function calculateCFSScore(answers) {
  // Count the number of "yes" responses (value=1)
  const badlsFields = ["dress", "eat", "walk", "bed", "bath"];
  const badls = badlsFields.reduce((count, field) => {
    return count + (answers[field] === "1" ? 1 : 0);
  }, 0);
  const iadlsFields = [
    "telephone",
    "shopping",
    "cooking",
    "housework",
    "medicine",
    "money",
  ];
  const iadls = iadlsFields.reduce((count, field) => {
    return count + (answers[field] === "1" ? 1 : 0);
  }, 0);
  const chronicFields = [
    "emphysema",
    "bp",
    "heart_disease",
    "angina",
    "cancer",
    "memory",
    "dementia",
    "osteoarthritis",
    "rheumatoid",
    "peripheral_vascular",
    "stroke",
    "mini_stroke",
    "parkinsons",
    "ulcers",
    "bowel_disorder",
    "glaucoma",
    "macular_degeneration",
    "osteoporosis",
    "back_problems",
    "thyroid_gland",
    "kidney_disease",
    "others",
  ];
  const chronic = chronicFields.reduce((count, field) => {
    return count + (answers[field] === "1" ? 1 : 0);
  }, 0);
  // Scoring Logic
  // Terminally ill is yes
  if (answers.terminally === "1") {
    if (badls > 2) {
      return 9;
    } else {
      return 8;
    }
  }
  // Terminally ill is no
  else {
    if (badls > 2) {
      return 7;
    } else if (badls > 0) {
      return 6;
    } else {
      if (iadls > 4) {
        return 6;
      } else if (iadls > 0) {
        return 5;
      } else {
        if (chronic > 9) {
          return 4;
        } else {
          // Health - Excellent
          if (answers.health === "2") {
            // Effort - All of the time (5-7 days)
            if (answers.effort === "2") {
              return 4;
            }
            // Effort - Rarely or never (Less than 1 day)
            else if (answers.effort === "0") {
              // Sports activity
              if (answers.sports === "1") {
                return 1;
              } else if (answers.sports === "0") {
                return 2;
              }
            }
            // Effort - Sometimes/Occasionally (1-4 days)
            else if (answers.effort === "1") {
              // Sports activity
              if (answers.sports === "1") {
                return 2;
              } else if (answers.sports === "0") {
                return 3;
              }
            }
          }
          // Health - Very Good/Good
          else if (answers.health === "1") {
            // Effort - All of the time (5-7 days)
            if (answers.effort === "2") {
              return 4;
            }
            // Effort - Rarely or never (Less than 1 day)
            else if (answers.effort === "0") {
              // Sports activity
              if (answers.sports === "1") {
                return 2;
              } else if (answers.sports === "0") {
                return 3;
              }
            }
            // Effort - Sometimes/Occasionally (1-4 days)
            else if (answers.effort === "1") {
              // Sports activity
              if (answers.sports === "1") {
                return 2;
              } else if (answers.sports === "0") {
                return 3;
              }
            }
          }
          // Health - Poor/Fair
          else if (answers.health === "0") {
            return 4;
          }
        }
      }
    }
  }
}

// Display result
function displayResult(score, details) {
  const level = CFS_LEVELS.find((l) => l.level === score);
  const resultCard = qs("#resultCard");

  resultCard.innerHTML = `
    <div class="score">${score}</div>
    <div class="level-title">${level.title}</div>
  `;

  // Show/hide chronic_div_others based on CFS score
  const chronicDivOthers = qs(".chronic_div_others");
  if (chronicDivOthers) {
    if (score >= 5) {
      chronicDivOthers.style.display = "block";
    } else {
      chronicDivOthers.style.display = "none";
    }
  }
}

// Display comprehensive assessment view (read-only)
function displayAssessmentView(assessment) {
  const level = CFS_LEVELS.find((l) => l.level === assessment.score);
  const viewContent = qs("#assessmentViewContent");
  const details = assessment.basicDetails || assessment.demographics || {};
  const responses = assessment.responses || {};

  // Helper function to format yes/no responses
  const formatYesNo = (value) => {
    if (value === "1") return "Yes";
    if (value === "0") return "No";
    return "Not answered";
  };

 // Helper function to format yes/no responses
  const BadlsFormatYesNo = (value) => {
    if (value === "1") return "No";
    if (value === "0") return "Yes";
    return "Not answered";
  };


  // Helper function to format health rating
  const formatHealth = (value) => {
    switch (value) {
      case "2":
        return "Excellent";
      case "1":
        return "Very Good/Good";
      case "0":
        return "Fair/Poor";
      default:
        return "Not answered";
    }
  };

  // Helper function to format effort rating
  const formatEffort = (value) => {
    switch (value) {
      case "0":
        return "Rarely or never (Less than 1 day)";
      case "1":
        return "Some/Occasional (1-4 days)";
      case "2":
        return "All of the time (5-7 days)";
      default:
        return "Not answered";
    }
  };

  // Helper function to format sports rating
  const formatSports = (value) => {
    switch (value) {
      case "0":
        return "Never/Seldom (1-2 days)";
      case "1":
        return "Sometimes/Often (3-7 days)";
      default:
        return "Not answered";
    }
  };

  viewContent.innerHTML = `
    <div>
      <!-- CFS Score Header -->
      <div style="text-align: center; margin-bottom: 2rem; padding: 1rem; background: var(--gray-100); border-radius: 8px; border: 1px solid var(--gray-200);">
        <div class="score" style="font-size: 3rem; font-weight: bold; color: var(--primary-blue); margin-bottom: 0.5rem;">${
          assessment.score
        }</div>
        <div class="level-title" style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--gray-800);">${
          level.title
        }</div>
      </div>

      <!-- Patient Information -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid var(--gray-300); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: var(--primary-blue); color: var(--bg-primary);">
            <th colspan="2" style="padding: 12px; text-align: left; font-size: 1.1rem;">Patient Information</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50); width: 30%;">Patient MRNO</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.mrno || "N/A"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Age</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.age || "N/A"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Gender</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.gender || "N/A"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">ED Visit Date</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.edVisitDate || "N/A"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">ED Visit Time</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.edVisitTime || "N/A"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Presenting Complaints</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.presentingComplaints || "N/A"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Assessment Date</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${new Date(
              assessment.timestamp
            ).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <!-- Vital Signs -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid var(--gray-300); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: var(--secondary-green); color: var(--bg-primary);">
            <th colspan="2" style="padding: 12px; text-align: left; font-size: 1.1rem;">Vital Signs</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50); width: 30%;">Blood Pressure (mmHg)</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.bp_count || "N/A"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Respiratory Rate (breaths/min)</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.rr_count || "N/A"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Heart Rate (bpm)</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.hr_count || "N/A"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">SpO2 (%)</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.spo2_count || "N/A"
            }</td>
          </tr>
        </tbody>
      </table>

      <!-- CFS Assessment -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid var(--gray-300); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: var(--secondary-orange); color: var(--bg-primary);">
            <th colspan="2" style="padding: 12px; text-align: left; font-size: 1.1rem;">Clinical Frailty Scale Assessment</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50); width: 30%;">Terminally Ill</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.terminally
            )}</td>
          </tr>
        </tbody>
      </table>

      <!-- BADLS -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid var(--gray-300); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: var(--secondary-teal); color: var(--bg-primary);">
            <th colspan="2" style="padding: 12px; text-align: left; font-size: 1.1rem;">Basic Activities of Daily Living (BADLS)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50); width: 50%;">Dress and undress</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.dress
            )} ${
    responses.dress === "1"
      ? "(Needs help)"
      : responses.dress === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Eat</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.eat
            )} ${
    responses.eat === "1"
      ? "(Needs help)"
      : responses.eat === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Walk</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.walk
            )} ${
    responses.walk === "1"
      ? "(Needs help)"
      : responses.walk === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Get in and out of bed</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.bed
            )} ${
    responses.bed === "1"
      ? "(Needs help)"
      : responses.bed === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Take a bath or shower</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.bath
            )} ${
    responses.bath === "1"
      ? "(Needs help)"
      : responses.bath === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
        </tbody>
      </table>

      <!-- IADLS -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid var(--gray-300); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: var(--primary-blue-light); color: var(--bg-primary);">
            <th colspan="2" style="padding: 12px; text-align: left; font-size: 1.1rem;">Instrumental Activities of Daily Living (IADLS)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50); width: 50%;">Use the telephone</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.telephone
            )} ${
    responses.telephone === "1"
      ? "(Needs help)"
      : responses.telephone === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Go shopping</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.shopping
            )} ${
    responses.shopping === "1"
      ? "(Needs help)"
      : responses.shopping === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Prepare meals</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.cooking
            )} ${
    responses.cooking === "1"
      ? "(Needs help)"
      : responses.cooking === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Do housework</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.housework
            )} ${
    responses.housework === "1"
      ? "(Needs help)"
      : responses.housework === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Take medicine</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.medicine
            )} ${
    responses.medicine === "1"
      ? "(Needs help)"
      : responses.medicine === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Handle money</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${BadlsFormatYesNo(
              responses.money
            )} ${
    responses.money === "1"
      ? "(Needs help)"
      : responses.money === "0"
      ? "(Independent)"
      : ""
  }</td>
          </tr>
        </tbody>
      </table>

      <!-- Chronic Conditions -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid var(--gray-300); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: var(--secondary-red); color: var(--bg-primary);">
            <th colspan="2" style="padding: 12px; text-align: left; font-size: 1.1rem;">Chronic Health Conditions</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50); width: 50%;">Emphysema/COPD</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.emphysema
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">High blood pressure</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.bp
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Heart disease</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.heart_disease
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Angina/Heart attack</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.angina
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Cancer</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.cancer
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Memory problem</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.memory
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Dementia/Alzheimer's</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.dementia
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Osteoarthritis</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.osteoarthritis
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Rheumatoid arthritis</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.rheumatoid
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Peripheral vascular disease</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.peripheral_vascular
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Stroke/CVA</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.stroke
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Mini-stroke/TIA</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.mini_stroke
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Parkinson's disease</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.parkinsons
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Stomach/Intestinal ulcers</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.ulcers
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Bowel disorder</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.bowel_disorder
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Glaucoma</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.glaucoma
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Macular degeneration</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.macular_degeneration
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Osteoporosis</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.osteoporosis
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Back problems</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.back_problems
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Thyroid problems</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.thyroid_gland
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Kidney disease</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.kidney_disease
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Other conditions</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatYesNo(
              responses.others
            )} ${
    responses.other_conditions ? `(${responses.other_conditions})` : ""
  }</td>
          </tr>
        </tbody>
      </table>

      <!-- Self-Care Assessment -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid var(--gray-300); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: var(--primary-blue-dark); color: var(--bg-primary);">
            <th colspan="2" style="padding: 12px; text-align: left; font-size: 1.1rem;">Self-Care Assessment</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50); width: 50%;">General Health</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatHealth(
              responses.health
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Everything is an Effort</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatEffort(
              responses.effort
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Sports/Recreation Activity</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${formatSports(
              responses.sports
            )}</td>
          </tr>
        </tbody>
      </table>

      <!-- ED Disposition & Orders -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid var(--gray-300); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: var(--warning); color: var(--bg-primary);">
            <th colspan="2" style="padding: 12px; text-align: left; font-size: 1.1rem;">ED Disposition & Orders</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50); width: 50%;">ED Disposition</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.disposition || "Not specified"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">DNI/DNR Order Placed</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.dnr_order || "Not specified"
            }</td>
          </tr>
        </tbody>
      </table>

      <!-- Outcome -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid var(--gray-300); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: var(--secondary-teal); color: var(--bg-primary);">
            <th colspan="2" style="padding: 12px; text-align: left; font-size: 1.1rem;">Outcome</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50); width: 50%;">In-hospital Mortality</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.mortality || "Not specified"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 8px; font-weight: bold; background-color: var(--gray-50);">Length of Stay (Days)</td>
            <td style="padding: 8px; background-color: var(--bg-primary);">${
              details.length_of_stay || "Not specified"
            }</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// Save current assessment
let currentAssessment = null;
let isEditingExisting = false; // Track if we're editing an existing assessment

async function saveCurrentAssessment() {
  if (!currentAssessment) {
    showToast("No assessment to save", "error");
    return;
  }

  try {
    // Set default values for unselected chronic conditions in chronic_div_others before collecting data
    const chronicDivOthers = qs(".chronic_div_others");
    if (chronicDivOthers && chronicDivOthers.style.display !== "none") {
      const chronicFields = [
        "emphysema", "bp", "heart_disease", "angina", "cancer", "memory",
        "dementia", "osteoarthritis", "rheumatoid", "peripheral_vascular",
        "stroke", "mini_stroke", "parkinsons", "ulcers", "bowel_disorder",
        "glaucoma", "macular_degeneration", "osteoporosis", "back_problems",
        "thyroid_gland", "kidney_disease", "others"
      ];

      chronicFields.forEach((field) => {
        // Check if any radio button for this field is selected
        const selectedRadio = chronicDivOthers.querySelector(`input[name="${field}"][type="radio"]:checked`);
        
        if (!selectedRadio) {
          // If no radio is selected, select the "0" (No) option
          const defaultRadio = chronicDivOthers.querySelector(`input[name="${field}"][value="0"]`);
          if (defaultRadio) {
            defaultRadio.checked = true;
          }
        }
      });
    }

    // Collect disposition and outcome data from the results section
    const resultsSection = qs("#resultsSection");
    const dispositionData = {};

    // Get disposition fields
    const dispositionInput = resultsSection.querySelector(
      'input[name="disposition"]:checked'
    );
    if (dispositionInput) {
      dispositionData.disposition = dispositionInput.value;
    }

    const dnrInput = resultsSection.querySelector(
      'input[name="dnr_order"]:checked'
    );
    if (dnrInput) {
      dispositionData.dnr_order = dnrInput.value;
    }

    const mortalityInput = resultsSection.querySelector(
      'input[name="mortality"]:checked'
    );
    if (mortalityInput) {
      dispositionData.mortality = mortalityInput.value;
    }

    const lengthOfStayInput = resultsSection.querySelector(
      'input[name="length_of_stay"]'
    );
    if (lengthOfStayInput && lengthOfStayInput.value) {
      dispositionData.length_of_stay = lengthOfStayInput.value;
    }

    // Collect chronic conditions data from chronic_div_others
    const chronicConditionsData = {};
    const chronicInputs = resultsSection.querySelectorAll(
      '.chronic_div_others input[type="radio"]:checked, .chronic_div_others input[type="text"]'
    );

    chronicInputs.forEach((input) => {
      if (input.type === "radio" && input.checked) {
        chronicConditionsData[input.name] = input.value;
      } else if (input.type === "text" && input.value.trim()) {
        chronicConditionsData[input.name] = input.value.trim();
      }
    });

    // Merge disposition and chronic conditions data with existing responses
    const updatedResponses = {
      ...currentAssessment.responses,
      ...chronicConditionsData,
    };

    // Merge disposition data with basic details
    const updatedBasicDetails = {
      ...currentAssessment.basicDetails,
      ...dispositionData,
    };

    // Update current assessment with all new data
    currentAssessment = {
      ...currentAssessment,
      basicDetails: updatedBasicDetails,
      responses: updatedResponses,
    };

    if (isEditingExisting && currentAssessment.id) {
      // Update existing assessment
      await updateAssessment(currentAssessment);
      showToast("Assessment updated successfully!");
    } else {
      // Create new assessment (remove ID if it exists to ensure new record)
      const newAssessment = { ...currentAssessment };
      delete newAssessment.id;
      await saveAssessment(newAssessment);
      showToast("Assessment saved successfully!");
    }

    // Reset editing flag
    isEditingExisting = false;

    loadSavedAssessments();
    showSection("savedSection");
  } catch (error) {
    console.error("Error saving assessment:", error);
    showToast("Error saving assessment", "error");
  }
}

// Load and display saved assessments
async function loadSavedAssessments() {
  try {
    const assessments = await getAllAssessments();
    const container = qs("#savedList");

    if (assessments.length === 0) {
      container.innerHTML = "<p>No saved assessments yet.</p>";
      return;
    }

    // Sort by timestamp (newest first)
    assessments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    container.innerHTML = assessments
      .map((assessment) => {
        // Handle both basicDetails and demographics data structures
        const details =
          assessment.basicDetails || assessment.demographics || {};
        const patientName =
          details.mrno || details.firstName || "Unknown Patient";
        const age = details.age || "N/A";

        return `
          <div class="card">
          <div class="card-info">
            <strong>${patientName}</strong><br>
            Age: ${age} | Gender: ${details.gender || "N/A"}<br>
            CFS Score: ${assessment.score} (${assessment.levelTitle})<br>
            <small>Assessed: ${new Date(
              assessment.timestamp
            ).toLocaleString()}</small>
          </div>
          <div class="card-actions">
            <button class="view" data-id="${assessment.id}">View</button>
            <button class="edit" data-id="${assessment.id}">Edit</button>
            <button class="del" data-id="${assessment.id}">Delete</button>
          </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading assessments:", error);
    showToast("Error loading assessments", "error");
  }
}

// Handle saved list actions
async function handleSavedListAction(event) {
  const button = event.target;
  const id = parseInt(button.dataset.id);

  if (button.classList.contains("view")) {
    try {
      const assessment = await getAssessment(id);
      currentAssessment = assessment;
      // Handle both basicDetails and demographics data structures
      const details = assessment.basicDetails || assessment.demographics || {};
      displayAssessmentView(assessment);
      showSection("viewSection");
    } catch (error) {
      console.error("Error viewing assessment:", error);
      showToast("Error loading assessment", "error");
    }
  }

  if (button.classList.contains("edit")) {
    try {
      const assessment = await getAssessment(id);
      await loadAssessmentForEditing(assessment);
      showToast("Assessment loaded for editing");
      showSection("basicDetailsSection");
    } catch (error) {
      console.error("Error loading assessment for editing:", error);
      showToast("Error loading assessment for editing", "error");
    }
  }

  if (button.classList.contains("del")) {
    if (confirm("Are you sure you want to delete this assessment?")) {
      try {
        await deleteAssessment(id);
        showToast("Assessment deleted");
        loadSavedAssessments();
      } catch (error) {
        console.error("Error deleting assessment:", error);
        showToast("Error deleting assessment", "error");
      }
    }
  }
}

// Load assessment data into forms for editing
async function loadAssessmentForEditing(assessment) {
  // Clear all forms first
  clearAllForms();

  // Handle both basicDetails and demographics data structures
  const details = assessment.basicDetails || assessment.demographics || {};
  const responses = assessment.responses || {};

  // Populate basic details form
  const basicDetailsForm = qs("#basicDetailsForm");
  if (basicDetailsForm) {
    Object.keys(details).forEach((key) => {
      const input = basicDetailsForm.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === "radio") {
          const radioButton = basicDetailsForm.querySelector(
            `[name="${key}"][value="${details[key]}"]`
          );
          if (radioButton) {
            radioButton.checked = true;
          }
        } else {
          input.value = details[key];
        }
      }
    });
  }

  // Populate CFS form
  const cfsForm = qs("#cfsForm");
  if (cfsForm) {
    Object.keys(responses).forEach((key) => {
      const input = cfsForm.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === "radio") {
          const radioButton = cfsForm.querySelector(
            `[name="${key}"][value="${responses[key]}"]`
          );
          if (radioButton) {
            radioButton.checked = true;
          }
        } else if (input.type === "text" || input.type === "number") {
          input.value = responses[key];
        }
      }
    });
  }

  // Set current assessment for potential saving and mark as editing existing
  currentAssessment = assessment;
  isEditingExisting = true;

  // Populate disposition and outcome fields in results section if they exist
  const resultsSection = qs("#resultsSection");
  if (resultsSection && details.disposition) {
    const dispositionInput = resultsSection.querySelector(
      `input[name="disposition"][value="${details.disposition}"]`
    );
    if (dispositionInput) {
      dispositionInput.checked = true;
    }
  }

  if (resultsSection && details.dnr_order) {
    const dnrInput = resultsSection.querySelector(
      `input[name="dnr_order"][value="${details.dnr_order}"]`
    );
    if (dnrInput) {
      dnrInput.checked = true;
    }
  }

  if (resultsSection && details.mortality) {
    const mortalityInput = resultsSection.querySelector(
      `input[name="mortality"][value="${details.mortality}"]`
    );
    if (mortalityInput) {
      mortalityInput.checked = true;
    }
  }

  if (resultsSection && details.length_of_stay) {
    const lengthOfStayInput = resultsSection.querySelector(
      'input[name="length_of_stay"]'
    );
    if (lengthOfStayInput) {
      lengthOfStayInput.value = details.length_of_stay;
    }
  }

  // Populate chronic conditions in chronic_div_others
  const chronicDivOthers = resultsSection.querySelector(".chronic_div_others");
  if (chronicDivOthers && responses) {
    // List of chronic condition field names
    const chronicFields = [
      "emphysema",
      "bp",
      "heart_disease",
      "angina",
      "cancer",
      "memory",
      "dementia",
      "osteoarthritis",
      "rheumatoid",
      "peripheral_vascular",
      "stroke",
      "mini_stroke",
      "parkinsons",
      "ulcers",
      "bowel_disorder",
      "glaucoma",
      "macular_degeneration",
      "osteoporosis",
      "back_problems",
      "thyroid_gland",
      "kidney_disease",
      "others",
    ];

    chronicFields.forEach((field) => {
      if (responses[field] !== undefined) {
        const radioButton = chronicDivOthers.querySelector(
          `input[name="${field}"][value="${responses[field]}"]`
        );
        if (radioButton) {
          radioButton.checked = true;
        }
      }
    });

    // Handle other_conditions text field
    if (responses.other_conditions) {
      const otherConditionsInput = chronicDivOthers.querySelector(
        'input[name="other_conditions"]'
      );
      if (otherConditionsInput) {
        otherConditionsInput.value = responses.other_conditions;
      }
    }

    // Set default values for any unselected chronic conditions
    chronicFields.forEach((field) => {
      if (responses[field] === undefined) {
        // If this field wasn't in the saved data, set default to "No" (value="0")
        const defaultRadio = chronicDivOthers.querySelector(`input[name="${field}"][value="0"]`);
        if (defaultRadio) {
          defaultRadio.checked = true;
        }
      }
    });
  }

  // Update section visibility based on loaded data
  updateSectionVisibility();

  // Update button states
  updateButtonState();
}

// Toast notifications
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  if (type === "error") {
    toast.style.background = "#f44336";
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

// Export data functionality
async function exportAllData() {
  try {
    const assessments = await getAllAssessments();

    if (assessments.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    // Create CSV content
    const csvContent = convertToCSV(assessments);
    const dataBlob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `cfs_assessments_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();

    showToast("Data exported to Excel successfully!");
  } catch (error) {
    console.error("Error exporting data:", error);
    showToast("Error exporting data", "error");
  }
}

// Convert assessments data to CSV format
function convertToCSV(assessments) {
  // Define CSV headers
  const headers = [
    "Assessment ID",
    "Timestamp",
    "Patient MRNO",
    "Patient Age",
    "Gender",
    "ED Visit Date",
    "ED Visit Time",
    "Presenting Complaints",
    "BP (mmHg)",
    "RR (breaths/min)",
    "HR (bpm)",
    "SpO2 (%)",
    "CFS Score",
    "CFS Level",
    "Terminally Ill",
    // BADLS fields
    "BADLS - Dress",
    "BADLS - Eat",
    "BADLS - Walk",
    "BADLS - Bed",
    "BADLS - Bath",
    // IADLS fields
    "IADLS - Telephone",
    "IADLS - Shopping",
    "IADLS - Cooking",
    "IADLS - Housework",
    "IADLS - Medicine",
    "IADLS - Money",
    // Chronic conditions
    "Chronic - Emphysema",
    "Chronic - High BP",
    "Chronic - Heart Disease",
    "Chronic - Angina",
    "Chronic - Cancer",
    "Chronic - Memory",
    "Chronic - Dementia",
    "Chronic - Osteoarthritis",
    "Chronic - Rheumatoid",
    "Chronic - Peripheral Vascular",
    "Chronic - Stroke",
    "Chronic - Mini Stroke",
    "Chronic - Parkinsons",
    "Chronic - Ulcers",
    "Chronic - Bowel Disorder",
    "Chronic - Glaucoma",
    "Chronic - Macular Degeneration",
    "Chronic - Osteoporosis",
    "Chronic - Back Problems",
    "Chronic - Thyroid",
    "Chronic - Kidney Disease",
    "Chronic - Other Conditions",
    "Other Conditions Details",
    // Self-care
    "Health Rating",
    "Effort Frequency",
    "Sports Activity",
    // ED Disposition & Orders
    "ED Disposition",
    "DNR Order",
    // Outcome
    "In-hospital Mortality",
    "Length of Stay (Days)",
  ];

  // Create CSV rows
  const rows = assessments.map((assessment) => {
    const demo = assessment.basicDetails || {};
    const resp = assessment.responses || {};

    // Format timestamp without commas to prevent CSV column splitting
    const timestamp = new Date(assessment.timestamp)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);

    return [
      assessment.id || "",
      `"${timestamp}"`, // Quoted to ensure single column
      demo.mrno || "",
      demo.age || "",
      demo.gender || "",
      demo.edVisitDate || "",
      demo.edVisitTime || "",
      demo.presentingComplaints || "",
      demo.bp_count || "",
      demo.rr_count || "",
      demo.hr_count || "",
      demo.spo2_count || "",
      assessment.score || "",
      assessment.levelTitle || "",
      resp.terminally === "1" ? "Yes" : resp.terminally === "0" ? "No" : "",
      // BADLS
      resp.dress === "1" ? "No" : resp.dress === "0" ? "Yes" : "",
      resp.eat === "1" ? "No" : resp.eat === "0" ? "Yes" : "",
      resp.walk === "1" ? "No" : resp.walk === "0" ? "Yes" : "",
      resp.bed === "1" ? "No" : resp.bed === "0" ? "Yes" : "",
      resp.bath === "1" ? "No" : resp.bath === "0" ? "Yes" : "",
      // IADLS
      resp.telephone === "1" ? "No" : resp.telephone === "0" ? "Yes" : "",
      resp.shopping === "1" ? "No" : resp.shopping === "0" ? "Yes" : "",
      resp.cooking === "1" ? "No" : resp.cooking === "0" ? "Yes" : "",
      resp.housework === "1" ? "No" : resp.housework === "0" ? "Yes" : "",
      resp.medicine === "1" ? "No" : resp.medicine === "0" ? "Yes" : "",
      resp.money === "1" ? "No" : resp.money === "0" ? "Yes" : "",
      // Chronic conditions
      resp.emphysema === "1" ? "Yes" : resp.emphysema === "0" ? "No" : "",
      resp.bp === "1" ? "Yes" : resp.bp === "0" ? "No" : "",
      resp.heart_disease === "1"
        ? "Yes"
        : resp.heart_disease === "0"
        ? "No"
        : "",
      resp.angina === "1" ? "Yes" : resp.angina === "0" ? "No" : "",
      resp.cancer === "1" ? "Yes" : resp.cancer === "0" ? "No" : "",
      resp.memory === "1" ? "Yes" : resp.memory === "0" ? "No" : "",
      resp.dementia === "1" ? "Yes" : resp.dementia === "0" ? "No" : "",
      resp.osteoarthritis === "1"
        ? "Yes"
        : resp.osteoarthritis === "0"
        ? "No"
        : "",
      resp.rheumatoid === "1" ? "Yes" : resp.rheumatoid === "0" ? "No" : "",
      resp.peripheral_vascular === "1"
        ? "Yes"
        : resp.peripheral_vascular === "0"
        ? "No"
        : "",
      resp.stroke === "1" ? "Yes" : resp.stroke === "0" ? "No" : "",
      resp.mini_stroke === "1" ? "Yes" : resp.mini_stroke === "0" ? "No" : "",
      resp.parkinsons === "1" ? "Yes" : resp.parkinsons === "0" ? "No" : "",
      resp.ulcers === "1" ? "Yes" : resp.ulcers === "0" ? "No" : "",
      resp.bowel_disorder === "1"
        ? "Yes"
        : resp.bowel_disorder === "0"
        ? "No"
        : "",
      resp.glaucoma === "1" ? "Yes" : resp.glaucoma === "0" ? "No" : "",
      resp.macular_degeneration === "1"
        ? "Yes"
        : resp.macular_degeneration === "0"
        ? "No"
        : "",
      resp.osteoporosis === "1" ? "Yes" : resp.osteoporosis === "0" ? "No" : "",
      resp.back_problems === "1"
        ? "Yes"
        : resp.back_problems === "0"
        ? "No"
        : "",
      resp.thyroid_gland === "1"
        ? "Yes"
        : resp.thyroid_gland === "0"
        ? "No"
        : "",
      resp.kidney_disease === "1"
        ? "Yes"
        : resp.kidney_disease === "0"
        ? "No"
        : "",
      resp.others === "1" ? "Yes" : resp.others === "0" ? "No" : "",
      `"${resp.other_conditions || ""}"`,
      // Self-care
      getHealthRating(resp.health),
      getEffortRating(resp.effort),
      getSportsRating(resp.sports),
      // ED Disposition & Orders
      resp.disposition || "",
      resp.dnr_order || "",
      // Outcome
      resp.mortality || "",
      resp.length_of_stay || "",
    ];
  });

  // Combine headers and rows
  const csvArray = [headers, ...rows];

  // Convert to CSV string
  return csvArray.map((row) => row.join(",")).join("\n");
}

// Helper functions to convert coded values to readable text
function getHealthRating(value) {
  switch (value) {
    case "2":
      return "Excellent";
    case "1":
      return "Very Good/Good";
    case "0":
      return "Fair/Poor";
    default:
      return "";
  }
}

function getEffortRating(value) {
  switch (value) {
    case "0":
      return "Rarely/Never";
    case "1":
      return "Some/Occasional";
    case "2":
      return "All the time";
    default:
      return "";
  }
}

function getSportsRating(value) {
  switch (value) {
    case "0":
      return "Never/Seldom";
    case "1":
      return "Sometimes/Often";
    default:
      return "";
  }
}

// Clear all form data and reset application state
function clearAllForms() {
  // Reset basicDetails form
  const basicDetailsForm = qs("#basicDetailsForm");
  if (basicDetailsForm) {
    basicDetailsForm.reset();
  }

  // Reset CFS form
  const cfsForm = qs("#cfsForm");
  if (cfsForm) {
    cfsForm.reset();
  }

  // Clear all radio button selections manually (including BADLS defaults)
  const allRadios = document.querySelectorAll('input[type="radio"]');
  allRadios.forEach((radio) => {
    radio.checked = false;
  });

  // Clear radio button memory for deselection functionality
  if (window.clearRadioMemory) {
    window.clearRadioMemory();
  }

  // Clear text inputs
  const allTextInputs = document.querySelectorAll(
    'input[type="text"], input[type="tel"], input[type="email"], input[type="number"], input[type="date"], input[type="time"]'
  );
  allTextInputs.forEach((input) => {
    input.value = "";
  });

  // Hide all conditional sections
  const badlsDiv = qs(".badls_div");
  const iadlsDiv = qs(".iadls_div");
  const chronicDiv = qs(".chronic_div");
  const selfCareDiv = qs(".self_care_div");

  if (badlsDiv) badlsDiv.hidden = true;
  if (iadlsDiv) iadlsDiv.hidden = true;
  if (chronicDiv) chronicDiv.hidden = true;
  if (selfCareDiv) selfCareDiv.hidden = true;

  // Clear current assessment
  currentAssessment = null;
  isEditingExisting = false;

  // Reset button states
  updateButtonState();

  // Show basicDetails section
  showSection("basicDetailsSection");
}

// Offline indicator
function updateOfflineStatus() {
  const indicator = qs("#offlineIndicator");
  indicator.classList.toggle("hidden", navigator.onLine);
}

// Simple custom alert function
function showAlert(message, onConfirm) {
  const modal = document.getElementById("alertModal");
  const alertText = document.getElementById("alertText");
  const cancelBtn = document.getElementById("alertCancel");
  const confirmBtn = document.getElementById("alertConfirm");

  alertText.textContent = message;
  modal.style.display = "flex";

  const hideModal = () => {
    modal.style.display = "none";
  };

  cancelBtn.onclick = hideModal;
  confirmBtn.onclick = () => {
    hideModal();
    onConfirm();
  };

  // Close on overlay click
  modal.onclick = (e) => {
    if (e.target === modal) hideModal();
  };
}

// Initialize app
async function init() {
  try {
    await initDB();
    console.log("Database initialized successfully");

    // Clear all forms on app initialization
    clearAllForms();

    // Load saved assessments
    await loadSavedAssessments();

    // Set up event listeners
    setupEventListeners();

    // Update offline status
    updateOfflineStatus();

    showToast("App loaded successfully!");
  } catch (error) {
    console.error("Error initializing app:", error);
    showToast("Error initializing app", "error");
  }
}

// Function to handle radio button deselection
function setupRadioButtonDeselection() {
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  const lastChecked = new Map(); // Track last checked radio for each group

  radioButtons.forEach((radio) => {
    radio.addEventListener("click", function (e) {
      const name = this.name;
      const wasChecked = lastChecked.get(name) === this;

      if (wasChecked) {
        // Deselect the radio button
        this.checked = false;
        lastChecked.delete(name);

        // Trigger input event to update form validation
        this.dispatchEvent(new Event("input", { bubbles: true }));

        // Update section visibility when radio is deselected
        if (name === "terminally") {
          updateSectionVisibility();
        }
      } else {
        // Update the last checked radio for this group
        lastChecked.set(name, this);
      }
    });

    // Update last checked on change (for programmatic changes)
    radio.addEventListener("change", function () {
      if (this.checked) {
        lastChecked.set(this.name, this);
      }
    });
  });

  // Clear the lastChecked map when forms are reset
  window.clearRadioMemory = function () {
    lastChecked.clear();
  };
}

// Function to handle conditional section display
function setupConditionalSectionDisplay() {
  const cfsForm = qs("#cfsForm");

  cfsForm.addEventListener("input", function (e) {
    if (e.target.type === "radio") {
      updateSectionVisibility();
    }
  });

  // Initial visibility update
  updateSectionVisibility();
}

function updateSectionVisibility() {
  const formData = new FormData(qs("#cfsForm"));
  const responses = Object.fromEntries(formData);

  const badlsDiv = qs(".badls_div");
  const iadlsDiv = qs(".iadls_div");
  const chronicDiv = qs(".chronic_div");
  const selfCareDiv = qs(".self_care_div");

  // Hide all sections initially
  badlsDiv.hidden = true;
  iadlsDiv.hidden = true;
  chronicDiv.hidden = true;
  selfCareDiv.hidden = true;

  // 1. If terminally ill is "yes" (value="1"), show BADLS
  if (responses.terminally === "1") {
    badlsDiv.hidden = false;
    return; // Stop here if terminally ill
  }

  // 2. If terminally ill is "no", check BADLS count
  if (responses.terminally === "0") {
    badlsDiv.hidden = false;

    // Count BADLS "yes" responses (value="1")
    const badlsFields = ["dress", "eat", "walk", "bed", "bath"];
    const badlsYesCount = badlsFields.reduce((count, field) => {
      return count + (responses[field] === "1" ? 1 : 0);
    }, 0);

    // 3. If BADLS yes count is 0, show IADLS
    if (badlsYesCount === 0) {
      iadlsDiv.hidden = false;

      // Count IADLS "yes" responses (value="1")
      const iadlsFields = [
        "telephone",
        "shopping",
        "cooking",
        "housework",
        "medicine",
        "money",
      ];
      const iadlsYesCount = iadlsFields.reduce((count, field) => {
        return count + (responses[field] === "1" ? 1 : 0);
      }, 0);

      // 4. If IADLS yes count is 0, show chronic conditions
      if (iadlsYesCount === 0) {
        chronicDiv.hidden = false;

        // Count chronic conditions "yes" responses (value="1")
        const chronicFields = [
          "emphysema",
          "bp",
          "heart_disease",
          "angina",
          "cancer",
          "memory",
          "dementia",
          "osteoarthritis",
          "rheumatoid",
          "peripheral_vascular",
          "stroke",
          "mini_stroke",
          "parkinsons",
          "ulcers",
          "bowel_disorder",
          "glaucoma",
          "macular_degeneration",
          "osteoporosis",
          "back_problems",
          "thyroid_gland",
          "kidney_disease",
          "others",
        ];
        const chronicYesCount = chronicFields.reduce((count, field) => {
          return count + (responses[field] === "1" ? 1 : 0);
        }, 0);

        // 5. If chronic conditions yes count is less than 10, show self care
        if (chronicYesCount < 10) {
          selfCareDiv.hidden = false;

          // 6. If health is fair/poor (value="0"), hide effort and sports sections
          if (responses.health === "0") {
            const effortDiv = qs(".effort");
            const sportsDiv = qs(".sports");
            if (effortDiv) effortDiv.hidden = true;
            if (sportsDiv) sportsDiv.hidden = true;
          } else {
            // If health is not "0" (Fair/Poor), show effort and sports sections
            const effortDiv = qs(".effort");
            const sportsDiv = qs(".sports");
            if (effortDiv) effortDiv.hidden = false;
            if (sportsDiv) sportsDiv.hidden = false;

            // 7. If effort is all of the time (value="2"), hide sports section (only if health is not Fair/Poor)
            if (responses.effort === "2") {
              const sportsDiv = qs(".sports");
              if (sportsDiv) sportsDiv.hidden = true;
            }
          }
        }
      }
    }
  }

  console.log("Section visibility updated:", {
    terminally: responses.terminally,
    badlsDiv: !badlsDiv.hidden,
    iadlsDiv: !iadlsDiv.hidden,
    chronicDiv: !chronicDiv.hidden,
    selfCareDiv: !selfCareDiv.hidden,
  });
}

// Set default values for BADLS radio buttons to "0" (No) if not already selected
// This function is used when collecting form data for calculation/saving
function setBadlsDefaultsForCollection() {
  const badlsDiv = qs(".badls_div");

  // Only apply defaults if BADLS section is visible
  if (!badlsDiv || badlsDiv.hidden) {
    return;
  }

  const badlsFields = ["dress", "eat", "walk", "bed", "bath"];

  badlsFields.forEach((fieldName) => {
    // Check if any radio button in this group is already selected
    const selectedRadio = qs(`input[name="${fieldName}"]:checked`);

    if (!selectedRadio) {
      // If no radio is selected, select the "0" (No) option
      const defaultRadio = qs(`input[name="${fieldName}"][value="0"]`);
      if (defaultRadio) {
        defaultRadio.checked = true;
        // Trigger change event to update form state
        defaultRadio.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  });
}

// Set default values for IADLS radio buttons to "0" (No) if not already selected
// This function is used when collecting form data for calculation/saving
function setIadlsDefaultsForCollection() {
  const iadlsDiv = qs(".iadls_div");

  // Only apply defaults if IADLS section is visible
  if (!iadlsDiv || iadlsDiv.hidden) {
    return;
  }

  const iadlsFields = [
    "telephone",
    "shopping",
    "cooking",
    "housework",
    "medicine",
    "money",
  ];

  iadlsFields.forEach((fieldName) => {
    // Check if any radio button in this group is already selected
    const selectedRadio = qs(`input[name="${fieldName}"]:checked`);

    if (!selectedRadio) {
      // If no radio is selected, select the "0" (No) option
      const defaultRadio = qs(`input[name="${fieldName}"][value="0"]`);
      if (defaultRadio) {
        defaultRadio.checked = true;
        // Trigger change event to update form state
        defaultRadio.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  });
}

// Set default values for chronic conditions radio buttons to "0" (No) if not already selected
// This function is used when collecting form data for calculation/saving
function setChronicDefaultsForCollection() {
  const chronicDiv = qs(".chronic_div");

  // Only apply defaults if chronic conditions section is visible
  if (!chronicDiv || chronicDiv.hidden) {
    return;
  }

  const chronicFields = [
    "emphysema",
    "bp",
    "heart_disease",
    "angina",
    "cancer",
    "memory",
    "dementia",
    "osteoarthritis",
    "rheumatoid",
    "peripheral_vascular",
    "stroke",
    "mini_stroke",
    "parkinsons",
    "ulcers",
    "bowel_disorder",
    "glaucoma",
    "macular_degeneration",
    "osteoporosis",
    "back_problems",
    "thyroid_gland",
    "kidney_disease",
    "others",
  ];

  chronicFields.forEach((fieldName) => {
    // Check if any radio button in this group is already selected
    const selectedRadio = qs(`input[name="${fieldName}"]:checked`);

    if (!selectedRadio) {
      // If no radio is selected, select the "0" (No) option
      const defaultRadio = qs(`input[name="${fieldName}"][value="0"]`);
      if (defaultRadio) {
        defaultRadio.checked = true;
        // Trigger change event to update form state
        defaultRadio.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  });
}

function setupEventListeners() {
  // Form validation listeners
  qs("#basicDetailsForm").addEventListener("input", updateButtonState);
  qs("#cfsForm").addEventListener("input", updateButtonState);

  // Radio button deselection functionality
  setupRadioButtonDeselection();

  // Conditional section display listeners
  setupConditionalSectionDisplay();

  // Navigation listeners
  qs("#nextToCfs").addEventListener("click", () => showSection("cfsSection"));
  qs("#viewSavedAssessments").addEventListener("click", () => {
    loadSavedAssessments();
    showSection("savedSection");
  });
  qs("#backToDemo").addEventListener("click", () =>
    showSection("basicDetailsSection")
  );
  qs("#backToCfs").addEventListener("click", () => showSection("cfsSection"));
  qs("#backToSaved").addEventListener("click", () => {
    loadSavedAssessments();
    showSection("savedSection");
  });

  // Handle all "New Assessment" buttons (multiple buttons with same ID)
  document.querySelectorAll("#newAssessment").forEach((button) => {
    button.addEventListener("click", () => {
      // Check if this button is in the results section
      const isInResultsSection = button.closest("#resultsSection");

      if (isInResultsSection) {
        // Show alert for results section button only
        showAlert(
          "Are you sure you want to start a new assessment? This will clear all current data and return to the beginning.",
          () => {
            clearAllForms();
            location.reload();
          }
        );
      } else {
        // For other buttons, proceed directly
        clearAllForms();
        location.reload();
      }
    });
  });

  // Calculate score listener
  qs("#calcScore").addEventListener("click", () => {
    // Set default values for any unselected fields before calculating
    setBadlsDefaultsForCollection();
    setIadlsDefaultsForCollection();
    setChronicDefaultsForCollection();

    const basicDetailsForm = qs("#basicDetailsForm");
    const cfsForm = qs("#cfsForm");

    const basicDetails = Object.fromEntries(new FormData(basicDetailsForm));
    const responses = Object.fromEntries(new FormData(cfsForm));
    console.log(responses);

    const score = calculateCFSScore(responses);
    const level = CFS_LEVELS.find((l) => l.level === score);
    console.log("Calculated CFS Score:", score, level);

    // Update current assessment with new data
    if (isEditingExisting && currentAssessment && currentAssessment.id) {
      // Preserve the original ID and timestamp when editing
      currentAssessment = {
        ...currentAssessment,
        basicDetails,
        responses,
        score,
        levelTitle: level.title,
        // Keep original timestamp but add updated timestamp
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Create new assessment
      currentAssessment = {
        basicDetails,
        responses,
        score,
        levelTitle: level.title,
        timestamp: new Date().toISOString(),
      };
    }

    displayResult(score, basicDetails);
    showSection("resultsSection");
  });

  // Save assessment listener
  qs("#saveAssessment").addEventListener("click", saveCurrentAssessment);

  // Saved list listeners
  qs("#refreshList").addEventListener("click", loadSavedAssessments);
  qs("#savedList").addEventListener("click", handleSavedListAction);
  qs("#exportData").addEventListener("click", exportAllData);

  // Offline status listeners
  window.addEventListener("online", updateOfflineStatus);
  window.addEventListener("offline", updateOfflineStatus);
}

// Debug function for development
window.debugExport = async function () {
  const assessments = await getAllAssessments();
  console.log("All assessments:", assessments);
  return assessments;
};

// Start the app when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

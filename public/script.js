const state = {
  notes: [],
  tests: []
};

document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();

    state.notes = data.notes || [];
    state.tests = data.tests || [];

    renderNotes();
    renderTests();
    updateDashboard();
    updateLatestClass();
    updateDate();

  } catch (error) {
    console.error("Unable to load website data:", error);
  }
}

// ===============================
// CURRENT DATE
// ===============================

function updateDate() {
  const element = document.getElementById("currentDate");

  if (!element) return;

  element.textContent = new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );
}

// ===============================
// DASHBOARD
// ===============================

function updateDashboard() {
  const testCount = document.getElementById("testCount");
  const attemptedCount =
    document.getElementById("attemptedCount");

  if (testCount) {
    testCount.textContent = state.tests.length;
  }

  const attempted = JSON.parse(
    localStorage.getItem("attemptedTests") || "[]"
  );

  if (attemptedCount) {
    attemptedCount.textContent = attempted.length;
  }
}

// ===============================
// LATEST CLASS
// ===============================

function updateLatestClass() {
  const container =
    document.getElementById("latestClass");

  if (!container) return;

  if (state.notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No class notes yet</h3>
        <p>
          New notes will appear here after upload.
        </p>
      </div>
    `;

    return;
  }

  const note = state.notes[0];

  container.innerHTML = `
    <div class="latest-card">

      <div>
        <span class="badge">
          LATEST CLASS
        </span>

        <h2>
          ${escapeHtml(note.title)}
        </h2>

        <p>
          ${escapeHtml(note.subject || "ECE")}
          ${
            note.lesson
              ? " • " + escapeHtml(note.lesson)
              : ""
          }
        </p>

        <small>
          ${escapeHtml(note.date)}
        </small>
      </div>

      <button
        class="primary-btn"
        onclick="openNote('${note.id}')"
      >
        OPEN
      </button>

    </div>
  `;
}

// ===============================
// CLASS NOTES
// ===============================

function renderNotes() {
  const container =
    document.getElementById("notesList");

  if (!container) return;

  if (state.notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No class notes available.
      </div>
    `;

    return;
  }

  container.innerHTML = state.notes
    .map(
      note => `
        <div class="content-row">

          <div>
            <h3>
              ${escapeHtml(note.title)}
            </h3>

            <p>
              ${escapeHtml(
                note.subject || "ECE"
              )}

              ${
                note.lesson
                  ? " • " +
                    escapeHtml(note.lesson)
                  : ""
              }
            </p>

            <small>
              ${escapeHtml(note.date)}
            </small>
          </div>

          <button
            class="outline-btn"
            onclick="openNote('${note.id}')"
          >
            OPEN
          </button>

        </div>
      `
    )
    .join("");
}

// ===============================
// TESTS
// ===============================

function renderTests() {
  const container =
    document.getElementById("testsList");

  if (!container) return;

  if (state.tests.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No short tests available.
      </div>
    `;

    return;
  }

  container.innerHTML = state.tests
    .map(
      test => `
        <div class="content-row">

          <div>
            <h3>
              ${escapeHtml(test.title)}
            </h3>

            <p>
              ${escapeHtml(
                test.subject || "ECE"
              )}
            </p>

            <small>
              ${escapeHtml(test.date)}
            </small>
          </div>

          <button
            class="primary-btn"
            onclick="startTest('${test.id}')"
          >
            START
          </button>

        </div>
      `
    )
    .join("");
}

// ===============================
// OPEN NOTE
// ===============================

function openNote(id) {
  const note = state.notes.find(
    item => item.id === id
  );

  if (!note) return;

  if (note.youtube) {
    window.open(
      note.youtube,
      "_blank"
    );

    return;
  }

  if (note.file) {
    window.open(
      note.file,
      "_blank"
    );

    return;
  }

  alert(
    "No PDF, PPT or YouTube link available."
  );
}

// ===============================
// START TEST
// ===============================

function startTest(id) {
  const test = state.tests.find(
    item => item.id === id
  );

  if (!test) return;

  const modal =
    document.getElementById("testModal");

  const title =
    document.getElementById("modalTitle");

  const body =
    document.getElementById("testBody");

  if (!modal || !title || !body) return;

  title.textContent = test.title;

  const questions =
    test.questions || [];

  if (questions.length === 0) {

    body.innerHTML = `
      <p>
        This test does not contain
        questions yet.
      </p>

      <button
        class="primary-btn"
        onclick="closeTest()"
      >
        CLOSE
      </button>
    `;

    modal.classList.add("show");

    return;
  }

  body.innerHTML = `
    <form id="testForm">

      ${questions
        .map(
          (question, index) => `
            <div class="question">

              <h3>
                ${index + 1}.
                ${escapeHtml(
                  question.question || ""
                )}
              </h3>

              ${(question.options || [])
                .map(
                  (option, optionIndex) => `
                    <label class="option">

                      <input
                        type="radio"
                        name="q${index}"
                        value="${optionIndex}"
                      >

                      ${escapeHtml(option)}

                    </label>
                  `
                )
                .join("")}

            </div>
          `
        )
        .join("")}

      <button
        type="submit"
        class="primary-btn"
      >
        SUBMIT TEST
      </button>

    </form>
  `;

  document
    .getElementById("testForm")
    .addEventListener(
      "submit",
      function (event) {

        event.preventDefault();

        const attempted =
          JSON.parse(
            localStorage.getItem(
              "attemptedTests"
            ) || "[]"
          );

        if (!attempted.includes(test.id)) {
          attempted.push(test.id);

          localStorage.setItem(
            "attemptedTests",
            JSON.stringify(attempted)
          );
        }

        updateDashboard();

        alert(
          "Test submitted successfully."
        );

        closeTest();
      }
    );

  modal.classList.add("show");
}

// ===============================
// CLOSE TEST
// ===============================

function closeTest() {
  const modal =
    document.getElementById("testModal");

  if (modal) {
    modal.classList.remove("show");
  }
}

// ===============================
// SECURITY / HTML CLEANING
// ===============================

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===============================
// MAKE FUNCTIONS AVAILABLE
// ===============================

window.openNote = openNote;
window.startTest = startTest;
window.closeTest = closeTest;
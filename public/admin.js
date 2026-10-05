// ============================================
// ECE GATE ACADEMY - ADMIN JAVASCRIPT
// ============================================

const noteForm = document.getElementById("noteForm");
const testForm = document.getElementById("testForm");
const answerForm = document.getElementById("answerForm");

const adminNotesList =
  document.getElementById("adminNotesList");

const adminTestsList =
  document.getElementById("adminTestsList");

const answerTestSelect =
  document.getElementById("answerTestSelect");


// ============================================
// LOAD ALL DATA
// ============================================

async function loadAdminData() {

  try {

    const response =
      await fetch("/api/data");

    if (!response.ok) {
      throw new Error("Unable to load data.");
    }

    const data =
      await response.json();

    renderNotes(
      data.notes || []
    );

    renderTests(
      data.tests || []
    );

    loadTestSelect(
      data.tests || []
    );

  } catch (error) {

    console.error(error);

    if (adminNotesList) {
      adminNotesList.innerHTML =
        `<p class="error-message">
          Unable to load notes.
        </p>`;
    }

    if (adminTestsList) {
      adminTestsList.innerHTML =
        `<p class="error-message">
          Unable to load tests.
        </p>`;
    }
  }
}


// ============================================
// CLASS NOTES
// ============================================

if (noteForm) {

  noteForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const submitButton =
        noteForm.querySelector(
          "button[type='submit']"
        );

      submitButton.disabled = true;

      submitButton.textContent =
        "PUBLISHING...";

      try {

        const formData =
          new FormData(noteForm);

        const response =
          await fetch(
            "/api/notes",
            {
              method: "POST",
              body: formData
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
            "Unable to publish note."
          );
        }

        alert(
          "Class notes published successfully!"
        );

        noteForm.reset();

        loadAdminData();

      } catch (error) {

        console.error(error);

        alert(
          error.message ||
          "Something went wrong."
        );

      } finally {

        submitButton.disabled =
          false;

        submitButton.textContent =
          "PUBLISH CLASS NOTES";
      }
    }
  );
}

// ============================================
// CREATE SHORT TEST - QUESTION BUILDER
// ============================================

let questionNumber = 0;


// ============================================
// ADD QUESTION
// ============================================

function addQuestion() {

  questionNumber++;

  const container =
    document.getElementById(
      "questionsContainer"
    );

  if (!container) {
    return;
  }

  const questionCard =
    document.createElement("div");

  questionCard.className =
    "question-builder";

  questionCard.dataset.questionNumber =
    questionNumber;

  questionCard.innerHTML = `

    <div class="question-builder-header">

      <h3>
        Question ${questionNumber}
      </h3>

      <button
        type="button"
        class="danger-btn"
        onclick="removeQuestion(this)"
      >
        REMOVE
      </button>

    </div>


    <div class="form-group">

      <label>
        Question
      </label>

      <textarea
        class="test-question"
        rows="4"
        placeholder="Type the question here..."
        required
      ></textarea>

    </div>


    <div class="form-grid">

      <div class="form-group">

        <label>
          Option A
        </label>

        <input
          type="text"
          class="option-a"
          placeholder="Option A"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Option B
        </label>

        <input
          type="text"
          class="option-b"
          placeholder="Option B"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Option C
        </label>

        <input
          type="text"
          class="option-c"
          placeholder="Option C"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Option D
        </label>

        <input
          type="text"
          class="option-d"
          placeholder="Option D"
          required
        >

      </div>

    </div>


    <div class="form-group">

      <label>
        Correct Answer
      </label>

      <div class="correct-answer-group">

        <label>
          <input
            type="radio"
            name="correct-${questionNumber}"
            value="A"
          >
          A
        </label>

        <label>
          <input
            type="radio"
            name="correct-${questionNumber}"
            value="B"
          >
          B
        </label>

        <label>
          <input
            type="radio"
            name="correct-${questionNumber}"
            value="C"
          >
          C
        </label>

        <label>
          <input
            type="radio"
            name="correct-${questionNumber}"
            value="D"
          >
          D
        </label>

      </div>

    </div>


    <div class="form-group">

      <label>
        Solution / Explanation
      </label>

      <textarea
        class="question-solution"
        rows="5"
        placeholder="Type the complete solution / explanation..."
        required
      ></textarea>

    </div>

  `;

  container.appendChild(
    questionCard
  );
}


// ============================================
// REMOVE QUESTION
// ============================================

function removeQuestion(button) {

  const card =
    button.closest(
      ".question-builder"
    );

  if (!card) {
    return;
  }

  const container =
    document.getElementById(
      "questionsContainer"
    );

  card.remove();

  renumberQuestions();

}


// ============================================
// RENUMBER QUESTIONS
// ============================================

function renumberQuestions() {

  const cards =
    document.querySelectorAll(
      ".question-builder"
    );

  cards.forEach(
    function(card, index) {

      const heading =
        card.querySelector("h3");

      if (heading) {

        heading.textContent =
          `Question ${index + 1}`;

      }
    }
  );
}


// ============================================
// COLLECT QUESTIONS
// ============================================

function collectQuestions() {

  const cards =
    document.querySelectorAll(
      ".question-builder"
    );

  const questions = [];


  cards.forEach(
    function(card) {

      const question =
        card
          .querySelector(
            ".test-question"
          )
          .value
          .trim();


      const optionA =
        card
          .querySelector(
            ".option-a"
          )
          .value
          .trim();


      const optionB =
        card
          .querySelector(
            ".option-b"
          )
          .value
          .trim();


      const optionC =
        card
          .querySelector(
            ".option-c"
          )
          .value
          .trim();


      const optionD =
        card
          .querySelector(
            ".option-d"
          )
          .value
          .trim();


      const correctRadio =
        card.querySelector(
          'input[type="radio"]:checked'
        );


      const solution =
        card
          .querySelector(
            ".question-solution"
          )
          .value
          .trim();


      questions.push({

        question:
          question,

        options: {

          A: optionA,
          B: optionB,
          C: optionC,
          D: optionD

        },

        correctAnswer:
          correctRadio
            ? correctRadio.value
            : "",

        solution:
          solution

      });

    }
  );


  return questions;
}


// ============================================
// VALIDATE QUESTIONS
// ============================================

function validateQuestions(
  questions
) {

  if (!questions.length) {

    alert(
      "Please add at least one question."
    );

    return false;
  }


  for (
    let i = 0;
    i < questions.length;
    i++
  ) {

    const q =
      questions[i];


    if (!q.question) {

      alert(
        `Please enter Question ${i + 1}.`
      );

      return false;
    }


    if (
      !q.options.A ||
      !q.options.B ||
      !q.options.C ||
      !q.options.D
    ) {

      alert(
        `Please enter all options for Question ${i + 1}.`
      );

      return false;
    }


    if (!q.correctAnswer) {

      alert(
        `Please select the correct answer for Question ${i + 1}.`
      );

      return false;
    }


    if (!q.solution) {

      alert(
        `Please enter the solution for Question ${i + 1}.`
      );

      return false;
    }

  }


  return true;
}


// ============================================
// PUBLISH SHORT TEST
// ============================================

async function publishShortTest() {

  const titleInput =
    document.getElementById(
      "testTitle"
    );

  const subjectInput =
    document.getElementById(
      "testSubject"
    );

  const dateInput =
    document.getElementById(
      "testDate"
    );


  const title =
    titleInput
      ? titleInput.value.trim()
      : "";


  const subject =
    subjectInput
      ? subjectInput.value.trim()
      : "";


  const date =
    dateInput
      ? dateInput.value
      : "";


  if (!title) {

    alert(
      "Please enter the Test Title."
    );

    return;
  }


  if (!subject) {

    alert(
      "Please enter the Subject."
    );

    return;
  }


  if (!date) {

    alert(
      "Please select the Test Date."
    );

    return;
  }


  const questions =
    collectQuestions();


  if (
    !validateQuestions(
      questions
    )
  ) {

    return;
  }


  const publishButton =
    document.querySelector(
      "button[onclick='publishShortTest()']"
    );


  if (publishButton) {

    publishButton.disabled =
      true;

    publishButton.textContent =
      "PUBLISHING...";
  }


  try {

    const response =
      await fetch(
        "/api/tests",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            title:
              title,

            subject:
              subject,

            date:
              date,

            questions:
              questions

          })
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.message ||
        "Unable to publish Short Test."
      );

    }


    alert(
      "Short Test published successfully!"
    );


    if (titleInput) {
      titleInput.value = "";
    }

    if (subjectInput) {
      subjectInput.value = "";
    }

    if (dateInput) {
      dateInput.value = "";
    }


    const container =
      document.getElementById(
        "questionsContainer"
      );

    if (container) {

      container.innerHTML =
        "";

    }


    questionNumber = 0;


    addQuestion();


    loadAdminData();


  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Something went wrong."
    );


  } finally {

    if (publishButton) {

      publishButton.disabled =
        false;

      publishButton.textContent =
        "PUBLISH SHORT TEST";
    }

  }
}

// ============================================
// RENDER NOTES
// ============================================

function renderNotes(notes) {

  if (!adminNotesList) {
    return;
  }


  if (!notes.length) {

    adminNotesList.innerHTML =
      `<div class="empty-state">
        No class notes published yet.
      </div>`;

    return;
  }


  adminNotesList.innerHTML =
    "";


  notes.forEach(
    function (note) {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "admin-item";


      const fileText =
        note.file
          ? "File uploaded"
          : "No file";


      item.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(note.title)}
          </strong>

          <p>
            ${escapeHtml(note.subject || "")}
          </p>

          <p>
            ${escapeHtml(note.lesson || "")}
          </p>

          <small>
            Date: ${escapeHtml(note.date || "")}
          </small>

          <br>

          <small>
            ${fileText}
          </small>

        </div>

        <div>

          ${
            note.file
              ? `
                <a
                  href="${note.file}"
                  target="_blank"
                  class="outline-btn"
                >
                  OPEN
                </a>
              `
              : ""
          }

          <button
            class="danger-btn"
            onclick="deleteNote('${note.id}')"
          >
            DELETE
          </button>

        </div>
      `;


      adminNotesList.appendChild(
        item
      );
    }
  );
}


// ============================================
// RENDER TESTS
// ============================================

function renderTests(tests) {

  if (!adminTestsList) {
    return;
  }


  if (!tests.length) {

    adminTestsList.innerHTML =
      `<div class="empty-state">
        No short tests published yet.
      </div>`;

    return;
  }


  adminTestsList.innerHTML =
    "";


  tests.forEach(
    function (test) {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "admin-item";


      const answerStatus =
        test.answersPdf
          ? "Answer PDF uploaded"
          : "Answer PDF not uploaded yet";


      item.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(test.title)}
          </strong>

          <p>
            ${escapeHtml(test.subject || "")}
          </p>

          <small>
            Test Date:
            ${escapeHtml(test.date || "")}
          </small>

          <br>

          <small>
            ${answerStatus}
          </small>

        </div>

        <div class="admin-actions">

          <a
            href="${test.questionsPdf}"
            target="_blank"
            class="outline-btn"
          >
            QUESTIONS
          </a>

          ${
            test.answersPdf
              ? `
                <a
                  href="${test.answersPdf}"
                  target="_blank"
                  class="outline-btn"
                >
                  ANSWERS
                </a>
              `
              : ""
          }

          <button
            class="danger-btn"
            onclick="deleteTest('${test.id}')"
          >
            DELETE
          </button>

        </div>
      `;


      adminTestsList.appendChild(
        item
      );
    }
  );
}


// ============================================
// DELETE NOTE
// ============================================

async function deleteNote(id) {

  const confirmed =
    confirm(
      "Delete this class note?"
    );


  if (!confirmed) {
    return;
  }


  try {

    const response =
      await fetch(
        `/api/notes/${id}`,
        {
          method: "DELETE"
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.message ||
        "Unable to delete note."
      );
    }


    alert(
      "Class note deleted."
    );


    loadAdminData();


  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Something went wrong."
    );
  }
}


// ============================================
// DELETE TEST
// ============================================

async function deleteTest(id) {

  const confirmed =
    confirm(
      "Delete this Short Test?"
    );


  if (!confirmed) {
    return;
  }


  try {

    const response =
      await fetch(
        `/api/tests/${id}`,
        {
          method: "DELETE"
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.message ||
        "Unable to delete test."
      );
    }


    alert(
      "Short Test deleted."
    );


    loadAdminData();


  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Something went wrong."
    );
  }
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


// ============================================
// START
// ============================================

loadAdminData();
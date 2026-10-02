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
// CREATE PDF SHORT TEST
// ============================================

if (testForm) {

  testForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const questionFile =
        document.getElementById(
          "questionsPdf"
        );

      if (
        !questionFile ||
        !questionFile.files.length
      ) {

        alert(
          "Please select the Question PDF."
        );

        return;
      }


      const file =
        questionFile.files[0];


      if (
        !file.name
          .toLowerCase()
          .endsWith(".pdf")
      ) {

        alert(
          "Please upload a PDF file only."
        );

        return;
      }


      const submitButton =
        testForm.querySelector(
          "button[type='submit']"
        );

      submitButton.disabled =
        true;

      submitButton.textContent =
        "PUBLISHING...";


      try {

        const formData =
          new FormData();

        formData.append(
          "title",
          document.getElementById(
            "testTitle"
          ).value
        );

        formData.append(
          "subject",
          document.getElementById(
            "testSubject"
          ).value
        );

        formData.append(
          "date",
          document.getElementById(
            "testDate"
          ).value
        );

        formData.append(
          "questionsPdf",
          file
        );


        const response =
          await fetch(
            "/api/tests",
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
            "Unable to publish test."
          );
        }


        alert(
          "Short Test published successfully!"
        );


        testForm.reset();

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
          "PUBLISH SHORT TEST";
      }
    }
  );
}


// ============================================
// LOAD TESTS INTO ANSWER SELECT
// ============================================

function loadTestSelect(tests) {

  if (!answerTestSelect) {
    return;
  }


  answerTestSelect.innerHTML =
    `<option value="">
      Select a test
    </option>`;


  if (!tests.length) {

    return;
  }


  tests.forEach(
    function (test) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        test.id;

      option.textContent =
        `${test.title} — ${test.date}`;

      answerTestSelect.appendChild(
        option
      );
    }
  );
}


// ============================================
// UPLOAD ANSWER PDF
// ============================================

if (answerForm) {

  answerForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const testId =
        answerTestSelect.value;


      if (!testId) {

        alert(
          "Please select a Short Test."
        );

        return;
      }


      const answerFile =
        document.getElementById(
          "answersPdf"
        );


      if (
        !answerFile ||
        !answerFile.files.length
      ) {

        alert(
          "Please select the Answer PDF."
        );

        return;
      }


      const file =
        answerFile.files[0];


      if (
        !file.name
          .toLowerCase()
          .endsWith(".pdf")
      ) {

        alert(
          "Please upload a PDF file only."
        );

        return;
      }


      const submitButton =
        answerForm.querySelector(
          "button[type='submit']"
        );


      submitButton.disabled =
        true;

      submitButton.textContent =
        "UPLOADING...";


      try {

        const formData =
          new FormData();


        formData.append(
          "answersPdf",
          file
        );


        const response =
          await fetch(
            `/api/tests/${testId}/answers`,
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
            "Unable to upload answers."
          );
        }


        alert(
          "Answer PDF uploaded successfully!"
        );


        answerForm.reset();

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
          "UPLOAD ANSWERS";
      }
    }
  );
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
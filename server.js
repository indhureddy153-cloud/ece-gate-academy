const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================
// FOLDERS
// =====================================

const publicFolder = path.join(__dirname, "public");
const dataRoot = process.env.DATA_DIR || __dirname;
const uploadFolder = path.join(dataRoot, "uploads");
const databaseFile = path.join(dataRoot, "database.json");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// =====================================
// DATABASE INITIALIZATION
// =====================================

if (!fs.existsSync(databaseFile)) {
  fs.writeFileSync(
    databaseFile,
    JSON.stringify(
      {
        notes: [],
        tests: [],
        submissions: [],
        settings: {
          academyName: "ECE GATE Academy"
        }
      },
      null,
      2
    )
  );
}

// =====================================
// DATABASE FUNCTIONS
// =====================================

function readDatabase() {
  try {
    const data = JSON.parse(
      fs.readFileSync(databaseFile, "utf8")
    );

    // Make sure required arrays exist
    if (!Array.isArray(data.notes)) {
      data.notes = [];
    }

    if (!Array.isArray(data.tests)) {
      data.tests = [];
    }

    if (!Array.isArray(data.submissions)) {
      data.submissions = [];
    }

    if (!data.settings) {
      data.settings = {
        academyName: "ECE GATE Academy"
      };
    }

    return data;
  } catch (error) {
    console.error("Database read error:", error);

    return {
      notes: [],
      tests: [],
      submissions: [],
      settings: {
        academyName: "ECE GATE Academy"
      }
    };
  }
}

function saveDatabase(data) {
  fs.writeFileSync(
    databaseFile,
    JSON.stringify(data, null, 2)
  );
}

// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

// Serve frontend
app.use(express.static(publicFolder));

// Serve uploaded files
app.use(
  "/uploads",
  express.static(uploadFolder)
);

// =====================================
// MULTER STORAGE
// =====================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },

  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    cb(
      null,
      Date.now() + "-" + safeName
    );
  }
});

// =====================================
// GENERAL FILE UPLOAD
// PDF / PPT / DOC
// =====================================

const upload = multer({
  storage: storage,

  limits: {
    fileSize: 25 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {
    const allowedExtensions = [
      ".pdf",
      ".ppt",
      ".pptx",
      ".doc",
      ".docx"
    ];

    const extension = path.extname(
      file.originalname
    ).toLowerCase();

    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, PPT, PPTX, DOC and DOCX files are allowed."
        )
      );
    }
  }
});

// ============================================
// TEXT QUESTION FILE UPLOAD
// ============================================

const questionUpload = multer({
  storage: storage,

  limits: {
    fileSize: 25 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {
    const extension = path.extname(
      file.originalname
    ).toLowerCase();

    if (extension === ".txt") {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only TXT question files are allowed."
        )
      );
    }
  }
});

// ============================================
// PARSE QUESTION TXT FILE
// ============================================

function parseQuestionFile(text, testId) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n");

  const blocks = [];
  let current = null;

  function startQuestion(number, firstLine) {
    current = {
      id: `${testId}-q${number}`,

      questionLines: firstLine
        ? [firstLine]
        : [],

      options: {
        A: "",
        B: "",
        C: "",
        D: ""
      },

      correctAnswer: "",

      solutionLines: [],

      inSolution: false,

      seenOption: false
    };

    blocks.push(current);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Ignore empty lines
    if (!line) {
      continue;
    }

    // ==================================
    // QUESTION
    // ==================================

    const questionMatch = line.match(
      /^QUESTION\s*(\d+)\s*:?\s*(.*)$/i
    );

    if (questionMatch) {
      startQuestion(
        questionMatch[1],
        questionMatch[2].trim()
      );

      continue;
    }

    // Ignore anything before first question
    if (!current) {
      continue;
    }

    // ==================================
    // OPTIONS
    // Supports A), A., A:
    // ==================================

    const optionMatch = line.match(
      /^([ABCD])[\)\.\:]\s*(.+)$/i
    );

    if (optionMatch) {
      const letter =
        optionMatch[1].toUpperCase();

      current.options[letter] =
        optionMatch[2].trim();

      current.seenOption = true;

      current.inSolution = false;

      continue;
    }

    // ==================================
    // ANSWER
    // ==================================

    const answerMatch = line.match(
      /^(ANSWER|CORRECT\s+ANSWER)\s*:\s*([ABCD])$/i
    );

    if (answerMatch) {
      current.correctAnswer =
        answerMatch[2].toUpperCase();

      current.inSolution = false;

      continue;
    }

    // ==================================
    // SOLUTION
    // ==================================

    const solutionMatch = line.match(
      /^(SOLUTION|EXPLANATION)\s*:\s*(.*)$/i
    );

    if (solutionMatch) {
      current.inSolution = true;

      if (solutionMatch[2].trim()) {
        current.solutionLines.push(
          solutionMatch[2].trim()
        );
      }

      continue;
    }

    // ==================================
    // CONTINUATION TEXT
    // ==================================

    if (current.inSolution) {
      current.solutionLines.push(line);
    } else {
      current.questionLines.push(line);
    }
  }

  // ==================================
  // CONVERT TO FINAL QUESTION FORMAT
  // ==================================

  return blocks.map(function (item) {
    return {
      id: item.id,

      question: item.questionLines
        .join(" ")
        .trim(),

      options: item.options,

      correctAnswer: item.correctAnswer,

      solution: item.solutionLines
        .join("\n")
        .trim(),

      marks: 1,

      negativeMarks: 0
    };
  });
}

// =====================================
// HEALTH CHECK
// =====================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      message: "Backend connected successfully"
    });
  }
);

// =====================================
// GET ALL WEBSITE DATA
// =====================================

app.get(
  "/api/data",
  (req, res) => {
    try {
      const database = readDatabase();

      res.json(database);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to load website data."
      });
    }
  }
);

// =====================================
// ADD CLASS NOTE
// =====================================

app.post(
  "/api/notes",
  upload.single("file"),
  (req, res) => {
    try {
      const database = readDatabase();

      const newNote = {
        id: Date.now().toString(),

        title:
          req.body.title ||
          "Class Note",

        subject:
          req.body.subject ||
          "",

        lesson:
          req.body.lesson ||
          "",

        date:
          req.body.date ||
          new Date()
            .toISOString()
            .split("T")[0],

        youtube:
          req.body.youtube ||
          "",

        file: req.file
          ? "/uploads/" + req.file.filename
          : "",

        originalFileName:
          req.file
            ? req.file.originalname
            : "",

        createdAt:
          new Date().toISOString()
      };

      database.notes.unshift(newNote);

      saveDatabase(database);

      res.json({
        success: true,

        message:
          "Class note added successfully.",

        note: newNote
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        message:
          "Unable to add class note."
      });
    }
  }
);

// =====================================
// DELETE CLASS NOTE
// =====================================

app.delete(
  "/api/notes/:id",
  (req, res) => {
    try {
      const database = readDatabase();

      const note = database.notes.find(
        item =>
          item.id === req.params.id
      );

      // Delete uploaded file
      if (note && note.file) {
        const fileName =
          path.basename(note.file);

        const filePath =
          path.join(
            uploadFolder,
            fileName
          );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Remove note from database
      database.notes =
        database.notes.filter(
          item =>
            item.id !== req.params.id
        );

      saveDatabase(database);

      res.json({
        success: true,
        message: "Class note deleted."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        message:
          "Unable to delete note."
      });
    }
  }
);

// ============================================
// CREATE SHORT TEST FROM TXT FILE
// ============================================

app.post(
  "/api/tests",
  questionUpload.single("questionsFile"),
  (req, res) => {
    let uploadedFilePath = "";

    try {
      const database = readDatabase();

      // ==================================
      // CHECK FILE
      // ==================================

      if (!req.file) {
        return res.status(400).json({
          success: false,

          message:
            "Question TXT file is required."
        });
      }

      uploadedFilePath = req.file.path;

      // ==================================
      // READ TXT FILE
      // ==================================

      const fileText = fs.readFileSync(
        req.file.path,
        "utf8"
      );

      // ==================================
      // CREATE TEST ID
      // ==================================

      const testId =
        Date.now().toString();

      // ==================================
      // PARSE QUESTIONS
      // ==================================

      const questions =
        parseQuestionFile(
          fileText,
          testId
        );

      // ==================================
      // CHECK QUESTIONS
      // ==================================

      if (!questions.length) {
        return res.status(400).json({
          success: false,

          message:
            "No questions found in the TXT file."
        });
      }

      // ==================================
      // VALIDATE EACH QUESTION
      // ==================================

      for (
        let i = 0;
        i < questions.length;
        i++
      ) {
        const q = questions[i];

        if (
          !q.question ||
          !q.options.A ||
          !q.options.B ||
          !q.options.C ||
          !q.options.D ||
          !q.correctAnswer ||
          !q.solution
        ) {
          return res.status(400).json({
            success: false,

            message:
              `Question ${i + 1} is incomplete. ` +
              `Please check question, all options, ` +
              `ANSWER and SOLUTION.`
          });
        }
      }

      // ==================================
      // CREATE TEST OBJECT
      // ==================================

      const newTest = {
        id: testId,

        title:
          req.body.title ||
          "Short Test",

        subject:
          req.body.subject ||
          "",

        date:
          req.body.date ||
          new Date()
            .toISOString()
            .split("T")[0],

        questions: questions,

        questionCount:
          questions.length,

        createdAt:
          new Date().toISOString()
      };

      // ==================================
      // SAVE TEST
      // ==================================

      database.tests.unshift(
        newTest
      );

      saveDatabase(database);

      // ==================================
      // DELETE TXT FILE AFTER PARSING
      // ==================================

      if (
        fs.existsSync(
          req.file.path
        )
      ) {
        fs.unlinkSync(
          req.file.path
        );
      }

      uploadedFilePath = "";

      // ==================================
      // RESPONSE
      // ==================================

      res.json({
        success: true,

        message:
          "Short Test published successfully.",

        test: newTest
      });
    } catch (error) {
      console.error(
        "Create test error:",
        error
      );

      // Cleanup uploaded file if something failed
      if (
        uploadedFilePath &&
        fs.existsSync(uploadedFilePath)
      ) {
        try {
          fs.unlinkSync(
            uploadedFilePath
          );
        } catch (cleanupError) {
          console.error(
            "File cleanup error:",
            cleanupError
          );
        }
      }

      res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to publish Short Test."
      });
    }
  }
);

// ============================================
// GET SINGLE TEST FOR STUDENT
// WITHOUT ANSWERS / SOLUTIONS
// ============================================

app.get(
  "/api/tests/:id",
  (req, res) => {
    try {
      const database = readDatabase();

      const test =
        database.tests.find(
          item =>
            item.id ===
            req.params.id
        );

      if (!test) {
        return res.status(404).json({
          success: false,

          message:
            "Test not found."
        });
      }

      // ==================================
      // REMOVE ANSWERS / SOLUTIONS
      // BEFORE SENDING TO STUDENT
      // ==================================

      const publicQuestions =
        (test.questions || []).map(
          function (q) {
            return {
              id: q.id,

              question:
                q.question,

              options:
                q.options,

              marks:
                q.marks || 1,

              negativeMarks:
                q.negativeMarks || 0
            };
          }
        );

      res.json({
        success: true,

        test: {
          id: test.id,

          title:
            test.title,

          subject:
            test.subject,

          date:
            test.date,

          questions:
            publicQuestions
        }
      });
    } catch (error) {
      console.error(
        "Get test error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Unable to load test."
      });
    }
  }
);

// ============================================
// STUDENT FINISH TEST
// CALCULATE RESULT
// ============================================

app.post(
  "/api/tests/:id/submit",
  (req, res) => {
    try {
      const database =
        readDatabase();

      // ==================================
      // FIND TEST
      // ==================================

      const test =
        database.tests.find(
          item =>
            item.id ===
            req.params.id
        );

      if (!test) {
        return res.status(404).json({
          success: false,

          message:
            "Test not found."
        });
      }

      // ==================================
      // STUDENT ANSWERS
      // ==================================

      const studentAnswers =
        req.body.answers || {};

      let correct = 0;
      let wrong = 0;
      let unattempted = 0;
      let score = 0;

      // ==================================
      // CALCULATE EVERY QUESTION
      // ==================================

      const details =
        (test.questions || []).map(
          function (q, index) {
            const studentAnswer =
              studentAnswers[q.id] || "";

            let status =
              "Not Attempted";

            // ==============================
            // NOT ATTEMPTED
            // ==============================

            if (!studentAnswer) {
              unattempted++;
            }

            // ==============================
            // CORRECT
            // ==============================

            else if (
              String(studentAnswer)
                .toUpperCase() ===
              String(q.correctAnswer)
                .toUpperCase()
            ) {
              correct++;

              status =
                "Correct";

              score += Number(
                q.marks || 1
              );
            }

            // ==============================
            // WRONG
            // ==============================

            else {
              wrong++;

              status =
                "Wrong";

              score -= Number(
                q.negativeMarks || 0
              );
            }

            // ==============================
            // QUESTION RESULT
            // ==============================

            return {
              questionNumber:
                index + 1,

              questionId:
                q.id,

              question:
                q.question,

              options:
                q.options,

              studentAnswer:
                studentAnswer,

              correctAnswer:
                q.correctAnswer,

              status:
                status,

              solution:
                q.solution,

              marks:
                q.marks || 1,

              negativeMarks:
                q.negativeMarks || 0
            };
          }
        );

      // ==================================
      // TOTAL QUESTIONS
      // ==================================

      const totalQuestions =
        details.length;

      // ==================================
      // ATTEMPTED
      // ==================================

      const attempted =
        correct + wrong;

      // ==================================
      // ACCURACY
      // ==================================

      const accuracy =
        attempted > 0
          ? (correct / attempted) * 100
          : 0;

      // ==================================
      // TOTAL MARKS
      // ==================================

      const totalMarks =
        details.reduce(
          function (sum, item) {
            return (
              sum +
              Number(
                item.marks || 1
              )
            );
          },
          0
        );

      // ==================================
      // PERCENTAGE
      // ==================================

      const percentage =
        totalMarks > 0
          ? (Math.max(score, 0) /
              totalMarks) *
            100
          : 0;

      // ==================================
      // FINAL RESULT
      // ==================================

      const result = {
        id:
          Date.now().toString(),

        testId:
          test.id,

        testTitle:
          test.title,

        totalQuestions:
          totalQuestions,

        attempted:
          attempted,

        correct:
          correct,

        wrong:
          wrong,

        unattempted:
          unattempted,

        score:
          score,

        totalMarks:
          totalMarks,

        accuracy:
          Number(
            accuracy.toFixed(2)
          ),

        percentage:
          Number(
            percentage.toFixed(2)
          ),

        submittedAt:
          new Date().toISOString(),

        details:
          details
      };

      // ==================================
      // SAVE SUBMISSION
      // ==================================

      if (
        !Array.isArray(
          database.submissions
        )
      ) {
        database.submissions = [];
      }

      database.submissions.push(
        result
      );

      saveDatabase(
        database
      );

      // ==================================
      // SEND RESULT TO STUDENT
      // ==================================

      res.json({
        success: true,

        message:
          "Test completed successfully.",

        result:
          result
      });
    } catch (error) {
      console.error(
        "Submit test error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Unable to calculate result."
      });
    }
  }
);

// =====================================
// STUDENT WEBSITE
// =====================================

app.get(
  /./,
  (req, res) => {
    res.sendFile(
      path.join(
        publicFolder,
        "index.html"
      )
    );
  }
);

// =====================================
// ERROR HANDLER
// =====================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        error.message ||
        "Something went wrong."
    });
  }
);

// =====================================
// START SERVER
// =====================================

if (require.main === module) {
  app.listen(
    PORT,
    () => {
      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "       ECE GATE ACADEMY"
      );
      console.log(
        "================================="
      );
      console.log("");

      console.log(
        "Website: http://localhost:" +
          PORT
      );

      console.log(
        "Admin:   http://localhost:" +
          PORT +
          "/admin"
      );

      console.log("");

      console.log(
        "Server is running..."
      );
    }
  );
}

module.exports = app;
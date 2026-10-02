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
// DATABASE
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

function readDatabase() {
  try {
    return JSON.parse(
      fs.readFileSync(databaseFile, "utf8")
    );
  } catch (error) {
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

app.use(
  express.static(publicFolder)
);

app.use(
  "/uploads",
  express.static(uploadFolder)
);

// =====================================
// MULTER FILE UPLOAD
// =====================================

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },

  filename: function (req, file, cb) {

    const safeName =
      file.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

    cb(
      null,
      Date.now() + "-" + safeName
    );
  }
});

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

    const extension =
      path.extname(
        file.originalname
      ).toLowerCase();

    if (
      allowedExtensions.includes(
        extension
      )
    ) {
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

// =====================================
// GET ALL WEBSITE DATA
// =====================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend connected successfully"
  });
});


app.get("/api/data", (req, res) => {

  const database =
    readDatabase();

  res.json(database);
});

// =====================================
// ADD CLASS NOTE
// =====================================

app.post(
  "/api/notes",
  upload.single("file"),
  (req, res) => {

    try {

      const database =
        readDatabase();

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

        file:
          req.file
            ? "/uploads/" +
              req.file.filename
            : "",

        originalFileName:
          req.file
            ? req.file.originalname
            : "",

        createdAt:
          new Date().toISOString()
      };

      database.notes.unshift(
        newNote
      );

      saveDatabase(
        database
      );

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

      const database =
        readDatabase();

      const note =
        database.notes.find(
          item =>
            item.id ===
            req.params.id
        );

      if (
        note &&
        note.file
      ) {

        const fileName =
          path.basename(
            note.file
          );

        const filePath =
          path.join(
            uploadFolder,
            fileName
          );

        if (
          fs.existsSync(
            filePath
          )
        ) {
          fs.unlinkSync(
            filePath
          );
        }
      }

      database.notes =
        database.notes.filter(
          item =>
            item.id !==
            req.params.id
        );

      saveDatabase(
        database
      );

      res.json({
        success: true,
        message:
          "Class note deleted."
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

// =====================================
// CREATE PDF SHORT TEST
// =====================================

app.post(
  "/api/tests",
  upload.fields([
    {
      name: "questionsPdf",
      maxCount: 1
    },
    {
      name: "answersPdf",
      maxCount: 1
    }
  ]),
  (req, res) => {

    try {

      const database =
        readDatabase();

      if (
        !database.submissions
      ) {
        database.submissions =
          [];
      }

      const questionFile =
        req.files &&
        req.files.questionsPdf
          ? req.files.questionsPdf[0]
          : null;

      const answerFile =
        req.files &&
        req.files.answersPdf
          ? req.files.answersPdf[0]
          : null;

      if (!questionFile) {

        return res.status(400).json({
          success: false,
          message:
            "Questions PDF is required."
        });
      }

      const newTest = {

        id:
          Date.now().toString(),

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

        questionsPdf:
          "/uploads/" +
          questionFile.filename,

        questionsPdfName:
          questionFile.originalname,

        answersPdf:
          answerFile
            ? "/uploads/" +
              answerFile.filename
            : "",

        answersPdfName:
          answerFile
            ? answerFile.originalname
            : "",

        createdAt:
          new Date().toISOString()
      };

      database.tests.unshift(
        newTest
      );

      saveDatabase(
        database
      );

      res.json({

        success: true,

        message:
          "Short test published successfully.",

        test: newTest
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          "Unable to publish short test."
      });
    }
  }
);

// =====================================
// UPLOAD ANSWER PDF LATER
// =====================================

app.post(
  "/api/tests/:id/answers",
  upload.single("answersPdf"),
  (req, res) => {

    try {

      const database =
        readDatabase();

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

      if (!req.file) {

        return res.status(400).json({
          success: false,
          message:
            "Answer PDF is required."
        });
      }

      test.answersPdf =
        "/uploads/" +
        req.file.filename;

      test.answersPdfName =
        req.file.originalname;

      test.answerUploadedAt =
        new Date().toISOString();

      saveDatabase(
        database
      );

      res.json({

        success: true,

        message:
          "Answer PDF uploaded successfully.",

        test: test
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          "Unable to upload answer PDF."
      });
    }
  }
);

// =====================================
// STUDENT SUBMIT ANSWERS
// =====================================

app.post(
  "/api/tests/:id/submit",
  (req, res) => {

    try {

      const database =
        readDatabase();

      if (
        !database.submissions
      ) {
        database.submissions =
          [];
      }

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

      const submission = {

        id:
          Date.now().toString(),

        testId:
          test.id,

        testTitle:
          test.title,

        answers:
          req.body.answers ||
          "",

        submittedAt:
          new Date().toISOString()
      };

      database.submissions.push(
        submission
      );

      saveDatabase(
        database
      );

      res.json({

        success: true,

        message:
          "Your answers have been submitted successfully.",

        submission:
          submission
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          "Unable to submit answers."
      });
    }
  }
);

// =====================================
// DELETE TEST
// =====================================

app.delete(
  "/api/tests/:id",
  (req, res) => {

    try {

      const database =
        readDatabase();

      const test =
        database.tests.find(
          item =>
            item.id ===
            req.params.id
        );

      if (test) {

        const filesToDelete = [];

        if (
          test.questionsPdf
        ) {
          filesToDelete.push(
            test.questionsPdf
          );
        }

        if (
          test.answersPdf
        ) {
          filesToDelete.push(
            test.answersPdf
          );
        }

        filesToDelete.forEach(
          fileUrl => {

            const fileName =
              path.basename(
                fileUrl
              );

            const filePath =
              path.join(
                uploadFolder,
                fileName
              );

            if (
              fs.existsSync(
                filePath
              )
            ) {
              fs.unlinkSync(
                filePath
              );
            }
          }
        );
      }

      database.tests =
        database.tests.filter(
          item =>
            item.id !==
            req.params.id
        );

      database.submissions =
        (
          database.submissions ||
          []
        ).filter(
          item =>
            item.testId !==
            req.params.id
        );

      saveDatabase(
        database
      );

      res.json({

        success: true,

        message:
          "Test deleted."
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          "Unable to delete test."
      });
    }
  }
);

// =====================================
// ADMIN PAGE
// =====================================

app.get(
  "/admin",
  (req, res) => {

    res.sendFile(
      path.join(
        publicFolder,
        "admin.html"
      )
    );
  }
);

// =====================================
// STUDENT WEBSITE
// =====================================

app.get(
  "*",
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

    console.error(error);

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
  app.listen(PORT, () => {
    console.log("");
    console.log("=================================");
    console.log("       ECE GATE ACADEMY");
    console.log("=================================");
    console.log("");

    console.log("Website: http://localhost:" + PORT);
    console.log("Admin:   http://localhost:" + PORT + "/admin");

    console.log("");
    console.log("Server is running...");
  });
}
module.exports = app;
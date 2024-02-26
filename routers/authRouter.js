const Router = require("express");
const router = new Router();
const multer = require("multer");
const controller = require("../controllers/authController");
const { check } = require("express-validator");
const authMiddleware = require("../middlewares/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/registration",
  [
    check("email", "Invalid email entered").isEmail(),
    check("username", "Username cannot be empty").notEmpty(),
    check(
      "password",
      "The password must be more than 6 and less than 16 characters"
    ).isLength({ min: 6, max: 16 }),
  ],
  controller.registration
);
router.post(
  "/login",
  [
    check("username", "Username cannot be empty").notEmpty(),
    check("password", "Password cannot be empty").notEmpty(),
  ],
  controller.login
);
router.post(
  "/upload",
  authMiddleware,
  upload.single("image"),
  controller.setUserImage
);
router.post("/logout", controller.logout);
router.post("/history", authMiddleware, controller.getHistory);
router.get("/activate/:link", controller.activate);
router.get("/refresh", controller.refresh);
router.get("/users", authMiddleware, controller.getUsers);

module.exports = router;

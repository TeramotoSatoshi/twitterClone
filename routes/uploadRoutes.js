const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const path = require("path");
const User = require("../schemas/UserSchema");

// GETメソッド
router.get("/images/:path", (req, res, next) => {
    res.sendFile(path.join((__dirname), "../uploads/images/" + req.params.path));
});

// routerをどこでも使えるようにする
module.exports = router;

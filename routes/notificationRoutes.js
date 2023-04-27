const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../schemas/UserSchema");
const Chat = require("../schemas/ChatSchema");

// GETメソッド
router.get("/", (req, res, next) => {
    res.status(200).render("notificationPage", {
        pageTitle: "Notifications",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    });
});

module.exports = router;

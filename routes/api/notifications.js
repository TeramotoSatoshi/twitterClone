const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");
const Chat = require("../../schemas/ChatSchema");
const Message = require("../../schemas/MessageSchema");
const Notification = require("../../schemas/NotificationSchema");

// POSTパラメータをJSONで取得するにはbody-parserを使う
app.use(bodyParser.urlencoded({ extended: false }));

// 通知取得
router.get("/", (req, res, next) => {
    let searchObj = { userTo: req.session.user._id, notificationType: { $ne: "NewMessage" } };
    if (req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
        searchObj.opened = false;
    }
    // NewMessageではない通知を取得
    Notification.find(searchObj)
        .populate("userTo")
        .populate("userFrom")
        .sort({ createdAt: -1 })
        .then((results) => res.status(200).send(results))
        .catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
});

// 最新通知取得
router.get("/latest", (req, res, next) => {
    Notification.findOne({ userTo: req.session.user._id })
        .populate("userTo")
        .populate("userFrom")
        .sort({ createdAt: -1 })
        .then((results) => res.status(200).send(results))
        .catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
});

// 通知状態更新(IDあり)
router.put("/:id/markAsOpened", (req, res, next) => {
    Notification.findByIdAndUpdate(req.params.id, { opened: true })
        .then(() => res.sendStatus(204))
        .catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
});

// 通知状態更新(IDなし)
router.put("/markAsOpened", (req, res, next) => {
    Notification.updateMany({ userTo: req.session.user._id }, { opened: true })
        .then(() => res.sendStatus(204))
        .catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
});

module.exports = router;

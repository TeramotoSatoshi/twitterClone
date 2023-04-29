const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");
const Chat = require("../../schemas/ChatSchema");
const Message = require("../../schemas/MessageSchema");

// POSTパラメータをJSONで取得するにはbody-parserを使う
app.use(bodyParser.urlencoded({ extended: false }));

// POSTメソッド
router.post("/", async (req, res, next) => {
    if (!req.body.users) {
        console.log("Users param not sent with request");
        return res.sendStatus(400);
    }
    // 文字列を JSON として解析
    let users = JSON.parse(req.body.users);
    if (users.length == 0) {
        console.log("Users array is empty");
        return res.sendStatus(400);
    }
    users.push(req.session.user);
    // チャットデータ作成
    let chatData = {
        users: users,
        isGroupChat: true
    }
    Chat.create(chatData)
    .then(results => res.status(200).send(results))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

// GETメソッド
router.get("/", async (req, res, next) => {
    Chat.find({ users: { $elemMatch: { $eq: req.session.user._id } }})
    .populate("users")
    .populate("latestMessage")
    .sort({ updatedAy: -1 })
    .then(async results => {
        // 最新メッセージユーザー情報取得
        results = await User.populate(results, {path: "latestMessage.sender" })
        res.status(200).send(results)
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

// GETメソッド
router.get("/:chatId", async (req, res, next) => {
    Chat.findOne({ _id: req.params.chatId, users: { $elemMatch: { $eq: req.session.user._id } }})
    .populate("users")
    .sort({ updatedAy: -1 })
    .then(results => res.status(200).send(results))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

// GETメソッド
router.get("/:chatId/messages", async (req, res, next) => {
    Message.find({ chat: req.params.chatId })
    .populate("sender")
    .then(results => res.status(200).send(results))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

// PUTメソッド
router.put("/:chatId", async (req, res, next) => {
    Chat.findByIdAndUpdate(req.params.chatId, req.body)
    .then(results => res.sendStatus(204))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

module.exports = router;
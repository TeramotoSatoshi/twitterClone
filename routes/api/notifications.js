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

// POSTメソッド
router.post("/", async (req, res, next) => {
    if (!req.body.content || !req.body.chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }
    // 新規メッセージ
    let newMessage = {
        sender: req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId,
    };

    // 新規メッセージ作成
    Message.create(newMessage)
        .then(async (message) => {
            message = await message.populate(["sender"]); // 送信者解析
            message = await message.populate(["chat"]); // チャット解析
            message = await User.populate(message, { path: "chat.users" }); // ユーザー解析

            // 最新メッセージ更新
            let chat = await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message }).catch((error) => console.log(error));
            insertNotification(chat, message);
            res.status(201).send(message);
        })
        .catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
});

// 通知送信
function insertNotification(chat, message) {
    chat.users.forEach((userId) => {
        if (userId == message.sender._id.toString()) return;
        Notification.insertNotification(userId, message.sender._id, "New Message", message.chat._id);
    });
}

module.exports = router;

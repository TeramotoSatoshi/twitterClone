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
    res.status(200).render("inboxPage", {
        pageTitle: "inbox",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    });
});

// GETメソッド
router.get("/new", (req, res, next) => {
    res.status(200).render("newMessage", {
        pageTitle: "New Message",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    });
});

// GETメソッド
router.get("/:chatId", async (req, res, next) => {

    let userId = req.session.user._id;
    let chatId = req.params.chatId;
    // ObjectIDとして有効であるかどうかを判定
    let isValidId = mongoose.isValidObjectId(chatId);
    let payload =  {
        pageTitle: "Chat",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    }

    // 無効なオブジェクトIDの場合
    if(!isValidId) {
        payload.errorMessage = "チャットが存在しないか、表示する権限がありません";
        return res.status(200).render("chatPage", payload);
    }

    let chat = await Chat.findOne({_id: chatId, users: { $elemMatch: { $eq: userId } } })
    .populate("users");
    // Chatが見つからない場合
    if (chat == null) {
        // ユーザIDが本物か調べる
        let userFound = await User.findById(chatId);
        if (userFound != null) {
            chat = await getChatByUserId(userFound._id, userId);
            console.log(chat);
        }
    }

    if (chat == null) {
        payload.errorMessage = "チャットが存在しないか、表示する権限がありません";
    } else {
        payload.chat = chat;
    }
    res.status(200).render("chatPage", payload);
});

function getChatByUserId(userLoggedInId, otherUserId) {
    return Chat.findOneAndUpdate({
        isGroupChat: false,
        users: {
            $size: 2,
            $all: [
                { $elemMatch: { $eq: userLoggedInId }},
                { $elemMatch: { $eq: otherUserId }}
            ]
        }
    }, {
        $setOnInsert: {
            users: [userLoggedInId, otherUserId]
        }
    }, { new: true, upsert: true })
    .populate("users")
}

module.exports = router;

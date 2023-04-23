const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ユーザースキーマ定義
const ChatSchema = new Schema({
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" }

}, { timestamps: true });

module.exports = mongoose.model("Chat", ChatSchema);

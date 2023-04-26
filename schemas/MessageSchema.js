const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ユーザースキーマ定義
const MessageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat:  { type: Schema.Types.ObjectId, ref: "Chat" },
    readBy:  [{ type: Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);

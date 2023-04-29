const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
    {
        userTo: { type: Schema.Types.ObjectId, ref: "User" },
        userFrom: { type: Schema.Types.ObjectId, ref: "User" },
        notificationType: String,
        opened: { type: Boolean, default: false },
        entityId: Schema.Types.ObjectId,
    },
    { timestamps: true }
);

// 通知静的メソッド
NotificationSchema.statics.insertNotification = async (userTo, userFrom, notificationType, entityId) => {
    let data = {
        userTo: userTo,
        userFrom,
        notificationType,
        entityId: entityId,
    };
    // 通知削除
    await Notification.deleteOne(data).catch((error) => console.log(error));
    // 通知新規作成
    return Notification.create(data).catch((error) => console.log(error));
};
let Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;

let connected = false;

let socket = io("http://localhost:3000");
// クライアントからsetupイベント送信
// userLoggedInをサーバーでは受け取る
socket.emit("setup", userLoggedIn);

// connectedを受け取る
socket.on("connected", () => (connected = true));
socket.on("message received", (newMessage) => messageReceived(newMessage));

socket.on("notification received", () => {
    $.get("/api/notifications/latest", (notificationData) => {
        showNotificationPopup(notificationData);
        refreshNotificationsBadge();
    });
});

function emitNotification(userId) {
    if (userId == userLoggedIn._id) return;
    socket.emit("notification received", userId);
}

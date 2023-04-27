let connected = false;

let socket = io("http://localhost:3000");
// クライアントからsetupイベント送信
// userLoggedInをサーバーでは受け取る
socket.emit("setup", userLoggedIn);

// connectedを受け取る
socket.on("connected", () => connected = true);
socket.on("message received", (newMessage) => messageReceived(newMessage));

$(document).ready(() => {
    $.get("/api/chats", (data, status, xhr) => {
        if (xhr.status == 400) {
            alert("チャットリストを取得できませんでした");
        } else {
            outputChatList(data, $(".resultsContainer"));
        }
    });
});

// チャットリスト出力
function outputChatList(chatList, container) {
    // 繰り返しチャット表示用HTML生成
    chatList.forEach((chat) => {
        let html = createChatHtml(chat);
        container.append(html);
    });

    if (chatList.length == 0) {
        container.append("<span class='noResults'>表示するものがありません</span>");
    }
}

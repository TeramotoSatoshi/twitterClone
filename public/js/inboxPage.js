$(document).ready(() => {
    $.get("/api/chats", (data, status, xhr) => {
        if(xhr.status == 400) {
            alert("チャットリストを取得できませんでした");
        } else {
            outputChatList(data, $(".resultsContainer"));
        }
    })
})

// チャットリスト出力
function outputChatList(chatList, container) {
    // 繰り返しチャット表示用HTML生成
    chatList.forEach(chat => {
        let html = createChatHtml(chat);
        container.append(html);
    });

    if (chatList.length == 0) {
        container.append("<span class='noResults'>表示するものがありません</span>");
    }
}

// チャットデータHTML生成
function createChatHtml(chatData) {
    // チャット名取得
    let chatName = getChatName(chatData);
    // チャット画像取得
    let image = getChatImageElements(chatData);
    // 最新メッセージ取得
    let latestMessage = getLatestMessage(chatData.latestMessage);
    return `<a href='/messages/${chatData._id}' class='resultListItem'>
                ${image}
                <div class='resultDetailContainer ellipsis'>
                    <span class='heading ellipsis'>${chatName}</span>
                    <span class='subText ellipsis'>${latestMessage}</span>
                </div>
            </a>`;
}

// 最新メッセージ取得
function getLatestMessage(latestMessage) {
    if (latestMessage != null) {
        let sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
    }
    return "New Chat";
}

// チャットユーザー画像取得
function getChatImageElements(chatData) {
    let otherChatUsers = getOtherChatUsers(chatData.users);
    let groupChatClass = "";
    let chatImage = getUserChatImageElement(otherChatUsers[0]);

    if(otherChatUsers.length > 1) {
        groupChatClass = "groupChatImage";
        chatImage += getUserChatImageElement(otherChatUsers[1]);
    }
    return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
}

// チャットユーザーの画像取得(詳細)
function getUserChatImageElement(user) {
    if(!user || !user.profilePic) {
        return alert("ユーザー画像取得失敗");
    }

    return `<img src='${user.profilePic}' alt='プロフィール画像'>`
}

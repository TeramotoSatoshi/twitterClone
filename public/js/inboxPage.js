$(document).ready(() => {
    $.get("/api/chats", (data, status, xhr) => {
        if(xhr.status == 400) {
            alert("チャットリストを取得できませんでした");
        } else {
            outputChatList(data, $(".resultsContainer"));
        }
    })
})

function outputChatList(chatList, container) {
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
    let chatName = getChatName(chatData);
    let image = getChatImageElements(chatData);
    let latestMessage = "最新メッセージ";
    return `<a href='/messages/${chatData._id}' class='resultListItem'>
                ${image}
                <div class='resultDetailContainer ellipsis'>
                    <span class='heading ellipsis'>${chatName}</span>
                    <span class='subText ellipsis'>${latestMessage}</span>
                </div>
            </a>`;
}

// チャット名取得
function getChatName(chatData) {
    let chatName = chatData.chatName;
    if (!chatName) {
        let otherChatUsers = getOtherChatUsers(chatData.users);
        let namesArray = otherChatUsers.map(user => user.firstName + " " + user.lastName);
        chatName = namesArray.join(", ");
    }
    return chatName;
}

// 自分以外のユーザー取得
function getOtherChatUsers(users) {
    if (users.length == 1) return users;
    return users.filter(user => user._id != userLoggedIn._id);
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

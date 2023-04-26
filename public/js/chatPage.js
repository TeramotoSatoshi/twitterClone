// チャットページ初期表示
$(document).ready(() => {
    $.get(`/api/chats/${chatId}`, data => $("#chatName").text(getChatName(data)));
    $.get(`/api/chats/${chatId}/messages`, data => {
        let messages = [];
        let lastSenderId = "";
        data.forEach((message, index) => {
            let html = createMessageHtml(message, data[index + 1], lastSenderId);
            messages.push(html);
            lastSenderId = message.sender._id;
        })
        let messagesHtml = messages.join("");
        addMessagesHtmlToPage(messagesHtml);
        scrollToBottom(false);

        $(".loadingSpinnerContainer").remove();
        $(".chatContainer").css("visibility", "visible");
    })
})

// チャット名保存ボタン押下
$("#chatNameButton").click(() => {
    let name = $("#chatNameTextBox").val().trim();

    $.ajax({
        url: "/api/chats/" + chatId,
        type: "PUT",
        data: { chatName: name },
        success: (data, status, xhr) => {
            if(xhr.status != 204) {
                alert("更新できませんでした");
            } else {
                location.reload();
            }
        }
    })
})

// チャット送信ボタン押下
$(".sendMessageButton").click(() => {
    messageSubmitted();
})

// Enter押下
$(".inputTextBox").keydown((event) => {
    if (event.which === 13) {
        messageSubmitted();
        return false;
    }
})

// メッセージ決定
function messageSubmitted() {
    let content = $(".inputTextBox").val().trim();
    if (content != "") {
        sendMessage(content);
        $(".inputTextBox").val("");
    }
}

// メッセージHTMLをページに追加する
function addMessagesHtmlToPage(html) {
    $(".chatMessages").append(html);
}

// メッセージ送信
function sendMessage(content) {
    $.post("/api/messages", { content: content, chatId: chatId }, (data, status, xhr) => {
        if (xhr.status != 201) {
            alert("メッセージを送信できませんでした");
            $(".inputTextBox").val(content);
            return;
        }
        addChatMessageHtml(data);
    })
}

// メッセージHTML追加
function addChatMessageHtml(message) {
    if(!message || !message._id) {
        alert("メッセージが無効です");
        return;
    }
    // メッセージHTML生成
    let messageDiv = createMessageHtml(message, null, "");
    // HTMLに追加
    addMessagesHtmlToPage(messageDiv);
    scrollToBottom(true);
}

// メッセージHTML生成
function createMessageHtml(message, nextMessage, lastSenderId) {
    let sender = message.sender;
    let senderName = sender.firstName + " " + sender.lastName;
    let currentSenderId = sender._id;
    let nextSenderId = nextMessage != null ? nextMessage.sender._id : "";

    // 最初のメッセージか
    let isFirst = lastSenderId != currentSenderId;
    // 最後のメッセージ化
    let isLast = nextSenderId != currentSenderId;
    // 自分の投稿か
    let isMine = message.sender._id == userLoggedIn._id;
    // クラス名
    let liClassName = isMine ? "mine": "theirs";

    let nameElement = "";
    if (isFirst) {
        liClassName += " first";
        if (!isMine) {
            nameElement = `<span class='senderName'>${senderName}</span>`;
        }
    }

    let profileImage = "";
    if (isLast) {
        liClassName += " last";
        profileImage = `<img src='${sender.profilePic}'>`
    }

    let imageContainer = "";
    if (!isMine) {
        imageContainer = `<div class='imageContainer'>
                                ${profileImage}
                            </div>`
    }

    return `<li class='message ${liClassName}'>
                ${imageContainer}
                <div class='messageContainer'>
                    ${nameElement}
                    <span class='messageBody'>
                        ${message.content}
                    </span>
                </div>
            </li>`;
}

function scrollToBottom(animated) {
    let container = $(".chatMessages");
    // コンテナ要素の高さを取得
    let scrollHeight = container[0].scrollHeight;

    if (animated) {
        // アニメーション付きでスクロール
        container.animate({ scrollTop: scrollHeight }, "slow");
    }
    else {
        // 即座にスクロール
        container.scrollTop(scrollHeight);
    }
}

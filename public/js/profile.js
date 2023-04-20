$(document).ready(() => {
    if(selectedTab === "replies") {
        loadReplies();
    } else {
        loadPosts();
    }
})

function loadPosts(){
    $.get("/api/posts", {postedBy: profileUserId, pinned: true}, results => {
        outputPinedPosts(results, $(".pinnedPostContainer"));
     });

     $.get("/api/posts", {postedBy: profileUserId, isReply: false}, results => {
        outputPosts(results, $(".postsContainer"));
     });
}

function loadReplies(){
    $.get("/api/posts", {postedBy: profileUserId, isReply: true}, results => {
        outputPosts(results, $(".postsContainer"));
     });
}

// ピン投稿作成
function outputPinedPosts(results, container) {
    if(results.length == 0) {
        container.hide();
        return;
    }
    container.html("");

    // 繰り返し処理
    results.forEach(result => {
        let html = createPostHtml(result);
        container.append(html);
    });
}

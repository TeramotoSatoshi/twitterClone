// DOMが全てロードされてDOMにアクセスできる準備が出来た段階で実行
$(document).ready(() => {
    $.get("/api/posts/" + postId, results => {
       outputPostsWithReplies(results, $(".postsContainer"));
    });
})

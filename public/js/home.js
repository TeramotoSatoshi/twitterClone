// DOMが全てロードされてDOMにアクセスできる準備が出来た段階で実行
$(document).ready(() => {
    // フォロー中の投稿のみ表示
    $.get("/api/posts", { followingOnly: true } ,results => {
       outputPosts(results, $(".postsContainer"));
    });
})

const mongoose = require("mongoose"); //mongoose読み込み

// Databaseクラス
class Database {
  constructor() {
    this.connect();
  }

  connect() {
    mongoose
      .connect("mongodb://user:twittercloneabc@ac-jgjvroc-shard-00-00.xtefkpk.mongodb.net:27017,ac-jgjvroc-shard-00-01.xtefkpk.mongodb.net:27017,ac-jgjvroc-shard-00-02.xtefkpk.mongodb.net:27017/?ssl=true&replicaSet=atlas-oh8ec0-shard-0&authSource=admin&retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        // 正常の場合
      })
      .catch((err) => {
        // エラーの場合
        console.log("database connection error" + err);
      });
  }
}

module.exports = new Database();

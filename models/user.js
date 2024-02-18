const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

userSchema.plugin(passportLocalMongoose, {
  errorMessages: {
    UserExistsError: "そのユーザー名は既に使われています。",
    MissingPasswordError: "パスワードを入力してください。",
    MissingUsernameError: "ユーザー名を入力してください。",
    AttemptTooSoonError:
      "アカウントがロックさています。時間をあけてさいどためしてください。",
    TooManyAttemptsError:
      "ログインの失敗が続いたため、アカウントをロックしました。。",
    NoSaltValueStoredError: "認証が出来ませんでした。",
    IncorrectPasswordError: "パスワードまたはユーザー名が間違っています。",
    IncorrectUsernameError: "パスワードまたはユーザー名が間違っています。",
  },
});

module.exports = mongoose.model("User", userSchema);

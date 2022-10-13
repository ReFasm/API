import { Schema, model } from "mongoose";

const UserSchema = new Schema({
  username: String,
  apikey: String,
  password: String,
});

const UserModel = model("User", UserSchema);

export default UserModel;

import { Schema, model } from "mongoose";

export const ShortenedUrlSchema = new Schema({
  slug: String,
  url: String,
  owner: String,
  nsfw: Boolean,
  password: String ?? Boolean,
});

export const ShortenedUrlModel = model("Url", ShortenedUrlSchema);

export default ShortenedUrlModel;

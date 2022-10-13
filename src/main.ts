import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import express from "express";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import UserModel from "./Schemas/User.js";
import ShortenedUrlModel from "./Schemas/ShortenedUrl.js";

const port = 3000;

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

app.disable("x-powered-by");

dotenv.config();

mongoose.connect(process.env.MONGODB_CONNECTION_STRING);

app.get("/", function (req, res) {
  res.send({ status: "OK", response: "Hi from ReFasm.ga api" });
});

app.post("/v1/create", async (req, res) => {
  const headers = req.headers;
  const body = req.body;
  const token = headers.authorization;

  if (!token)
    return res
      .status(401)
      .send({ status: "ERROR", response: "No authorization token" });

  const user = await UserModel.findOne({ apikey: token }).exec();

  if (!user)
    return res.status(401).send({
      status: "ERROR",
      response: "Invalid Authorization Token",
    });

  if (!body.hasOwnProperty("url") || !body.hasOwnProperty("nsfw"))
    return res
      .status(400)
      .send({ status: "ERROR", response: "Malformed body" });

  const password: string | boolean = body.password || false;

  let slug = "";

  if (!body.hasOwnProperty("slug")) {
    slug = (Math.random() + 1).toString(36).substring(6);
  } else {
    slug = body.slug;
  }

  const exitingUrlWithSameSlug = await ShortenedUrlModel.findOne({
    slug: slug,
  });

  if (exitingUrlWithSameSlug)
    return res.send({ status: "ERROR", response: "slug already in use" });

  const shortened = new ShortenedUrlModel({
    slug: slug,
    url: body.url,
    owner: user.username,
    nsfw: body.nsfw,
    password: password,
  });

  shortened.save();

  return res.send({
    status: "OK",
    response: "shortened",
    link: `refasm.ga/${slug}`,
  });
});

app.get("/v1/urls/:url", async (req, res) => {
  const headers = req.headers;
  const params = req.params;
  const token = headers.authorization;

  if (!token)
    return res
      .status(401)
      .send({ status: "ERROR", response: "No authorization token" });

  const user = await UserModel.findOne({ apikey: token }).exec();

  if (!user)
    return res.status(401).send({
      status: "ERROR",
      response: "Invalid Authorization Token",
    });

  const item = await ShortenedUrlModel.findOne({ slug: params.url });

  if (!item) return res.send({ status: "ERROR", code: "Slug not found" });

  res.send(item["_doc"]);
});

app.get("/v1/urls", async (req, res) => {
  const headers = req.headers;
  const token = headers.authorization;

  if (!token)
    return res
      .status(401)
      .send({ status: "ERROR", response: "No authorization token" });

  const user = await UserModel.findOne({ apikey: token }).exec();

  if (!user)
    return res.status(401).send({
      status: "ERROR",
      response: "Invalid Authorization Token",
    });

  const item = await ShortenedUrlModel.find({ owner: user.username });

  return res.send(item);
});

app.patch("/v1/edit", async (req, res) => {
  const headers = req.headers;
  const body = req.body;
  const token = headers.authorization;

  if (!token)
    return res
      .status(401)
      .send({ status: "ERROR", response: "No authorization token" });

  const user = await UserModel.findOne({ apikey: token }).exec();

  if (!user)
    return res.status(401).send({
      status: "ERROR",
      response: "Invalid Authorization Token",
    });

  const resultUrl = await ShortenedUrlModel.findOne({
    slug: headers.slug,
  }).exec();

  if (!resultUrl)
    return res
      .status(404)
      .send({ status: "ERROR", response: "Slug not found!" });

  // If we want to edit the slug
  if (body.slug) {
    const exitingUrlWithSameSlug = await ShortenedUrlModel.find({
      slug: body.slug,
    });

    if (exitingUrlWithSameSlug)
      return res
        .status(409)
        .send({ status: "ERROR", response: "slug already in use" });
  }

  await ShortenedUrlModel.updateOne(
    { slug: headers.slug },
    {
      slug: body.slug || resultUrl.slug,
      nsfw: body.nsfw || resultUrl.nsfw,
      password: body.password || resultUrl.password,
    }
  );

  const updatedUrl = await ShortenedUrlModel.findOne({
    slug: body.slug || headers.slug,
  }).exec();

  res.send({ status: "OK", response: updatedUrl["_doc"] });
});

app.delete("/v1/delete", async (req, res) => {
  const headers = req.headers;
  const body = req.body;
  const token = headers.authorization;

  if (!token)
    return res.send({ status: "ERROR", response: "No authorization token" });

  const user = await UserModel.findOne({ apikey: token }).exec();

  if (!user)
    return res.send({
      status: "ERROR",
      response: "Invalid Authorization Token",
    });

  const urlInfo = await ShortenedUrlModel.findOne({ slug: body.slug }).exec();

  if (!urlInfo)
    return res.send({ status: "ERROR", response: "Slug not found!" });

  if (urlInfo.owner != user.username)
    return res.send({ status: "ERROR", response: "You don't own this slug!" });

  await ShortenedUrlModel.findOneAndDelete({ slug: body.slug });

  res.send({ status: "OK", response: "Deleted successfully" });
});

app.post("/internal/register", async (req, res) => {
  const headers = req.headers;
  const body = req.body;
  const token = headers.authorization;

  if (!token)
    return res
      .status(401)
      .send({ status: "ERROR", code: "Missing API secret" });

  if (token !== process.env.API_SECRET)
    return res.status(401).send({ status: "ERROR", code: "Wrong API secret" });

  if (!body.username || !body.password)
    return res.status(400).send({ status: "ERROR", code: "Malformed body" });

  const exitingUserWithSameUsername = await UserModel.findOne({
    username: body.username,
  });

  if (exitingUserWithSameUsername)
    return res
      .status(409)
      .send({ status: "ERROR", code: "Username already taken" });

  const apiToken = randomBytes(16);

  const user_body = {
    username: body.username,
    password: body.password,
    apikey: apiToken.toString("hex"),
  };

  UserModel.create(user_body);
  res.send(user_body);
});

app.listen(port, () => {
  console.log(`ReFasm API listening on ${port}`);
});

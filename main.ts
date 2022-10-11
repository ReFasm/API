import express from "express";
const port = 3000;
const app = express();
import * as mongoose from "mongoose";
import * as dotenv from "dotenv";
import { randomBytes } from "crypto"
import rateLimit from 'express-rate-limit'
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable("x-powered-by");
dotenv.config();

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
const ShortenedUrlModel = new mongoose.Schema({
  slug: String,
  url: String,
  owner: String,
});
const ShortenedUrl = mongoose.model("Url", ShortenedUrlModel);

const UserModel = new mongoose.Schema({
  username: String,
  apikey: String,
  password: String,
});
const User = mongoose.model("User", UserModel);

const result = await User.find().exec();

const keys = {};
result.forEach((value) => {
  keys[value.apikey] = [value.username, value.password];
});
app.get("/", function (req, res) {
  console.log(req.query);
  res.send({ status: "OK", response: "Hi from ReFasm.ga api" });
});

app.post("/v1/create", async (req, res) => {
  const result = await User.find().exec();

  const keys = {};
  result.forEach((value) => {
    keys[value.apikey] = [value.username, value.password];
  });
  const headers = req.headers;
  const body = req.body;
  const token = headers.authorization;
  console.log(token);

  if (!body.hasOwnProperty("url")) {
    return res.send({ status: "ERROR", response: "No url provided" });
  }

  if (!body.hasOwnProperty("slug")) {
    var slug = (Math.random() + 1).toString(36).substring(6);
  } else {
    var slug: string = body.slug;
  }
  const url = body.url;
  if (!token) {
    return res.send({ status: "ERROR", response: "No authorization token" });
  }
  if (!keys[token]) {
    return res.send({
      status: "ERROR",
      response: "Invalid Authorization Token",
    });
  }
  const return_value = await ShortenedUrl.find({ slug: slug });
  if (return_value.length == 0) {
    const shortened = new ShortenedUrl({
      slug: slug,
      url: url,
      owner: keys[token][0],
    });
    shortened.save().then(() => {
      console.log("Saved!");
    });
    return res.send({
      status: "OK",
      response: "shortened",
      link: `refasm.ga/${slug}`,
    });
  } else {
    return res.send({ status: "ERROR", response: "slug already in use" });
  }
});

app.get("/v1/urls/:url", async (req, res) => {
  const result = await User.find().exec();

  const keys = {};
  result.forEach((value) => {
    keys[value.apikey] = [value.username, value.password];
  });
  const headers = req.headers;
  const token = headers.authorization;
  if (!token) {
    return res.send({ status: "ERROR", response: "No authorization token" });
  }
  if (!keys[token]) {
    return res.send({
      status: "ERROR",
      response: "Invalid Authorization Token",
    });
  }

  const item = await ShortenedUrl.findOne({ slug: req.params.url });
  res.send({ ...item["_doc"] });
});

app.get("/v1/urls", async (req, res) => {
  const result = await User.find().exec();

  const keys = {};
  result.forEach((value) => {
    keys[value.apikey] = [value.username, value.password];
  });
  const headers = req.headers;
  const token = headers.authorization;
  if (!token) {
    return res.send({
      status: "ERROR",
      response: "No authorization token specified in Headers",
    });
  }
  if (!keys[token]) {
    return res.send({
      status: "ERROR",
      response: "Invalid Authorization Token",
    });
  }

  const item = await ShortenedUrl.find({ owner: keys[token] });
  console.log(item);

  await res.send(item);
});
app.post("/internal/register", (req, res) => {
  var headers = req.headers;
  var body = req.body;
  if (!headers.authorization) {
    return res.send({ status: "ERROR", code: "Missing API secret" });
  }
  if (headers.authorization !== process.env.API_SECRET) {
    return res.send({ status: "ERROR", code: "Wrong API secret" });
  }
  if (!(body.username && body.password)) {
    return res.send({ status: "ERROR", code: "Malformed body" });
  }
  
  const buf = randomBytes(16)
  
  const user_body = {

    username: body.username,
    password: body.password,
    apikey: buf.toString("hex")
  };

  User.create(user_body);
  res.send(user_body);
  
});

app.listen(port, () => {
  console.log(`ReFasm API listening on ${port}`);
});

import express from "express";
const port = 3000;
const app = express();
import * as mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as bp from "body-parser";
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

dotenv.config();

mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
const ShortenedUrlModel = new mongoose.Schema({ slug: String, url: String });
const ShortenedUrl = mongoose.model("Url", ShortenedUrlModel);

const keys = { foo: "bar" };
app.get("/", function (req, res) {
  console.log(req.query);
  res.send({ status: "OK", response: "Hi from ReFasm.ga api" });
});

app.post("/create", async (req, res) => {
  const headers = req.headers;
  const body = req.body;
  const token = headers.authorization;

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
  console.log(slug);
  console.log(body.slug);
  const return_value = await ShortenedUrl.find({ slug: slug });
  if (return_value.length == 0) {
    const shortened = new ShortenedUrl({ slug: slug, url: url });
    shortened.save().then(() => {
      console.log("Saved!");
    });
    return res.send({
      status: "OK",
      response: "shortened",
      link: "refasm.ga/" + slug,
    });
  } else {
    return res.send({ status: "ERROR", response: "slug already in use" });
  }
});

app.get("/url/:url", async (req, res) => {
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
  res.setHeader("x-powered-by", "ReFasm.ga - Express");
  const item = await ShortenedUrl.findOne({ slug: req.params.url });
  res.send({ ...item["_doc"] });
});

app.listen(port, () => {
  console.log(`ReFasm API listening on ${port}`);
});

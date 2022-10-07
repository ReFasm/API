"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const port = 3000;
const app = (0, express_1.default)();
const mongoose = __importStar(require("mongoose"));
const bp = __importStar(require("body-parser"));
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
mongoose.connect('mongodb://admin:AMOGUS@192.168.0.200:27017/ReFasm?authSource=admin&readPreference=primary&ssl=false');
const ShortenedUrlModel = new mongoose.Schema({ slug: String, url: String });
const ShortenedUrl = mongoose.model('Url', ShortenedUrlModel);
const shit = new ShortenedUrl({ slug: 'shit', url: 'https://example.com' });
shit.save().then((value) => console.log('shit be like: ', value));
const keys = { "foo": "bar" };
app.get("/", function (req, res) {
    console.log(req.query);
    res.send({ "status": "OK", "response": "Hi from ReFasm.ga api" });
});
app.post("/create", (req, res) => {
    let headers = req.headers;
    let body = req.body;
    const token = headers.authorization;
    if (!body.hasOwnProperty("url")) {
        return res.send({ "status": "ERROR", "response": "No url provided" });
    }
    if (!body.hasOwnProperty("slug")) {
        var slug = (Math.random() + 1).toString(36).substring(6);
    }
    else {
        var slug = body.slug;
    }
    let url = body.url;
    if (!token) {
        return res.send({ "status": "ERROR", "response": "No authorization token" });
    }
    if (!keys[token]) {
        return res.send({ "status": "ERROR", "response": "Invalid Authorization Token" });
    }
    return res.send({ "status": "OK", "response": "shortened", "link": "refasm.ga/", slug });
});
app.listen(port, () => {
    console.log(`ReFasm API listening on ${port}`);
});

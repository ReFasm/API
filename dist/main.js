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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const port = 3000;
const app = (0, express_1.default)();
const mongoose = __importStar(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const bp = __importStar(require("body-parser"));
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
dotenv.config();
const connection = mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
const ShortenedUrlModel = new mongoose.Schema({ slug: String, url: String });
const ShortenedUrl = mongoose.model("Url", ShortenedUrlModel);
const keys = { foo: "bar" };
app.get("/", function (req, res) {
    console.log(req.query);
    res.send({ status: "OK", response: "Hi from ReFasm.ga api" });
});
app.post("/create", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let headers = req.headers;
    let body = req.body;
    const token = headers.authorization;
    if (!body.hasOwnProperty("url")) {
        return res.send({ status: "ERROR", response: "No url provided" });
    }
    if (!body.hasOwnProperty("slug")) {
        var slug = (Math.random() + 1).toString(36).substring(6);
    }
    else {
        var slug = body.slug;
    }
    let url = body.url;
    if (!token) {
        return res.send({ status: "ERROR", response: "No authorization token" });
    }
    if (!keys[token]) {
        return res.send({
            status: "ERROR",
            response: "Invalid Authorization Token",
        });
    }
    const return_value = yield ShortenedUrl.find({ slug: slug });
    if (return_value.length == 0) {
        const shortened = new ShortenedUrl({ slug: slug, url: url });
        shortened.save().then((value) => {
            console.log("Saved!");
        });
        return res.send({
            status: "OK",
            response: "shortened",
            link: "refasm.ga/" + slug,
        });
    }
    else {
        return res.send({ status: "ERROR", response: "slug already in use" });
    }
}));
app.listen(port, () => {
    console.log(`ReFasm API listening on ${port}`);
});

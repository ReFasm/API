import express from "express" ;
const port = 3000
const app = express()
import * as bp  from 'body-parser';
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))



const keys = {"foo": "bar"}
app.get("/", function(req, res) {
    console.log(req.query)
    res.send({"status": "OK", "response": "Hi from ReFasm.ga api"});
})

app.post("/create", (req, res) => {
    let headers = req.headers
    let body = req.body
    const token = headers.authorization
    if (!body.hasOwnProperty("url")) {
        return res.send({"status": "ERROR", "response": "No url provided"})
    }
    if (!body.hasOwnProperty("slug")) {
        var slug = (Math.random() + 1).toString(36).substring(6);
    }
    else {
        var slug: string = body.slug
    }
    let url = body.url
    if (!token) {
        return res.send({"status": "ERROR", "response": "No authorization token"})

    }
    if (!keys[token]) {
        return res.send({"status": "ERROR", "response": "Invalid Authorization Token"})
    }
    return res.send({"status": "OK", "response": "shortened", "link": "refasm.ga/", slug})
})

app.listen(port, () => {
    console.log(`ReFasm API listening on ${port}`)
  })
  
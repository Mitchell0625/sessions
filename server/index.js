require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { json } = require("body-parser");
const port = process.env.PORT || 3001;
const app = express();
const session = require("express-session");

app.use(cors());
app.use(json());
app.use(
  session({
    //session needs to be listed before the function middleware
    secret: process.env.SESSION_SECRET, //any thing that should be kept secret
    saveUninitialized: false, //doesn't save the session unless it was interacted with
    resave: false, //asks if any changes were made to thesession; if no changes, save the old version; if changes save the new version
    cookie: {
      maxAge: 100000 //gives the session expiration in milliseconds
    }
  })
);

app.use(logger); //logger as top level middleware
app.use((req, res, next) => {
  //checks if the cart exists on the middleware
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

app.post("/api/cart", (req, res) => {
  req.session.cart.push(req.body);
  res.status(200).json(req.session.cart);
});

app.get("/api/cart", (req, res) => {
  if (req.query.type) {
    //querying is great for filtering on the server
    const filtered = req.session.cart.filter(
      val => val.type === req.query.type
    ); // filters through the cart and returns the values that were queried for
    res.status(200).json(filtered);
  } else {
    res.status(200).json(req.session.cart);
  }
});

app.delete("/api/cart/:item", (req, res) => {
  if (!req.session.cart.length) {
    res.status(500).json({ message: "There's nothing in the cart" });
  } else {
    const { cart } = req.session;
    const filtered = cart.filter(val => val.type !== req.params.item);
    req.session.cart = filtered; //cart equals the array with the item removed
    res.status(200).json(filtered);
  }
});

// app.use((req, res, next) => {
//   if (req.method !== "GET") {
//     res.status(405).json({ message: "This API is Read Only" });
//   } else {
//     next();
//   }
// });

app.get("/api/test", (req, res, next) => {
  res.status(200).json({ message: "Success" });
});

app.get("/api/nomids", (req, res, next) => {
  res.status(200).json({ message: "I have no middles" });
});

app.post("/api/adminpath", isAuthed, (req, res, next) => {
  res.status(200).json({ message: "some sensitive info" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/"); //send the user back out; post says that you want to destroy the user on the server
  });
});
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

function logger(req, res, next) {
  console.log("REQ.SESSION: ", req.session);
  console.log("REQ.BODY: ", req.body);
  console.log("REQ.QUERY: ", req.query);
  next(); //json and cors call next under the hood
}

function isAuthed(req, res, next) {
  if (req.body.user.role === "Admin") {
    next();
  } else {
    res.status(401).json({ message: "unauthorized" });
  }
}

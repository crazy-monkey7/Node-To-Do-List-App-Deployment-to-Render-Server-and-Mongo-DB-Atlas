//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config(); // Load environment variables from .env file - use when modifying locally otherwise keep commented out


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then(function() {
    console.log("MongoDB connected successfully");
  })
  .catch(function(err) {
    console.log("MongoDB connection error: " + err);
  });
  
const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        return Item.insertMany(defaultItems);
      } else {
        return foundItems;
      }
    })
    .then(function (items) {
      res.render("list", { listTitle: "Today", newListItems: items });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:listName", function(req, res) {
  const listName = req.params.listName;

  List.findOne({ name: listName })
    .then(function(foundList) {
      if (!foundList) {
        // Create a new list document and save it to the database
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        // Render the existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function(err) {
      console.log(err);
    });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");

  } else {
    List.findOne({name: listName})
        .then(foundList => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
        .catch(err => {
            console.error(err);
        });
}

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  Item.deleteOne({ _id: checkedItemId })
    .then(function() {
      console.log("Successfully deleted item with ID " + checkedItemId);
      res.redirect("/");
    })
    .catch(function(err) {
      console.log(err);
      res.redirect("/");
    });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
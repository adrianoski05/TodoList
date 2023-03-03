//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _= require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://admin-adrianoski:test123@cluster0.9viwtre.mongodb.net/todolistDB");

//Create the model for the docuemnents with MONGOOSE
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

// Creating 3 new documents
const item1 = new Item({
  name: "Welcome to your todo List"
});

const item2 = new Item({
  name: "Hit the + button to aff a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//Adding documents into an Array.
const defaultItems = [item1, item2, item3];

// Creating new Documents with NEW SCHEMA
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    // if database documents is empty, insert the Default Items array.
    if(foundItems.length === 0) {

      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Default items were added correctly.");
        }
      });
      // Reload the page to HOME, then go to the ELSE statement
      res.redirect("/");
    } else {
      //Render the TODO list.
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});


app.get("/:customListName", function(req,res){

  customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new List
        const list = new List({
        name: customListName,
        items: defaultItems
        });

        list.save();
        res.redirect("/"+customListName);
      }else{
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })


});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }

});


app.post("/delete", function(req,res){
  // Save Item checked in const.
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    //Find the item in ITEM and Delete it. Use the FindByID method.
    Item.findByIdAndRemove(checkedItemID,function(err){
      if(!err){
        console.log("Item checked was removed");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemID}}},
      function(err, foundList){
        if(!err){
          console.log(listName);
          res.redirect("/" + listName);
        }
      }
    );
  }
  }
);


app.get("/about", function(req, res){
  res.render("about");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});

const express = require('express');
const app = express();

var path = require("path")
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var localStrategy = require("passport-local");
var expressSession = require("express-session");


var Delivery = require("./schema/deliveryModel");
var History = require("./schema/historyModel");
var User = require("./schema/userModel");
var Options = require("./schema/optionsModel");
var OptionsHistory = require("./schema/historyOptions");


var adminPassword = "ZeusTradingApp@23";
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];



// ================================================
//        DATABASE CONNECTION
// ================================================
mongoose.connect('mongodb://localhost/zeus', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
    })
    .then(() => console.log('Connected to DB!'))
    .catch(error => console.log(error.message));

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");


// =====================================================
//          PASSPORT SETUP
// =====================================================
app.use(expressSession({
  secret: "ZeusP",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next){
  res.locals.currentUser = req.user;
  next();
});
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// registerMe();

// ==================== ADD NEW SCRIPT ===================
// var newScrip = {
//   scrip: "HDFC",
//   indicator: "BUY",
//   price: 1345
// };
// Delivery.create(newScrip, function (err, scrip) {
//   if(err)
//     console.log("ERROR OCCURED = ", err);
//   else{
//     console.log("Created new script");
//     console.log(scrip);
//   }
// })

// =======================  ADD NEW OPTION =================
// var newOptions = {
//   tradeType: "BUY",
//   optionName: "NIFTY",
//   levelValue: 13500,
//   callOrPut: "CE",
//   weekDate: "13-01-2021",
//   entry: 84,
//   stopLoss: 76,
//   target: 98
// };
// Options.create(newOptions, function (err, option){
//   if(err)
//     console.log("ERROR OCCURED = " + err);
//   else{
//     console.log("created sample option");
//     console.log(option);
//   }
// });


// =====================================================
//                      ROUTES
// =====================================================
app.get('/', (req, res) => {
    res.render("landing");
});

// ===================  OPTIONS ROUTES  ==========================
app.get("/trades/options", isLoggedIn,function (req, res) {
  console.log("\n==================================================");
  Options.find({}).sort({'createdAt': 'desc'}).exec(function (err, allOptions){
    if(err)
      console.log("Error Occured while finding options = " + err);
    else{
      console.log("Display All Options");
      res.render("options", {options: allOptions});
    }
  })
});

app.post("/trades/options", function (req, res){
  console.log(req.body);
  var d = new Date(req.body.date);
  var newDate = d.getDate() + " " + monthNames[d.getMonth()];
  var newOption = {
    tradeType: req.body.trade,
    optionName: req.body.optionName,
    levelValue: req.body.levelValue,
    callOrPut: req.body.type,
    weekDate: newDate,
    entry: req.body.entry,
    stopLoss: req.body.stopLoss,
    target: req.body.target
  };
  Options.findOneAndUpdate({optionName: req.body.optionName}, newOption, {
    new: true,
    upsert: true
  }, function (err, option){
    if(err)
      console.log("Error Occured during creating option = " + err);
    else{
      console.log("Added Option data from form");
      console.log(option);
      res.redirect("/trades/options");
    }
  });
});

app.get("/trades/options/history", isLoggedIn, function (req, res){
  OptionsHistory.find({}).sort({'createdAt': 'desc'}).exec(function (err, allOptions){
    if(err)
      console.log("Error Occured during Options History = " + err);
    else{
      console.log("Displaying Options History");
      // res.send("Options History over here");
      res.render("optionsHistory", {options: allOptions});
    }
  });
});




// =================  OPTION BUTTONS ROUTES ========================

// ===============  DELETE  ====================
app.post("/trades/options/delete", function (req, res){
  console.log("\n==================================================");
  Options.findByIdAndDelete(req.body.optionId, function (err, deletedOption){
    if(err)
      console.log("error while removing option from active = " + err);
    else{
      var historyOption = {
        tradeType: deletedOption.tradeType,
        optionName: deletedOption.optionName,
        levelValue: deletedOption.levelValue,
        callOrPut: deletedOption.callOrPut,
        weekDate: deletedOption.weekDate,
        entry: deletedOption.entry,
        stopLoss: deletedOption.stopLoss,
        target: deletedOption.target,
        createdAt: deletedOption.createdAt,
        updatedAt: new Date()
      };
      OptionsHistory.create(historyOption, function (err, addedOption){
        if(err)
          console.log("Error Occured while adding option to history = " + err);
        else{
          console.log("Added option to history");
          // res.send("selling option with ID = " + addedOption._id);
          res.redirect("/trades/options");
        }
      })
    }
  });
});

// ============ SL AT COST ===============
app.post("/trades/options/sl@cost", function (req, res){
  console.log("\n==================================================");
  var id = req.body.optionId;
  var stopLoss = "";
  Options.findById(id, function (err, option){
    if(err)
      console.log("error occured during SL @ Cost - " + err);
    else{
      stopLoss = option.entry;
      console.log("Changing Stop Loss to entry: " + stopLoss);    
      Options.findByIdAndUpdate(id, {stopLoss: stopLoss}, {new: true}, function (err, updatedOption){
        if(err)
          console.log("Error occured during update : " + err);
        else{
          res.redirect("/trades/options");
        }
      });
    }
  });
});

// ================ IMMEDIATE EXIT  ================
app.post("/trades/options/immexit", isLoggedIn, function (req, res){
  console.log("\n==================================================");
  var id = req.body.optionId;
  var indication = "IMMEDIATE EXIT";
  Options.findByIdAndUpdate(id,{notification: indication}, {new: true}, function (err, option){
    if(err)
      console.log("Error Occured during Immediate Exit: " + err);
    else{
      console.log("Immediate Exit option with Name = " + option.optionName);
      console.log("The new option is - " + option);
      res.redirect("/trades/options");
    }
  })
});

// ===========  ENTERED ============
app.post("/trades/options/enter", isLoggedIn, function (req, res){
  console.log("\n==================================================");
  var id = req.body.optionId;
  var indication = "ENTERED";
  Options.findByIdAndUpdate(id,{notification: indication}, {new: true}, function (err, option){
    if(err)
      console.log("Error Occured during Entered: " + err);
    else{
      console.log("Entered option with Name = " + option.optionName);
      console.log("The new option is - " + option);
      res.redirect("/trades/options");
    }
  })
});

//  ==================  DELIVERY ROUTES =======================
app.get("/trades/delivery", isLoggedIn, function(req, res){
  console.log("\n==================================================");
  Delivery.find({}).sort({'createdAt': 'desc'}).exec(function (err, allTrades) {
    if(err)
      console.log("an error occured = " + err);
    else{
      console.log("ADDED SCRIP");
      res.render("delivery", {trades: allTrades});
    }
  })
});

app.post("/trades/delivery", isLoggedIn, function (req, res) {
  var scripName = req.body.scrip;

  // todo - get price from yahoo api
  // var price = (Math.random() * 1000) + 200;
  var indicator = req.body.name;

  if(indicator === "SELL"){
    var historyTrade = {
      scrip: scripName
    }

    Delivery.findOneAndUpdate({scrip: scripName}, {indicator: indicator}, null, function (err, trade) {
      if(err)
        console.log("ERROR OCCURED = " + err);
      else{

        historyTrade.price = trade.price;
        historyTrade.indicator = "SELL";
        historyTrade.createdAt = trade.createdAt;
        historyTrade.updatedAt = Date.now();
        
        History.create(historyTrade, function (err, historicTrade){
          if(err)
            console.log("ERROR OCCURED = " + err);
          else{
            console.log("MOVED TO HISTORY");
          }
        });  
      }
    })
    Delivery.findOneAndDelete({scrip: scripName},function (err, deletedTrade){
      if(err)
        console.log(err);
      else{
        console.log("DELETED SUCCESSFULLY");
      }
      res.redirect("/trades/delivery");

    });
  }
  else{
    var price = req.body.price;
    var newScrip = {
      scrip: scripName,
      price: price,
      indicator: indicator
    }
  
    
    Delivery.create(newScrip, function (err, scrip){
      if(err)
        res.send("DUPLICATE SHARE");
      else{
        res.redirect("/trades/delivery");
      }
    });
  }
});

app.get("/trades/history", isLoggedIn, function (req, res) {
  History.find({}).sort({'createdAt': 'desc'}).exec(function (err, allTrades) {
    if(err)
      console.log(err)
    else{
      console.log("HISTORY SCRIP");
      res.render("history", {trades: allTrades});
    }
  })
})





// =================  AUTHENTICATION functionality ===========================
app.get("/login", function (req, res){
  res.render("login");
});

app.get("/loggedIn", function (req, res){
  res.redirect("/");
})

app.post("/login", passport.authenticate("local",
  {
    successRedirect:"/loggedIn",
    failureRedirect:"/"
  }), function (req, res){
    // do nothing here
});


app.get("/logout", function (req, res){
  req.logout();
  res.redirect("/");
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    next();
    // res.send("YOU ARE LOGGED IN");
  }
  else{
    res.redirect("/login");
  }
}

function registerMe(){

  User.deleteMany({}, function (err){
    if(err)
      console.log(err);
    else{
      console.log("COLLECTION PURGED and UPDATED!!");
    }
  });

  var newUser = new User({
    username: "Zorawar"
  })

  User.register(newUser, adminPassword, function (err, user){
    if(err){
      console.log(err);
    }

    passport.authenticate("local", {
      successRedirect: "/trades/delivery",
    });
  });
}









app.listen(3000, () => {
  console.log("Listening on port 3000")
})
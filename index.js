console.log("Starting");
var Twit = require('twit');
var Canvas = require('canvas');
var config = require('./config')
var Mage = require('./Classes/Mage');
var Knight = require('./Classes/Knight');
var Archer = require('./Classes/Archer');
var Omega = require('./Bosses/Omega');
var path = require('path');
var utils = require('./Utilities');
console.log("Loaded libraries");


var T = new Twit(config);
var Font = Canvas.Font
var Image = Canvas.Image;
var canvas = new Canvas(800,800);
var context = canvas.getContext('2d');
var bosses = ["Omega","Nexus","Osiris"];
var players = [];
var gameRunning = false;
var tweetStream;
var favoriteStream;
var playerLimit = 10;

//Timers (in minutes)
var waitTime = 10;
var cycleTime = 1.5;
var gameOffTime = 60;

var random = Math.floor((Math.random() * 1000) + 1);
var waitingTimer;
var imageMessages = [];
var playerClasses = ["Mage","Archer","Knight"];
var boss;

//Game variables
var cycles = 0;
var totalHealth = 0;
var previousTweetID;
var originalTweetID;
var deads = [];

//Backgrounds
var startingBackground= new Image();
var bossBackground = new Image();
var cycleBackground = new Image();
startingBackground.src = "./Resources/Images/Starting.png";
cycleBackground.src = "./Resources/Images/Cycle.png"
bossBackground.src = "./Resources/Images/Boss.png";

//Class Icons
var archerIcon = new Image();
var mageIcon = new Image();
var knightIcon = new Image();
archerIcon.src = "./Resources/Images/Class Icons/Archer.png";
mageIcon.src = "./Resources/Images/Class Icons/Mage.png";
knightIcon.src = "./Resources/Images/Class Icons/Knight.png";

var textWidth = 575;


//Beginning the game
function startGame(){
  console.log("Starting new game");


  //Reset game variables just in case
  players = [];
  imageMessages = [];
  gameRunning = false;
  clearTimeout(waitingTimer);
  if(tweetStream != null)
    tweetStream.stop();



  var currentTime = getFormattedTime();


  var status = currentTime + "  You can look at the rules, code, and commands at: https://github.com/SolarFloss/Slayer";
  console.log(currentTime);

  context.drawImage(startingBackground,0,0);
  context.fillStyle = "black";
  context.font = "30px Arial";
  if(playerLimit < 10)
    playerLimit = "0" + playerLimit;

  context.fillText(playerLimit,495,775);
  var fs = require('fs')
  //var out = fs.createWriteStream('./Resources/Output Images/StartingOutput.png');
  var stream = canvas.pngStream();
  //var dataUrl = stream.pipe(out);


  T.post('media/upload',{media_data: canvas.toBuffer().toString('base64')},function(err,data,response){
    console.log("uploaded");
    var mediaIdStr = data.media_id_string;
    var params = {status: status, media_ids: [mediaIdStr]}

    //upload tweet with new image
    T.post('statuses/update', params, function(err, data, response){
      if(!err){
        console.log("Image tweet Succesful");
        originalTweetID = data.id_str;
        previousTweetID = data.id_str;
      }
    });
  });






  //Start listening for users joining the game
  //favoriteStream = T.stream('user');
  //favoriteStream.on('favorite',favoriteEvent);
  tweetStream = T.stream('user');
  tweetStream.on('tweet',tweetEvent);
  tweetStream.on('favorite',interactionEvent);
  tweetStream.on('unfavorite',interactionEvent);
  console.log("Waiting for people to join");
  waitingTimer = setTimeout(intermissionOver,60000*waitTime);
}



function interactionEvent(event){
  var user = event.source.screen_name;
  var target = event.target_object.id_str;
  if(event.event == "favorite"){
    if((target == originalTweetID) && checkPlayerArray("@" + user) && !gameRunning){
      //Add player to list, and give them a class
      var chosenClass = playerClasses[Math.floor(Math.random()*playerClasses.length)];
      //var chosenClass = "Archer";
      var newClass;

      switch (chosenClass) {
        case "Mage":
          newClass= new Mage("@" + user,600);
          break;
        case "Archer":
          newClass = new Archer("@" + user,600);
          break;
        case "Knight":
          newClass = new Knight("@" + user,600);
          break;
      }
      players.push(newClass);
      console.log(newClass.name + " [" + newClass.getPlayerType() + "] joined!");
      if(players.length >= playerLimit){
        console.log("Limit reached");
        tweetStream.stop();
        clearTimeout(waitingTimer);
        intermissionOver();
      }
    }
  }else if(event.event == "unfavorite"){
    if((target == originalTweetID) && !checkPlayerArray("@" + user) && !gameRunning){
      for(var i = 0; i < players.length;i++){
        if(players[i].name == ("@" + user)){
          console.log("@" + user + " left the game");
          players.splice(i,1);
        }
      }
    }
  }
}


function getFormattedTime(){
  var currentDate = new Date();

  var hours = currentDate.getHours();
  var minutes = currentDate.getMinutes();
  var seconds = currentDate.getSeconds();

  if(hours < 10){
    hours = "0" + hours;
  }
  if(minutes < 10){
    minutes = "0" + minutes;
  }
  if(seconds < 10){
    seconds = "0" + seconds;
  }

  return("[" + hours + ":" + minutes + ":" + seconds + "]");
}



//When the intermession is over
function intermissionOver(){
  console.log("Intermission is over");
  clearTimeout(waitingTimer);
  if(tweetStream != null)
    tweetStream.stop();


  if(players.length > 0){
    gameRunning = true;

    //Fill open spots with computers
    randomPlayerMaker(playerLimit - players.length);

    //Just Omega for now
    boss = new Omega("Omega Giant",players.length * 3500);

    cycles = 0;
    tweetGame();
    setTimeout(attackCycle,60000*waitTime/2);
  }else{
    console.log("Not enough players");
    gameRunning = false;
    var message = getFormattedTime() +  ' Not enough players. Starting again in 60 minutes';
    basicTweet(message,true);
    setTimeout(startGame,60000*gameOffTime);
  }
}

function bossInfo(){
  var bossName = boss.getBossType();
  var bossMinDamage = boss.minDamage;
  var bossMaxDamage = boss.maxDamage;
  var bossHealth = boss.health;
  var bossMaxHealth = boss.maxHealth;
  var ySpacing;
  var xSpacing;


  //Boss name
  context.fillStyle = "black";
  context.font = "100px Arial";
  context.fillText(bossName.toUpperCase(),(canvas.width/2) - (context.measureText(bossName).width/2),90);

  //Boss info box
  context.fillStyle = "black";
  context.font = "20px Arial";
  context.fillText(bossName,450,598);
  context.fillText(bossMaxHealth,485,647);
  context.fillText(bossMinDamage + " HP - " + bossMaxDamage + " HP",565,697);

  //Boss Health Bar
  boss.health = bossHealth;
  context.beginPath();
  context.fillStyle = "gray";
  context.rect(104,133,(bossHealth * 591)/bossMaxHealth,35);
  context.fill();
  context.closePath();

  //Boss Health Text
  context.fillStyle = "white";
  context.font = "30px Arial";
  context.fillText(bossHealth + "/" + bossMaxHealth,(canvas.width)/2 - (context.measureText(bossHealth + "/" + bossMaxHealth).width/2),160);
  context.strokeStyle = "black";
  context.strokeText(bossHealth + "/" + bossMaxHealth,(canvas.width)/2 - (context.measureText(bossHealth + "/" + bossMaxHealth).width/2),160);
}


function playerInfo(){
  var ySpacing = 180;
  var xSpacing = 90;
  var inventorySpacingX;


  for(var i = 0; i < players.length;i++){
    var inventorySpacingX = 600;

    switch (players[i].getPlayerType()) {
      case "Mage":
        context.drawImage(mageIcon,xSpacing,ySpacing);
        break;
      case "Archer":
        context.drawImage(archerIcon,xSpacing,ySpacing);
        break;
      case "Knight":
        context.drawImage(knightIcon,xSpacing,ySpacing);
        break;
    }

    for(var j = 0;j < players[i].inventory.length;j++){
      context.fillStyle = "black";
      context.font = "10pt Arial";
      context.fillText(players[i].inventory[j].substring(0,1),inventorySpacingX + 3,ySpacing+15);


      context.beginPath();
      context.fillStyle = "black"
      context.rect(inventorySpacingX,ySpacing + 18,15,2);
      context.fill();
      context.closePath();
      inventorySpacingX += 20;
    }

    //Charge
    var chargeSpacingX = 725;
    for(var j = 0;j < players[i].charge;j++){
      context.beginPath();
      context.arc(chargeSpacingX,ySpacing+17,5,0,2*Math.PI);
      context.stroke();
      context.closePath();
      chargeSpacingX += 15;
    }

    //Player name
    context.font = "15px Arial";
    context.fillStyle = "black";
    context.fillText(players[i].name.substring(0,11),110,ySpacing + 15);


    //Health bars
    //The pixel space is 115 pixels
    var pHealth = players[i].health;
    var pMaxHealth = players[i].maxHealth;
    context.beginPath();
    context.fillStyle = "black";
    if(pHealth > pMaxHealth * .55){
      context.fillStyle = "green";
    }else if(pHealth <= pMaxHealth * .55 && pHealth > pMaxHealth * .20){
      context.fillStyle = "orange";
    }else{
      context.fillStyle = "red";
    }
    context.rect(226,ySpacing + 7,(pHealth * 115)/pMaxHealth,10);
    context.fill();


    //Health Bar Text
    context.fillStyle = "black";
    context.strokeStyle = "black";
    context.fillText(pHealth + "/" + pMaxHealth,400 - context.measureText(pHealth + "/" + pMaxHealth).width,ySpacing + 17);
    //context.strokeText(pHealth + "/" + pMaxHealth,325,ySpacing + 16);
    //context.textAlign = "right";


    ySpacing += 22;
  }
}



function tweetGame(){
  var ySpacing;
  var xSpacing;

  //Background
  context.drawImage(cycleBackground,0,0);
  cycles = 0;
  bossInfo();
  playerInfo();
  drawCycle();

}

//Drawing for Cycle 0
function drawCycle(){
  var fs = require('fs')
  //var out = fs.createWriteStream('./Resources/Images/CycleOutput.png');
  var stream = canvas.pngStream();
  //var dataUrl = stream.pipe(out);


  //Uploading the image to twitter first
  T.post('media/upload',{media_data: canvas.toBuffer().toString('base64')},function(err,data,response){
    //console.log("uploaded");
    var mediaIdStr = data.media_id_string;
    //TODO: Add cycle number to status
    var params = {status: getFormattedTime() + " Game starting in 5 minutes! Cycle #" + cycles, media_ids: [mediaIdStr],in_reply_to_status_id: previousTweetID}

    //upload tweet with new image
    T.post('statuses/update', params, function(err, data, response){
      if(err){
        console.log(err);
      }
    });
  });

}

//Tweet match stuff
function tweetCycle(){
  var bossName = boss.getBossType();
  var bossMinDamage = boss.minDamage;
  var bossMaxDamage = boss.maxDamage;
  var bossHealth = boss.health;
  var bossMaxHealth = boss.maxHealth;
  //var agro = boss.agro;
  var totalDamage = 0;
  totalHealth = 0;
  var ySpacing;
  var xSpacing;


  //Background
  context.drawImage(cycleBackground,0,0);

  //Boss name
  context.fillStyle = "black";
  context.font = "100px Arial";
  context.fillText(bossName.toUpperCase(),(canvas.width/2) - (context.measureText(bossName).width/2),90);

  //Boss info box
  context.fillStyle = "black";
  context.font = "20px Arial";
  context.fillText(bossName.toUpperCase(),450,598);
  context.fillText(bossMaxHealth,485,647);
  context.fillText(bossMinDamage + " HP - " + bossMaxDamage + " HP",565,697);


  //Boss hits
  context.font = "15px Arial";
  ySpacing = 540;
  xSpacing = 100;
  //Boss Hits
  for(var i = 0;i < players.length; i++){
    var attackDamage = Math.floor((Math.random() * (bossMaxDamage - bossMinDamage) + bossMinDamage));
    var info = boss.attack(players[i]);
    //console.log(info);
    if(info == 0){
      context.fillStyle = "black";
      context.fillText(players[i].name + " dodged the attack",xSpacing,ySpacing);
    }else{
      context.fillStyle = "red";
      context.fillText(info + " damage " + players[i].name,xSpacing,ySpacing);
    }
    ySpacing += 22;
  }

  boss.agro();



  ySpacing = 180;
  xSpacing = 90;






  //Player Hits and Heals and inventory
  for(var i = 0;i < players.length; i++){
    var pHealth = players[i].health;
    var pMaxHealth = players[i].maxHealth;
    var inventorySpacingX = 600;
    var itemChance = .20;

    //Item Giving
    if(Math.random() < itemChance && players[i].mode == "normal"){
      players[i].giveItem();
    }


    //Player Actions
    switch(players[i].action){
      case "hit":
        //attackDamage = Math.floor((Math.random() * (maxDamage - minDamage) + minDamage));
        if(players[i].health != 0){
          context.fillStyle = "red";
          context.font = "15px Arial";
          attackDamage = players[i].attack();
          context.fillText(attackDamage + " damage @" + bossName,textWidth - context.measureText(attackDamage + " damage @" + bossName).width,ySpacing + 17);
          totalDamage += attackDamage;
        }else{
          context.fillStyle = "red";
          context.font = "15px Arial";
          context.fillText("0 damage @" + bossName,textWidth - context.measureText("0 damage @" + bossName).width,ySpacing + 17);
        }
        break;
      case "heal":
          context.fillStyle = "green";
          context.font = "15px Arial";

          //Returns [player name,health restored]
          var healInfo = players[i].heal();
          //players[i].target.health += players[i].target.maxHealth * .2;
          context.fillText(healInfo[1] + " HP " +   healInfo[0].substring(0,11),textWidth - context.measureText(healInfo[1] + " HP " +   healInfo[0].substring(0,11)).width,ySpacing + 17);
          removeItem("Health",players[i].inventory);
          players[i].action = "hit";
          players[i].target = "";
        break;
      case "self heal":
        context.fillStyle = "green";
        context.font = "15px Arial";
        var healInfo = players[i].selfHeal();
        context.fillText(healInfo + " HP " + players[i].name.substring(0,11),textWidth - context.measureText(healInfo + " HP " + players[i].name.substring(0,11)).width,ySpacing + 17);

        players[i].action = "hit";
        players[i].target = "";
        break;
      case "armor":
        context.fillStyle = "black";
        context.font = "15px Arial";
        players[i].absorb += .02;
        context.fillText("Dmg Absorption: " + Math.floor(players[i].absorb * 100) + "%",textWidth - context.measureText("Dmg Absorption: " + Math.floor(players[i].absorb * 100) + "%").width,ySpacing + 17);
        removeItem("Armor",players[i].inventory);
        players[i].action = "hit";
        break;
      case "cape":
        context.fillStyle = "black";
        context.font = "15px Arial";
        players[i].dodgeChance += .02;
        context.fillText("Dodge Chance: " + Math.floor(players[i].dodgeChance * 100) + "%",textWidth - context.measureText("Dodge Chance:" + Math.floor(players[i].dodgeChance * 100) + "%").width,ySpacing + 17);
        removeItem("Cape",players[i].inventory);
        players[i].action = "hit";
        break;
      case "damage":
        context.fillStyle = "black";
        context.font = "15px Arial";
        players[i].maxDamage += 5;
        context.fillText("Max Damage: " + players[i].maxDamage,textWidth - context.measureText("Max Damage: " + players[i].maxDamage).width,ySpacing + 17);
        removeItem("Damage",players[i].inventory);
        players[i].action = "hit";
        break;
      case "rage":
        context.fillStyle = "red";
        context.font = "15px Arial";
        players[i].rage();
        attackDamage = players[i].attack();
        players[i].handleRage();
        context.fillText(attackDamage + " damage @" + bossName,textWidth - context.measureText(attackDamage + " damage @" + bossName).width,ySpacing + 17);
        break;
      case "beserk":
        context.fillStyle = "red";
        context.font = "15px Arial";
        players[i].beserk();
        attackDamage = players[i].attack();
        players[i].handleBeserk();
        context.fillText(attackDamage + " damage @" + bossName,textWidth - context.measureText(attackDamage + " damage @" + bossName).width,ySpacing + 17);
        break;
    }
    players[i].handleCharge();





    //Inventory
    for(var j = 0;j < players[i].inventory.length;j++){
      if(players[i].action == "normal"){
        context.fillStyle = "black";
        context.font = "10pt Arial";
      }else{
        context.fillStyle = "red";
        context.font = "10pt Arial";
      }

      context.fillText(players[i].inventory[j].substring(0,1),inventorySpacingX + 3,ySpacing+15);
      context.beginPath();
      context.fillStyle = "black"
      context.rect(inventorySpacingX,ySpacing + 18,15,2);
      context.fill();
      context.closePath();
      inventorySpacingX += 20;
    }


    //Charge
    var chargeSpacingX = 725;
    for(var j = 0;j < players[i].charge;j++){
      context.beginPath();
      context.arc(chargeSpacingX,ySpacing+17,5,0,2*Math.PI);
      context.stroke();
      context.closePath();
      chargeSpacingX += 15;
    }



    switch (players[i].getPlayerType()) {
      case "Mage":
        context.drawImage(mageIcon,xSpacing,ySpacing);
        break;
      case "Archer":
        context.drawImage(archerIcon,xSpacing,ySpacing);
        break;
      case "Knight":
        context.drawImage(knightIcon,xSpacing,ySpacing);
        break;
    }





    //Player name
    context.font = "15px Arial";
    context.fillStyle = "black";
    context.fillText(players[i].name.substring(0,11),115,ySpacing + 15);


    //Player Health bars
    //The pixel space is 115 pixels
    var pHealth = players[i].health;
    var pMaxHealth = players[i].maxHealth;
    context.beginPath();
    context.fillStyle = "black";
    if(players[i].health > pMaxHealth * .55){
      context.fillStyle = "green";
    }else if(pHealth <= pMaxHealth * .55 && pHealth > pMaxHealth * .20){
      context.fillStyle = "orange";
    }else{
      context.fillStyle = "red";
    }

    if(players[i].health == 0){
      players[i].deaths++;
      deads.push(players[i]);
    }

    context.rect(226,ySpacing + 7,(pHealth * 110)/pMaxHealth,10);
    context.fill();


    //Health Bar Text
    context.fillStyle = "black";
    context.strokeStyle = "gray";
    context.fillText(pHealth + "/" + pMaxHealth,400 - context.measureText(pHealth + "/" + pMaxHealth).width,ySpacing + 17);
    //context.strokeText(pHealth + "/" + pMaxHealth,325,ySpacing + 16);
    //context.textAlign = "right";


    totalHealth += players[i].health;
    ySpacing += 22;
  }






  //Boss Health Bar
  if(bossHealth - totalDamage < 0){
    bossHealth = 0;
    gameRunning = false;
  }else{
    bossHealth -= totalDamage;
  }

  boss.health = bossHealth;
  context.beginPath();
  context.fillStyle = "gray";
  context.rect(104,133,(bossHealth * 591)/bossMaxHealth,35);
  context.fill();
  context.closePath();
  //Boss Health Text
  context.fillStyle = "white";
  context.font = "30px Arial";
  context.fillText(bossHealth + "/" + bossMaxHealth,(canvas.width)/2 - (context.measureText(bossHealth + "/" + bossMaxHealth).width/2),160);
  context.strokeStyle = "black";
  context.strokeText(bossHealth + "/" + bossMaxHealth,(canvas.width)/2 - (context.measureText(bossHealth + "/" + bossMaxHealth).width/2),160);



  var fs = require('fs')
  //var out = fs.createWriteStream('./Resources/Output Images/CycleOutput.png');
  var stream = canvas.pngStream();
  //var dataUrl = stream.pipe(out);

  //Uploading the image to twitter first

  T.post('media/upload',{media_data: canvas.toBuffer().toString('base64')},function(err,data,response){
    //console.log("uploaded");
    var mediaIdStr = data.media_id_string;
    //TODO: Add cycle number to status
    var params = {status: getFormattedTime() + " Game Cycle #" + cycles, media_ids: [mediaIdStr],in_reply_to_status_id: previousTweetID}

    //upload tweet with new image
    T.post('statuses/update', params, function(err, data, response){
      if(err){
        console.log(err);
      }else{
        previousTweetID = data.id_str;
      }
    });
  });
}

//Attack Cycle Function
function attackCycle(){
  if(gameRunning){
    cycles++;
    tweetStream.stop();
    console.log("Cycle:" + cycles);
    tweetCycle();

    if(totalHealth != 0 && boss.health != 0){
      cleanPlayerArray();
      tweetStream = T.stream('user');
      tweetStream.on('tweet',tweetEvent);
      setTimeout(attackCycle,60000*cycleTime);
    }else{
      if(totalHealth == 0){
        //Boss won
      }else if(boss.health == 0){
        //Players won
      }else if(boss.health == 0 && totalHealth == 0){
        //Tie
      }
      console.log("Game over");
      gameRunning = false;
      setTimeout(startGame,60000*gameOffTime);
    }
  }else{
    console.log("Game over");
    tweetStream.stop();
    setTimeout(startGame,60000*gameOffTime);
  }
}


//Delete any players who have a health of 0
function cleanPlayerArray(){
  for(var i = 0;i < players.length; i++){
    if(players[i].health == 0){
      players.splice(i,1);
    }
  }
}

//The callback function for when the bot is tweeted at
function tweetEvent(event){
  var receipent = event.in_reply_to_screen_name;
  var message = event.text;
  var user = event.user.screen_name;

  //If the tweet was directed at the bot
  if(receipent == "_SlayerBot_" && user != "_SlayerBot_"){
    console.log("@" + user + "tweeted the bot");
    //Make sure they are joining the game, and haven't already joined
    if((message.toUpperCase().indexOf("#JOINGAME") != -1) && checkPlayerArray(("@" + user),players) && !gameRunning){
      //Add player to list, and give them a class
      var chosenClass = playerClasses[Math.floor(Math.random()*playerClasses.length)];
      //var chosenClass = "Archer";
      var newClass;

      switch (chosenClass) {
        case "Mage":
          newClass= new Mage("@" + user,600);
          break;
        case "Archer":
          newClass = new Archer("@" + user,600);
          break;
        case "Knight":
          newClass = new Knight("@" + user,600);
          break;
      }
      players.push(newClass);
      console.log(newClass.name + " [" + newClass.getPlayerType() + "] joined!");
      if(players.length >= playerLimit){
        console.log("Limit reached");
        tweetStream.stop();
        clearTimeout(waitingTimer);
        intermissionOver();
      }
    //Differentiate between "Heal" and "Health"
    }else if(message.toUpperCase().indexOf("#HEAL") != -1 && gameRunning){
      //Check player array returns true if player is not in game....
      if(!checkPlayerArray(("@" + user),players)){
        var users = event.entities.user_mentions;
        //If there are no user mentions it is a heal item
        if(users.length > 1){
          var target = "@" +users[1].screen_name;
          if(!checkPlayerArray(target,players)){
            var player = getPlayer("@" + user);
            var target = getPlayer(target);
            if(player.name == target.name){
              if(player.getPlayerType() != "Knight"){
                console.log(player.name + " is set to self-heal");
                player.action = "self heal"
                player.target = target;
              }
            }else{
              if(player.getPlayerType() == "Mage" && target != null){
                console.log(player.name + " is set to heal");
                player.action = "heal";
                player.target = target;
              }
            }
          }
        }else{
          var player = getPlayer("@" + user);
          if(player.inventory.indexOf("Health") != -1 && player.action != "heal"){
            console.log(player.name + " is set to use healing item");
            player.action = "heal";
            player.target = player;
          }
        }
      }
    }else if(message.toUpperCase().indexOf("#ARMOR") != -1 && gameRunning){
      if(!checkPlayerArray(("@" + user),players)){
        var player = getPlayer("@" + user);
        if(player.inventory.indexOf("Armor") != -1 && player.action != "armor"){
          console.log(player.name + " is set to use armor item");
          player.action = "armor"
        }
      }
    }else if(message.toUpperCase().indexOf("#CAPE") != -1 && gameRunning){
      if(!checkPlayerArray(("@" + user),players)){
        var player = getPlayer("@" + user);
        if(player.inventory.indexOf("Cape") != -1 && player.action != "cape"){
          console.log(player.name + " is set to use cape item");
          player.action = "cape"
        }
      }
    }else if(message.toUpperCase().indexOf("#DAMAGE") != -1 && gameRunning){
      if(!checkPlayerArray(("@" + user),players)){
        var player = getPlayer("@" + user);
        if(player.inventory.indexOf("Damage") != -1 && player.action != "damage"){
          console.log(player.name + " is set to use damage item");
          player.action = "damage"
        }
      }
    }else if(message.toUpperCase().indexOf("#RAGE") != -1 && gameRunning){
      if(!checkPlayerArray(("@" + user),players)){
        var player = getPlayer("@" + user);
        if(player.cooldown == 4 && player.action != "rage"){
          if(player.getPlayerType() == "Archer"){
            console.log(player.name + " is set to go into rage mode");
            player.action = "rage";
          }
        }
      }
    }else if(message.toUpperCase().indexOf("#BESERK") != -1 && gameRunning){
      if(!checkPlayerArray(("@" + user),players)){
        var player = getPlayer("@" + user);
        if(player.charge == 4 && player.action != "beserk"){
          if(player.getPlayerType() == "Knight"){
            console.log(player.name + " is set to go into beserk mode");
            player.action = "beserk";
          }
        }
      }
    }else if(message.toUpperCase().indexOf("#REVIVE") != -1 && gameRunning){
      if(!checkPlayerArray(("@" + user),players)){
        var player = getPlayer("@" + user);
        if(player.charge == 4 && player.action != "revive"){
          if(player.getPlayerType() == "Mage"){
            if(users.length > 1){
              var player = getPlayer("@" + user);
              var target = getPlayer(target);
              if(target != null){
                //Check "deads" array
              }
            }
          }
        }
      }
    }
  }
}




function removeItem(itemName,inventory){
  var found = false;
  for(var i = 0;i < inventory.length; i++){
    if(!found){
      if(inventory[i] == itemName){
        found = true;
        inventory.push("");
        inventory.splice(i,1);
      }
    }
  }
}

function getPlayer(user){
  for(var i = 0; i < players.length;i++){
    if(players[i].name == user){
      return players[i];
    }
  }
  return null;
}


function randomPlayerMaker(amount){
  for(var i = 0;i < amount;i++){
    var chosenClass = playerClasses[Math.floor(Math.random()*playerClasses.length)];
    var num = Math.floor((Math.random() * 100)+1);
    var health = 600;
    var newClass;

    switch (chosenClass) {
      case "Mage":
        newClass= new Mage("@player" + num,health);
        break;
      case "Archer":
        newClass = new Archer("@player" + num,health);
        break;
      case "Knight":
        newClass = new Knight("@player" + num,health);
        break;
    }
    players.push(newClass);
  }
  //console.log(players.length);
}


function checkPlayerArray(name,array){
  var pass = true;
  for(var i = 0;i < array.length; i++){
    if(players[i].name == name){
      pass = false;
    }
  }
  return pass;
}

//Prints arrays
function printPlayerArray(array){
  for(var i = 0;i < array.length;i++){``
    console.log(array[i].name + "/" + array[i].getPlayerType());
  }
}


function basicTweet(message,reply){
  if(!reply){
    if(message.length < 140){
      T.post('statuses/update',{status: message},function(err,data,response){
        if(!err){
          //console.log(data);
          console.log("Tweet successful");
        }else{
          console.log(err);
        }
      });
    }else{
      console.log("Tweet too long");
    }
  }else{
    if(message.length < 140){
      T.post('statuses/update', {status: message, in_reply_to_status_id: previousTweetID},function(err,data,response){
        if(err){
          console.log(err);
        }
      });
    }
  }
}



startGame();
//boss = new Omega("Omega Giant",players.length * 3500);
//randomPlayerMaker(10);
//tweetGame();

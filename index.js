console.log("Starting");
var Twit = require('twit');
var Canvas = require('canvas');
var config = require('./config')
var Mage = require('./Classes/Mage');
var Knight = require('./Classes/Knight');
var Archer = require('./Classes/Archer');
var Omega = require('./Bosses/Omega');
var path = require('path');
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
var playerLimit = 10;

//In minutes
var waitTime = 5;
var cycleTime = 1;
var gameOffTime = 60;

var random = Math.floor((Math.random() * 1000) + 1);
var waitingTimer;
var imageMessages = [];
var playerClasses = ["Mage","Archer","Knight"];
var boss;
var cycles = 0;
var totalHealth = 0;

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


//Beginning the game
function startGame(){
  //Reset game variables just in case
  players = [];
  imageMessages = [];
  gameRunning = false;
  clearTimeout(waitingTimer);
  if(tweetStream != null)
    tweetStream.stop();


  var currentDate = new Date();
  var currentTime = ("[" + currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds() + "]");
  var status = currentTime + "  You can look at the rules, code, and commands at: https://github.com/SolarFloss/Slayer";

  context.drawImage(startingBackground,0,0);
  context.fillStyle = "black";
  context.font = "30px Arial";
  context.fillText(playerLimit,505,775);
  var fs = require('fs')
  var out = fs.createWriteStream('./Resources/Output Images/StartingOutput.png');
  var stream = canvas.pngStream();
  var dataUrl = stream.pipe(out);


  T.post('media/upload',{media_data: canvas.toBuffer().toString('base64')},function(err,data,response){
    console.log("uploaded");
    var mediaIdStr = data.media_id_string;
    var params = {status: status, media_ids: [mediaIdStr]}

    //upload tweet with new image
    T.post('statuses/update', params, function(err, data, response){
      console.log("Image tweet Succesful");
    });
  });



  //Start listening for users joining the game
  tweetStream = T.stream('user');
  tweetStream.on('tweet',tweetEvent);
  console.log("Waiting for people to join");
  waitingTimer = setTimeout(intermissionOver,60000*waitTime);
}




//When the intermession is over
function intermissionOver(limit){
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
    setTimeout(attackCycle,60000*waitTime);
  }else{
    gameRunning = false;
    T.post('statuses/update', { status: 'Not enough players. Starting again in 60 minutes' }, function(err, data, response) {
       console.log(data)
    })
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
  context.fillText(bossName,(canvas.width/2) - (context.measureText(bossName).width/2),90);

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

    //Player name
    context.font = "15px Arial";
    context.fillStyle = "black";
    context.fillText(players[i].name.substring(0,11),115,ySpacing + 15);


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

function drawCycle(){
  var fs = require('fs')
  var out = fs.createWriteStream('./Resources/Output Images/CycleOutput.png');
  var stream = canvas.pngStream();
  var dataUrl = stream.pipe(out);

  //Uploading the image to twitter first
  T.post('media/upload',{media_data: canvas.toBuffer().toString('base64')},function(err,data,response){
    //console.log("uploaded");
    var mediaIdStr = data.media_id_string;
    //TODO: Add cycle number to status
    var params = {status: "Game starting in 5 minutes! Cycle #" + cycles, media_ids: [mediaIdStr]}

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
  var agro = boss.agro;
  var totalDamage = 0;
  totalHealth = 0;
  var ySpacing;
  var xSpacing;


  //Background
  context.drawImage(cycleBackground,0,0);

  //Boss name
  context.fillStyle = "black";
  context.font = "100px Arial";
  context.fillText(bossName,(canvas.width/2) - (context.measureText(bossName).width/2),90);

  //Boss info box
  context.fillStyle = "black";
  context.font = "20px Arial";
  context.fillText(bossName,450,598);
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



  ySpacing = 180;
  xSpacing = 90;






  //Player Hits and Heals and inventory
  for(var i = 0;i < players.length; i++){
    var pHealth = players[i].health;
    var pMaxHealth = players[i].maxHealth;
    var inventorySpacingX = 600;
    var itemChance = .50;

    //Item Giving
    if(Math.random() < itemChance){
      players[i].giveItem();
    }

    switch(players[i].action){
      case "hit":
        //attackDamage = Math.floor((Math.random() * (maxDamage - minDamage) + minDamage));
        if(players[i].health != 0){
          context.fillStyle = "red";
          context.font = "15px Arial";
          attackDamage = players[i].attack();
          context.fillText(attackDamage + " damage @" + bossName,565 - context.measureText(attackDamage + " damage @" + bossName).width,ySpacing + 17);
          totalDamage += attackDamage;
        }else{
          context.fillStyle = "red";
          context.font = "15px Arial";
          context.fillText("0 damage @" + bossName,565 - context.measureText("0 damage @" + bossName).width,ySpacing + 17);
        }
        break;
      case "heal":
          context.fillStyle = "green";
          context.font = "15px Arial";

          //Returns [player name,health restored]
          var healInfo = players[i].heal();
          //players[i].target.health += players[i].target.maxHealth * .2;
          context.fillText(healInfo[1] + " HP " +   healInfo[0].substring(0,11),565 - context.measureText(healInfo[1] + " HP " +   healInfo[0].substring(0,11)).width,ySpacing + 17);

          players[i].action = "hit";
          players[i].target = "";
        break;
      case "self heal":
        context.fillStyle = "green";
        context.font = "15px Arial";
        var healthInfo = players[i].selfHeal();
        context.fillText(healInfo + " HP " + players[i].name.substring(0,11),565 - context.measureText(healInfo + " HP " + players[i].name.substring(0,11)).width,ySpacing + 17);

        players[i].action = "hit";
        players[i].target = "";
        break;
      case "armor":
        context.fillStyle = "black";
        context.font = "15px Arial";
        players[i].absorb += .02;
        context.fillText("Dmg Absorption: " + players[i].absorb * 100 + "%",565 - context.measureText("Dmg Absorption: " + players[i].absorb + "%").width,ySpacing + 17);
        players[i].action = "hit";
        break;
      case "cape":
        context.fillStyle = "black";
        context.font = "15px Arial";
        players[i].dodgeChance += .02;
        context.fillText("Dodge Chance: " + players[i].dodgeChance * 100 + "%",565 - context.measureText("Dodge Chance:" + players[i].dodgeChance + "%").width,ySpacing + 17);
        players[i].action = "hit";
        break;
      case "damage":
        context.fillStyle = "black";
        context.font = "15px Arial";
        players[i].maxDamage += 5;
        context.fillText("Max Damage: " + players[i].maxDamage,565 - context.measureText("Max Damage: " + players[i].maxDamage).width,ySpacing + 17);
        players[i].action = "hit";
        break;
    }


    totalHealth += players[i].health;


    //Inventory
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
    //The pixel space is 120 pixels
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
    context.rect(226,ySpacing + 7,(pHealth * 120)/pMaxHealth,10);
    context.fill();


    //Health Bar Text
    context.fillStyle = "black";
    context.strokeStyle = "black";
    context.fillText(pHealth + "/" + pMaxHealth,400 - context.measureText(pHealth + "/" + pMaxHealth).width,ySpacing + 17);
    //context.strokeText(pHealth + "/" + pMaxHealth,325,ySpacing + 16);
    //context.textAlign = "right";


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
  var out = fs.createWriteStream('./Resources/Output Images/CycleOutput.png');
  var stream = canvas.pngStream();
  var dataUrl = stream.pipe(out);

  //Uploading the image to twitter first

  T.post('media/upload',{media_data: canvas.toBuffer().toString('base64')},function(err,data,response){
    //console.log("uploaded");
    var mediaIdStr = data.media_id_string;
    //TODO: Add cycle number to status
    var params = {status: "Test game with fake players. Cycle #" + cycles, media_ids: [mediaIdStr]}

    //upload tweet with new image
    T.post('statuses/update', params, function(err, data, response){
      if(err){
        console.log(err);
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
      setTimeout(attackCycle,60000*cycleTime);
      tweetStream = T.stream('user');
      tweetStream.on('tweet',tweetEvent);
    }else{
      gameRunning = false;
      setTimeout(startGame,60000*gameOffTime);
    }
  }else{
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
  if(receipent == "_SlayerBot_"){
    //Make sure they are joining the game, and haven't already joined
    if((message.toUpperCase().indexOf("#JOINGAME") != -1) && checkPlayerArray("@" + user) && !gameRunning){
      //Add player to list, and give them a class
      var chosenClass = playerClasses[Math.floor(Math.random()*playerClasses.length)];
      //var chosenClass = "Mage";
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
        intermissionOver(true);
      }
    //Differentiate between "Heal" and "Health"
    }else if(message.toUpperCase().indexOf("#HEAL") != -1 && gameRunning){
      //Check player array returns true if player is not in game....
      if(!checkPlayerArray("@" + user)){
        var users = event.entities.user_mentions;
        if(users.length > 1){
          var target = "@" +users[1].screen_name;
          if(!checkPlayerArray(target)){
            var player = getPlayer("@" + user);
            var target = getPlayer(target);
            if(player.name == target.name){
              if(player.getPlayerType() != "Knight"){
                player.action = "self heal"
                player.target = target;
              }
            }else{
              if(player.getPlayerType() == "Mage"){
                player.action = "heal";
                player.target = target;
              }
            }
          }
        }else{
          var player = getPlayer("@" + user);
          if(player.inventory.indexOf("Health") != -1 && player.action != "heal"){
            player.action = "heal";
            player.target = player;
            var found = false;
            for(var i = 0; i < player.inventory.length;i++){
              if(player.inventory[i] == "Health" && !found){
                found = true;
                player.inventory.push("");
                player.inventory.splice(i,1);
              }
            }
          }
        }
      }
    }else if(message.toUpperCase().indexOf("#ARMOR") != -1 && gameRunning){
      if(!checkPlayerArray("@" + user)){
        var player = getPlayer("@" + user);
        if(player.inventory.indexOf("Armor") != -1 && player.action != "armor"){
          player.action = "armor"
          var found = false;
          for(var i = 0; i < player.inventory.length;i++){
            if(player.inventory[i] == "Armor" && !found){
              found = true;
              player.inventory.push("");
              player.inventory.splice(i,1);
            }
          }
        }
      }
    }else if(message.toUpperCase().indexOf("#CAPE") != -1 && gameRunning){
      if(!checkPlayerArray("@" + user)){
        var player = getPlayer("@" + user);
        if(player.inventory.indexOf("Cape") != -1 && player.action != "cape"){
          var found = false;
          player.action = "cape"
          for(var i = 0; i < player.inventory.length;i++){
            if(player.inventory[i] == "Cape" && !found){
              player.inventory.push("");
              player.inventory.splice(i,1);
            }
          }
        }
      }
    }else if(message.toUpperCase().indexOf("#DAMAGE") != -1 && gameRunning){
      if(!checkPlayerArray("@" + user)){
        var player = getPlayer("@" + user);
        if(player.inventory.indexOf("Damage") != -1 && player.action != "damage"){
          player.action = "damage"
          for(var i = 0; i < player.inventory.length;i++){
            if(player.inventory[i] == "Damage" && !found){
              found = true;
              player.inventory.push("");
              player.inventory.splice(i,1);
            }
          }
        }
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


function checkPlayerArray(name){
  var pass = true;
  for(var i = 0;i < players.length; i++){
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


function basicTweet(message){
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
}




startGame();
//boss = new Omega("Omega Giant",players.length * 3500);
//tweetGame();

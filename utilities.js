//To clear up some space in index file
//Put utilty functions that are called often in here
var exports = module.exports = {};


exports.checkPlayerArray = function(name,array){
  var pass = true;
  for(var i = 0;i < array.length; i++){
    if(players[i].name == name){
      pass = false;
    }
  }
  return pass;
}

exports.printPlayerArray = function(array){
  for(var i = 0;i < array.length;i++){``
    console.log(array[i].name + "/" + array[i].getPlayerType());
  }
}

exports.getPlayer = function(user,array){
  for(var i = 0; i < players.length;i++){
    if(players[i].name == user){
      return players[i];
    }
  }
  return null;
}

exports.removeItem = function(inventory){
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

exports.randomPlayerMaker = function(amount){
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

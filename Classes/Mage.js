var utils = require('../utilities');

class Mage{
  constructor(name,h){
    this.health = h;
    this.maxHealth = h;
    this.name = name;
    this.action = "hit";
    this.minDamage = 90;
    this.maxDamage = 220;
    this.inventory = ["","","",""];
    this.dodgeChance = .01;
    this.absorb = 0;
    this.items = ["Armor","Health","Cape","Damage"];
    this.target = "";
    this.mode = "normal";
    this.cooldown = 0;
    this.charging = false;
    this.charge = 4;
    this.deaths = 0;
  }

  handleCharge(){
    if(this.charging){
      this.charge++;
    }

    if(this.charge == 4){
      this.charging = false;
    }
  }

  attack(){
    var attackDamage = Math.floor((Math.random() * (this.maxDamage - this.minDamage) + this.minDamage));
    return attackDamage;
  }

  attacked(damage){
    //In case the damage needs to be edited
    var fDamage = damage - Math.floor(damage * this.absorb);
    if(Math.random() > this.dodgeChance){
      if(this.health - fDamage > 0){
        this.health -= fDamage;
      }else{
        //console.log(this.name + " is dead");
        //utils.removeFromArray(this.name,);
        this.health = 0;
      }
    }else{
      return 0;
    }
    return fDamage;
  }

  giveItem(){
    this.inventory.unshift(this.items[Math.floor(Math.random()*this.items.length)]);
    this.inventory.pop();
  }

  heal(){
    var num = Math.floor(this.target.maxHealth * .2);
    if(this.target.health + num < this.maxHealth){
      this.target.health += num;
      return [this.target.name,num];
    }else{
      this.target.health = this.maxHealth;
      return [this.target.name,num];
    }
  }

  selfHeal(){
    var num = Math.floor(this.target.maxHealth * .3);
    if(this.health + num < this.maxHealth){
      this.health += num;
      return num;
    }else{
      this.health = this.maxHealth;
      return num;
    }
  }

  revive(players,deadArray){
    console.log("getting player");
    var player = utils.getPlayer(this.target,deadArray);
    if(player != null){
      player.health = player.maxHealth / 2;
      players.push(player);
      utils.removeFromArray(player.name,deadArray);
      this.charging = true;
      this.charge = 0;
    }else{
      console.log("player not dead");
    }
  }



  getPlayerType(){
    return "Mage";
  }
}


module.exports = Mage;

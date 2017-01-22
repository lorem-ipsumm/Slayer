class Nexus{
  constructor(name,health){
    this.name = name;
    this.agro = 20;
    this.maxHealth = health;
    this.health = health;
    this.minDamage = 0;
    this.maxDamage = 50;
    this.critChance = .05;
  }

  attack(player){
    //Loop through table and "attack" each player
    //Range is Math.floor(Math.random()*(max-min+1)+min)
    var max = this.maxDamage;
    var min = this.minDamage;

    if(Math.random() > this.critChance){
      player.attacked(Math.floor(Math.random()*(max-min+1)+min));
    }else{
      player.attacked(Math.floor(Math.random()*((max * 2)-(min+1))+min));
    }
  }

  getBossType(){
    return "Nexus";
  }
}


module.exports = Nexus;

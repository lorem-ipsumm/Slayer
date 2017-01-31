class Nexus{
  constructor(name,health){
    this.name = name;
    this.agro = 20;
    this.maxHealth = health;
    this.health = health;
    this.minDamage = 0;
    this.maxDamage = 70;
    this.critChance = .05;
    this.count = 0;
  }

  attack(player){
    //Loop through table and "attack" each player
    //Range is Math.floor(Math.random()*(max-min+1)+min)
    var max = this.maxDamage;
    var min = this.minDamage;
    var info;

    if(Math.random() > this.critChance){
      //Info returns how much damage the player actually took from the attack
      info = player.attacked(Math.floor(Math.random()*(max-min+1)+min));
    }else{
      info = player.attacked(Math.floor(Math.random()*((max * 2)-(min+1))+min));
    }

    if(this.count >= 20){
      this.maxDamage += 5;
    }



    this.count += 1;
    return info;
  }

  agro(){
    this.count += 1;
    if(this.count >= 20){
      this.maxDamage += 5;
    }
  }

  getBossType(){
    return "Nexus";
  }
}


module.exports = Nexus;

class Archer{
  constructor(name,h){
    this.health = h;
    this.maxHealth = h;
    this.name = name;
    this.action = "hit";
    this.minDamage = 50;
    this.maxDamage = 120;
    this.inventory = ["","","",""];
    this.dodgeChance = .1;
    this.absorb = 0;
    this.items = ["Armor","Health","Cape","Damage"];
    this.target = "";
    this.mode = "normal";
    this.cooldown = 0;
  }

  attack(){
    var attackDamage = Math.floor((Math.random() * (this.maxDamage - this.minDamage) + this.minDamage));

    return attackDamage;
  }

  attacked(damage){
    //In case the damage needs to be edited
    var fDamage = damage;
    if(Math.random() > this.dodgeChance){
      if(this.health - fDamage > 0){
        fDamage = damage - Math.floor(damage * this.absorb);
        this.health -= fDamage;
      }else{
        this.health = 0;
      }
    }else{
      return 0;
    }
    return fDamage;
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
    var num = Math.floor(this.target.maxHealth * .2);
    if(this.health + num < this.maxHealth){
      this.health += num;
      return num;
    }else{
      this.health = this.maxHealth;
      return num;
    }
  }

  cooldown(){

  }

  handleRage(){
    if(this.cooldown < 4){
      this.inventory[this.cooldown] = "";
    }
    this.cooldown -= 1;
    if(this.cooldown < 0){
      this.action = "hit";
      this.inventory = ["","","",""];
      this.maxDamage -= 100;
      this.dodgeChance -= .1;
      this.cooldown = 0;
      this.mode = "normal";
      console.log("rage over");
    }
  }


  rage(){
    this.inventory = ["R","A","G","E"];
    this.maxDamage += 100;
    this.dodgeChance += .1;
    this.cooldown = 5;
    this.mode = "rage";
  }

  giveItem(){
    this.inventory.unshift(this.items[Math.floor(Math.random()*this.items.length)]);
    this.inventory.pop();
  }

  getPlayerType(){
    return "Archer";
  }
}


module.exports = Archer;

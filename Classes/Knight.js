class Knight{
  constructor(name,h){
    this.health = h;
    this.maxHealth = h;
    this.name = name;
    this.action = "hit";
    this.minDamage = 70;
    this.maxDamage = 170;
    this.inventory = ["","","",""];
    this.dodgeChance = .03;
    this.absorb = .20;
    this.items = ["Armor","Health","Cape","Damage"];
    this.target = "";
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

  giveItem(){
    this.inventory.unshift(this.items[Math.floor(Math.random()*this.items.length)]);
    this.inventory.pop();
  }

  getPlayerType(){
    return "Knight";
  }
}


module.exports = Knight;

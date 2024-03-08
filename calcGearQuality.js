'use strict'
module.exports = (units, totalGp)=>{
  try{
    const tempUnits = units.filter(x=>x.currentTier > 11)
    let count = +tempUnits.length, relic = 0
    if(count > 0){
      let i = tempUnits.length
      while(i--){
        if(tempUnits[i].relic.currentTier > 1) relic += 1 + ((tempUnits[i].relic.currentTier - 2) * 0.2)
      }
    }
    return +(Math.round((count + relic) / (totalGp / 100000)  * 10000) / 10000).toFixed(2)
  }catch(e){
    throw(e);
  }
}

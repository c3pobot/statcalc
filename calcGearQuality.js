'use strict'
module.exports = (units, totalGp)=>{
  try{
    let count = 0
    let relic = 0
    const tempUnits = units.filter(x=>x.currentTier > 11)
    if(tempUnits.length > 0){
      count = +tempUnits.length
      for(let u in tempUnits){
        if(tempUnits[u].relic.currentTier > 1) relic += 1 + ((tempUnits[u].relic.currentTier - 2) * 0.2)
      }
    }
    return +(Math.round((count + relic) / (totalGp / 100000)  * 10000) / 10000).toFixed(2)
  }catch(e){
    console.error(e);
  }
}

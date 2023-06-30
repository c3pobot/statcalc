'use strict'
const sorter = require('json-array-sorter')
module.exports = (units, num) =>{
  try{
    let count = 0
    let tempGp = 0
    const sortedUnits = sorter([{column: 'gp', order: 'descending'}], units)
    let tempUnits = sortedUnits
    if(sortedUnits.length > num) tempUnits = sortedUnits.slice(0, num)
    for(let u in tempUnits){
      for(let m in tempUnits[u].equippedStatMod){
        count += +tempUnits[u].equippedStatMod[m].secondaryStat.filter(x=>x.stat.unitStatId == 5 && x.stat.statValueDecimal > 140000).length
      }
      tempGp += +tempUnits[u].gp
    }
    return +(Math.round((count / (+tempGp / 100000)) * 10000) / 10000).toFixed(2)
  }catch(e){
    console.error(e);
  }
}

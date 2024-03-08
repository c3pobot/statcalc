function mapStats(stats, gameData = {}){
  let res = {}, modStatId = {21: 14, 22: 15, 35: 39, 36: 40}
  //i is base/mods/final etc
  for(let i in stats){

    if(i === 'growthModifiers') continue
    //s is statId
    for(let s in stats[i]){
      if(!stats[i][s]) continue
      let statId = s
      if(i === 'mods' && modStatId[s]) statId = modStatId[s]
      let statMap = gameData.statDefMap[statId]
      if(!res[statId]) res[statId] = { id: +statId, nameKey: statMap.nameKey, pct: statMap.pct,  base: 0, crew: 0, mods: 0, final: 0 }
      let stat = stats[i][s]
      if(statMap.pct) stat = stat * 100
      res[statId][i] = stat
    }
  }
  return res
}
module.exports = mapStats

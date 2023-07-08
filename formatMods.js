'use strict'
function updateCounts(value, dataCount = {}){
  if(value >= 25 ){
     ++dataCount.mod['25']
  }
  if(value >= 20 && value < 25 ){
     ++dataCount.mod['20']
   }
  if(value >= 15 && value < 20 ){
     ++dataCount.mod['15']
   }
  if(value >= 10 && value < 15 ){
     ++dataCount.mod['10']
   }
}
function formatSecondaryStat(mods = [], dataCount = {}, statMap){

  if(mods?.length === 0) return
  let res = [], i = 0, len = mods.length
  while(i < len){
    let mod = {
      statId: mods[i].stat.unitStatId,
      rolls: mods[i].statRolls
    }
    mod.pct = statMap[mod.statId].pct
    if(mod.pct){
      mod.value = +(+mods[i].stat.unscaledDecimalValue / 1000000).toFixed(2)
    }else{
      mod.value = Math.floor(+mods[i].stat.unscaledDecimalValue / 100000000)
    }
    mod.statName = statMap[mod.statId].nameKey
    if(mod.statId === 5) updateCounts(mod.value, dataCount)
    res.push(mod)
    ++i
  }
  return res
}
function formatMods(mods, dataCount = {}, gameData = {}){
  if(!mods || mods.length === 0) return
  let statMap = gameData.statDefMap
  let res = {}, len = mods.length, i = 0
  while(i < len){
    let mod = JSON.parse(JSON.stringify(gameData.modDefMap[mods[i].definitionId]))
    mod.statId = mods[i].primaryStat.stat.unitStatId
    mod.level = mods[i].level
    mod.tier = mods[i].tier
    mod.pct = statMap[mod.statId].pct
    mod.statName = statMap[mod.statId].nameKey
    if(mod.pct){
      mod.value = +(+mods[i].primaryStat.stat.unscaledDecimalValue / 1000000).toFixed(2)
    }else{
      mod.value = Math.floor(+mods[i].primaryStat.stat.unscaledDecimalValue / 100000000)
    }
    mod.secondaryStat = formatSecondaryStat(mods[i].secondaryStat, dataCount, statMap)
    res[mod.slot] = mod
    if(mod.rarity === 6){
      ++dataCount.mod.r6
    }
    ++i
  }
  return res
}
module.exports = formatMods

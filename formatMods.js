'use strict'
function updateCounts(value, dataCount = {}){
  if(value >= 25 ) dataCount.mod['25']++
  if(value >= 20 && value < 25 ) dataCount.mod['20']++
  if(value >= 15 && value < 20 ) dataCount.mod['15']++
  if(value >= 10 && value < 15 ) dataCount.mod['10']++
}
function formatSecondaryStat(mods = [], dataCount = {}, statMap){
  let res = []
  if(mods?.length === 0) return
  for(let i in mods){
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
  }
  return res
}
function formatMods(mods, dataCount = {}, gameData = {}){
  if(!mods || mods.length === 0) return mods
  let statMap = gameData.statDefMap
  let res = {}
  for(let i in mods){
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
    if(mod.rarity === 6) dataCount.mod.r6++
  }
  return res
}
module.exports = formatMods

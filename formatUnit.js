const formatMods = require('./formatMods')
function formatUnit(defID, data = {}, dataCount = {}, gameData = {}){
  let unit = JSON.parse(JSON.stringify(gameData.unitDefMap[ defID ]))
  unit.growthModifiers = data.growthModifiers
  unit.stats = data.stats
  unit.gp = data.gp
  unit.rarity = data.unit.currentRarity
  unit.level = data.unit.level
  if(unit.combatType === 1) unit.mods = data.mods
  for(let i in data.skills){
    let s = data.skills[i]
    if(!unit.skill[s.id]) continue;
    unit.skill[s.id].tier = s.tier
    if(unit.combatType === 2) continue;
    if(unit.skill[s.id].isZeta && +s.tier >= unit.skill[s.id].zetaTier) dataCount.zetaCount++
    if(unit.skill[s.id].isOmi && s.tier >= unit.skill[s.id].omiTier){
      if(dataCount.omiCount[unit.skill[s.id].omicronType] >= 0) dataCount.omiCount[unit.skill[s.id].omicronType]++
      dataCount.omiCount.total++
    }
  }
  if(unit.combatType === 1 && data.mods){
    if(data.unit.equippedStatMod) unit.mods = formatMods(data.unit.equippedStatMod, dataCount, gameData)
    unit.relicTier = data.unit.relic.currentTier
    unit.gearTier = data.unit.currentTier
  }
  return unit
}
module.exports = formatUnit

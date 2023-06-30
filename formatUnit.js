const formatMods = require('./formatMods')
function formatUnit(defID, data = {}, dataCount = {}, gameData = {}){
  let unit = JSON.parse(JSON.stringify(gameData.unitDefMap[ defID ]))

  unit.gp = data.gp
  unit.rarity = data.unit.currentRarity
  unit.level = data.unit.level

  if(unit.combatType === 1){
    unit.zetaCount = 0
    unit.omiCount = 0
    if(data.unit.equippedStatMod) unit.mods = formatMods(data.unit.equippedStatMod, dataCount, gameData)
    if(data.unit.relic.currentTier > 1){
      unit.relicTier = data.unit.relic.currentTier - 2
    }else{
      unit.relicTier = 0
    }
    unit.gearTier = data.unit.currentTier
  }
  unit.sort = (unit.gearTier || 0) + (unit.relicTier || 0) + ((unit.gp || 0) / 100000000)
  unit.stats = data.stats
  unit.growthModifiers = data.growthModifiers

  for(let i in data.skills){
    let s = data.skills[i]
    if(!unit.skill[s.id]) continue;
    unit.skill[s.id].tier = s.tier
    if(unit.combatType === 2) continue;
    if(unit.skill[s.id].isZeta && +s.tier >= unit.skill[s.id].zetaTier){
      dataCount.zetaCount++
      unit.zetaCount++
    }
    if(unit.skill[s.id].isOmi && s.tier >= unit.skill[s.id].omiTier){
      if(dataCount.omiCount[unit.skill[s.id].omicronType] >= 0) dataCount.omiCount[unit.skill[s.id].omicronType]++
      dataCount.omiCount.total++
      unit.omiCount++
    }
  }

  return unit
}
module.exports = formatUnit

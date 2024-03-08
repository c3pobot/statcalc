const formatMods = require('./formatMods')
const deepCopy = require('./deepCopy')

function formatUnit(defID, data = {}, dataCount = {}, gameData = {}){
  let unit = deepCopy(gameData.unitDefMap[ defID ])

  unit.gp = data.gp
  unit.rarity = data.unit.currentRarity
  unit.level = data.unit.currentLevel

  //if(!dataCount.rarity[unit.combatType][unit.rarity]) dataCount.rarity[unit.combatType][unit.rarity] = 0
  ++dataCount.rarity[unit.combatType][unit.rarity]
  ++dataCount.rarity[unit.combatType].total

  if(unit.combatType === 1){
    unit.equipment = data.unit.equipment
    unit.zetaCount = 0
    unit.omiCount = 0
    if(data.unit.equippedStatMod) unit.mods = formatMods(data.unit.equippedStatMod, dataCount, gameData)
    if(data.unit.relic.currentTier > 1){
      unit.relicTier = data.unit.relic.currentTier - 2
      if(unit.relicTier > 0){
        //if(!dataCount.relic[unit.relicTier]) dataCount.relic[unit.relicTier] = 0
        ++dataCount.relic[unit.relicTier]
        ++dataCount.relic.total
      }
    }else{
      unit.relicTier = 0
    }

    unit.gearTier = data.unit.currentTier
    //if(!dataCount.gear[unit.gearTier]) dataCount.gear[unit.gearTier] = 0
    ++dataCount.gear[unit.gearTier]
  }
  unit.sort = (unit.gearTier || 0) + (unit.relicTier || 0) + ((unit.gp || 0) / 100000000)
  unit.stats = data.stats
  unit.growthModifiers = data.growthModifiers
  
  let i = data.skills.length
  while(i--){
    let s = data.skills[i]
    unit.skill[s.id].tier = s.tier
    if(unit.combatType === 2) continue;
    if(unit.skill[s.id].isZeta && +s.tier >= unit.skill[s.id].zetaTier){
      ++dataCount.zeta
      ++unit.zetaCount
    }
    if(unit.skill[s.id].isOmi && s.tier >= unit.skill[s.id].omiTier){
      //if(!dataCount.omi[unit.skill[s.id].omicronType]) dataCount.omi[unit.skill[s.id].omicronType] = 0
      ++dataCount.omi[unit.skill[s.id].omicronType]
      ++dataCount.omi.total
      ++unit.omiCount
    }
  }

  return unit
}
module.exports = formatUnit

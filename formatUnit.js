function formatUnit(defID, data = {}, gameData = {}){
  let res = {zetaCount: 0, omiCount: {total: 0, tb: 0, tw: 0, ga: 0, cq: 0, raid: 0}}
  let unit = JSON.parse(JSON.stringify(gameData.unitDefMap[ defID ]))
  unit.growthModifiers = data.growthModifiers
  unit.stats = data.stats
  unit.gp = data.gp
  if(unit.combatType === 1) unit.mods = data.mods
  for(let i in data.skills){
    let s = data.skills[i]
    if(!unit.skill[s.id]) continue;
    unit.skill[s.id].tier = s.tier
    if(unit.combatType === 2) continue;
    if(unit.skill[s.id].isZeta && +s.tier >= unit.skill[s.id].zetaTier) res.zetaCount++
    if(unit.skill[s.id].isOmi && s.tier >= unit.skill[s.id].omiTier){
      if(res.omiCount[unit.skill[s.id].omicronType] >= 0) res.omiCount[unit.skill[s.id].omicronType]++
      res.omiCount.total++
    }
  }
  res.unit = unit
  return res
}
module.exports = formatUnit

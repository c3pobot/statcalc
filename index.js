'use strict'

let unitData, modSetData, gearData, crTables, gpTables, relicData, unitDefMap, statDefMap, modDefMap;
const DEFAULT_MOD_TIER = 5;
const DEFAULT_MOD_LEVEL = 15;
const DEFAULT_MOD_PIPS = 6;
const formatUnit = require('./formatUnit')
const mapStats = require('./mapStats')
const calcGearQuality = require('./calcGearQuality')
const calcModQuality = require('./calcModQuality')
function setGameData(gameData = {}){
  try{
    if(gameData?.unitData){
      unitData = gameData.unitData;
      gearData = gameData.gearData;
      modSetData = gameData.modSetData;
      crTables = gameData.crTables;
      gpTables = gameData.gpTables;
      relicData = gameData.relicData;
      unitDefMap = gameData.unitDefMap;
      statDefMap = gameData.statDefMap;
      modDefMap = gameData.modDefMap;
    }
    if(unitData) return true
  }catch(e){
    throw(e);
  }
}

function calcRosterStats(units = []) {
  try{
    let returnUnits = {}, totalGp = 0
    let dataCount = { mod: { r6: 0, 10: 0, 15: 0, 20: 0, 25: 0 }, gl: { total: 0 }, zeta: 0 }
    dataCount.relic = { total: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }
    dataCount.omi = { total: 0, tw: 0, ga: 0, raid: 0, tb: 0, cq: 0}
    dataCount.gear = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 }
    dataCount.rarity = { 1: {total: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }, 2: {total: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 } }
    let ships = [], crew = {};
    // get character stats
    let i = units.length
    while(i--){
      let unit = units[i]
      let defID = unit.defId || unit.definitionId.split(':')[0];
      if (!unit || !unitData[defID] || !unitDefMap[ defID ]) return;
      if (unitData[ defID ].combatType == 2) { // is ship
        unit.combatType = 2
        ships.push( unit );
      } else { // is character

        crew[ defID ] = unit; // add to crew list to find quickly for ships
         let unitStats = calcCharStats(unit);
         if(!unitStats) return
         let tempUnit = formatUnit(defID, unitStats, dataCount, { unitDefMap: unitDefMap, statDefMap: statDefMap, modDefMap: modDefMap })
         if(!tempUnit) return
         if(tempUnit.isGL){
           if(!dataCount.gl[tempUnit.baseId]) dataCount.gl[tempUnit.baseId] = 0,
           ++dataCount.gl[tempUnit.baseId]
           ++dataCount.gl.total
         }
         //sixModCount += tempUnit.sixModCount
         returnUnits [ defID ] = tempUnit
         unit.combatType = 1
         unit.gp = tempUnit.gp
         unit.baseId = defID
         unit.alignment = tempUnit.alignment
         unit.sort = tempUnit.sort
         totalGp += tempUnit.gp
         if(unit.purchasedAbilityId?.length === 0) delete returnUnits [ defID ].ultimate
      }
    };

    // get ship stats
    let s = ships.length
    while(s--){
      let ship = ships[s]
      let defID = ship.defId || ship.definitionId.split(':')[0];
      if (!ship || !unitData[defID] || !unitDefMap[ defID ]) return;
      let crw = unitData[ defID ].crew.map(id => crew[id])
      let unitStats = calcShipStats(ship, crw);
      if(!unitStats) return
      let tempUnit = formatUnit(defID, unitStats, dataCount, {unitDefMap: unitDefMap})
      if(!tempUnit) return
      returnUnits [ defID ] = tempUnit
      ships[s].stats = ship.stats
      ships[s].gp = tempUnit.gp
      ships[s].baseId = defID
      ships[s].alignment = tempUnit.alignment
      ships[s].sort = tempUnit.sort
      ships[s].combatType = 2
      totalGp += tempUnit.gp
    }
    let quality = {}
    quality.mods = calcModQuality(units.filter(x=>x.combatType === 1), 999)
    quality.top = calcModQuality(units.filter(x=>x.combatType === 1), 80)
    quality.gear = calcGearQuality(units.filter(x=>x.combatType === 1), totalGp)
    quality.total = +(quality.gear + quality.mods).toFixed(2)
    dataCount.quality = quality
    return { summary: dataCount, roster: returnUnits }
  }catch(e){
    throw(e)
  }
}


function calcCharStats(unit) {
  try{
    let char = useValuesChar(unit);

    let stats = {}, res = {};
    stats = getCharRawStats(char);
    stats = calculateBaseStats(stats, char.level, char.defId);
    stats.mods = calculateModStats(stats.base, char)
    stats = formatStats(stats, char.level);
    unit.stats = stats
    res.stats = mapStats(stats, {statDefMap: statDefMap});
    res.gp = calcCharGP(char);
    res.growthModifiers = stats.growthModifiers
    res.skills = char.skills
    res.unit = unit
    return res
  }catch(e){
    throw(e)
  }
}

function calcShipStats(unit, crewMember) {
  try{
    let {ship, crew} = useValuesShip(unit, crewMember);
    let stats = {}, res = {};
    stats = getShipRawStats(ship, crew);
    stats = calculateBaseStats(stats, ship.level, ship.defId);
    stats = formatStats(stats, ship.level, { percentVals: true, gameStyle: true });
    unit.stats = stats
    res.stats = mapStats(stats, {statDefMap: statDefMap})
    res.gp = calcShipGP(ship, crew);
    res.growthModifiers = stats.growthModifiers
    res.skills = ship.skills
    res.unit = unit
    return res
  }catch(e){
    throw(e)
  }
}

function getCharRawStats(char) {
  try{
    const stats = {
      base: Object.assign({}, unitData[char.defId].gearLvl[char.gear].stats ),
      growthModifiers: Object.assign({}, unitData[char.defId].growthModifiers[char.rarity] ),
      gear: {}
    };
    // calculate stats from current gear:
    let g = char.equipped.length
    while(g--){
      let gearID;
      if (!stats.gear || !gearData[ gearID = char.equipped[g].equipmentId ]) { return; } // Unknown gear -- no stats
      const gearStats = gearData[ gearID ].stats;
      for (var statID in gearStats) {
        if (statID == 2 || statID == 3 || statID == 4) {
          // Primary Stat, applies before mods
          stats.base[ statID ] += gearStats[ statID ];
        } else {
          // Secondary Stat, applies after mods
          stats.gear[ statID ] = (stats.gear[ statID ] || 0) + gearStats[ statID ];
        }
      }
    }
    if (char.relic && char.relic.currentTier > 2) {
      // calculate stats from relics
      let relic = relicData[ unitData[char.defId].relic[ char.relic.currentTier ] ];
      for (var statID in relic.stats) {
        stats.base[ statID ] = (stats.base[ statID ] || 0) + relic.stats[ statID ];
      }
      for (var statID in relic.gms) {
        stats.growthModifiers[ statID ] += relic.gms[ statID ];
      }
    }
    return stats;
  }catch(e){
    throw(e)
  }
}
function getShipRawStats(ship, crew) {
  try{
    // ensure crew is the correct crew
    if (crew.length != unitData[ship.defId].crew.length)
      throw new Error(`Incorrect number of crew members for ship ${ship.defId}.`);
    let c = crew.length
    while(c--){
      if ( !unitData[ship.defId].crew.includes(crew[c].defId) )
        throw new Error(`Unit ${crew[c].defId} is not in ${ship.defId}'s crew.`);
    }
    // if still here, crew is good -- go ahead and determine stats
    const crewRating = crew.length == 0 ? getCrewlessCrewRating(ship) : getCrewRating(crew);
    const stats = {
      base: Object.assign({}, unitData[ship.defId].stats),
      crew: {},
      growthModifiers: Object.assign({}, unitData[ship.defId].growthModifiers[ship.rarity] )
    };
    let statMultiplier = crTables.shipRarityFactor[ship.rarity] * crewRating;
    Object.entries(unitData[ship.defId].crewStats).forEach( ([statID, statValue]) => {
      // stats 1-15 and 28 all have final integer values
      // other stats require decimals -- shrink to 8 digits of precision through 'unscaled' values this calculator uses
      stats.crew[ statID ] = floor( statValue * statMultiplier, (statID < 16 || statID == 28) ? 8 : 0);
    });
    return stats;
  }catch(e){
    throw(e)
  }
}

function getCrewRating(crew) {
  try{
    let totalCR = crew.reduce( (crewRating, char) => {
      crewRating += crTables.unitLevelCR[ char.level ] + crTables.crewRarityCR[ char.rarity ]; // add CR from level/rarity
      crewRating += crTables.gearLevelCR[ char.gear ]; // add CR from complete gear levels
      crewRating += (crTables.gearPieceCR[ char.gear ] * char.equipped.length || 0); // add CR from currently equipped gear
      crewRating = char.skills.reduce( (cr, skill) => cr + getSkillCrewRating(skill), crewRating); // add CR from ability levels
       // add CR from mods
      if (char.mods) crewRating = char.mods.reduce( (cr, mod) => cr + crTables.modRarityLevelCR[ mod.pips ][ mod.level ], crewRating);
      else if (char.equippedStatMod) crewRating = char.equippedStatMod.reduce( (cr, mod) => cr + crTables.modRarityLevelCR[ +mod.definitionId[1] ][ mod.level ], crewRating);

      // add CR from relics
      if (char.relic && char.relic.currentTier > 2) {
        crewRating += crTables.relicTierCR[ char.relic.currentTier ];
        crewRating += char.level * crTables.relicTierLevelFactor[ char.relic.currentTier ];
      }

      return crewRating;
    }, 0);
    return totalCR;
  }catch(e){
    throw(e)
  }
}
function getSkillCrewRating(skill) {
  // Crew Rating for GP purposes depends on skill type (i.e. contract/hardware/etc.), but for stats it apparently doesn't.
  return crTables.abilityLevelCR[ skill.tier ];
}

function getCrewlessCrewRating(ship) {
  // temporarily uses hard-coded multipliers, as the true in-game formula remains a mystery.
  // but these values have experimentally been found accurate for the first 3 crewless ships:
  //     (Vulture Droid, Hyena Bomber, and BTL-B Y-wing)
  return floor( crTables.crewRarityCR[ ship.rarity ] + 3.5*crTables.unitLevelCR[ ship.level ] + getCrewlessSkillsCrewRating( ship.skills ) );
}
function getCrewlessSkillsCrewRating(skills) {
  return skills.reduce( (cr, skill) => {
    cr += ((skill.id.substring(0,8) == "hardware") ? 0.696 : 2.46) * crTables.abilityLevelCR[ skill.tier ];
    return cr;
  }, 0);
}

function calculateBaseStats(stats, level, baseID) {
  // calculate bonus Primary stats from Growth Modifiers:
  stats.base[2] += floor( stats.growthModifiers[2] * level, 8) // Strength
  stats.base[3] += floor( stats.growthModifiers[3] * level, 8) // Agility
  stats.base[4] += floor( stats.growthModifiers[4] * level, 8) // Tactics
  if (stats.base[61]) {
    // calculate effects of Mastery on Secondary stats:
    let mms = crTables[ unitData[ baseID ].masteryModifierID ];
    for (var statID in mms) {
      stats.base[ statID ] = (stats.base[ statID ] || 0) + stats.base[61]*mms[ statID ];
    }
  }
  // calculate effects of Primary stats on Secondary stats:
  stats.base[1] = (stats.base[1] || 0) + stats.base[2] * 18;                                            // Health += STR * 18
  stats.base[6] = floor( (stats.base[6] || 0) + stats.base[ unitData[ baseID ].primaryStat ] * 1.4, 8); // Ph. Damage += MainStat * 1.4
  stats.base[7] = floor( (stats.base[7] || 0) + (stats.base[4] * 2.4), 8 );                             // Sp. Damage += TAC * 2.4
  stats.base[8] = floor( (stats.base[8] || 0) + (stats.base[2] * 0.14) + (stats.base[3] * 0.07), 8);    // Armor += STR*0.14 + AGI*0.07
  stats.base[9] = floor( (stats.base[9] || 0) + (stats.base[4] * 0.1), 8);                              // Resistance += TAC * 0.1
  stats.base[14] = floor( (stats.base[14] || 0) + (stats.base[3] * 0.4), 8);                            // Ph. Crit += AGI * 0.4
  // add hard-coded minimums or potentially missing stats
  stats.base[12] = (stats.base[12] || 0) + (24 * 1e8);  // Dodge (24 -> 2%)
  stats.base[13] = (stats.base[13] || 0) + (24 * 1e8);  // Deflection (24 -> 2%)
  stats.base[15] = (stats.base[15] || 0);               // Sp. Crit
  stats.base[16] = (stats.base[16] || 0) + (150 * 1e6); // +150% Crit Damage
  stats.base[18] = (stats.base[18] || 0) + (15 * 1e6);  // +15% Tenacity

  return stats
}
function calculateModStats(baseStats, char) {
  try{
    // return empty object if no mods
    if (!char.equippedStatMod ) return {};

    // calculate raw totals on mods
    const setBonuses = {};
    const rawModStats = {};
    if (char.equippedStatMod) {
      let i = char.equippedStatMod.length
      while(i--){
        let setBonus;
        if ( setBonus = setBonuses[ +char.equippedStatMod[i].definitionId[0] ] ) {
          // set bonus already found, increment
          ++setBonus.count;
          if ( char.equippedStatMod[i].level == 15 ) ++setBonus.maxLevel;
        } else {
          // new set bonus, create object
          setBonuses[ +char.equippedStatMod[i].definitionId[0] ] = { count: 1, maxLevel: char.equippedStatMod[i].level == 15 ? 1 : 0 };
        }

        // add Primary/Secondary stats to data
        let stat = char.equippedStatMod[i].primaryStat.stat, s = 0;
        do {
          rawModStats[ stat.unitStatId ] = +stat.unscaledDecimalValue + (rawModStats[ stat.unitStatId ] || 0);
          stat = char.equippedStatMod[i].secondaryStat[s] && char.equippedStatMod[i].secondaryStat[s].stat;
        } while ( s++ < char.equippedStatMod[i].secondaryStat.length );
      }
    } else {
      // return empty object if no mods
      return {};
    }

    // add stats given by set bonuses
    for (var setID in setBonuses) {
      const setDef = modSetData[setID];
      const {count: count, maxLevel: maxCount } = setBonuses[ setID ];
      const multiplier = ~~(count / setDef.count) + ~~(maxCount / setDef.count);
      rawModStats[ setDef.id ] = (rawModStats[ setDef.id ] || 0) + (setDef.value * multiplier);
    }

    // calcuate actual stat bonuses from mods
    const modStats = {};
    for (var statID in rawModStats) {
      const value = rawModStats[ statID ];
      switch (~~statID) {
        case 41: // Offense
          modStats[6] = (modStats[6] || 0) + value; // Ph. Damage
          modStats[7] = (modStats[7] || 0) + value; // Sp. Damage
          break;
        case 42: // Defense
          modStats[8] = (modStats[8] || 0) + value; // Armor
          modStats[9] = (modStats[9] || 0) + value; // Resistance
          break;
        case 48: // Offense %
          modStats[6] = floor( (modStats[6] || 0) + (baseStats[6] * 1e-8 * value), 8); // Ph. Damage
          modStats[7] = floor( (modStats[7] || 0) + (baseStats[7] * 1e-8 * value), 8); // Sp. Damage
          break;
        case 49: // Defense %
          modStats[8] = floor( (modStats[8] || 0) + (baseStats[8] * 1e-8 * value), 8); // Armor
          modStats[9] = floor( (modStats[9] || 0) + (baseStats[9] * 1e-8 * value), 8); // Resistance
          break;
        case 53: // Crit Chance
          modStats[21] = (modStats[21] || 0) + value; // Ph. Crit Chance
          modStats[22] = (modStats[22] || 0) + value; // Sp. Crit Chance
          break;
        case 54: // Crit Avoid
          modStats[35] = (modStats[35] || 0) + value; // Ph. Crit Avoid
          modStats[36] = (modStats[36] || 0) + value; // Ph. Crit Avoid
          break;
        case 55: // Heatlth %
          modStats[1] = floor( (modStats[1] || 0) + (baseStats[1] * 1e-8 * value), 8); // Health
          break;
        case 56: // Protection %
          modStats[28] = floor( (modStats[28] || 0) + ( (baseStats[28] || 0) * 1e-8 * value), 8); // Protection may not exist in base
          break;
        case 57: // Speed %
          modStats[5] = floor( (modStats[5] || 0) + (baseStats[5] * 1e-8 * value), 8); // Speed
          break;
        default:
          // other stats add like flat values
          modStats[ statID ] = (modStats[ statID ] || 0) + value;
      }
    }

    return modStats;
  }catch(e){
    throw(e)
  }
}


// Apply following flags to adjust object format
//   -scaled
//   -unscaled
//   -gameStyle
//   -percentVals
function formatStats(stats, level, options) {
  try{
    // value/scaling flags
    let scale = 1e-8; // also useful in some Stat Format calculations below
    /*
    if (options.scaled) { scale = 1e-4; }
    else if (!options.unscaled) { scale = 1e-8; }
    */
    if (stats.mods) {
      for (var statID in stats.mods) stats.mods[statID] = Math.round( stats.mods[statID] );
    }

    for (var statID in stats.base) stats.base[statID] *= scale;
    for (var statID in stats.gear) stats.gear[statID] *= scale;
    for (var statID in stats.crew) stats.crew[statID] *= scale;
    for (var statID in stats.growthModifiers) stats.growthModifiers[statID] *= scale;
    if (stats.mods) {
      for (var statID in stats.mods) stats.mods[statID] *= scale;
    }

    let vals;
    // convert Crit
    convertPercent(14, val => convertFlatCritToPercent( val, scale * 1e8 ) ); // Ph. Crit Rating -> Chance
    convertPercent(15, val => convertFlatCritToPercent( val, scale * 1e8 ) ); // Sp. Crit Rating -> Chance
    // convert Def
    convertPercent(8, val => convertFlatDefToPercent( val, level, scale * 1e8, stats.crew ? true:false ) ); // Armor
    convertPercent(9, val => convertFlatDefToPercent( val, level, scale * 1e8, stats.crew ? true:false ) ); // Resistance
    // convert Acc
    convertPercent(37, val => convertFlatAccToPercent( val, scale * 1e8 ) ); // Physical Accuracy
    convertPercent(38, val => convertFlatAccToPercent( val, scale * 1e8 ) ); // Special Accuracy
    // convert Evasion
    convertPercent(12, val => convertFlatAccToPercent( val, scale * 1e8 ) ); // Dodge
    convertPercent(13, val => convertFlatAccToPercent( val, scale * 1e8 ) ); // Deflection
    // convert Crit Avoidance
    convertPercent(39, val => convertFlatCritAvoidToPercent( val, scale * 1e8 ) ); // Physical Crit Avoidance
    convertPercent(40, val => convertFlatCritAvoidToPercent( val, scale * 1e8 ) ); // Special Crit Avoidance

    // calls 'convertFunc' for all stat values of 'statID' in stats, and replaces those values with the % granted by that stat type
    //   i.e. mods = convertFunc(base + gear + mods) - convertFunc(base + gear)
    //     or for ships: crew = convertFunc(base + crew) - convertFunc(crew)
    function convertPercent(statID, convertFunc) {
      let flat = stats.base[statID],
          percent = convertFunc(flat);
      stats.base[statID] = percent;
      let last = percent;
      if (stats.crew) { // is Ship
        if (stats.crew[statID]) {
          stats.crew[statID] = (/*percent = */convertFunc(flat += stats.crew[statID])) - last;
        }
      } else { // is Char
        if (stats.gear && stats.gear[statID]) {
          stats.gear[statID] = (percent = convertFunc(flat += stats.gear[statID])) - last;
          last = percent;
        }
        if (stats.mods && stats.mods[statID]) stats.mods[statID] = (/*percent = */convertFunc(flat += stats.mods[statID])) - last;
      }
    }

    let gsStats = { final:{} };
    // get list of all stat IDs used in base
    const statList = Object.keys(stats.base);
    const addStats = statID => { if (!statList.includes(statID)) statList.push(statID); }
    if (stats.gear) { // is Char
      // add stats from gear to list
      let gearList = Object.keys(stats.gear)
      let s = gearList.length
      while(s--) addStats(gearList[s])
      if(stats.mods){
        // add stats from mods to list
        let modList = Object.keys(stats.mods)
        let m = modList.length
        while(m--) addStats(modList[m])
      }
      if (stats.mods) gsStats.mods = stats.mods; // keep mod stats untouched
      let i = statList.length
      while(i--){
        let flatStatID = statList[i];
        switch (~~statList[i]) {
            // stats with both Percent Stats get added to the ID for their flat stat (which was converted to % above)
          case 21: // Ph. Crit Chance
          case 22: // Sp. Crit Chance
            flatStatID = statList[i] - 7; // 21-14 = 7 = 22-15 ==> subtracting 7 from statID gets the correct flat stat
            break;
          case 35: // Ph. Crit Avoid
          case 36: // Sp. Crit Avoid
            flatStatID = ~~statList[i] + 4; // 39-35 = 4 = 40-36 ==> adding 4 to statID gets the correct flat stat
            break;
          default:
        }
        gsStats.final[flatStatID] = gsStats.final[flatStatID] || 0; // ensure stat already exists
        gsStats.final[flatStatID] += (stats.base[statList[i]] || 0) + (stats.gear[statList[i]] || 0) + (stats.mods && stats.mods[statList[i]] ? stats.mods[statList[i]] : 0);
      }

    } else { // is Ship
      // add stats from crew to list
      let crewStats = Object.keys(stats.crew)
      let s = crewStats.length
      while(s--){
        addStats(crewStats[s])
      }
      gsStats.crew = stats.crew; // keep crew stats untouched
      let i = statList.length
      while(i--) gsStats.final[statList[i]] = (stats.base[statList[i]] || 0) + (stats.crew[statList[i]] || 0);
    }

    stats.final = gsStats.final;

    return stats;
  }catch(e){
    throw(e)
  }
}

// *****************************
// ****** GP Calculations ******
// *****************************

function calcCharGP(char) {
  try{
    let gp = gpTables.unitLevelGP[ char.level ];
    gp += gpTables.unitRarityGP[ char.rarity ];
    gp += gpTables.gearLevelGP[ char.gear ];
    // Game tables for current gear include the possibility of differect GP per slot.
    // Currently, all values are identical across each gear level, so a simpler method is possible.
    // But that could change at any time.

    gp = char.equipped.reduce( (power, piece) => power + gpTables.gearPieceGP[ char.gear ][ piece.slot ], gp);

    gp = char.skills.reduce( (power, skill) => power + getSkillGP(char.defId, skill), gp);
    if (char.purchasedAbilityId) gp += char.purchasedAbilityId.length * gpTables.abilitySpecialGP.ultimate;
    if (char.mods) gp = char.mods.reduce( (power, mod) => power + gpTables.modRarityLevelTierGP[ mod.pips ][ mod.level ][ mod.tier ], gp);
    else if (char.equippedStatMod) gp = char.equippedStatMod.reduce( (power, mod) => power + gpTables.modRarityLevelTierGP[ +mod.definitionId[1] ][ mod.level ][ mod.tier ], gp)
    if (char.relic && char.relic.currentTier > 2) {
      gp += gpTables.relicTierGP[ char.relic.currentTier ];
      gp += char.level * gpTables.relicTierLevelFactor[ char.relic.currentTier ];
    }
    return floor( gp*1.5 );
  }catch(e){
    throw(e)
  }
}
function getSkillGP(id, skill) {
  try{
    let oTag = unitData[ id ].skills.find( s => s.id == skill.id ).powerOverrideTags[ skill.tier ];
    if (oTag)
      return gpTables.abilitySpecialGP[ oTag ];
    else
      return gpTables.abilityLevelGP[ skill.tier ] || 0;
  }catch(e){
    throw(e)
  }
}
function calcShipGP(ship, crew = []) {
  try{
    // ensure crew is the correct crew
    if (crew.length != unitData[ship.defId].crew.length)
      throw new Error(`Incorrect number of crew members for ship ${ship.defId}.`);
    let c = crew.length
    while(c--){
      if ( !unitData[ship.defId].crew.includes(crew[c].defId) )
        throw new Error(`Unit ${crew[c].defId} is not in ${ship.defId}'s crew.`);
    }

    let gp;

    if (crew.length == 0) { // crewless calculations
      let gps = getCrewlessSkillsGP( ship.defId, ship.skills );
      gps.level = gpTables.unitLevelGP[ ship.level ];
      gp = ( gps.level*3.5 + gps.ability*5.74 + gps.reinforcement*1.61 )*gpTables.shipRarityFactor[ ship.rarity ];
      gp += gps.level + gps.ability + gps.reinforcement;
    } else { // normal ship calculations
      gp = crew.reduce( (power, c) => power + c.gp, 0);
      gp *= gpTables.shipRarityFactor[ ship.rarity ] * gpTables.crewSizeFactor[ crew.length ]; // multiply crewPower factors before adding other GP sources
      gp += gpTables.unitLevelGP[ ship.level ];
      gp = ship.skills.reduce( (power, skill) => power + getSkillGP(ship.defId, skill), gp);
    }
    return floor( gp*1.5 );
  }catch(e){
    throw(e)
  }
}
function getCrewlessSkillsGP(id, skills) {
  try{
    let a = 0,
        r = 0;
    /*
    let s = skills.length
    while(s--){
      let oTag = unitData[ id ].skills.find( s => s.id == skills[s].id ).powerOverrideTags[ skills[s].tier ];
      if (oTag && oTag.substring(0,13) == 'reinforcement')
        r += gpTables.abilitySpecialGP[ oTag ];
      else
        a += oTag ? gpTables.abilitySpecialGP[ oTag ] : gpTables.abilityLevelGP[ skills[s].tier ];
    }
    */
    skills.forEach( skill => {
      let oTag = unitData[ id ].skills.find( s => s.id == skill.id ).powerOverrideTags[ skill.tier ];
      if (oTag && oTag.substring(0,13) == 'reinforcement')
        r += gpTables.abilitySpecialGP[ oTag ];
      else
        a += oTag ? gpTables.abilitySpecialGP[ oTag ] : gpTables.abilityLevelGP[ skill.tier ];
    });
    return {ability: a, reinforcement: r};
  }catch(e){
    throw(e)
  }
}



// ******************************
// ****** Helper Functions ******
// ******************************

// correct round-off error inherit to floats
function fixFloat(value,digits) {
  return Number(`${Math.round(`${value}e${digits}`)}e-${digits}`) || 0;
}

// floor value to specified digit
function floor(value, digits = 0) {
  return Math.floor(value / ('1e'+digits)) * ('1e'+digits);
}


// convert def
function convertFlatDefToPercent(value, level = 85, scale = 1, isShip = false) {
  const val = value / scale;
  const level_effect = isShip ? 300 + level*5 : level*7.5;
  return (val/(level_effect + val)) * scale;//.toFixed(2);
}

// convert crit
function convertFlatCritToPercent(value, scale = 1) {
  const val = value / scale;
  return (val/2400 + 0.1) * scale;//.toFixed(4);
}

// convert accuracy / evasion
function convertFlatAccToPercent(value, scale = 1) {
  const val = value / scale;
  return (val/1200) * scale;
}

// convert crit avoidance
function convertFlatCritAvoidToPercent(value, scale = 1) {
  const val = value / scale;
  return (val/2400) * scale;
}


// build character from 'useValues' option
function useValuesChar(char) {
  return {
    defId: char.definitionId.split(":")[0],
    rarity: char.currentRarity,
    level: char.currentLevel,
    gear: char.currentTier,
    equipped: char.equipment,
    equippedStatMod: char.equippedStatMod,
    relic: char.relic,
    skills: char.skill.map( skill => { return { id: skill.id, tier: skill.tier + 2 }; }),
    purchasedAbilityId: char.purchasedAbilityId
    // TODO set purchasedAbilityId
  };
}

// build ship/crew from 'useValues' option
function useValuesShip(ship, crew) {
  ship = {
    defId: ship.definitionId.split(":")[0],
    rarity: ship.currentRarity,
    level: ship.currentLevel,
    skills: ship.skill.map( skill => { return { id: skill.id, tier: skill.tier + 2 }; })
  };
  crew = crew.map( c => {
    return {
      defId: c.definitionId.split(":")[0],
      rarity: c.currentRarity,
      level: c.currentLevel,
      gear: c.currentTier,
      equipped: c.equipment,
      equippedStatMod: c.equippedStatMod,
      relic: c.relic,
      skills: c.skill.map( skill => { return { id: skill.id, tier: skill.tier + 2 }; }),
      gp: c.gp
    };
  });
  return {ship: ship, crew: crew};
}

function setSkills( unitID, val ) {
  if (val == 'max')
    return unitData[ unitID ].skills.map(skill => { return {id: skill.id, tier: skill.maxTier}; });
  else if (val == 'maxNoZeta')
    return unitData[ unitID ].skills.map(skill => { return {id: skill.id, tier: skill.maxTier - (skill.isZeta ? 1 : 0)}; });
  else if ('number' == typeof val) // expecting an integer, 1-8, for skill level to use
    return unitData[ unitID ].skills.map(skill => { return {id: skill.id, tier: Math.min(val, skill.maxTier)}; });
  else // expecting an array of skill objects
    return val;
}
module.exports = {
  setGameData: setGameData,
  calcRosterStats: calcRosterStats
}

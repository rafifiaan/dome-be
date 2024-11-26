const units = require('../utils/units.json');

function validateUnitAndSubUnit(unit, subUnit) {
    console.log('Validating unit:', unit); 
    const foundUnit = units.find((u) => u.unit_baru === unit); 
    if (!foundUnit) {
        console.log('Unit tidak ditemukan:', unit); 
        return false; 
    }

    console.log('Found unit:', foundUnit); 

    if (subUnit && foundUnit.sub_unit_baru) {
        return foundUnit.sub_unit_baru.includes(subUnit);
    }

    return true;
}

module.exports = { validateUnitAndSubUnit };


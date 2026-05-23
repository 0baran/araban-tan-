const fs = require('fs');

let content = fs.readFileSync('src/services/OBD2Service.ts', 'utf8');

// The regex will find patterns like: 
// const r1 = await this.sendCommandFast('0110'); this.parseMAF(r1);
// And capture the parsing method name (e.g. parseMAF) to infer the key.

const mappings = {
  'parseMAF': 'maf',
  'parseMAP': 'map',
  'parseEngineLoad': 'engineLoad',
  'parseIntakeTemp': 'intakeTemp',
  'parseBatteryVoltage': 'batteryVoltage',
  'parseMonitorStatusForPoll': 'dtcCount',
  'parseThrottlePos': 'throttlePos',
  'parseFuelLevel': 'fuelLevel',
  'parseTimingAdvance': 'timingAdvance',
  'parseAmbientTemp': 'ambientTemp',
  'parseCommandedAFR': 'commandedAFR',
  'parseBarometricPressure': 'barometricPressure',
  'parseEngineOilTemp': 'engineOilTemp',
  'parseFuelRate': 'fuelRate',
  'parseRunTime': 'runTime',
  'parseInjectionTiming': 'injectionTiming',
  'parseShortTermFuelTrim': 'shortTermFuelTrim',
  'parseLongTermFuelTrim': 'longTermFuelTrim',
  'parseFuelPressure': 'fuelPressure',
  'parseAbsoluteThrottleB': 'absoluteThrottleB',
  'parseAbsoluteThrottleC': 'absoluteThrottleC',
  'parseCommandedThrottleActuator': 'commandedThrottleActuator',
  'parseAcceleratorPosD': 'acceleratorPosD',
  'parseDriverDemandTorque': 'driverDemandTorque',
  'parseO2Sensor1Voltage': 'o2Sensor1Voltage',
  'parseCatalystTempBank1': 'catalystTempBank1',
  'parseDistanceSinceDTCClear': 'distanceSinceDTCClear',
  'parseFuelRailPressureRelative': 'fuelRailPressureRelative',
  'parseFuelRailPressureAbsolute': 'fuelRailPressureAbsolute',
  'parseEGTBank1': 'egtBank1',
  'parseEVAPVaporPressure': 'evapVaporPressure',
  'parseRelativePedalPos': 'relativePedalPos',
  'parseAbsoluteLoad': 'absoluteLoad',
  'parseRelativeThrottlePos': 'relativeThrottlePos',
  'parseEthanolPercent': 'ethanolPercent',
  'parseFuelSystemStatus': 'fuelSystemStatus',
  'parseO2Sensor2Voltage': 'o2Sensor2Voltage',
  'parseShortTermFuelTrim2': 'shortTermFuelTrim2',
  'parseLongTermFuelTrim2': 'longTermFuelTrim2',
  'parseDistanceWithMIL': 'distanceWithMIL',
  'parseTimeSinceDTCClear': 'timeSinceDTCClear',
  'parseWarmUpsSinceDTCClear': 'warmUpsSinceDTCClear',
  'parseFuelType': 'fuelType',
  'parseTimeWithMIL': 'timeWithMIL',
  'parseCatalystTempBank2': 'catalystTempBank2',
  'parseWideRangeO2B1S1': 'wideRangeO2B1S1',
  'parseAcceleratorPosE': 'acceleratorPosE',
  'parseAcceleratorPosF': 'acceleratorPosF',
  'parseCommandedEgr': 'commandedEgr',
  'parseEgrError': 'egrError',
  'parseCommandedEvapPurge': 'commandedEvapPurgeFlow',
  'parseO2B1S1EquivRatio': 'o2B1S1EquivRatio',
  'parseO2B1S2EquivRatio': 'o2B1S2EquivRatio',
  'parseActualEgr': 'actualEgr',
  'parseEgrErrorDuty': 'egrErrorDuty',
  'parseActualEngineTorque': 'actualEngineTorque',
  'parseEngineReferenceTorque': 'engineReferenceTorque',
  'parseOdometer': 'odometer',
  'parseHybridBatteryLife': 'hybridBatteryLife',
  'parseDpfDifferentialPressure': 'dpfDifferentialPressure',
  'parseDpfTemp': 'dpfTemp',
  'parseExhaustPressure': 'exhaustPressure',
  'parseTurboRpm': 'turboRpm',
  'parseChargeAirCoolerTemp': 'chargeAirCoolerTemp',
  'parseFuelRailGaugePressure': 'fuelRailGaugePressure',
  'parseEngineFrictionTorque': 'engineFrictionTorque',
  'parseDistanceSinceDTCClearHighRes': 'distanceSinceDTCClearHighRes',
  'parseThrottlePositionG': 'throttlePositionG',
  'parseSecondaryAirStatus': 'secondaryAirStatus',
  'parseObdStandard': 'obdStandard',
  'parseEvapVaporPressureAbsolute': 'evapVaporPressureAbsolute',
  'parseEgtBank2': 'egtBank2',
  'parseTurboCompressorInletPressure': 'turboCompressorInletPressure',
  'parseVgtControl': 'vgtControl',
  'parseWastegateControl': 'wastegateControl',
  'parseTurboTemp': 'turboTemp',
  'parseFuelPressureControl': 'fuelPressureControl',
  'parseInjectionPressureControl': 'injectionPressureControl',
  'parseCatalystTempBank1Sensor2': 'catalystTempBank1Sensor2',
  'parseCatalystTempBank2Sensor2': 'catalystTempBank2Sensor2',
  'parseBoostPressureControl': 'boostPressureControl',
  'parseDpfBypassPressure': 'dpfBypassPressure',
  'parseNoxNTEControlStatus': 'noxNTEControlStatus',
  'parsePmNTEControlStatus': 'pmNTEControlStatus',
  'parseEngineAuxiliarySupported': 'engineAuxiliarySupported',
  'parseO2Sensor3Voltage': 'o2Sensor3Voltage',
  'parseO2Sensor4Voltage': 'o2Sensor4Voltage',
  'parseO2Sensor5Voltage': 'o2Sensor5Voltage',
  'parseO2Sensor6Voltage': 'o2Sensor6Voltage',
  'parseO2Sensor7Voltage': 'o2Sensor7Voltage',
  'parseO2Sensor8Voltage': 'o2Sensor8Voltage'
};

const regex = /sendCommandFast\('([0-9A-F]+)'\);\s*this\.(parse[a-zA-Z0-9_]+)\(/g;

content = content.replace(regex, (match, cmd, method) => {
  const key = mappings[method];
  if (key) {
    return `sendCommandFast('${cmd}', '${key}'); this.${method}(`;
  }
  return match; // fallback
});

fs.writeFileSync('src/services/OBD2Service.ts', content, 'utf8');
console.log('Patch complete.');

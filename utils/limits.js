const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data', 'generation_limits.json');

if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath));
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));

function loadData() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getUserGenerationCount(userId) {
  const data = loadData();
  const today = getTodayKey();
  return data[userId]?.[today] || 0;
}

function incrementUserGeneration(userId) {
  const data = loadData();
  const today = getTodayKey();

  if (!data[userId]) data[userId] = {};
  if (!data[userId][today]) data[userId][today] = 0;

  data[userId][today]++;
  saveData(data);
}

module.exports = {
  getUserGenerationCount,
  incrementUserGeneration
};
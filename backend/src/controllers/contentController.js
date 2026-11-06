const training = require('../content/training');
const bonuses = require('../content/bonuses');

exports.training = (req, res) => res.json({ modules: training });
exports.bonuses = (req, res) => res.json({ bonuses });

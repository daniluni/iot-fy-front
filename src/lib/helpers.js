const bcrypt = require('bcryptjs');

const helpers = {};

helpers.encryptPassword = async (clave) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(clave, salt);
  return hash;
};

helpers.matchPassword = async (clave, savedPassword) => {
  try {
    return await bcrypt.compare(clave, savedPassword);
  } catch (e) {
    console.log(e)
  }
};

module.exports = helpers;

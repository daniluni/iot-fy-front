const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'usuario',
  passwordField: 'clave',
  passReqToCallback: true
}, async (req, usuario, clave, done) => {
  const rows = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
  if (rows.length > 0) {
    const user = rows[0];
    const validPassword = await helpers.matchPassword(clave, user.clave)
    if (validPassword) {
      done(null, user, req.flash('success', 'Welcome ' + user.usuario));
    } else {
      done(null, false, req.flash('message', 'Clave Incorrecta'));
    }
  } else {
    return done(null, false, req.flash('message', 'El nombre de usuario no existe.'));
  }
}));

passport.use('local.signup', new LocalStrategy({
  usernameField: 'usuario',
  passwordField: 'clave',
  passReqToCallback: true
}, async (req, usuario, clave, done) => {

  const { nombre } = req.body;
  let newUser = {
    nombre,
    usuario,
    clave
  };
  newUser.clave = await helpers.encryptPassword(clave);
  // Saving in the Database
  const result = await pool.query('INSERT INTO usuarios SET ? ', newUser);
  newUser.id = result.insertId;
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  done(null, rows[0]);
});


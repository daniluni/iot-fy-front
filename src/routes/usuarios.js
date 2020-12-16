const express = require('express');
const router = express.Router();

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const usuarios = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    console.log(usuarios);
    res.render('usuarios/edit', {usuarios: usuarios[0]});
});

router.post('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre,usuario,email} = req.body; 
    const newLink = {
        nombre,
        usuario,
        email
    };
    await pool.query('UPDATE usuarios set ? WHERE id = ?', [newLink, id]);
    req.flash('success', 'Datos actualizados exitosamente');
    res.redirect('/profile');
});

module.exports = router;
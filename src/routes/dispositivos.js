const express = require('express');
const router = express.Router();

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/add', (req, res) => {
    res.render('dispositivos/add');
});

router.post('/add', async (req, res) => {
    const { ubicacion, descripcion, autorizadodesde, autorizadohasta, watios } = req.body;
    const newDispositivo = {
        ubicacion,
        descripcion,
        autorizadodesde,
        autorizadohasta,
        watios,
        usuarios_id: req.user.id
    };
    await pool.query('INSERT INTO dispositivos set ?', [newDispositivo]);
    req.flash('success', 'Su Nuevo dispositivo está agregado');
    res.redirect('/dispositivos');
});

router.get('/', isLoggedIn, async (req, res) => {
    const dispositivos = await pool.query('SELECT id,descripcion,ubicacion,watios,autorizadodesde,autorizadohasta,(SELECT COUNT(*) FROM alarmas WHERE dispositivos_id=d.id) AS alarmas FROM dispositivos d WHERE usuarios_id = ?', [req.user.id,req.user.id]);
    res.render('dispositivos/list', { dispositivos });
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM dispositivos WHERE id = ?', [id]);
    req.flash('success', 'Dispositivo desvinculado');
    res.redirect('/dispositivos');
});

router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const dispositivos = await pool.query('SELECT * FROM dispositivos WHERE id = ?', [id]);
    console.log(dispositivos);
    res.render('dispositivos/edit', {dispositivos: dispositivos[0]});
});

router.get('/listcons/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;    
    const consumos = await pool.query('select dispositivos.descripcion, dispositivos.ubicacion,desde,hasta,(TIMESTAMPDIFF(second,desde,hasta)/3600)*dispositivos.watios as Wh from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id where consumos.dispositivos_id= ?', [id]);
    const total = await pool.query('select SUM((TIMESTAMPDIFF(second,desde,hasta)/3600)*dispositivos.watios) as Wh  from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id where hasta<>"9999/12/31" and consumos.dispositivos_id= ?', [id]);
 
    res.render('dispositivos/listcons', { consumos, total });
});

// Lista todos los consumos de agrupados por dispositivos del usuario
router.get('/listallcons', isLoggedIn, async (req, res) => {
    const { id } = req.params;    
    const consumos = await pool.query('select usuarios.id,dispositivos.descripcion,dispositivos.ubicacion, SUM((TIMESTAMPDIFF(second,desde,hasta)/3600)*dispositivos.watios) as Wh from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where hasta<>"9999/12/31" and usuarios.id=? group by dispositivos.descripcion', [req.user.id]);
    const total = await pool.query('select usuarios.id, SUM((TIMESTAMPDIFF(second,desde,hasta)/3600)*dispositivos.watios) as Wh from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where hasta<>"9999/12/31" and usuarios.id=?', [req.user.id]);
 
    res.render('dispositivos/listallcons', { consumos,total });
});

// Lista todos los consumos de agrupados por fecha de los dispositivos del usuario
router.get('/listaconsfecha', isLoggedIn, async (req, res) => {
    const { id } = req.params;    
    const consumos = await pool.query('select DATE_FORMAT(consumos.desde,"%d/%m/%Y") as fecha, SUM((TIMESTAMPDIFF(second,desde,hasta)/3600)*dispositivos.watios) as Wh from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where hasta<>"9999/12/31" and usuarios.id=? group by DATE_FORMAT(consumos.desde,"%d/%m/%Y")', [req.user.id]);
    const total = await pool.query('select DATE_FORMAT(consumos.desde,"%d/%m/%Y") as fecha, SUM((TIMESTAMPDIFF(second,desde,hasta)/3600)*dispositivos.watios) as Wh from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where hasta<>"9999/12/31" and usuarios.id=?', [req.user.id]);
    res.render('dispositivos/listaconsfecha', { consumos, total});
});

// Lista todos los consumos de agrupados por fecha de los dispositivos del usuario
router.get('/listaconsfechag', isLoggedIn, async (req, res) => {
    const { id } = req.params;    
    const consumos = await pool.query('select DATE_FORMAT(consumos.desde,"%d/%m/%Y") as fecha, SUM((TIMESTAMPDIFF(second,desde,hasta)/3600)*dispositivos.watios) as Wh from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where hasta<>"9999/12/31" and usuarios.id=? group by DATE_FORMAT(consumos.desde,"%d/%m/%Y")', [req.user.id]);
    res.render('dispositivos/listaconsfechag', { consumos });
});

// Lista todas consumos por periodos en alarma por dispositivos
router.get('/listallalarma', isLoggedIn, async (req, res) => {
    const { id } = req.params;    
    const consumos = await pool.query('select usuarios.id,dispositivos.descripcion,dispositivos.ubicacion,consumos.inicio_alarma, SUM((TIMESTAMPDIFF(second,inicio_alarma,hasta)/3600)*dispositivos.watios) as Wh from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where (inicio_alarma<>"9999/12/31" and estado="apagado") and usuarios.id=? group by dispositivos.descripcion', [req.user.id]);
    const total = await pool.query('select usuarios.id, SUM((TIMESTAMPDIFF(second,inicio_alarma,hasta)/3600)*dispositivos.watios) as Wh from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where (inicio_alarma<>"9999/12/31" and estado="apagado") and usuarios.id=?', [req.user.id]);
    res.render('dispositivos/listallalarma', { consumos, total });
});

// Lista todas las alarmas por dispositivos
router.get('/listalarma', isLoggedIn, async (req, res) => {
    const { id } = req.params;    
    const consumos = await pool.query('select dispositivos.descripcion,dispositivos.ubicacion, count(*) as nro_alarmas from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where (inicio_alarma<>"9999/12/31" and estado="apagado") and usuarios.id=? group by dispositivos.descripcion', [req.user.id]);
    const total = await pool.query('select dispositivos.descripcion,dispositivos.ubicacion, count(*) as total_alarmas from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where (inicio_alarma<>"9999/12/31" and estado="apagado") and usuarios.id=?', [req.user.id]);
    res.render('dispositivos/listalarma', { consumos, total });
});
// Lista todas las alarmas por dispositivos para grafico
router.get('/listalarmag', isLoggedIn, async (req, res) => {
    const { id } = req.params;    
    const consumos = await pool.query('select dispositivos.descripcion,dispositivos.ubicacion, count(*) as nro_alarmas from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where (inicio_alarma<>"9999/12/31" and estado="apagado") and usuarios.id=? group by dispositivos.descripcion', [req.user.id]);
    res.render('dispositivos/listalarmag', { consumos });
});


// Lista todos los consumos del usuario para gráfico
router.get('/listall', isLoggedIn, async (req, res) => {
    const { id } = req.params;    
    const consumos = await pool.query('select dispositivos.id as idDis,usuarios.id,dispositivos.descripcion,dispositivos.ubicacion, SUM((TIMESTAMPDIFF(second,desde,hasta)/3600)*dispositivos.watios) as Wh from consumos inner join dispositivos on dispositivos.id=consumos.dispositivos_id inner join usuarios on usuarios.id=dispositivos.usuarios_id where hasta<>"9999/12/31" and usuarios.id=? group by dispositivos.descripcion', [req.user.id]);
    res.render('dispositivos/listall', { consumos });
});



router.post('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { ubicacion, descripcion, autorizadodesde,autorizadohasta,watios} = req.body; 
    const newLink = {
        ubicacion,
        descripcion,
        autorizadodesde,
        autorizadohasta,
        watios
    };
    await pool.query('UPDATE dispositivos set ? WHERE id = ?', [newLink, id]);
    req.flash('success', 'Dispositivo actualizado exitosamente');
    res.redirect('/dispositivos');
});

module.exports = router;
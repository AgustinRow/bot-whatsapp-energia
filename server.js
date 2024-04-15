const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const { runClient } = require('./index');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('login.ejs');
});

// Ruta de inicio de sesión
app.post(
  '/login',
  (req, res, next) => {
    const { username, password } = req.body;
    // Aquí podrías verificar el usuario y la contraseña, por ejemplo, con una base de datos
    // Por simplicidad, vamos a simular una verificación básica
    if (username === 'usuario' && password === 'contraseña') {
      next();
    } else {
      res.status(401).send('Usuario o contraseña incorrectos');
    }
  },
  runClient,
);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});

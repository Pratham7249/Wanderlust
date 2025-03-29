const express = require('express');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

app.use(expressLayouts);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const authRoutes = require('./routes/auth');
app.set('layout', 'layouts/boilerplate.ejs');
app.use('/auth', authRoutes);

app.get('/dashboard', (req, res) => {
    const user = null; 
    res.render('dashboard', { user });
});
app.get('/recycling', (req, res) => {
    const user = null; 
    res.render('recycling', { user });
});

app.get('/', (req, res) => {
    const user = null; 
    res.render('home', { user });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

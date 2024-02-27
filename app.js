const express = require('express')
const { MongoClient } = require('mongodb');
const path = require('path')
const dotenv = require('dotenv').config( {
        path: path.join(__dirname, '/src/.env')
});
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

const app = express();
const upload = multer();

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '/src/views'))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')));

const MONGODB_URI = 'mongodb+srv://makykari:11112004ar@cluster0.jrgn1k2.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'userDB';
const COLLECTION_NAME = 'users';

let db, collection;

app.use(session({
    secret: "qwerty",
    resave: true,
    saveUninitialized: true
}));

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db(DB_NAME);
        collection = db.collection(COLLECTION_NAME);
    })
    .catch(error => console.error('Error connecting to MongoDB:', error));

function authorizeUser(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { name, password } = req.body;
    

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        name: name,
        password: hashedPassword,
        creationDate: new Date(),
        isAdmin: false,
        tickers: []
    };

    try {
        const existingUser = await collection.findOne({ name: name });
        if (existingUser) {
            return res.status(400).send('Username is already used.');
        }
    } catch (error) {
        console.error('Error checking existing username:', error);
        return res.status(500).send('Internal Server Error');
    }

    try {
        const result = await collection.insertOne(newUser);
        res.status(201).redirect('/');
    } catch (error) {
        console.error('Error inserting user:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/login', async (req, res) => {
    const { name, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await collection.findOne({ name: name});

        if(!bcrypt.compare(password, hashedPassword)) {
            return res.status(401).send('Unauthorized: Invalid username or password.');
        }

        if (user) {
            req.session.user = user;
            if (user.isAdmin) {
                res.redirect('/admin');
            } else{
                res.redirect('/');
            }
        } else {
            res.status(401).send('Unauthorized: Invalid username or password.');
        }
    } catch (error) {
        console.error('Error finding user:', error);
        res.status(500).send('Internal Server Error');
    }
});

function authorizeUser(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/', authorizeUser, async (req, res) => {
    try {
      const companyCards = await db.collection('cards').find().toArray();
      res.render('index', { companyCards, user: req.session.user});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
});


app.get('/admin', isAdmin, async (req, res) => {
    try {
        const companyCards = await db.collection('cards').find().toArray();
        res.render('admin', { companyCards, user: req.session.user});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.isAdmin) {
        next();
    } else {
        res.status(403).send('Forbidden: Only admins can access this page.');
    }
}

app.post('/admin/users', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await collection.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already exists');
        }

        await collection.insertOne({ username, password });
        res.redirect('/admin');
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send('Internal server error');
    }
});

app.post('/admin/add_recommendations', async (req, res) => {
    try {
        const { stockTicker } = req.body;

        const existingRecommendation = await db.collection('recommendations').findOne({ stockTicker });

        if (existingRecommendation) {
            res.status(400).send('Recommendation already exists');
            return;
        }

        await db.collection('recommendations').insertOne({ stockTicker });
        res.status(201).send('Recommendation added successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admin/remove_recommendations', async (req, res) => {
    try {
        const { stockTicker } = req.body;
        const existingRecommendation = await db.collection('recommendations').findOne({ stockTicker });
        
        if (existingRecommendation) {
            await db.collection('recommendations').deleteOne({ stockTicker });
            res.status(200).send('Recommendation deleted successfully');
        } else {
            res.status(404).send('Recommendation not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admin/addCompany', upload.single('photo'), async (req, res) => {
    try {
        const { companyName, description, companyGoal} = req.body;
        var photo = req.file;
        const creationDate = new Date().toLocaleDateString();
        const donated = 0;

        photo = photo.buffer;

        if(companyGoal < 0) {
            return res.status(400).send('Company goal must be a positive number');
        }
        console.log(companyGoal)
        await db.collection('cards').insertOne({
            companyName,
            description,
            creationDate,
            companyGoal,
            photo,
            donated,
        });
        res.status(201).send('Company card added successfully');
    } catch (error) {
        console.error('Error adding company card:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admin/delete/:id', async (req, res) => {
    const companyId = req.params.id;
    try {
        await db.collection('cards').deleteOne({ _id: new ObjectId(companyId) });
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/admin/update/:id', isAdmin ,async (req, res) => {
    const companyId = req.params.id;
    try {
        const company = await db.collection('cards').findOne({ _id: new ObjectId(companyId) });
        res.render('update', { company });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admin/update/:id', upload.single('photo'), async (req, res) => {
    const companyId = req.params.id;
    const { companyName, description } = req.body;
    const creationDate = new Date().toLocaleDateString();

    try {
        const existingCompany = await db.collection('cards').findOne({ _id: new ObjectId(companyId) });

        let updateData = {
            companyName: companyName || existingCompany.companyName,
            description: description || existingCompany.description,
            creationDate: creationDate,
        };

        if (req.file && req.file.buffer) {
            updateData.photo = req.file.buffer;
        } else {
            updateData.photo = existingCompany.photo;
        }

        const result = await db.collection('cards').updateOne({ _id: new ObjectId(companyId) }, { $set: updateData });

        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/card/:id', async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await db.collection('cards').findOne({ _id: new ObjectId(companyId) });
        if (!company) {
            return res.status(404).send('Company not found');
        }
        res.render('card', { company, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.post('/donate', async (req, res) => {
    const {id, amount} = req.body;
    try {
        const company = await db.collection('cards').findOne({ _id: new ObjectId(id) });
        if (!company) {
            return res.status(404).send('Company not found');
        }
        const alreadyDonated = company.donated || 0;
        console.log(alreadyDonated);
        console.log(amount);
        console.log(parseFloat(alreadyDonated)+parseFloat(amount));
        await db.collection('cards').updateOne({ _id: new ObjectId(id) }, { $set: { donated: parseFloat(alreadyDonated)+parseFloat(amount) } });
        res.status(200).send('Donation added successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
})
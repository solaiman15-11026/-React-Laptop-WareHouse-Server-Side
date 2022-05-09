const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" })
    }
    next();
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@cluster0.plbgo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const inventoryCollecttion = client.db('carWarehouse').collection('inventory');

        // get inventory items
        app.get('/inventory', async (req, res) => {
            const query = {}
            const cursor = inventoryCollecttion.find(query);
            const inventories = await cursor.toArray();
            res.send(inventories)
        });

        // get one inventory item
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await inventoryCollecttion.findOne(query);
            res.send(inventory);
        })

        // post one inventory item
        app.post('/inventory', async (req, res) => {
            const newInventory = req.body;
            const result = await inventoryCollecttion.insertOne(newInventory);
            res.send(result)
        })

        // delete one inventory
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await inventoryCollecttion.deleteOne(query);
            res.send(result)
        })

        // delivery 
        app.put('/inventory/decrease/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await inventoryCollecttion.updateOne(query, {
                $inc: { quantity: -1 }

            })
            res.send(inventory)
        })

        // restore
        app.put('/inventory/increase/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const quantity = parseInt(req.body.quantity);
            const inventory = await inventoryCollecttion.findOne(query);
            const newQuantity = quantity + inventory.quantity;

            const updateQuantity = await inventoryCollecttion.updateOne(query, {
                $set: { quantity: newQuantity }
            })
            res.send(updateQuantity);
        })

        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

        // add item
        app.get('/myInventory', verifyJWT, async (req, res) => {
            const email = req.query.email;
            console.log(email)
            const query = { email: email }
            const cursor = inventoryCollecttion.find(query);
            const items = await cursor.toArray();
            res.send(items)
        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running Car Warehouse Server')
})

app.listen(port, (req, res) => {
    console.log('Listening to port', port)
})
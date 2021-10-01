const express = require('express')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const level = require('level')
const idGenerator = require('./src/idGenerator.js')
const handlers = require('./src/handlers.js')

const app = express()
const idGen = new idGenerator()
const db = level('src/db/db', (err, db) => {
    if (err) {
        throw err
    }
    console.log('db initiated');
})

const storage = multer.diskStorage({
    destination: 'src/db/img/',
    filename: (req, file, cb) => {
        cb(null, idGen.getNextId() + path.extname(file.originalname))
    }
})
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg') {
            cb(null, true)
        } else {
            cb(null, false)
        }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
})

// middleware

app.use(express.static(path.resolve(__dirname, 'public')))

// handlers

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/index.html'))
})

app.post('/upload', upload.single('img'), (req, res) => {
    if (req.file) {
        try {
            let info = handlers.uploadHandler(req.file, idGen.getNextId(), db)

            fs.readFile(info.path, (err, data) => {
                if (err) {
                    throw err
                } else {
                    info.body = data
    
                    res.status(200)
                    res.send(info)
                }
            })
        } catch (error) {
            console.log(error);
        }
    } else {
        res.status(401)
        res.send({
            err: 'multer error'
        })
    }
})

app.get('/list', (req, res) => {
    try {
        const dbList = handlers.listHandler(db)
        console.log(`dbList: ${dbList}`);
        res.status(200)
        res.send(dbList)
    } catch (error) {
        console.log(error);

        res.status(500)
        res.send({
            err: 'dbread err'
        })
    }
})

app.get('/image/:id', (req, res) => {
    console.log('getimg: ' + req.params.id)

    res.send(req.params.id);
})

app.delete('image/:id', (req, res) => {
    console.log('del: ' + req.params.id)
    res.send(req.params.id)
})

app.get('/merge', (req, res) => {
    console.log(req.body);
    res.send(req.body)
})


const PORT = 8080
app.listen(PORT, () => {
    console.log(`listening at http://localhost:${PORT}/`);
})
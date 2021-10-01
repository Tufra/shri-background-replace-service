const express = require('express')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const level = require('level')
const bp = require('body-parser')
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
app.use(bp.urlencoded({extended: true}))

// handlers

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/index.html'))
})

app.post('/upload', upload.single('img'), async (req, res) => {
    if (req.file) {
        try {
            let info = await handlers.uploadHandler(req.file, idGen.getNextId(), db)

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
        res.send('file uploading error')
    }
})

app.get('/list', async (req, res) => {
    try {
        const dbList = await handlers.listHandler(db)
        console.log(`dbList: ${dbList}`);
        res.status(200)
        res.send(dbList)
    } catch (error) {
        console.log(error);

        res.status(500)
        res.send(error.message)
    }
})

app.get('/image/:id', async (req, res) => {
    try {
        const fileInfo = await handlers.downloadHandler(req.params.id, db)
        console.log('obj: ' + JSON.stringify(fileInfo));
        let stream = fs.createReadStream(fileInfo.path)
        stream.pipe(res)
    } catch (error) {
        console.log(error instanceof Error);
        res.status(404)
        res.send(error.message)
    }
})

app.delete('image/:id', (req, res) => {
    try {
        handlers.deleteHandler(id, db)
    } catch (error) {
        res.status(404)
        res.send(error)
    }
})

app.get('/merge', async (req, res) => {
    let {front, back, color, threshold} = req.query
    console.log(typeof color);

    try {
        let result = await handlers.mergeHandler(front, back, color.split(','), threshold, db)
        result.pipe(res)

    } catch (error) {
        console.log(`server: ${error}`);
        res.status(400)
        res.send(error.message)
    }
    
})


const PORT = 8080
app.listen(PORT, () => {
    console.log(`listening at http://localhost:${PORT}/`);
})
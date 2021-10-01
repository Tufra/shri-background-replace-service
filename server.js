const express = require('express')
const path = require('path')
const bp = require('body-parser')
const handlers = require('./src/handlers.js')

const app = express()

app.use(bp.urlencoded())
app.use(bp.json())

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/index.html'))
})

app.post('/upload', (req, res) => {
    console.log('upload: ' + req.body);
})

app.get('/list', (req, res) => {
    console.log('getlist')
})

app.get('/image/:id', (req, res) => {
    console.log('getimg: ' + req.body.id)
})

app.delete('image/:id', (req, res) => {
    console.log('del: ' + req.body.id)
})

app.get('/merge', (req, res) => {
    console.log(re);
})

handlers.initHandlers(app)

const PORT = 3000
app.listen(PORT, () => {
    console.log(`listening at http://localhost:${PORT}/`);
})
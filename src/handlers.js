const fs = require('fs');
const path = require('path');

module.exports = {
    /** 
     * Функция добаваляет в бд информацию о файле и возвращает объект с ней
     * 
     * @param {Object} file Файл multer
     * @param {String} id ID файла
     * @param {Object} db Объект базы данных
     * 
     * @returns {Object} Объект информации о картинке
     */
    uploadHandler(file, id, db) {
        let objInfo = {
            id: id,
            uploadedAt: Date.now(),
            size: file.size,
            path: file.path,
            mimetype: file.mimetype
        }
        console.log(objInfo);
        db.put(id, JSON.stringify(objInfo), (err) => {
            if (err) {
                throw err
            }
        })
        return objInfo
    },

    /** 
     * Функция формирует массив объектов из базы данных
     * и добавляет к каждому объекту Buffer соответствующего файла
     * 
     * @param {Object} db Объект базы данных
     * 
     * @returns {Array} Массив с информацией о каждом объекте в бд
     */
    listHandler(db) {
        let stream = db.createValueStream()
        let buffer = []
        let readStack = []
        stream.on('data', (data) => {
            let info = JSON.parse(data)
            console.log(`on ${info.id}`);
            console.log(`start reading ${info.id}`);
            readStack.push(
                new Promise((resolve, reject) => {
                    fs.readFile(info.path, async (err, filedata) => {
                        if (err) {
                            reject()
                            throw err
                        }
                        info.body = filedata
                        buffer.push(info.id)
                        console.log('+buf: ' + info.id);
                        console.log(`stop reading ${info.id}`);
                        resolve()
                    })
                })
            )
            
        })
        stream.on('end', async() => {
            await Promise.all(readStack)
            console.log(`list: ${buffer}`);
            return buffer
        })
    }

}
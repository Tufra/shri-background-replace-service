const fs = require('fs');
const path = require('path');
const backrem = require('backrem')
const imgsize = require('image-size')

module.exports = {
    /** 
     * Функция добаваляет в бд информацию о файле и возвращает ID картинки
     * 
     * @param {Object} file Файл multer
     * @param {String} id ID файла
     * @param {Object} db Объект базы данных
     * 
     * @returns {String} ID картинки
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
        return objInfo.id
    },

    /** 
     * Функция формирует массив объектов из базы данных
     * и добавляет к каждому объекту Buffer соответствующего файла
     * 
     * @param {Object} db Объект базы данных
     * 
     * @returns {Object[]} Массив с информацией о каждом объекте в бд
     */
    async listHandler(db) {
        let stream = db.createValueStream()
        let buffer = []
        let error
        let prom = () => {
            return new Promise((resolve) => {
                let readStack = []
                stream.on('data', (data) => {
                    let info = JSON.parse(data)
                    console.log(`on ${info.id}`);
                    console.log(`start reading ${info.id}`);
                    let obj = {
                        id: info.id,
                        uploadedAt: info.uploadedAt,
                        size: info.size
                    }
                    buffer.push(obj)
                })
                stream.on('end', async() => {

                    console.log(`list: ${buffer}`);
                    resolve()
                })
            })
        }

        await prom().catch((err) => {throw err})

        //if (error) throw error

        return buffer
    },


    /**
     * Функция ищет картинку в бд по ID
     * 
     * @throws Not Found
     * 
     * @param {String} id ID картинки
     * @param {Object} db Объект бд
     * @returns Объект с информацией о картинке
     */
    async downloadHandler(id, db) {
        let info = {}
        // let prom = () => new Promise((resolve, reject) => {
        //     db.get(id, (err, value) => {
        //         if (err) {
        //             error = err
        //             reject(err)
        //         }
    
        //         console.log(`get: ${id}`)
                
        //         try {
        //             info = JSON.parse(value)
        //             console.log(`found: ${info}`);
        //             resolve()
        //         } catch (error) {
        //             reject(error)
        //         }
        //     })
        // })
        // await prom().catch((err) => {throw err})
        // console.log('here');
        // //if (error) throw error

        await db.get(id).then((value) => {
            try {
                info = JSON.parse(value)
                console.log(`found: ${info}`);
            } catch (error) {
                console.log(error);
                throw err
            }
        }).catch((err) => {
            console.log(err);
            throw err
        })

        let obj = info
        console.log(obj);
        return obj
    },

    /**
     * Функция удаляет объект с заданным ID
     * 
     * @throws IO? 
     * 
     * @param {String} id ID картинки
     * @param {Object} db Объект бд
     */
    async deleteHandler(id, db) {
        let info
        console.log(`deleting ${id}`);
        let prom = () => new Promise((resolve, reject) => {
            db.get(id, (err, value) => {
                if (err) {
                    error = err
                    reject(err)
                }
    
                console.log(`get: ${id}`)
                
                try {
                    info = JSON.parse(value)
                    
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        })

        await prom().catch((err) => {throw err})
        await db.get(id).then(async (value) => {
            console.log(`deleted ${id}`);
            try {
                info = JSON.parse(value)
                console.log(`found: ${info}`);
            } catch (error) {
                console.log(error);
                throw error
            }

            await db.del(id).catch((err) => {throw err})
        }).catch((err) => {
            console.log(err)
            throw err
        })
        console.log(`path ${info.path}`);
        return info.path
    },

    
    /**
     * 
     * @param {String} frontId 
     * @param {String} backId 
     * @param {String[3]} color 
     * @param {number} threshold 
     * @param {Object} db 
     * @returns 
     */
    async mergeHandler(frontId, backId, color, threshold, db) {
        let frontPath
        let backPath
        let newImageStream
        let error

        console.log('merging');

        let prom = async () => new Promise(async (globResolve, globReject) => {

            let numericColor
            let numericThreshold
                
            try {
                numericColor = color.map((item) => parseInt(item))
                numericThreshold = parseInt(threshold)
            } catch (error) {
                console.log(error);
                error = error
            }
            
            let findFront = () => new Promise((resolve, reject) => {
                db.get(frontId, (err, value) => {
                    if (err) {
                        console.log(error);
                        error = err
                    }
        
                    console.log(`get: ${frontId}`)
                    
                    try {
                        info = JSON.parse(value)
                        frontPath = info.path
                        console.log(`found: ${info}`);
                        resolve()
                    } catch (error) {
                        console.log(error);
                        reject(error)
                    }
                })
            })
            let findBack = () => new Promise((resolve, reject) => {
                db.get(backId, (err, value) => {
                    if (err) {
                        error = err
                    }
        
                    console.log(`get: ${backId}`)
                    
                    try {
                        info = JSON.parse(value)
                        backPath = info.path
                        console.log(`found: ${info}`);
                        resolve(backPath)
                    } catch (error) {
                        console.log(error);
                        reject(error)
                    }
                })
            })

            await Promise.all([findFront(), findBack()])
            
            try {

        
                if (!this.compareDimensions(frontPath, backPath)) {
                    error = Error('Различные размеры')
                    globReject()
                } 
                
                console.log('genereating frontStream');
                let frontStream = fs.createReadStream(frontPath)
                
                console.log('genereating backStream');
                let backStream = fs.createReadStream(backPath)

                console.log(`generating image: ${numericColor}; ${numericThreshold}`);
                newImageStream = await backrem.replaceBackground(frontStream, backStream, numericColor, numericThreshold)
                console.log('generated');

                globResolve()
   
            } catch (err) {
                console.log(`merge catch: ${err.message}`);
                error = err
                console.log(error instanceof Error);
                (error)
            }

        })

        await prom().catch((err) => { throw error })
        console.log('mmm');
        
        console.log(`return ${newImageStream}`);
        return newImageStream
    },

    /**
     * Функция сравнивает размеры 2 картинок и возвращает True если они равны
     * 
     * @param {String} frontPath Путь до первой картинки
     * @param {String} backPath Путь до второй картинки
     * @returns {True | False} Одинаковы ли размеры
     */

    compareDimensions(frontPath, backPath) {
        let frontDims = imgsize(frontPath)
        let backDims = imgsize(backPath)

        if (frontDims.width === backDims.width &&
            frontDims.height === backDims.height) {
                return true
            } else {
                return false
            }
   }

}
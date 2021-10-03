const fs = require('fs')
const path = require('path')

module.exports = class idGenerator {
    
    
    /** 
     * Создает экземпляр генератора ID
     * 
     * @constructor 
     */
    constructor() {
        fs.readFile(path.resolve(__dirname, 'idGen.config.json')).then(data => {
            this.currentId = BigInt(data.lastId)
        }).catch((err) => {
            this.currentId = 0
        })
    }


    /**
     * Функция возвращает последний ID
     * 
     * @returns {String} Последний ID
     */
    getCurrentId() {
        return 'id' + this.currentId.toString()
    }


    /** 
     * Функция формирует следующий ID для файла
     * 
     * @returns {String} Следующий ID
     */
    getNextId() {
        let nextId = this.currentId + 1n
        this.currentId = nextId
        fs.writeFile(path.resolve(__dirname, 'idGen.config.js'), {})
        return 'id' + nextId.toString()
    }
}
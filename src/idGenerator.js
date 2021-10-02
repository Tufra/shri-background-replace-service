module.exports = class idGenerator {
    
    
    /** 
     * Создает экземпляр генератора ID
     * 
     * @constructor
     * 
     * @param {*} lastId 
     */
    constructor(lastId = 0) {
        this.currentId = BigInt(lastId)
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
        return 'id' + nextId.toString()
    }
}
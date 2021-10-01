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
     * Функция формирует следующий ID для файла
     * 
     * @returns {String} Следующий ID
     */
    getNextId() {
        let nextId = this.currentId + 1n
        this.currentId = nextId
        return 'abobus' + nextId.toString() + 'avtobus'
    }
}
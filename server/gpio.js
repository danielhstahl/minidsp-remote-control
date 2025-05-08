//gpio:
//01 is 26 -> 7
//02 is 20 -> 
//03 is 21 -> 9
const { writeFile, readFile } = require('fs')

const PATH = '/sys/class/gpio'
const DIR_IN = 'in'
const DIR_OUT = 'out'
const OFF = '0'
const ON = '1'

const promisify = file_fn => (v1, v2) => new Promise((res, rej) => {
    file_fn(v1, v2, (err, v) => {
        if (err) {
            rej(err)
        }
        else {
            res(v)
        }
    })
})

const writeFilePs = promisify(writeFile)
const readFilePs = promisify(readFile)

const openPin = (pin) => {
    return writeFilePs(PATH + '/export', pin)
}

const closePin = (pin) => {
    return writeFilePs(PATH + '/unexport', pin)
}

const toggle = (pin, type) => {
    return writeFilePs(PATH + `/gpio${pin}/direction`, DIR_OUT).then(() => {
        return writeFilePs(PATH + `/gpio${pin}/value`, type)
    })
}
const turnOn = (pin) => {
    return toggle(pin, ON)
}

const turnOff = (pin) => {
    return toggle(pin, OFF)
}

const getStatus = (pin) => {
    return writeFilePs(PATH + `/gpio${pin}/direction`, DIR_IN).then(() => {
        return readFilePs(PATH + `/gpio${pin}/value`, 'utf-8')
    })
}
module.exports = {
    turnOn,
    turnOff,
    getStatus,
    openPin
}

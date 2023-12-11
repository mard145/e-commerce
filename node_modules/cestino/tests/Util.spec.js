var Util = require('../src/Util')

describe('Utilities for common use', function () {
    it('should check numbers', function () {
        expect(Util.isNumber(89)).toBe(true)
        expect(Util.isNumber('89')).toBe(false)
        expect(Util.isNumber(89.5)).toBe(true)
        expect(Util.isNumber([])).toBe(false)
        expect(Util.isNumber({})).toBe(false)
        expect(Util.isNumber(function () {})).toBe(false)
        expect(Util.isNumber(NaN)).toBe(false)
    })

    it('should check floats', function () {
        expect(Util.isFloat(89)).toBe(false)
        expect(Util.isFloat('89')).toBe(false)
        expect(Util.isFloat(89.5)).toBe(true)
        expect(Util.isFloat([])).toBe(false)
        expect(Util.isFloat({})).toBe(false)
        expect(Util.isFloat(function () {})).toBe(false)
        expect(Util.isFloat(NaN)).toBe(false)
    })

    it('should check integers', function () {
        expect(Util.isInt(89)).toBe(true)
        expect(Util.isInt('89')).toBe(false)
        expect(Util.isInt(89.5)).toBe(false)
        expect(Util.isInt([])).toBe(false)
        expect(Util.isInt({})).toBe(false)
        expect(Util.isInt(function () {})).toBe(false)
        expect(Util.isInt(NaN)).toBe(false)
    })

    it('should round to integer', function () {
        expect(Util.round(89)).toBe(89)
        expect(Util.round(89.499)).toBe(89)
        expect(Util.round(89.5)).toBe(90)
        expect(Util.round(-89)).toBe(-89)
        expect(Util.round(-89.499)).toBe(-89)
        expect(Util.round(-89.5)).toBe(-90)
    })

    it('should check emptiness', function () {
        expect(Util.isEmpty('')).toBe(true)
        expect(Util.isEmpty(0)).toBe(true)
        expect(Util.isEmpty('0')).toBe(true)
        expect(Util.isEmpty(0.0)).toBe(true)
        expect(Util.isEmpty(null)).toBe(true)
        expect(Util.isEmpty(false)).toBe(true)
        expect(Util.isEmpty('a')).toBe(false)
        expect(Util.isEmpty(1)).toBe(false)
        expect(Util.isEmpty(0.1)).toBe(false)
    })

    it('left padding', function () {
        expect(Util.lpad('test', 3, '#+')).toBe('test')
        expect(Util.lpad('test', 13, '#+')).toBe('#+#+#+#+#test')
        expect(Util.lpad('test', 5, '#+')).toBe('#test')
        expect(Util.lpad('test', 4, '#+')).toBe('test')
        expect(Util.lpad('test', 2, '#+')).toBe('test')
        expect(Util.lpad('tst', 4, '#+')).toBe('#tst')

        expect(Util.lpad('tst', 5, '+')).toBe('++tst')
        expect(Util.lpad('tst', 6, '+-+')).toBe('+-+tst')
    })
})

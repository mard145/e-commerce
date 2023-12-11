/**
 * @param   {Object} root
 * @param   {Function} factory
 *
 * @returns {Object}
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Cestino = root.Cestino || {};
        root.Cestino.Util = factory();
    }
}(this, function () {
    "use strict";

    var moduleAPI;

    /**
     * Is passed data a number?
     *
     * @public
     * @param   {*} n
     * @returns {Boolean}
     */
    function _isNumber(n) {
        return n === +n;
    }

    /**
     * Is passed data of type Integer?
     *
     * @public
     * @param   {*} n
     * @returns {Boolean}
     */
    function _isInt(n) {
        return _isNumber(n) && n === (n|0);
    }

    /**
     * Is passed data of type Float?
     *
     * @public
     * @param   {*} n
     * @returns {Boolean}
     */
    function _isFloat(n) {
        return _isNumber(n) && n !== (n|0);
    }

    /**
     * Is passed data empty?
     *
     * @public
     * @param   {*} val
     * @returns {Boolean}
     */
    function _isEmpty(val) {
        return ! val || val === '0';
    }

    /**
     * Pad a string on left side to a certain length with another string.
     *
     * @public
     * @param   {String} str
     * @param   {Integer} width
     * @param   {String} padStr
     * @returns {String}
     */
    function _lpad(str, width, padStr) {
        var padding;

        if (! _isInt(width)) {
            throw new TypeError('Parameter width has to be an int!');
        }

        str = str + '';
        if (str.length >= width) {
            return str;
        }

        padStr = padStr || '0';
        padStr = padStr + '';

        padding = new Array(Math.ceil((width - str.length) / padStr.length) + 1).join(padStr);
        return padding.slice(0, width - str.length) + str;
    }

    /**
     * Other than `Math.round()`, this function rounds to nearest away from zero
     *
     * @public
     * @param   {Number} number
     * @returns {Integer}
     */
    function _round(number) {
        return parseInt(number.toFixed(0), 10);
    }

    /**
     * Utilities used to check and modify basic data types.
     * 
     * @module Cestino/Util
     * @borrows <anonymous>~_isNumber as isNumber
     * @borrows <anonymous>~_isInt as isInt
     * @borrows <anonymous>~_isFloat as isFloat
     * @borrows <anonymous>~_isEmpty as isEmpty
     * @borrows <anonymous>~_lpad as lpad
     * @borrows <anonymous>~_round as round
     */
    moduleAPI = {
        isNumber: _isNumber,
        isInt: _isInt,
        isFloat: _isFloat,
        isEmpty: _isEmpty,
        lpad: _lpad,
        round: _round
    };

    return moduleAPI;
}));

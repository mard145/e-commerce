/**
 * Requirements: IE9+
 *
 * @param   {Object} root
 * @param   {Function} factory
 *
 * @returns {Object}
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['cestino/Util'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./Util'));
    } else {
        root.Cestino = root.Cestino || {};
        root.Cestino.PriceFormatter = factory(root.Cestino.Util);
    }
}(this, function (Util) {
    "use strict";

    /**
     * Formatting integers to decimal currency representation.
     * 
     * @module Cestino/PriceFormatter
     * @requires Cestino/Util
     */

    /**
     * Creates an object to convert integer price to decimal price (e. g. cents to dollar/euro).
     * 
     * @constructor
     * @private
     * @global
     * @param   {String} decimalSeparator
     * @param   {String} thousandsSeparator
     * @param   {Integer} decimalCount
     * @borrows <anonymous>~_format as format
     */
    function PriceFormatter(decimalSeparator, thousandsSeparator, decimalCount) {
        decimalCount = decimalCount || 2;
        thousandsSeparator = thousandsSeparator || '';
        if ([2,3].indexOf(decimalCount) === -1) {
            throw new RangeError('The decimal count has to be 2 or 3!');
        }
        if (['.',',','٫'].indexOf(decimalSeparator) === -1) {
            throw new RangeError(
                ['"', decimalSeparator, '" is not a typical decimal separator'].join('')
            );
        }

        /** @member {Integer} */
        this[' decimalCount'] = decimalCount;
        /** @member {String} */
        this[' thousandsSeparator'] = thousandsSeparator;
        /** @member {String} */
        this[' decimalSeparator'] = decimalSeparator;
    }

    /**
     * @param   {String} str
     * @param   {Integer} size
     *
     * @returns {Array}
     * @private
     */
    function _chunks(str, size) {
        var str = str + '', numChunks, firstSize, chunks;

        if (! Util.isInt(size)) {
            throw new TypeError('Parameter size has to be an Int!');
        }

        numChunks = Math.ceil(str.length / size);
        firstSize = str.length % size || size;
        chunks = new Array(numChunks);

        while(--numChunks > 0) {
            chunks[numChunks] = str.substr((numChunks-1)*size+firstSize, size);
        }
        chunks[0] = str.substr(0, firstSize);

        return chunks;
    }

    /**
     * Converts the passed integer value into configured format.
     *
     * @param   {Integer} int
     *
     * @returns {String}
     * @private
     */
    function _format(int) {
        var currencyValue;

        if (! Util.isInt(int)) {
            throw new TypeError('Parameter int has to be an Int!');
        }

        currencyValue = parseInt((int + '').slice(0, this[' decimalCount'] * -1)) || 0;

        return [
            _chunks(currencyValue, 3).join(this[' thousandsSeparator']),
            this[' decimalSeparator'],
            Util.lpad(int % Math.pow(10, this[' decimalCount']), this[' decimalCount'])
        ].join('');
    }

    // PriceFormatter-API
    PriceFormatter.prototype = {
        format: _format
    };

    // Module-API
    return {
        /**
         * Creates an object to convert integer price to decimal price (e. g. cents to dollar/euro).
         * 
         * @alias   module:Cestino/PriceFormatter.create
         * @param   {String} decimalSeparator
         * @param   {String} thousandsSeparator
         * @param   {Number} decimalCount
         * @returns {PriceFormatter}
         */
        create: function (decimalSeparator, thousandsSeparator, decimalCount) {
            return new PriceFormatter(decimalSeparator, thousandsSeparator, decimalCount);
        }
    };
}));

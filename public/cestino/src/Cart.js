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
        define(
            ['cestino/Util', 'cestino/BasicCartService', 'cestino/PriceFormatter'],
            factory
        );
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('./Util'), require('./BasicCartService'), require('./PriceFormatter')
        );
    } else {
        root.Cestino = factory(
            root.Cestino.Util, root.Cestino.BasicCartService, root.Cestino.PriceFormatter
        );
    }
}(this, function (Util, BasicCartService, PriceFormatter) {
    "use strict";

    /**
     * A basic shopping cart implementation in javascript.
     * @module Cestino
     * @requires Cestino/BasicCartService
     * @requires Cestino/PriceFormatter
     * @requires Cestino/Util
     */

    /**
     * Callback that will be fired, if registered and the cart has been load from json.
     * @callback module:Cestino~loadCallback
     * @param {Cart} cart
     * @abstract
     */
    /**
     * Callback that will be fired, if registered and a product has been add to cart.
     * @callback module:Cestino~addProductCallback
     * @param {CartPosition} position
     * @abstract
     */
    /**
     * Callback that will be fired, if registered and a product has been removed from cart.
     * @callback module:Cestino~removeProductCallback
     * @param {CartPosition} position
     * @abstract
     */
    /**
     * Callback that will be fired, if registered and a product-position in cart has been
     * changed.
     * @callback module:Cestino~changePositionCallback
     * @param {CartPosition} position
     * @abstract
     */

    var module,
        INCOMPLETE_MARKER = '__INCOMPLETE__',
        availableEvents = ['load', 'add', 'change', 'remove'];

    /**
     * Cart-API
     */
    Cart.prototype = {
        add:                    _addProduct, /* Params: oProduct, oQuantity, sShippingGroup, aProductFeatures */
        on:                     _on, /* Params: kind, fnListener */
        off:                    _off, /* Params: kind, fnListener */
        calculateGroup:         _calculateGroup, /* Params: sShippingGroup */
        calculate:              _calculate, /* no params */
        deletePosition:         _deletePosition, /* Params: sIdCartPosition */
        getShippingGroupByName: _getShippingGroupByName, /* Params: sShippingGroup */
        getPositionsOfGroup:    _getPositionsOfGroup, /* Params: sShippingGroup */
        getShippingGroups:      _getGroups,
        getPositionById:        _getPositionById, /* Params: sIdCartPosition */
        toJSON:                 _toJSON,
        fromJSON:               _fromJSON,
        walk:                   _walk /* Params: fnCallback */
    };

        // CartPosition-API
        CartPosition.prototype = {
            calculate: _calculateCartPosition,
            incrementAmount: _incrementAmount, /* Params: amount */
            decrementAmount: _decrementAmount, /* Params: amount */
            replaceQuantity: _replaceQuantity /* Params: quantity-object */
        };


    /**
     * Class to manage a shopping cart. The cart only supports product-positions
     * separated by shipping-groups.
     * All prices were handled without tax; Extend the model to consider tax
     * calculation.
     * You have to implement costs of payment on your own.
     *
     * @constructor
     * @global
     * @private
     * @param {Object} oService
     * @borrows <anonymous>~_addProduct as add
     * @borrows <anonymous>~_on as on
     * @borrows <anonymous>~_off as off
     * @borrows <anonymous>~_calculateGroup as calculateGroup
     * @borrows <anonymous>~_calculate as calculate
     * @borrows <anonymous>~_deletePosition as deletePosition
     * @borrows <anonymous>~_getShippingGroupByName as getShippingGroupByName
     * @borrows <anonymous>~_getPositionsOfGroup as getPositionsOfGroup
     * @borrows <anonymous>~_getGroups as getShippingGroups
     * @borrows <anonymous>~_getPositionById as getPositionById
     * @borrows <anonymous>~_toJSON as toJSON
     * @borrows <anonymous>~_fromJSON as fromJSON
     * @borrows <anonymous>~_walk as walk
     */
    function Cart(oService) {
        oService = oService || BasicCartService.create();
        if (typeof oService['setProductDataToCart'] !== 'function') {
            throw new TypeError([
                'The service has to be able to find Products! ', "\n",
                'Implement a function named "setProductDataToCart" that takes one argument of type ',
                'Object. ', "\n", 'The keys of the object has to represent product-ids, the ',
                'values has to be arrays of selected product-feature-ids.'
            ].join(''));
        }

        /** @member {Integer} */
        this[' positionId'] = 1;

        /**
         * @member {Object}
         * @instance
         */
        this[' oCartService'] = oService;
        /** @member {CartPosition[]} */
        this[' positions'] = {};
        /**
         * @private
         * @member {Object}
         */
        this[' shippingGroups'] = {};
        /** @member {Object} */
        this[' listener'] = {
            /**
             * Event reporting that a product has been add to cart.
             *
             * @event module:Cestino~add
             * @param {CartPosition} position
             */
            add: [],
            /**
             * Event reporting that a product has been removed from cart.
             *
             * @event module:Cestino~remove
             * @param {CartPosition} position
             */
            remove: [],
            /**
             * Event reporting that a product-position in cart has been changed.
             *
             * @event module:Cestino~change
             * @param {CartPosition} position
             */
            change: [],
            /**
             * Event reporting that the cart has been load from json.
             * @event module:Cestino~load
             * @param {Cart} cart
             */
            load: []
        };
    }

        /**
         * The cart reference will be injected on instancing separately.
         *
         * @constructor
         * @private
         * @global
         * @param   {String} sId
         * @param   {Product} oProduct
         * @param   {ProductFeature[]} aFeatures
         * @param   {ProductQuantity} oQuantity
         */
        function CartPosition(sId, oProduct, aFeatures, oQuantity) {
            this[' id']       = sId;
            this[' product']  = oProduct;
            this[' features'] = aFeatures;
            this[' quantity'] = oQuantity;
            this[' cart']     = null;
        }

            /**
             * @method CartPosition#getId
             * @returns {String}
             */
            CartPosition.prototype.getId = function() {
                return this[' id'];
            };

            /**
             * @method CartPosition#getProduct
             * @returns {Product}
             */
            CartPosition.prototype.getProduct = function() {
                return this[' product'];
            };

            /**
             * @method CartPosition#getFeatures
             * @returns {ProductFeature[]}
             */
            CartPosition.prototype.getFeatures = function() {
                return this[' features'];
            };

            /**
             * @method CartPosition#getQuantity
             * @returns {ProductQuantity}
             */
            CartPosition.prototype.getQuantity = function() {
                return this[' quantity'];
            };

            /**
             * @method CartPosition#getCart
             * @returns {Cart}
             */
            CartPosition.prototype.getCart = function() {
                return this[' cart'];
            };

    /**
     * Class to describe a product that was add to cart.
     *
     * @constructor
     * @private
     * @global
     * @param   {String} id
     * @param   {String} title
     * @param   {Integer} price
     * @borrows module:Cestino~Cart.Product#getPrice as getPrice
     * @borrows module:Cestino~Cart.Product#getTitle as getTitle
     */
    Cart.Product = function (id, title, price) {
        if (Util.isEmpty(id) || (typeof id !== 'string' && ! Util.isInt(id))) {
            throw new RangeError('The product has to have an id of type string or integer!');
        }
        if (Util.isEmpty(title) || typeof title !== 'string') {
            throw new RangeError('The product has to have a title of type string!');
        }
        if (! Util.isInt(price) || price < 0) {
            throw new TypeError('The price has to be an positive integer!');
        }

        this[' id']    = id;
        this[' title'] = title;
        // Integers only (cents)!
        this[' price'] = price;
    };

        /**
         * @method Product#getId
         * @returns {String}
         */
        Cart.Product.prototype.getId = function () {
            return this[' id'];
        };

        /**
         * Returns the title of the product.
         * @method  Product#getTitle
         * @returns {String}
         */
        Cart.Product.prototype.getTitle = function () {
            return this[' title'];
        };

        /**
         * Returns the price of the product. Overwrite this method to modify the cart calculation
         * to your needs (e. g. to add tax)
         * @method  Product#getPrice
         * @param   {CartPosition=} oCartPosition
         * @returns {Integer}
         */
        Cart.Product.prototype.getPrice = function (oCartPosition) {
            return this[' price'];
        };

    /**
     * Class to represent the quantity structure of a product in a position. No limits or ranges
     * will be checked, you have to implement it by yourself!
     * 
     * @constructor
     * @private
     * @global
     * @param   {Integer} amount
     * @param   {Integer=} dimX
     * @param   {Integer=} dimY
     * @param   {Integer=} dimZ
     * @borrows module:Cestino~Cart.ProductQuantity#getFactor as getFactor
     */
    Cart.ProductQuantity = function (amount, dimX, dimY, dimZ) {
        // Integers only!
        this[' amount'] = amount;

        // Also don't use float-values with dimensions, change the unit for the dimensions instead.
        // The price of the product relates to the standard value of the dimension unit;
        // For example:
        // - The dimension unit is inch and the product a tissue, the price has to be essential for
        //   a square inch
        // - Or the product is a sponge :) that will be individually cut for the customer in a cubic
        //   shape. The dimension unit is defined to cm - then the standard value is cubic
        //   centimeters and the price has to be defined in relation to cubic centimeters!
        this[' dimensionX'] = dimX || 1;
        this[' dimensionY'] = dimY || 1;
        this[' dimensionZ'] = dimZ || 1;

        if (! (Util.isInt(this[' amount'])
                && Util.isInt(this[' dimensionX'])
                && Util.isInt(this[' dimensionY'])
                && Util.isInt(this[' dimensionZ']))
        ) {
            throw new TypeError([
                'Invalid try to instanciate quantity. Not all parameters are integers! ',
                "\ndata object: ", JSON.stringify(this), "\n"
            ].join(''));
        }
    };

        /**
         * @method ProductQuantity#getAmount
         * @returns {Integer}
         */
        Cart.ProductQuantity.prototype.getAmount = function () {
            return this[' amount'];
        };

        /**
         * @method ProductQuantity#getLength
         * @returns {Integer}
         */
        Cart.ProductQuantity.prototype.getLength = function () {
            return this[' dimensionX'];
        };

        /**
         * @method ProductQuantity#getWidth
         * @returns {Integer}
         */
        Cart.ProductQuantity.prototype.getWidth = function () {
            return this[' dimensionX'];
        };

        /**
         * @method ProductQuantity#getHeight
         * @returns {Integer}
         */
        Cart.ProductQuantity.prototype.getHeight = function () {
            return this[' dimensionY'];
        };

        /**
         * @method ProductQuantity#getDepth
         * @returns {Integer}
         */
        Cart.ProductQuantity.prototype.getDepth = function () {
            return this[' dimensionZ'];
        };

        /**
         * Calculates the quantity factor for the product. Overwrite this method to modify the cart
         * calculation to your needs (e. g. to convert into another scale unit).
         * @method  ProductQuantity#getFactor
         * @param   {CartPosition=} oCartPosition
         * @returns {Integer}
         */
        Cart.ProductQuantity.prototype.getFactor = function (oCartPosition) {
            return this.getAmount() * this.getWidth() * this.getHeight() * this.getDepth();
        };

    /**
     * Class to describe a selected feature of a product.
     *
     * @constructor
     * @private
     * @global
     * @param   {(String|Integer)} id
     * @param   {String} label
     * @param   {Integer=} price
     * @borrows module:Cestino~Cart.ProductFeature#getPrice as getPrice
     * @borrows module:Cestino~Cart.ProductFeature#getLabel as getLabel
     */
    Cart.ProductFeature = function (id, label, price) {
        price = price || 0;

        if (Util.isEmpty(id) || (typeof id !== 'string' && ! Util.isInt(id))) {
            throw new RangeError('The product feature has to have an id of type string or integer!');
        }
        if (Util.isEmpty(label) || typeof label !== 'string') {
            throw new RangeError('The product feature has to have a title of type string!');
        }
        if (! Util.isInt(price) || price < 0) {
            throw new TypeError('The price has to be an positive integer!');
        }

        this[' id']    = id;
        // Integers only (cents)!
        this[' price'] = price;
        this[' label'] = label;
    };

        /**
         * @method ProductFeature#getId
         * @returns {String}
         */
        Cart.ProductFeature.prototype.getId = function () {
            return this[' id'];
        };

        /**
         * Returns the price of a feature selected to a product. Overwrite this method to modify
         * the cart calculation to your needs
         * @method  ProductFeature#getPrice
         * @param   {CartPosition=} oCartPosition
         * @returns {Integer}
         */
        Cart.ProductFeature.prototype.getPrice = function (oCartPosition) {
            return this[' price'];
        };

        /**
         * Returns the label of a feature selected to a product.
         * @method  ProductFeature#getLabel
         * @returns {Integer}
         */
        Cart.ProductFeature.prototype.getLabel = function () {
            return this[' label'];
        };

    /**
     * Represents information about a shipping group
     *
     * @constructor
     * @global
     * @private
     * @param   {String=} sName
     * @borrows module:Cestino~Cart.ShippingGroup#calculate as calculate
     * @borrows module:Cestino~Cart.ShippingGroup#setPrice as setPrice
     * @borrows module:Cestino~Cart.ShippingGroup#getPrice as getPrice
     * @borrows module:Cestino~Cart.ShippingGroup#getName as getName
     * @borrows module:Cestino~Cart.ShippingGroup#getCart as getCart
     */
    Cart.ShippingGroup = function (sName) {
        /**
         * @private
         * @member {String}
         */
        this[' name'] = sName || '';
        /**
         * @private
         * @member {Cart}
         */
        this[' cart'] = null;
        /**
         * @private
         * @member {Integer}
         */
        this[' price'] = 0;
    };

        /**
         * Returns the cost for the whole Shipping group
         * 
         * @method  ShippingGroup#calculate
         * @param   {Boolean} includeShippingGroupCost
         * @returns {Integer}
         */
        Cart.ShippingGroup.prototype.calculate = function () {
            return _calculateGroup.call(
                this.getCart(),
                this.getName(),
                includeShippingGroupCost || true
            );
        };

        /**
         * Sets the cost for shipping of a shipping group.
         * 
         * @method  ShippingGroup#setPrice
         * @param   {Integer} price 
         * @returns {ShippingGroup}
         */
        Cart.ShippingGroup.prototype.setPrice = function (price) {
            if (! Util.isInt(price) || price < 0) {
                throw new TypeError('The price has to be an positive integer!');
            }
            this[' price'] = price;
            return this;
        };

        /**
         * Returns the shipping cost for the group. Overwrite this method to add cost for shipping of a
         * shipping group. You can access the current cart through method-call "this.getCart()".
         * 
         * @method  ShippingGroup#getPrice
         * @returns {Integer}
         */
        Cart.ShippingGroup.prototype.getPrice = function () {
            return this[' price'];
        };

        /**
         * Returns the name of this shipping group.
         * 
         * @method  ShippingGroup#getName
         * @returns {String}
         */
        Cart.ShippingGroup.prototype.getName = function () {
            return this[' name'];
        };

        /**
         * Returns the cart this shipping group belongs to.
         * 
         * @method  ShippingGroup#getCart
         * @returns {Cart}
         */
        Cart.ShippingGroup.prototype.getCart = function () {
            return this[' cart'];
        };


        /**
         * Walks through all positions of the cart, calls passed function and puts position and group to
         * it.
         * 
         * @method  Cart#walk
         * @param   {Function} fnCallback
         * @returns {Cart}
         * @public
         */
        function _walk(fnCallback) {
            var that = this;
    
            this.getShippingGroups().forEach(function (group) {
                that.getPositionsOfGroup(group).forEach(function (oPosition) {
                    fnCallback(oPosition, group);
                });
            });
    
            return this;
        }
    
    
        /**
         * Returns a json-representation of the cart; Only necessary information will be transported to
         * the json-string.
         *
         * @method  Cart#toJSON
         * @returns {String}
         * @public
         */
        function _toJSON() {
            var cart = {date: (new Date()).toISOString(), AutoPosId: this[' positionId'], pos: {}};
    
            this.walk(function (oPosition, group) {
                cart.pos[group] = cart.pos[group] || [];
                cart.pos[group].push({
                    id: oPosition.getId(),
                    product: {
                        id: oPosition.getProduct().getId()
                    },
                    quantity: {
                        amount: oPosition.getQuantity().getAmount(),
                        dimX: oPosition.getQuantity().getWidth(),
                        dimY: oPosition.getQuantity().getHeight(),
                        dimZ: oPosition.getQuantity().getDepth()
                    },
                    features: oPosition.getFeatures().map(function (oFeature) {
                        return oFeature.getId();
                    })
                });
            });
    
            return JSON.stringify(cart);
        }
    
    
        /**
         * Build the cart from JSON
         *
         * @method  Cart#fromJSON
         * @param   {String} sJSON
         * @returns {Cart}
         * @public
         * @fires   module:Cestino~load
         */
        function _fromJSON(sJSON) {
            var that = this, oCart, oPosition, oShippingGroup, internGrpName;
    
            if (Object.keys(this[' positions']).length !== 0) {
                throw new RangeError('Cart has to be empty when loading from a JSON!');
            }
            oCart = JSON.parse(sJSON);
            this[' positionId'] = oCart.AutoPosId;
    
            Object.keys(oCart.pos).forEach(function (group) {
                internGrpName = 'g'+group;
                oShippingGroup = module.ShippingGroup.create(group);
                oShippingGroup[' cart'] = that;
                that[' shippingGroups'][internGrpName] = oShippingGroup;

                oCart.pos[group].forEach(function (position) {
                    oPosition = new CartPosition(
                        position.id,
                        module.Product.create(position.product.id, INCOMPLETE_MARKER, 987654321),
                        position.features.map(function (id) {
                            return module.ProductFeature.create(id, INCOMPLETE_MARKER, 987654321);
                        }),
                        module.ProductQuantity.create(
                            position.quantity.amount,
                            position.quantity.dimX,
                            position.quantity.dimY,
                            position.quantity.dimZ
                        )
                    );
                    oPosition[' cart'] = that;
                    that[' positions'][internGrpName] = that[' positions'][internGrpName] || [];
                    that[' positions'][internGrpName].push(oPosition);
                });
            });
    
            // notify load-listeners on promise resolve
            this[' oCartService'].setProductDataToCart(this)
                .then(function() {
                    that[' listener'].load.forEach(function (fnListener) {
                        fnListener(that);
                    });
                });
    
            return this;
        }


        /**
         * @param {String} sKind
         * @param {CartPosition} oPosition
         * @private
         */
        function _notifyListeners(sKind, oPosition) {
            this[' listener'][sKind].forEach(function (fnListener) {
                fnListener(oPosition);
            });
        }


        /**
         * Creates a position in the cart
         * 
         * @method  Cart#add
         * @param   {Product} oProduct
         * @param   {(ProductQuantity|Integer)} oQuantity
         * @param   {(ShippingGroup|String)} [oShippingGroup=""]
         * @param   {ProductFeature[]}  [aProductFeatures=[]]
         * @returns {String} Id of generated Position
         * @public
         * @fires   module:Cestino~add
         */
        function _addProduct(
            oProduct, oQuantity, oShippingGroup, aProductFeatures
        ) {
            var posId, oPosition,
                oQuantity = oQuantity || (module.ProductQuantity.create(1)),
                oShippingGroup = _getShippingGroupByName.call(this, oShippingGroup)
                    || (module.ShippingGroup.create(oShippingGroup)),
                internGrpName = 'g'+oShippingGroup.getName(),
                aProductFeatures = aProductFeatures || [];

            if (! (oProduct instanceof Cart.Product)) {
                throw new TypeError('The product has to be a instance of Cart.Product!');
            }

            if (Util.isInt(oQuantity)) {
                oQuantity = module.ProductQuantity.create(oQuantity);
            }

            if (! (oQuantity instanceof Cart.ProductQuantity)) {
                throw new TypeError([
                    'The quantity has to be a instance of Cart.ProductQuantity or a positive ',
                    'integer value!'
                ].join(''));
            }

            oShippingGroup[' cart'] = this;
            this[' shippingGroups'][internGrpName] = oShippingGroup;

            this[' positions'][internGrpName] = this[' positions'][internGrpName] || [];

            posId = 'p'+(this[' positionId']++);
            oPosition = new CartPosition(
                posId, oProduct, aProductFeatures, oQuantity
            );
            oPosition[' cart'] = this;
            this[' positions'][internGrpName].push(oPosition);
            _notifyListeners.call(this, 'add', oPosition);

            return posId;
        }


            /**
             * Adds a function that will be invoke when a specific event occurs.
             *
             * @method  Cart#on
             * @param   {String} kind "add" (product), "remove" (product), "change" (position) or "load" (cart)
             * @param   {(module:Cestino~loadCallback|module:Cestino~addProductCallback|module:Cestino~removeProductCallback|module:Cestino~changePositionCallback)} fnListener
             * @returns {Cart}  this-reference for method chaining ...
             * @public
             */
            function _on(kind, fnListener) {
                if (typeof fnListener !== 'function') {
                    throw new TypeError('The passed listener has to be a function!');
                }
                if (availableEvents.indexOf(kind) === -1) {
                    throw new TypeError(kind+' is an unknown event! Try one of these: '+availableEvents.join(', ')+'.');
                }
                this[' listener'][kind].push(fnListener);
                return this;
            }


            /**
             * Removes a function that will be invoke on specific action.
             *
             * @method  Cart#off
             * @param   {string}   kind
             * @param   {(module:Cestino~loadCallback|module:Cestino~addProductCallback|module:Cestino~removeProductCallback|module:Cestino~changePositionCallback)} fnListener
             * @returns {Cart}  this-reference for method chaining ...
             * @public
             */
            function _off(kind, fnListener) {
                var that = this;

                if (availableEvents.indexOf(kind) === -1) {
                    throw new TypeError(kind+' is an unknown event! Try one of these: '+availableEvents.join(', ')+'.');
                }
                this[' listener'][kind].some(function (eListener, idx) {
                    if (fnListener === eListener) {
                        that[' listener'][kind].splice(idx, 1);
                        return true;
                    }
                });

                return this;
            }


        /**
         * Get all defined groups.
         *
         * @method  Cart#getShippingGroups
         * @returns {String[]}
         * @public
         */
        function _getGroups() {
            return Object.keys(this[' positions']).map(function (val) {
                return val.substr(1);
            });
        }


        /**
         * Returns a shipping-group by name.
         * 
         * @method  Cart#getShippingGroupByName
         * @param   {(String|ShippingGroup)} sShippingGroup
         * @returns {(false|ShippingGroup)}
         */
        function _getShippingGroupByName(sShippingGroup) {
            var isInstance = sShippingGroup instanceof Cart.ShippingGroup,
                internGrpName = 'g'+(isInstance && sShippingGroup.getName() || sShippingGroup || '');
            
            return internGrpName in this[' shippingGroups'] && this[' shippingGroups'][internGrpName]
                || isInstance && sShippingGroup
                || false;
        }


        /**
         * Returns the intern name of a passed shipping-group.
         * 
         * @param {(String|ShippingGroup)} sShippingGroup 
         * @private
         */
        function _getInternGroupName(sShippingGroup) {
            var isInstance = sShippingGroup instanceof Cart.ShippingGroup;
            return 'g'+(isInstance && sShippingGroup.getName() || sShippingGroup || '');
        }


        /**
         * Returns all positions of the pssed group.
         *
         * @method  Cart#getPositionsOfGroup
         * @param   {(String|ShippingGroup)} sShippingGroup
         * @returns {CartPosition[]}
         * @public
         */
        function _getPositionsOfGroup(sShippingGroup) {
            var internGrpName = _getInternGroupName.call(this, sShippingGroup);

            if (! (internGrpName in this[' positions'])) {
                throw new ReferenceError(
                    ["No shipping-group with name '", sShippingGroup, "' found!"].join('')
                )
            }

            return this[' positions'][internGrpName];
        }


        /**
         * Calculates the subtotal of a shipping-group.
         *
         * @method  Cart#calculateGroup
         * @param   {(String|ShippingGroup)} sShippingGroup
         * @param   {Boolean} includeShippingGroupCost
         * @returns {Integer}
         * @public
         */
        function _calculateGroup(sShippingGroup, includeShippingGroupCost) {
            var subtotal = 0,
                includeShippingGroupCost = includeShippingGroupCost || false,
                internGrpName = _getInternGroupName.call(this, sShippingGroup);

            this.getPositionsOfGroup(sShippingGroup).forEach(function (ePosition) {
                subtotal += ePosition.calculate();
            });

            return subtotal + (
                includeShippingGroupCost && this[' shippingGroups'][internGrpName].getPrice() || 0
            );
        }


        /**
         * Calculates the total of the whole shopping-cart.
         *
         * @method  Cart#calculate
         * @param   {Boolean} includeShippingGroupCost
         * @returns {Integer}
         * @public
         */
        function _calculate(includeShippingGroupCost) {
            var that = this, total = 0,
                includeShippingGroupCost = includeShippingGroupCost || false;

            _getGroups.call(this).forEach(function (oGroup) {
                total += _calculateGroup.call(that, oGroup, includeShippingGroupCost);
            });

            return total;
        }


        /**
         * Delete a cart-position by id.
         * 
         * @method  Cart#deletePosition
         * @param   {String} sIdCartPosition
         * @returns {CartPosition} The position that was removed
         * @public
         * @fires   module:Cestino~remove
         */
        function _deletePosition(sIdCartPosition) {
            var oPosition,
                oFound = _findPosition.call(this, sIdCartPosition);

            if (! oFound) {
                throw new RefereneceError(["No position with id '", sIdCartPosition, "' found!"].join(''));
            }

            oPosition = this[' positions'][oFound.group].splice(oFound.index, 1)[0];
            _notifyListeners.call(this, 'remove', oPosition);

            return oPosition;
        }


        /**
         * Tries to get a position from given id.
         *
         * @method  Cart#getPositionById
         * @param   {String} sIdCartPosition
         * @returns {CartPosition}
         * @public
         */
        function _getPositionById(sIdCartPosition) {
            var oFound = _findPosition.call(this, sIdCartPosition);

            if (! oFound) {
                throw new ReferenceError([
                    "No position with id '", sIdCartPosition, "' found!"
                ].join(''));
            }

            return this[' positions'][oFound.group][oFound.index];
        }


        /**
         * Search positions by id
         *
         * @param   {String} sIdCartPosition
         * @returns {Object} {"group": "GROUP_AS_STRING", "index": "INDEX_AS_INT"}
         * @private
         */
        function _findPosition(sIdCartPosition) {
            var positions = this[' positions'],
                eFound = false;

            Object.keys(positions).some(function (group) {
                positions[group].some(function (ePosition, idx) {
                    if (ePosition.getId() === sIdCartPosition) {
                        eFound = {"group": group, "index": idx};
                    }
                    return !!eFound;
                });
                return !!eFound;
            });

            return eFound;
        }


        /**
         * Replacing the product quantity in cart position.
         *
         * @method  CartPosition#replaceQuantity
         * @param   {ProductQuantity} oQuantity
         * @returns {CartPosition} this-reference for method chaining ...
         * @public
         * @fires   module:Cestino~change
         */
        function _replaceQuantity(oQuantity) {
            if (! (oQuantity instanceof Cart.ProductQuantity)) {
                throw new TypeError('The quantity has to be a instance of Cart.ProductQuantity!');
            }

            this[' quantity'] = oQuantity;

            _notifyListeners.call(this[' cart'], 'change', this);
            return this;
        }


        /**
         * Incrementing amount of cart position.
         *
         * @method  CartPosition#incrementAmount
         * @param   {Integer} amount
         * @returns {CartPosition}
         * @public
         * @fires   module:Cestino~change
         */
        function _incrementAmount(amount) {
            amount = amount || 1;
            if (! Util.isInt(amount)) {
                throw new TypeError('Amount has to be of type integer!');
            }
            this[' quantity'][' amount'] += amount;
            _notifyListeners.call(this[' cart'], 'change', this);
            return this;
        }


        /**
         * Decrementing amount of cart position.
         *
         * @method  CartPosition#decrementAmount
         * @param   {Integer} amount
         * @returns {CartPosition}
         * @public
         * @fires   module:Cestino~change
         */
        function _decrementAmount(amount) {
            amount = amount || 1;
            if (! Util.isInt(amount)) {
                throw new TypeError('Amount has to be of type integer!');
            }
            this[' quantity'][' amount'] -= amount;
            _notifyListeners.call(this[' cart'], 'change', this);
            return this;
        }


        /**
         * Returns calculated price in cents.
         *
         * @method  CartPosition#calculate
         * @returns {Integer}
         * @public
         */
        function _calculateCartPosition() {
            var that = this,
                nFeaturePrice = 0;

            this[' features'].forEach(function (eFeature) {
                nFeaturePrice += eFeature.getPrice(that);
            });

            return (this[' product'].getPrice(this) + nFeaturePrice) *
                    this[' quantity'].getFactor(this);
        }


    /**
     * Extends the constructor passed implicit (as this reference).
     * 
     * @param {*} subclassConstructor
     * @private
     */
    function _extendWith(subclassConstructor) {
        var key, subclassProto = subclassConstructor.prototype;

        subclassConstructor.prototype = Object.create(this.prototype);
        subclassConstructor.prototype.constructor = subclassConstructor;
        subclassConstructor.prototype.getSuperMethod = function (methodName) {
            return this.__proto__.__proto__[methodName].bind(this);
        };

        for (key in subclassProto) {
            if (Object.prototype.hasOwnProperty.call(subclassProto, key)) {
                subclassConstructor.prototype[key] = subclassProto[key];
            }
        }

        return {
            create: function () {
                var subclassObject = Object.create(subclassConstructor.prototype),
                    constructorArguments = arguments;

                (function constructWalk (objToWalk) {
                    if (!!objToWalk.__proto__.__proto__) {
                        constructWalk(objToWalk.__proto__);
                    }
                    objToWalk.__proto__.constructor.apply(subclassObject, constructorArguments);
                })(subclassObject);

                return subclassObject;
            },
            extendWith: function (subsubclassConstructor) {
                return _extendWith.bind(subclassConstructor)(subsubclassConstructor);
            }
        };
    }

    /**
     * Creates a factory to instanciate a new object of passed type.
     * 
     * @param {String} kind Type of object to create
     * @private
     */
    function _createFactory(kind) {
        return function () {
            return new Cart[kind](
                typeof arguments[0] !== 'undefined' && arguments[0] || undefined,
                typeof arguments[1] !== 'undefined' && arguments[1] || undefined,
                typeof arguments[2] !== 'undefined' && arguments[2] || undefined,
                typeof arguments[3] !== 'undefined' && arguments[3] || undefined
            );
        }
    }

    // Module-API
    return module = {
        /**
         * Creates an object of type Cart; The main object.
         * @alias   module:Cestino.create
         * @param   {Object} oService
         * @returns {Cart}
         */
        create: function (oService) {
            return new Cart(oService);
        },
        /**
         * @alias module:Cestino.Util
         * @see   {@link module:Cestino/Util}
         */
        Util: Util,
        /**
         * @alias module:Cestino.PriceFormatter
         * @see   {@link module:Cestino/PriceFormatter}
         */
        PriceFormatter: PriceFormatter,
        /**
         * @alias module:Cestino.BasicCartService
         * @see   {@link module:Cestino/BasicCartService}
         */
        BasicCartService: BasicCartService,
        /** @alias module:Cestino.Product */
        Product: {
            /**
             * Creates an object of type Cart.Product
             * @alias   module:Cestino.Product.create
             * @param   {String} id
             * @param   {String} title
             * @param   {Integer} price
             * @returns {Product}
             */
            create: _createFactory('Product'),
            /**
             * Extends class Product by passed constructor
             * @alias module:Cestino.Product.extendWith
             * @param {*} subclassConstructor
             * @returns {Product}
             */
            extendWith: _extendWith.bind(Cart.Product)
        },
        /** @alias module:Cestino.ProductFeature */
        ProductFeature: {
            /**
             * Creates an object of type Cart.ProductFeature
             * @alias   module:Cestino.ProductFeature.create
             * @param   {String|Integer} id
             * @param   {String} label
             * @param   {Integer} price
             * @returns {ProductFeature}
             */
            create: _createFactory('ProductFeature'),
            /**
             * Extends class ProductFeature by passed constructor
             * @alias module:Cestino.ProductFeature.extendWith      
             * @param {*} subclassConstructor
             * @returns {ProductFeature}
             */
            extendWith: _extendWith.bind(Cart.ProductFeature)
        },
        /** @alias module:Cestino.ProductQuantity */
        ProductQuantity: {
            /**
             * Creates an object of type Cart.ProductQuantity
             * @alias   module:Cestino.ProductQuantity.create
             * @param   {Integer} amount
             * @param   {Integer} dimX
             * @param   {Integer} dimY
             * @param   {Integer} dimZ
             * @returns {ProductQuantity}
             */
            create: _createFactory('ProductQuantity'),
            /**
             * Extends class ProductQuantity by passed constructor
             * @alias module:Cestino.ProductQuantity.extendWith      
             * @param {*} subclassConstructor
             * @returns {ProductQuantity}
             */
            extendWith: _extendWith.bind(Cart.ProductQuantity)
        },
        /** @alias module:Cestino.ShippingGroup */
        ShippingGroup: {
            /**
             * Creates an object of type Cart.ShippingGroup
             * @alias   module:Cestino.ShippingGroup.create
             * @param   {String} name
             * @returns {ShippingGroup}
             */
            create: _createFactory('ShippingGroup'),
            /**
             * Extends class ShippingGroup by passed constructor
             * @alias module:Cestino.ShippingGroup.extendWith      
             * @param {*} subclassConstructor
             * @returns {ShippingGroup}
             */
            extendWith: _extendWith.bind(Cart.ShippingGroup)
        },
        /**
         * Use this to override the method for calculating a cart-position
         * @alias   module:Cestino.overridePositionCalculation
         * @param   {Function} fn
         */
        overridePositionCalculation: function (fn) {
            CartPosition.prototype.calculate = fn;
        }
    };
}));

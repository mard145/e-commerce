jest.mock('./__mocks__/atomicjs');
cartTest(require('../src/Cart'), require('../src/BasicCartService'));

function cartTest (Cart, Repo) {
    "use strict";

    Repo = Repo || Cart.BasicCartService;
	
    var cart = Cart.create(),
        genProducts = [],
        positionIDs = [],
        actionsMap = {
            lastAddedPositionID: false,
            lastChangedPositionID: false,
            lastRemovedPositionID: false
        },
        testObject4JSON = {
            date: new Date(),
            AutoPosId: 3,
            pos: {
                test: [
                    {id:"p1",
                     product:{id: 3},
                     quantity:{amount:4,dimX:1,dimY:1,dimZ:1},
                     features:[]},
                    {id:"p2",
                     product:{id: 42},
                     quantity:{amount:1,dimX:1,dimY:1,dimZ:1},
                     features:[]}
                ]
            }
        };
	
    describe('A shopping-cart', function () {
        it('trying to create products', function () {
            expect(function () { Cart.Product.create() }).toThrowError(Error)
            expect(function () { Cart.Product.create('') }).toThrowError(Error)
            expect(function () { Cart.Product.create(42, '', 3) }).toThrowError(RangeError)
            expect(function () { Cart.Product.create(42, 'Test', -4) }).toThrowError(TypeError)
            expect(function () {
                genProducts.push(Cart.Product.create(42, 'TestProduct', 499))
                genProducts.push(Cart.Product.create(7, 'TestProduct2', 599))
                genProducts.push(Cart.Product.create(3, 'TestProduct3', 60))
                genProducts.push(Cart.Product.create(19, 'TestProduct4', 656))
            }).not.toThrowError(Error);
        })

        it('trying to add listeners', function () {
            expect(function () { cart.on(); }).toThrowError(TypeError)
            expect(function () { cart.on(''); }).toThrowError(TypeError)
            expect(function () { cart.on(12); }).toThrowError(TypeError)
            expect(function () { cart.on('test', function () {}); }).toThrowError(TypeError)
            expect(function () { cart.on('', function () {}); }).toThrowError(TypeError)
            expect(function () { cart.on(12, function () {}); }).toThrowError(TypeError)
            expect(function () { cart.on('add', function () {}); }).not.toThrowError(Error)
        })

        it('adding a first product', function () {
            expect(function () {
                cart.on('add', function (oPosition) {
                    actionsMap.lastAddedPositionID = oPosition.getId()
                })
            }).not.toThrowError(Error)
            expect(actionsMap.lastAddedPositionID).toBe(false)

            positionIDs.push(cart.add(genProducts[1], 2))

            // check whether adding-listener has been invoked
            expect(actionsMap.lastAddedPositionID).toBe('p1')
			
            expect(cart.calculate()).toBe(2*599)
            expect(positionIDs[0]).toBe('p1')
        })

        it('adding some more products', function () {
            expect(function () {
                positionIDs.push(cart.add(genProducts[2]))
                positionIDs.push(cart.add(genProducts[3], Cart.ProductQuantity.create(2, 5)))
            }).not.toThrow()

            // check whether adding-listener has been invoked
            expect(actionsMap.lastAddedPositionID).toBe('p3')

            expect(cart.calculate()).toBe(2*599+60+656*2*5)
            expect(positionIDs.join('')).toBe(['p1','p2','p3'].join(''))
        })

        it('remove a product', function () {
            expect(function() {
                cart.on('remove', function (oPosition) {
                    actionsMap.lastRemovedPositionID = oPosition.getId()
                })
            }).not.toThrowError(Error)
            expect(actionsMap.lastRemovedPositionID).toBe(false)
            cart.deletePosition(positionIDs[1])
            // check whether removing-listener has been invoked
            expect(actionsMap.lastRemovedPositionID).toBe('p2')
            expect(cart.calculate()).toBe(2*599+656*2*5)
        })

        it('increment amount in cart position', function () {
            expect(function() {
                cart.on('change', function (oPosition) {
                    actionsMap.lastChangedPositionID = oPosition.getId()
                })
            }).not.toThrowError(Error)
            cart.getPositionById(positionIDs[2]).incrementAmount()
            expect(cart.calculate()).toBe(2*599+656*3*5)
            cart.getPositionById(positionIDs[2]).incrementAmount(3)
            expect(actionsMap.lastChangedPositionID).toBe('p3')
            expect(cart.calculate()).toBe(2*599+656*6*5)
            cart.getPositionById(positionIDs[0]).decrementAmount()
            expect(actionsMap.lastChangedPositionID).toBe('p1')
            expect(cart.calculate()).toBe(1*599+656*6*5)
            cart.getPositionById(positionIDs[2]).decrementAmount(5)
            expect(cart.calculate()).toBe(1*599+656*1*5)
            expect(actionsMap.lastChangedPositionID).toBe('p3')
        })

        it('replace quantity in cart position', function () {
            cart.getPositionById(positionIDs[0]).replaceQuantity(
                Cart.ProductQuantity.create(3, 2)
            )
            expect(actionsMap.lastChangedPositionID).toBe('p1')
            expect(cart.calculate()).toBe(3*2*599+656*1*5)
        })

        it('trying to get not existing position', function () {
            expect(function () { cart.getPositionById(positionIDs[1]) })
                .toThrowError(ReferenceError, /^No position with id/)
        })

        it('trying to add a product', function () {
            expect(function () { cart.add(); }).toThrowError(Error)
            expect(function () { cart.add(''); }).toThrowError(Error)
        })

        it('create shipping group', function () {
            var grp = Cart.ShippingGroup.create('TestShipping')

            expect(grp.getName()).toBe('TestShipping')
            grp.setPrice(193)
            expect(grp.getPrice()).toBe(193)
        })

        it('add products to a separate shipping groups and calculate costs', function () {
            cart.add(genProducts[2], 3, Cart.ShippingGroup.create('shgrp').setPrice(67))
            cart.add(genProducts[0], 1, 'shgrp')
            cart.add(genProducts[0], 2, Cart.ShippingGroup.create('shgrp2').setPrice(34))

            // without shipping cost calculation
            expect(cart.calculate()).toBe(3*2*599+656*1*5+3*60+1*499+2*499)
            // with shipping cost calculation
            expect(cart.calculate(true)).toBe(3*2*599+656*1*5+3*60+1*499+67+2*499+34)
        })

        it('create a product-feature', function () {
            expect(function () { Cart.ProductFeature.create() })
                .toThrowError(Error)
            expect(function () { Cart.ProductFeature.create(3, '') })
                .toThrowError(Error)
            expect(function () { Cart.ProductFeature.create('2##', 'color: orange') })
                .not.toThrowError(Error)
            expect(function () { Cart.ProductFeature.create(2, 'color: orange') })
                .not.toThrowError(Error)
            expect(function () { Cart.ProductFeature.create(2, 'color: orange', 0) })
                .not.toThrowError(Error)
            expect(function () { Cart.ProductFeature.create(2, 'color: orange', 10) })
                .not.toThrowError(Error)
            expect(function () { Cart.ProductFeature.create(2, 'color: orange', -1) })
                .toThrowError(Error)
        })

        // // TODO: find product and delete product

        it('Check json-representation of cart', function () {
            var cartJSON,
                cart = Cart.create()

            cart.add(genProducts[2], 4, 'test')
            cart.add(genProducts[0], 1, 'test')
            
            cartJSON = cart.toJSON()
            testObject4JSON.date = JSON.parse(cartJSON).date

            expect(cartJSON).toBe(JSON.stringify(testObject4JSON))
        })

        it('Load cart from json', function (done) {
            var options = {url: 'base/test/CartData.json'},
                repo = Repo.create(options),
                cart = Cart.create(repo);

            cart.on('load', function () {
                var i = 0, productTitles = ['Test 1', 'Test 2'];
                expect(cart.calculate()).toBe(456*4+1*333);
                cart.walk(function (position) {
                    expect(position.getProduct().getTitle()).toBe(productTitles[i++]);
                });

                done();
            });
            cart.fromJSON(JSON.stringify(testObject4JSON));
        });

        it('extend product objects', function () {
            var Product, Quantity, p, q;

            function ExtendedProduct(id, title, price, imgSrc) {
                this.imgSrc = imgSrc
            }
            ExtendedProduct.prototype.getImg = function () {
                return this.imgSrc
            };

            Product = Cart.Product.extendWith(ExtendedProduct)

            p = Product.create(12, 'Test extended', 595, '/thumbs/test.png')
            expect(p.getId()).toBe(12)
            expect(p.getImg()).toBe('/thumbs/test.png')
            expect(JSON.stringify(p)).toEqual(JSON.stringify({
                " id": 12,
                " title": 'Test extended',
                " price": 595,
                imgSrc: '/thumbs/test.png'
            }))

            function ExtendedProductQuantity(amount, dimX, dimY, dimZ, unit) {
                this.unit = unit
            }
            ExtendedProductQuantity.prototype.getCubicUnit = function() {
                return (this.getWidth() * this.getHeight() * this.getDepth())
                    + ' ' + this.unit + '³'
            }

            Quantity = Cart.ProductQuantity.extendWith(ExtendedProductQuantity)

            q = Quantity.create(5, 60, 125, 241, 'cm')
            expect(q.getCubicUnit()).toBe((60*125*241) + ' cm³')
            expect(q.getFactor()).toBe(5*60*125*241)

            cart.add(p, q)
        });

        it('override method to calculate cart', function () {
            var cart = Cart.create();
            Cart.overridePositionCalculation(function () {
                var that = this,
                    nFeaturePrice = 0;

                this[' features'].forEach(function (eFeature) {
                    nFeaturePrice += eFeature.getPrice(that);
                });

                return (this[' product'].getPrice(this) + nFeaturePrice) *
                        this[' quantity'].getFactor(this) + 4;
            });

            cart.add(genProducts[1], 2);
            cart.add(genProducts[2]);
            expect(cart.calculate()).toBe(2*599+4+60+4);
        });
    })
}

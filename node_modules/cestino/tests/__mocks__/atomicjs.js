module.exports = function (url) {
  return Promise.resolve({
    "data": {
      "3": {
          "title": "Test 1",
          "price": 456,
          "features": []
      },
      "42": {
          "title": "Test 2",
          "price": 333,
          "features": []
      }
    }
  })
}
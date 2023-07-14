const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
    res.json({ data: dishes });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

function bodyHasPrice(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (typeof price === "number" && price > 0) {
      return next();
    }
    if (price < 0) {
      return next({
        status: 400,
        message: "Dish must have a price that is an integer greater than 0",
      });
    } else {
      next({
        status: 400,
        message: "Dish must include a price",
      });
    }

}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id == dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found ${dishId}`,
  });
}

function read(req, res,) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const dish = res.locals.dish;
  const { dishId } = req.params;
  const { data: { id, name, description, image_url, price } = {} } = req.body;

  dish.id = id;
  dish.name = name;
  dish.description = description;
  dish.image_url =image_url;
  dish.price = price;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyHasPrice,
    bodyDataHas("image_url"),
    create,
  ],
  read: [dishExists, read],
  update: [
   dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyHasPrice,
    bodyDataHas("image_url"),
    update
  ],
  dishExists
};

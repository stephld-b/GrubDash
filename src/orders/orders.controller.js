const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
    res.json({ data: orders});
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && propertyName.length > 0) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function bodyHasDishes(request, response, next) {
  const {
    data: { dishes },
  } = request.body;
  if (Array.isArray(dishes) === true && dishes.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a dish",
  });
}
function bodyHasQuantity(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  dishes.forEach((dish, index) => {
    const quantity = dish.quantity;
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

//create a quantity counter and create a dishes validator and quantity validator
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found ${orderId}`,
  });
}

function read(req, res) {
  const { orderId } = req.params;
  res.json({ data: orders.find((order) => order.id === orderId) });
}

function update(req, res, next) {
  const orderUpdate = res.locals.order;
  const { orderId } = req.params;
  const { data: { id, deliverTo, mobileNumber, status, dishes, } = {}, } = req.body;

  orderUpdate.id = orderId;
  orderUpdate.deliverTo = deliverTo;
  orderUpdate.mobileNumber = mobileNumber;
  orderUpdate.status = status;
  orderUpdate.dishes = dishes;
  
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }

  res.json({ data: orderUpdate });
}

function statusValidation(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Value of the 'status' property must be one of ${validStatus}. Received: ${status}`,
  });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyHasDishes,
    bodyHasQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyHasDishes,
    bodyHasQuantity,
    statusValidation,
    update,
  ],
  delete: [orderExists, destroy],
  orderExists,
};

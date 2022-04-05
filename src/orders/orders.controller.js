const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order not found: ${orderId}`
  })
}

function bodyIdMatchesParamIfPresent(req, res, next) {
  const { data: { id }} = req.body;
  const { orderId } = req.params;
  if (!id) {
    return next();
  }
  if (orderId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
  })
}

function statusPropertyIsPending(req, res, next) {
  const status = res.locals.order.status;
  if (status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending"
  })
}

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatuses.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: "Order must have a status of pending, perparing, out-for-delivery, delivered"
  })
}

function orderIsNotAlreadyDelivered(req, res, next) {
  const originalStatus = res.locals.order.status;
  if (originalStatus !== "delivered") {
    return next();
  }
  next({
    status: 400,
    message: "A delivered order cannot be changed"
  })
}

function deliverToIsValid(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a deliverTo"
  })
}

function mobileNumberIsValid(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a mobileNumber"
  })
}

function dishesIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a dish"
  })
}

function dishesIsAnArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include at least one dish"
  })
}

function dishQuantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes.every((dish) => (
    Number.isInteger(dish.quantity) &&
    dish.quantity > 0
  ))) {
    return next();
  }
  const index = dishes.findIndex((dish) => (
    dish.quantity <= 0 ||
    !Number.isInteger(dish.quantity)
  ));
  next({
    status: 400,
    message: `Dish ${index} must have a quantity that is an integer greater than 0`
  })
}

// GET
function list(req, res) {
  res.json({ data: orders });
}

// POST
function create(req, res) {
  const { data: {
    deliverTo,
    mobileNumber,
    dishes
  } } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// GET ID
function read(req, res) {
  res.json({ data: res.locals.order });
}

// PUT
function update(req, res) {
  const { data: {
    deliverTo,
    mobileNumber,
    status,
    dishes
  } } = req.body;
  const order = res.locals.order;
  let {
    deliverTo: originalDeliverTo,
    mobileNumber: originalMobileNumber,
    status: originalStatus,
    dishes: originalDishes
  } = order;
  if (originalDeliverTo !== deliverTo) {
    order.deliverTo = deliverTo;
  }
  if (originalMobileNumber !== mobileNumber) {
    order.mobileNumber = mobileNumber;
  }
  if (originalStatus !== status) {
    order.status = status;
  }
  if (originalDishes !== dishes) {
    order.dishes = dishes;
  }
  res.json({ data: order });
}

// DELETE
function destroy(req, res) {
  const orderToDelete = res.locals.order;
  const index = orders.findIndex((order) => order === orderToDelete);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    deliverToIsValid,
    mobileNumberIsValid,
    dishesIsValid,
    dishesIsAnArray,
    dishQuantityIsValid,
    create
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyIdMatchesParamIfPresent,
    statusPropertyIsValid,
    orderIsNotAlreadyDelivered,
    deliverToIsValid,
    mobileNumberIsValid,
    dishesIsValid,
    dishesIsAnArray,
    dishQuantityIsValid,
    update
  ],
  delete: [
    orderExists,
    statusPropertyIsPending,
    destroy
  ]
}

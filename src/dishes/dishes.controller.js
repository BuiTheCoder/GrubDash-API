const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`
  })
}

function namePropertyIsValid(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a name"
  })
}

function descriptionPropertyIsValid(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a description"
  })
}

function pricePropertyIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include price"
  })
}

function priceIsNotNegative(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (Number.isInteger(price) && price > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0"
  })
}

function imageUrlPropertyIsValid(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a image_url"
  })
}

function bodyIdMatchesParamIfPresent(req, res, next) {
  const { dishId } = req.params;
  const { data: {id} } = req.body;
  if (!id) {
    return next();
  }
  if (dishId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
  })
}

// GET
function list(req, res) {
  res.json({ data: dishes });
}

// GET ID
function read(req, res) {
  res.json({ data: res.locals.dish });
}

// POST
function create(req, res) {
  const {
    data: {
      name,
      description,
      price,
      image_url
    }
  } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// PUT
function update(req, res) {
  const {
    data: {
      name,
      description,
      price,
      image_url
    }
  } = req.body;
  const dish = res.locals.dish;
  let {
    name: originalName,
    description: originalDescription,
    price: originalPrice,
    image_url: originalImage_Url
  } = dish;
  if (originalName !== name) {
    dish.name = name;
  };
  if (originalDescription !== description) {
    dish.description = description;
  };
  if (originalPrice !== price) {
    dish.price = price;
  };
  if (originalImage_Url !== image_url) {
    dish.image_url = image_url;
  };
  res.json({ data: dish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [
    namePropertyIsValid,
    descriptionPropertyIsValid,
    pricePropertyIsValid,
    priceIsNotNegative,
    imageUrlPropertyIsValid,
    create
  ],
  update: [
    dishExists,
    namePropertyIsValid,
    descriptionPropertyIsValid,
    pricePropertyIsValid,
    priceIsNotNegative,
    imageUrlPropertyIsValid,
    bodyIdMatchesParamIfPresent,
    update
  ]
}

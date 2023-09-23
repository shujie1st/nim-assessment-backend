const mongoose = require("../db.js");

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  items: [
    {
      item: {
        type: mongoose.Schema.ObjectId,
        ref: "MenuItems"
      },

      quantity: {
        type: Number,
        required: true
      }
    }
  ],
  status: {
    type: String,
    required: true,
    enum: ["pending", "confirmed", "delivered", "cancelled"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
orderSchema.set("toJSON", {
  virtuals: true
});
orderSchema.statics.calcTotal = (items) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

// order model
const Order = mongoose.model("Order", orderSchema);

const getAll = async () => {
  // populate each item
  const orders = await Order.find().populate("items.item");

  return orders;
};

const getOne = async (id) => {
  const order = await Order.findById(id).populate("items.item");
  return order;
};

const create = async (body) => {
  const order = await Order.create(body);
  return order;
};

const update = async (id, body) => {
  const order = await Order.findByIdAndUpdate(id, body, { new: true });
  return order;
};

const remove = async (id) => {
  const order = await Order.findByIdAndDelete(id);
  return order.id;
};

const getByStatus = async (status, start, end) => {
  const orders = await Order.aggregate([
    {
      $match: {
        $and: [
          {
            $expr: {
              $cond: [
                { $in: [start, [null, "", "undefined"]] },
                true,
                { $gt: ["$createdAt", new Date(start)] }
              ]
            }
          },
          {
            $expr: {
              $cond: [
                { $in: [end, [null, "", "undefined"]] },
                true,
                { $lt: ["$createdAt", new Date(end)] }
              ]
            }
          },
          { status }
        ]
      }
    }
  ]).exec();
  return orders;
};

const getTotalSales = async (start, end) => {
  const data = (
    await Order.aggregate([
      {
        $match: {
          $and: [
            {
              $expr: {
                $cond: [
                  { $in: [start, [null, "", "undefined"]] },
                  true,
                  { $gt: ["$createdAt", new Date(start)] }
                ]
              }
            },
            {
              $expr: {
                $cond: [
                  { $in: [end, [null, "", "undefined"]] },
                  true,
                  { $lt: ["$createdAt", new Date(end)] }
                ]
              }
            }
          ]
        }
      },
      {
        $unwind: "$items"
      },
      {
        $lookup: {
          from: "menuitems",
          localField: "items.item",
          foreignField: "_id",
          as: "menuitem"
        }
      },
      {
        $group: {
          _id: "totalSales",
          total_items: { $sum: 1 },
          total: {
            $sum: {
              $multiply: [{ $first: "$menuitem.price" }, "$items.quantity"]
            }
          }
        }
      }
    ]).exec()
  )[0];

  return data;
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  getByStatus,
  Order,
  getTotalSales
};

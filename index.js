const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.DB_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function run() {
  try {
    // await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
    const orders = client.db("demo").collection("orders");
    const users = client.db("demo").collection("users");
    const products = client.db("demo").collection("products");
    // using aggregation
    app.get("/orders-using-aggregation", async (req, res) => {
      try {
        const result = await orders
          .aggregate([
            { $unwind: "$product" },
            {
              $group: {
                _id: {
                  user: "$user",
                  product: "$product",
                },
                totalOrders: { $sum: 1 },
              },
            },
            { $match: { totalOrders: { $gt: 10 } } },
            {
              $addFields: {
                product: { $toObjectId: "$_id.product" },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id.user",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: "$user" },
            { $unwind: "$product" },
            {
              $project: {
                _id: 0,
                "user.name": 1,
                "user.email": 1,
                "product.name": 1,
                totalOrders: 1,
                "product.price": 1,
              },
            },
          ])
          .toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred");
      }
    });

    // using find bangla style
    app.get("/orders-using-find", async (req, res) => {
      try {
        const order = await orders
          .find({ product: { $type: "array" } })
          .toArray();

        const orderGroups = order.reduce((groups, order) => {
          order.product.forEach((productId) => {
            const key = `${order.user}-${productId}`;
            groups[key] = groups[key] || {
              user: order.user,
              product: productId,
              totalOrders: 0,
            };
            groups[key].totalOrders++;
          });
          return groups;
        }, {});

        const filteredGroups = Object.values(orderGroups).filter(
          (group) => group.totalOrders > 10
        );

        const userIds = filteredGroups.map((group) => group.user);
        const userList = await users.find({ _id: { $in: userIds } }).toArray();

        const productIds = filteredGroups.map(
          (group) => new ObjectId(group.product)
        );
        const productList = await products
          .find({ _id: { $in: productIds } })
          .toArray();

        const result = filteredGroups.map((group) => {
          const user = userList.find(
            (user) => user._id.toString() === group.user.toString()
          );
          const product = productList.find(
            (product) => product._id.toString() === group.product.toString()
          );

          return {
            totalOrders: group.totalOrders,

            product: {
              name: product.name,
              price: product.price,
            },
            user: {
              name: user.name,
              email: user.email,
            },
          };
        });

        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred");
      }
    });

    // database
    app.get("/database", async (req, res) => {
      try {
        const userList = await users.find().toArray();
        const productList = await products.find().toArray();
        const orderList = await orders.find().toArray();
        res.send({
          users: userList,
          products: productList,
          orders: orderList,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred");
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(process.env.PORT || 3000, () => {
  console.log("Example app listening on port 3000!");
});

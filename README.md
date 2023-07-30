# Aggregation Task

````const result = await orders
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
          ])```
````

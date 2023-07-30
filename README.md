# Aggregation Task

```
orders
    .aggregate([
        { $unwind: "$product" },
        // প্রোডাক্ট নামে আমার যেই Array আছে সেইটা থেকে Unwind করেছি প্রতিটা প্রোডাক্ট থেকে একটা করে ডকুমেন্ট তৈরি করার জন্যে ।
        {
            $group: {
                _id: {
                  user: "$user",
                  product: "$product",
                },
                // ইউজার এবং প্রোডাক্ট টাকে একটা object হিসেবে রাখলাম _id এর মধ্যে ।
                totalOrders: { $sum: 1 },
                // টোটাল Order এর সংখ্যা যোগ করলাম
            },
        },
        { $match: { totalOrders: { $gt: 10 } } },
        // যেই গুলীর Order ১০ এর থেকে বেশী সেইগুলি শুধু রাখলাম
        {
            $addFields: {
                product: { $toObjectId: "$_id.product" },
            },
        },
        // একটা product নামে field অ্যাড করলাম নাহলে product এর তথ্য আনতে সমস্যা হচ্ছিলো
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
        // lookup ব্যাবহার করে collection থেকে ইউজার এবং প্রোডাক্টের তথ্য নিয়ে আসলাম
        { $unwind: "$user" },
        { $unwind: "$product" },
        // আবার প্রতিটা প্রোডাক্ট থেকে একটা করে ডকুমেন্ট তৈরি করলাম
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
        // সবার শেষে আমি কি কি দেখাতে চাই টা সেন্ড করলাম $project দিয়ে ।
    ]).toArray();

```

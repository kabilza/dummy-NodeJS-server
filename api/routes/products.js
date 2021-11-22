const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});

const Product = require("../models/products");

//get use exec()
//post use save()

// router.get("/", (req, res, next) => {
//   Product.find()
//     .exec()
//     .then((doc) => {
//       console.log(doc);
//       res.status(200).json(doc);
//     })
//     .catch((err) => {
//       console.log(err);
//       res.status(500).json({
//         error: err,
//       });
//     });

// });

router.get("/", async function (req, res, next) {
  const productList = await Product.find().select("name price _id").exec();
  try {
    console.log(productList);
    let docs = {
      count: productList.length,
      products: productList.map((prod) => {
        return {
          name: prod.name,
          price: prod.price,
          _id: prod._id,
          request: {
            type: "GET",
            url: "http://localhost:3000/products/" + prod._id,
          },
        };
      }),
    };
    res.status(200).json(docs);
  } catch {
    (err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    };
  }
});

router.post("/", upload.single('productImage'), (req, res, next) => {
  console.log(req.file);
  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
    productImage: req.file.path
  });
  product
    .save()
    .then((result) => {
      console.log(result);
      res.status(200).json({
        message: "Handling POST requests to /products",
        createdProduct: {
          name: result.name,
          price: result.price,
          _id: result._id,
          imagePath: result.productImage,
          request: {
            type: "GET",
            url: "http://localhost:3000/products/" + result._id,
          },
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(200).json({
        err,
      });
    });
});

router.get("/:productId", (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .exec()
    .then((doc) => {
      console.log(doc);
      res.status(200).json({
        product: doc,
        request: {
          type: "GET",
          url: "http://localhost:3000/products",
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.patch("/:id", (req, res, next) => {
  const id = req.params.id;
  Product.findByIdAndUpdate(id, { $set: req.body }, { new: true })
    .then((result) =>
      res.status(200).json({
        message: 'Product Updated!',
        request: {
          type: "GET",
          url: "http://localhost:3000/products" + id,
        },
      })
    )
    .catch((err) => res.status(500).json({ error: err }));
});

// router.patch("/:productId", (req, res, next) => {
//   res.status(200).json({
//     message: "Updated product!",
//   });
// });

router.delete("/:productId", (req, res, next) => {
  const id = req.params.productId;
  Product.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({
          message: 'Product Deleted',
          request: {
              type: 'POST',
              url: 'http://localhost:3000/products',
              body: { name: 'String', price: 'Number' }
          }
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;

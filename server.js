const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const https = require("https");
const app = express();
const port = 8000;

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// =================== Pokemon schema =================
const { Schema } = mongoose;

var pokemonModel;
// "mongodb+srv://dinhplnguyen:OyOojZtCfxxuhbHN@cluster0.jk2imwg.mongodb.net/?retryWrites=true&w=majority"
// mongodb://localhost:27017/test
// =================== Step 2: Fetch JSON from github ===================
app.listen(process.env.PORT || 8800, async (req, res) => {
  try {
    const db = await mongoose.connect(
      "mongodb+srv://dinhplnguyen:OyOojZtCfxxuhbHN@cluster0.jk2imwg.mongodb.net/?retryWrites=true&w=majority"
    );
    mongoose.connection.db.dropDatabase();
  } catch (error) {
    console.log(error);
  }

  let pokemonUrl =
    "https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json";

  let typeUrl =
    "https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/types.json";

  GetData(typeUrl).then((urlData) => {
    var tempList = [];

    urlData.forEach((pokemonType) => {
      tempList.push(pokemonType);
    });

    console.log(tempList);

    const pokemonSchema = new mongoose.Schema({
      id: Number,
      name: {
        english: String,
        japanese: String,
        chinese: String,
        french: String,
      },
      type: [],
      base: {
        HP: Number,
        Attack: Number,
        Defense: Number,
        "Sp. Attack": Number,
        "Sp. Defense": Number,
        Speed: Number,
      },
    });

    pokemonModel = mongoose.model("Pokemon", pokemonSchema);

    https.get(pokemonUrl, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        // console.log(data);

        let pokemon = JSON.parse(data);
        // console.log(tempList);

        // pokemon.forEach((rawData) => {
        //   rawData.type = { enum: JSON.stringify(["hi", "hello"]) };
        // });

        pokemon.forEach((pokemon) => {
          pokemonModel.create(pokemon, function (err) {
            if (err) {
              console.log(err);
            }
          });
        });
      });
    });
  });
});

// =================== Edit the database ===================
// GETing all the pokémons - missing count or after
app.get("/api/v1/pokemons?count=2", (req, res) => {
  res.send("Hello World!");
});
// Get all pokemon
app.get("/api/v1/pokemon", async (req, res) => {
  pokemonModel
    .find({})
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ message: "Error reading from database to get ALL POKEMON" });
    });
});

// - get a pokemon
app.get("/api/v1/pokemon/:id", async (req, res) => {
  pokemonModel
    .find({ id: req.params.id })
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ message: "Error reading from database to get A POKEMON" });
    });
});

// - get a pokemon Image URL
app.get("/api/v1/pokemonImage/:id", async (req, res) => {
  let pokemonId = req.params.id;
  while (pokemonId.length < 3) {
    pokemonId = "0" + pokemonId;
  }
  let url = `https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/${pokemonId}.png`;
  res.json({ url: url });
});

//create a pokemon
app.post("/api/v1/pokemon", async (req, res) => {
  if (pokemonModel.find({ id: req.body.id }).length > 0) {
    res.json({ message: "Pokemon already exists" });
  } else {
    pokemonModel
      .create(req.body)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        console.log(err);
        res.json({
          message: "Error reading from database to create a POKEMON",
        });
      });
  }
});

// insert new attribute to pokemon
app.put("/api/v1/pokemon/:id", async (req, res) => {
  pokemonModel
    .updateOne({ id: req.params.id }, { $set: req.body }, { upsert: true })
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ message: "Error reading from database to PATCH A POKEMON" });
    });
});

// - patch a pokemon document or aportion of the pokemon document
app.patch("/api/v1/pokemon/:id", async (req, res) => {
  if (pokemonModel.find({ id: req.body.id }).length > 0) {
    res.json({ message: "Cannot change pokemon" });
  } else {
    pokemonModel
      .updateOne({ id: req.params.id }, { $set: req.body }, { upsert: true })
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        console.log(err);
        res.json({ message: "Error reading from database to PATCH A POKEMON" });
      });
  }
});

// delete a pokemon
app.delete("/api/v1/pokemon/:id", async (req, res) => {
  pokemonModel
    .deleteOne({ id: req.params.id })
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ message: "Error reading from database to DELETE A POKEMON" });
    });
});

// =================== Get Data from URL ===================
const GetData = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(JSON.parse(data));
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

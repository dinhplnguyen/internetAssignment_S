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
var pokemonModel = mongoose.model("Pokemon", pokemonSchema);
// "mongodb+srv://dinhplnguyen:OyOojZtCfxxuhbHN@cluster0.jk2imwg.mongodb.net/?retryWrites=true&w=majority"
// mongodb://localhost:27017/test
// =================== Step 2: Fetch JSON from github ===================
app.listen(process.env.PORT || 8800, async (req, res) => {
  try {
    const db = await mongoose.connect(
      "mongodb+srv://dinhplnguyen:OyOojZtCfxxuhbHN@cluster0.jk2imwg.mongodb.net/?retryWrites=true&w=majority"
    );
    // mongoose.connection.db.dropDatabase();
  } catch (error) {
    console.log(error);
  }

  let pokemonUrl =
    "https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json";

  let typeUrl =
    "https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/types.json";

  GetData(typeUrl).then((urlData) => {
    var tempList = [];
    for (const type in urlData) {
      tempList.push(urlData[type].english);
    }

    https.get(pokemonUrl, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let pokemon = JSON.parse(data);
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
// - get all the pokemons after the 10th. List only Two.
app.get("/api/v1/pokemons?count=2&after=10", (req, res) => {});
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

// - upsert a whole pokemon document
app.patch("/api/v1/pokemon/:id", async (req, res) => {
  pokemonModel
    .findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true })
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ message: "Error reading from database to update A POKEMON" });
    });
});

// - patch a pokemon document or aportion of the pokemon document
app.patch("/api/v1/pokemon/:id", async (req, res) => {
  pokemonModel
    .updateOne({ id: req.params.id }, { $set: req.body })
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ message: "Error reading from database to PATCH A POKEMON" });
    });
});
// app.delete('/api/v1/pokemon/:id')                // - delete a  pokemon

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

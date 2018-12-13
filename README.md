#  El paradigma NoSQL - Bases de Datos de Grafos: IMDB recommendation graph with GraphQL

Final project for the graphs databases course.

All the important code is in `src/start.js`.

Install, build and run:

```
npm install
```

## For Local Development 

You need to start Mongodb for Local development .

```
npm run dev
```

## Setup Instructions

### Step 1

Descargarse todos los datasets de [https://datasets.imdbws.com/](https://datasets.imdbws.com/)

### Step 2

Descargarse mongo

### Step 3 - Importar la data

Importar todos los datasets con.

`mongoimport --db nosql --collection <collection> --type tsv --file <tsv-descargado>`

@see [https://docs.mongodb.com/manual/reference/program/mongoimport/](https://docs.mongodb.com/manual/reference/program/mongoimport/)

Donde `<collection>` es:

|tsv|collection|
|:-:|:-:|
|name.basics.tsv.gz|names|
|title.akas.tsv.gz|akas|
|title.basics.tsv.gz|titles|
|title.crew.tsv.gz|crew|
|title.episode.tsv.gz|episodes|
|title.principals.tsv.gz|principals|
|title.ratings.tsv.gz|ratings|

### Step 4

Clonar el repo, instalar las dependencias y setear la variable de entorno

```
git clone git@github.com:juanmbellini/recommendation-graph.git
cd recommendation-graph
npm install
echo 'MONGO_HOST=127.0.0.1' > .env
```

### Step 5

```
cd pre-process
ls | xargs -I{} node {}
```

Esto hace para cada uno de los archivos escupe un `<collection>.json`

> Puede tomarse su tiempo y generar archivos bastante grandes

### Step 6

Para cada uno de los `<collection>.json`. Hacer

`mongoimport --drop --db nosql --collection <collection> --file <collection.json>`

### Step 7

Crear indices sobre imdbID.

```
mongo nosql
db.titles.createIndex({ imdbID: 1 })
db.crew.createIndex({ imdbID: 1})
...
```

### Step 8

Correr el proyecto

`npm run dev`

Abrir `localhost:3001/graphiql`. Ahi esta la consola de GraphQL

### Step 9

El codigo esta en `src/start.js`. Los `resolvers` y todo.

### Step 10

Abrir la UI

```
cd ui
npm i
npm start
```

## Authors

* [Eric Horvat](https://github.com/EricHorvat)
* [Martin Goffan](https://github.com/mgoffan)
* [Juan Bellini](https://github.com/juanmbellini)
* [Daniel Lobo](https://github.com/lobo)

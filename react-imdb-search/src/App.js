import React, { Component } from 'react';
import { Container, Header, Divider, Form, Button} from 'semantic-ui-react'
import Movies from './components/movies/Movies'
import './home.css'
import axios from 'axios'

class App extends Component {

  constructor () {
    super();
    this.state = {
      movieSearch: '',
      movies: [],
      isMoviesResults: false,
      active: false,
      myList: [],
      recommendations: []
    }
  }

  inputHandler = e => this.setState({movieSearch: e.target.value})

  search = () => {
    this.state.movieSearch.length > 0 
      ? this.setState({isMoviesResults: !this.state.isMoviesResults})
      : alert('Type somethig please ...')
  }

  addToMyList = (movie) => {
    this.setState({ myList: this.state.myList.concat(movie) });
  }

  removeFromMyList = (movie) => {
    const idx = this.state.myList.findIndex(v => v.imdbID === movie.imdbID);
    const nextMyList = this.state.myList.slice();
    nextMyList.splice(idx, 1);
    this.state({ myList: nextMyList });
  }

  componentDidUpdate = (prevProps, prevState) => {
    console.log('componentDidUpdate');
    if (prevState.myList !== this.state.myList) {
      this.calcRecommendations();
    }
  }

  calcRecommendations = () => {
    const { myList } = this.state;
    console.log(myList);
    if (!myList.length) return;
    console.log('querying graphql', myList);
    const ids = myList.map(m => m.imdbID);
    axios.post('http://localhost:3001/graphql', {
      variables: { ids },
      query: `
        query($ids: [String!]!) {
          titles(imdbIDs: $ids) {
            imdbID
            titleType
            primaryTitle
            originalTitle
            isAdult
            startYear
            endYear
            runtimeMinutes
            genres
            averageRating
            numVotes
            actors {
              imdbID
              primaryName
              birthYear
              deathYear
              primaryProfession
              ordering
              category
              job
              characters
              knownForTitles {
                imdbID
                titleType
                primaryTitle
                originalTitle
                isAdult
                startYear
                endYear
                runtimeMinutes
                genres
                averageRating
                numVotes
              }
            }
          }
        }`
    })
    .then(({ data: graphqlResponse }) => {
      const { data } = graphqlResponse;
      
      const recommendations = data.titles.flatMap(t => t.actors).flatMap(a => a.knownForTitles).sort((t1, t2) => {
        return -(t1.averageRating - t2.averageRating);
      }).filter(v => !~ids.indexOf(v.imdbID)).slice(0, 4).map(r => ({
        Title: r.primaryTitle,
        Year: r.startYear,
        imdbID: r.imdbID
      }));
      console.log(recommendations);
      this.setState({ recommendations });
      recommendations.forEach(r => {
        let urlApi = `http://www.omdbapi.com/?apikey=e75caa77&i=${r.imdbID}`;
        axios.get(urlApi).then(({data}) => {
          const recommendations = this.state.recommendations.slice();
          const r  = recommendations.find(v => v.imdbID === data.imdbID);
          r.Poster = data.Poster;
          this.setState({ recommendations });
        });
      })
    })
  }

  closeSearch = () => {this.setState({isMoviesResults: !this.state.isMoviesResults})}

  render() {
    return (
      <div>
        {this.state.isMoviesResults === false ? ( 
          <div className='main_wrapper'>
            <Header as='h1'>IMDB Search</Header>
            <Divider />
            <Container>
              <Form>
                <Form.Field>
                  <input value={this.state.movieSearch} onChange={this.inputHandler} placeholder='Type a Movie title' />
                </Form.Field>
                <Button secondary type='submit' size='big' onClick={this.search}>Go Find</Button>
              </Form>
              <Header as='h1'>My List</Header>
              <Movies list movies={this.state.myList} addToMyList={this.addToMyList} removeFromMyList={this.removeFromMyList} />
              <Header as='h1'>Recommendations</Header>
              <Movies recommendation movies={this.state.recommendations} />
            </Container>
          </div>
        ) : (
          <Movies searchString={this.state.movieSearch} closeComponent={this.closeSearch} addToMyList={this.addToMyList} removeFromMyList={this.removeFromMyList} />
        )}
      </div>
    );
  }
}

export default App;

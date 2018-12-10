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
    this.setState({ myList: nextMyList });
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
          titles(imdbIDs:$ids) {
            genres {
              topTitles(limit: 20) {
                imdbID
                primaryTitle
                startYear
                averageRating
                numVotes
              }
            }
            actors {
              knownForTitles {
                imdbID
                primaryTitle
                startYear
                averageRating
                numVotes
              }
            }
            directors {
              knownForTitles {
                imdbID
                primaryTitle
                startYear
                averageRating
                numVotes
              }
            }
          }
        }`
    })
    .then(({ data: graphqlResponse }) => {
      const { data } = graphqlResponse;
      
      const recommendations =
        data.titles
        .flatMap(t => t.actors)
        .flatMap(a => a.knownForTitles)
        .map(v => {
          v.score = v.averageRating * v.numVotes * 1.1;
          return v;
        })
        .concat(
          data.titles
          .flatMap(t => t.directors)
          .flatMap(a => a.knownForTitles)
          .map(v => {
            v.score = v.averageRating * v.numVotes;
            return v;
          })
        )
        .concat(
          data.titles
          .flatMap(t => t.genres)
          .flatMap(a => a.topTitles)
          .map(v => {
            v.score = v.averageRating * v.numVotes * 0.9;
            return v;
          })
        )
        .reduce((memo, val) => {
          const v = memo.find(v => v.imdbID === val.imdbID);
          if (!v) {
            memo.push(val);
          }
          return memo;
        }, [])
        .sort((t1, t2) => -(t1.score - t2.score))
        .filter(v => !~ids.indexOf(v.imdbID))
        .slice(0, 9)
        .map(r => ({
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
          if (!data || !r) return;
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

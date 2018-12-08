import React, { Component } from 'react';
import { Container, Header, Divider, Form, Button} from 'semantic-ui-react'
import Movies from './components/movies/Movies'
import './home.css'

class App extends Component {

  constructor () {
    super();
    this.state = {
      movieSearch: '',
      movies: [],
      isMoviesResults: false,
      active: false,
      myList: []
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
              <Movies list movies={this.state.myList} addToMyList={this.addToMyList} removeFromMyList={this.removeFromMyList} />
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

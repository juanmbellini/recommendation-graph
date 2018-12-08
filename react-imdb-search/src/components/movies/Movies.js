import React, { Component } from 'react';
import { Card, Button, Icon } from 'semantic-ui-react'
import MovieItem from './MovieItem'
import axios from 'axios'
import './movies.css'

export default class Movies extends Component {
  
  constructor () {
    super()
    this.state = {
      movies: []
    }
  }

  componentWillMount = () => {
    if (this.props.list) {
      this.setState({ movies: this.props.movies || [] });
      return;
    }
    let urlApi = 'http://www.omdbapi.com/?apikey=e75caa77&'
    axios.get(urlApi + 's=' + this.props.searchString)
      .then(({data}) => {
        if (data.Response !== 'False')
          this.setState({movies: data.Search})
        else 
          this.setState({movies: [{Title: 'Film Not Found', Year: '---', Poster: '--'}]})
      })
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.movies !== this.props.movies) {
      this.setState({ movies: nextProps.movies });
    }
  }

  render () {
    let cards = this.state.movies.map((m, i) => {
      return (
        <MovieItem
          key={i}
          movie={m}
          list={this.props.list}
          removeFromMyList={this.props.removeFromMyList}
          addToMyList={this.props.addToMyList}
        />
      );
    });

    const cardStyle = this.props.list ? {} : { height: '100vh' };

    const cardList = (
      <Card.Group style={cardStyle}>
        {cards}
      </Card.Group>
    );

    if (this.props.list) {
      if (!this.state.movies.length) {
        return <span>No movies in your list</span>;
      }
      return cardList;
    }
    
    return (
      <div className='movies_wrapper'>
        <div className='close_div'>
          <Button secondary animated='vertical' onClick={this.props.closeComponent}>
            <Button.Content hidden>Close</Button.Content>
            <Button.Content visible>
              <Icon name='close' />
            </Button.Content>
          </Button>
        </div>
        {cardList}
      </div>
    );
  }
}
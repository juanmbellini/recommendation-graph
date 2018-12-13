import React, { Component } from 'react';
import { Card, Icon, Image, Button } from 'semantic-ui-react'

export default class MovieItem extends Component {
  render () {
    const { list, recommendation } = this.props;
    return (
      <Card>
        <Image src={this.props.movie.Poster} />
        <Card.Content>
          <Card.Header>
            {this.props.movie.Title}
            {list && !recommendation && <Button size="mini" onClick={() => this.props.removeFromMyList(this.props.movie)}>Remove from My List</Button>}
            {!list && !recommendation && <Button size="mini" onClick={() => this.props.addToMyList(this.props.movie)}>Add to My List</Button>}
          </Card.Header>
          <Card.Meta>
            <span className='date'>
              Lançamento {this.props.movie.Year} - {this.props.movie.imdbID}
            </span>
          </Card.Meta>  
        </Card.Content>
      </Card>
    );
  }
}
import React, { Component } from "react";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import CharSummaryCard from "./CharSummaryCard";

export default class MyCharacters extends Component {
  mapCharacters = (val, i) => {
    return (
      <Col key={i} md={4}>
        <CharSummaryCard char={val} />
      </Col>
    );
  };
  render() {
    const { characters } = this.props;
    return (
      <Card>
        <CardHeader>
          <h5 className="title">My Characters</h5>
        </CardHeader>
        <CardBody>
          <Row>{characters && characters.map(this.mapCharacters)}</Row>
        </CardBody>
      </Card>
    );
  }
}

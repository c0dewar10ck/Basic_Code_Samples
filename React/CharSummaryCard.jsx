import React, { PureComponent } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";

export default class CharSummaryCard extends PureComponent {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false
    };
  }

  toggle() {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }
  render() {
    const { char } = this.props;
    return (
      <Card>
        <CardHeader className="d-flex">
          <h3 className="title">{char.name}</h3>
          <Dropdown
            isOpen={this.state.dropdownOpen}
            toggle={this.toggle}
            className="ml-auto"
          >
            <DropdownToggle
              caret
              style={{
                marginRight: "-20px",
                width: "10px",
                opacity: "0"
              }}
            />
            <span className="three-dot-dropdown" />
            <DropdownMenu>
              <DropdownItem header>Header</DropdownItem>
              <DropdownItem>Edit</DropdownItem>
              <DropdownItem>Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </CardHeader>
        <CardBody>
          <div>
            <span>{char.class || "not specified"}</span>
          </div>
          <div>
            <span>{char.race || "not specified"}</span>
          </div>
          <div>
            <span>{char.level || "not specified"}</span>
          </div>
          <div>
            <span>{char.alignment || "not specified"}</span>
          </div>
          <div>
            <span>{char.background || "not specified"}</span>
          </div>
        </CardBody>
      </Card>
    );
  }
}

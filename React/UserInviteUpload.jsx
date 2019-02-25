import React, { Component } from "react";
import * as rs from "reactstrap";
import Dropzone from "react-dropzone";
import * as Papa from "papaparse";
import * as prompts from "../NotificationMessage";

import * as accountsService from "../../services/accountsService";

import ContentWrapper from "../Layout/ContentWrapper";
import SelectWrapper from "./SelectWrapper";

export default class UserInviteUpload extends Component {
  constructor() {
    super();
    this.state = {
      file: null,
      data: [],
      dataAssociations: {},
      filter: {
        active: false,
        data: []
      },
      modal: false,
      modalSpinner: false
    };
    this.rejected = false;
  }

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  getDropZoneContent = file => {
    if (file) {
      return (
        <React.Fragment>
          <em className="far fa-thumbs-up text-muted mt-5 d-flex justify-content-center" />
          <div className="mb-5">{file && file.name}</div>
        </React.Fragment>
      );
    } else if (this.rejected) {
      return (
        <React.Fragment>
          <em className="fas fa-times text-muted mt-5 d-flex justify-content-center" />
          <div className="mb-5">Please upload valid .CSV file</div>
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          <em className="fa fa-upload text-muted mt-5 d-flex justify-content-center" />
          <div className="mb-5">Drop .CSV file here to upload</div>
        </React.Fragment>
      );
    }
  };

  getTableContent = () => {
    const data = this.state.filter.active
      ? this.state.filter.data
      : this.state.data;
    const populateTableRows = () => {
      let output = [];
      let recordsToDisplay = this.state.filter.active ? data.length - 1 : 20;
      data.forEach((row, index) => {
        if (index > 0 && index <= recordsToDisplay) {
          output.push(
            <tr key={index}>
              <th scope="row">{index}</th>
              {row.map((val, i) => {
                return <td key={i}>{val}</td>;
              })}
            </tr>
          );
        } else if (
          index === recordsToDisplay + 1 &&
          !this.state.filter.active
        ) {
          output.push(
            <tr key={index}>
              <th>...</th>
              {data[0].map(val => (
                <td key={val} />
              ))}
            </tr>
          );
        }
      });
      return output;
    };

    if (this.state.file) {
      return (
        <rs.Card>
          <rs.Table striped>
            <thead>
              <tr>
                <th>#</th>
                {data[0].map((val, i) => (
                  <th key={i}>{data[0][i]}</th>
                ))}
              </tr>
            </thead>
            <tbody>{populateTableRows()}</tbody>
          </rs.Table>
        </rs.Card>
      );
    }
  };

  onDropAccepted = files => {
    const stateChange = data => {
      this.setState({
        file: files[0],
        data: data,
        dataAssociations: {},
        filtered: false
      });
      this.rejected = false;
    };

    Papa.parse(files[0], {
      complete: function(results) {
        if (results) {
          stateChange(results.data);
        }
      }
    });
  };

  onDropRejected = () => {
    this.setState({
      file: null,
      data: [],
      dataAssociations: {},
      filter: {
        active: false,
        data: []
      }
    });
    this.rejected = true;
  };

  onFileDialogCancel = () => {
    this.setState({
      file: null,
      data: [],
      dataAssociations: {},
      filter: {
        active: false,
        data: []
      }
    });
    this.rejected = false;
  };

  handleChangeSelect = (key, value) => {
    this.setState({
      dataAssociations: { ...this.state.dataAssociations, [key]: value }
    });
  };

  handleReset = () => {
    this.setState(prevState => ({
      ...prevState,
      dataAssociations: {},
      filter: {
        active: false,
        data: []
      }
    }));
  };

  onInviteUsersSuccess = () => {
    this.toggle();
    this.toggleSpinner(false);
    this.onFileDialogCancel();
    window.scrollTo(0, 0);
    prompts.prompt({
      title: "Yay!",
      text: "Your invites are on their way!",
      icon: "success"
    });
  };

  onInviteUsersFail = error => {
    console.error(error);
    this.toggle();
    this.toggleSpinner(false);
    window.scrollTo(0, 0);
    prompts.prompt({
      title: "Oh No!",
      text: "Something went wrong... Please check your logs for more info.",
      icon: "error"
    });
  };

  toggleSpinner = bool => {
    this.setState({
      modalSpinner: bool
    });
  };

  handleSendInvitesClick = () => {
    this.toggleSpinner(true);
    let payload = { userInvites: [...this.state.filter.data.slice(1)] };
    payload.userInvites = payload.userInvites.map(row => {
      let output = {};
      output.firstName = row[0];
      output.lastName = row[1];
      output.emailAddress = row[2];
      output.points = row[3] || 0;
      return output;
    });
    accountsService
      .inviteUsers(payload)
      .then(this.onInviteUsersSuccess)
      .catch(this.onInviteUsersFail);
  };

  setFilter = data => {
    let include = { ...this.state.dataAssociations };
    let filteredData = [];

    filteredData = data.map(row => {
      return [
        row[include.firstName],
        row[include.lastName],
        row[include.emailAddress],
        row[include.points]
      ];
    });
    filteredData = filteredData.filter(row => row.length !== 0 && row[2]);
    filteredData = [
      ["First Name", "Last Name", "Email Address", "Points"],
      ...filteredData.slice(1)
    ];

    this.setState({
      filter: {
        active: true,
        data: filteredData
      }
    });
  };

  toggle = () => {
    this.setState({
      modal: !this.state.modal
    });
  };

  render() {
    const { file, data, dataAssociations, filter } = this.state;

    const dataAssocOptions = (() => {
      if (data[0]) {
        let output = [];
        data[0].forEach((text, index) => {
          if (Object.values(dataAssociations).indexOf(index) > -1) {
            return;
          }
          output.push({ value: index, label: text });
        });
        return output;
      } else {
        return [];
      }
    })();

    return (
      <ContentWrapper>
        <rs.Modal isOpen={this.state.modal} toggle={this.toggle}>
          <rs.ModalHeader toggle={this.toggle} />
          <rs.ModalBody className="text-center">
            {this.state.modalSpinner ? (
              <div
                className="whirl"
                style={{ height: "200px", backgroundColor: "white" }}
              />
            ) : (
              <React.Fragment>
                <h2 className="mt-5">
                  We found {filter.data.length - 1} records with Emails.
                </h2>
                <h3 className="mb-5">Send invites?</h3>
              </React.Fragment>
            )}
          </rs.ModalBody>
          <rs.ModalFooter>
            <rs.Button color="primary" onClick={this.handleSendInvitesClick}>
              Ok
            </rs.Button>{" "}
            <rs.Button color="secondary" onClick={this.toggle}>
              Cancel
            </rs.Button>
          </rs.ModalFooter>
        </rs.Modal>
        <div className="content-heading">Invite Users to GoodDog</div>
        <div className="container container-lg">
          <Dropzone
            className="ignore"
            onDropAccepted={this.onDropAccepted}
            onDropRejected={this.onDropRejected}
            onFileDialogCancel={this.onFileDialogCancel}
            multiple={false}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          >
            {({ getRootProps, getInputProps }) => {
              return (
                <div
                  {...getRootProps()}
                  className="dropzone mb-3 card d-flex flex-row justify-content-center flex-wrap"
                >
                  <div className="dz-default dz-message mx-auto my-5">
                    <input {...getInputProps()} />
                    <div>{this.getDropZoneContent(file)}</div>
                  </div>
                </div>
              );
            }}
          </Dropzone>
          {Object.values(data).length > 0 && (
            <rs.Card>
              <rs.CardHeader>
                <h4>Please Specify Table Values</h4>
              </rs.CardHeader>
              <rs.CardBody>
                <rs.Form>
                  <rs.FormGroup>
                    <rs.Row>
                      <rs.Col lg={6} className="mb-3">
                        <SelectWrapper
                          options={dataAssocOptions}
                          name="firstName"
                          label="First Name"
                          value={dataAssociations.firstName}
                          onChange={this.handleChangeSelect}
                        />
                      </rs.Col>
                      <rs.Col lg={6} className="mb-3">
                        <SelectWrapper
                          options={dataAssocOptions}
                          name="lastName"
                          label="Last Name"
                          value={dataAssociations.lastName}
                          onChange={this.handleChangeSelect}
                        />
                      </rs.Col>
                    </rs.Row>
                    <rs.Row>
                      <rs.Col lg={6} className="mb-3">
                        <SelectWrapper
                          options={dataAssocOptions}
                          name="emailAddress"
                          label="Email Address"
                          value={dataAssociations.emailAddress}
                          onChange={this.handleChangeSelect}
                        />
                      </rs.Col>
                      <rs.Col lg={6} className="mb-3">
                        <SelectWrapper
                          options={dataAssocOptions}
                          name="points"
                          label="Points"
                          value={dataAssociations.points}
                          onChange={this.handleChangeSelect}
                        />
                      </rs.Col>
                    </rs.Row>
                  </rs.FormGroup>
                </rs.Form>
              </rs.CardBody>
              <rs.CardFooter className="d-flex">
                <rs.Button
                  color="secondary"
                  className="ml-auto mr-2"
                  onClick={() => this.setFilter(data)}
                  disabled={
                    Object.values(dataAssociations).length === 4 ? false : true
                  }
                >
                  Filter
                </rs.Button>
                <rs.Button
                  color="default"
                  onClick={this.handleReset}
                  disabled={
                    Object.values(dataAssociations).length > 0 ? false : true
                  }
                >
                  Reset
                </rs.Button>
              </rs.CardFooter>
            </rs.Card>
          )}
          {filter.active && (
            <rs.Button
              color="primary"
              className="btn-block mb-3"
              onClick={() => {
                this.toggle();
                this.toggleSpinner(false);
              }}
            >
              Accept
            </rs.Button>
          )}
          {this.getTableContent()}
        </div>
      </ContentWrapper>
    );
  }
}
